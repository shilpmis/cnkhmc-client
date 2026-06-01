import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  AlertCircle,
  ArrowUpDown,
  MoreHorizontal,
  Copy,
  Check,
  Loader2,
} from "lucide-react"
import type { SalaryTemplate } from "@/types/payroll"
import {
  useUpdaetSalaryTemplateMutation,
  useCreateSalaryTemplateMutation,
  useLazyFetchSalaryTemplateQuery,
  useLazyFetchSalaryComponentQuery,
  // useDeleteSalaryTemplateMutation,
} from "@/services/PayrollService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { SaralPagination } from "../ui/common/SaralPagination"
import { useNavigate } from "react-router-dom"

const SalaryTemplatesManagement = () => {
  const { t } = useTranslation()
  
  const navigate = useNavigate()
  const currentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  // RTK Query hooks
  const [fetchSalaryTemplates, { data: salaryTempla3tesResponse, isLoading: isLoadingTemplates }] =
    useLazyFetchSalaryTemplateQuery()
  const [fetchSalaryComponents, { isLoading: isLoadingComponents }] = useLazyFetchSalaryComponentQuery()
  const [createSalaryTemplate, { isLoading: isCreating }] = useCreateSalaryTemplateMutation()
  const [updateSalaryTemplate, { isLoading: isUpdating }] = useUpdaetSalaryTemplateMutation()
  // const [deleteSalaryTemplate, { isLoading: isDeleting }] = useDeleteSalaryTemplateMutation()

  // State for templates and UI
  const [templates, setTemplates] = useState<SalaryTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("All")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [totalTemplates, setTotalTemplates] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<SalaryTemplate | null>(null)

  // Load data
  useEffect(() => {
    if (currentAcademicSessionForSchool?.id) {
      fetchTemplates()
      fetchComponents()
    }
  }, [currentPage, pageSize, currentAcademicSessionForSchool])

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      // const params: PaginationParams = {
      //   page: currentPage,
      //   limit: pageSize,
      //   search: searchTerm || undefined,
      //   sort_by: sortConfig?.key,
      //   sort_order: sortConfig?.direction === "ascending" ? "asc" : "desc",
      //   filter_by: selectedRole !== "All" ? selectedRole : undefined,
      // }

      const response = await fetchSalaryTemplates({
        academic_session: currentAcademicSessionForSchool!.id,
        // ...params,
      })

      if (response.data) {
        setTemplates(response.data.data || [])
        setTotalTemplates(response.data.meta?.total || 0)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to fetch salary templates",
        variant: "destructive",
      })
    }
  }

  // Fetch components
  const fetchComponents = async () => {
    try {
      await fetchSalaryComponents({
        academic_session: currentAcademicSessionForSchool!.id,
      })
    } catch (error) {
      console.error("Error fetching components:", error)
      toast({
        title: "Error",
        description: "Failed to fetch salary components",
        variant: "destructive",
      })
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    await fetchTemplates()
    toast({
      title: "Data refreshed",
      description: "Salary templates have been updated",
    })
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Handle role filter
  const handleRoleFilter = (value: string) => {
    setSelectedRole(value)
    setCurrentPage(1)
  }

  // Request sort
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
    setCurrentPage(1)
  }

  // Handle add new template
  const handleAddTemplate = () => {
    navigate("create")
  }

  // Handle edit template
  const handleEditTemplate = (template: SalaryTemplate) => {
    navigate(`edit/${template.id}`)
  }

  // Handle duplicate template
  const handleDuplicateTemplate = async (template: SalaryTemplate) => {
    try {
      // Create a new template based on the existing one
      const newTemplate = {
        template_name: `${template.template_name} (Copy)`,
        template_code: `${template.template_code}-COPY`,
        description: template.description,
        annual_ctc: template.annual_ctc,
        is_mandatory: template.is_mandatory,
        is_active: template.is_active,
        template_components: template.template_components,
      }

      await createSalaryTemplate({ payload: newTemplate })
      await fetchTemplates()

      toast({
        title: "Template duplicated",
        description: `${newTemplate.template_name} has been created successfully`,
      })
    } catch (error) {
      console.error("Error duplicating template:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      })
    }
  }

  // Handle delete template
  const handleDeleteTemplate = (template: SalaryTemplate) => {
    setTemplateToDelete(template)
    setIsDeleteDialogOpen(true)
  }

  // Handle toggle template status
  const handleToggleStatus = async (template: SalaryTemplate) => {
    try {
      await updateSalaryTemplate({
        salary_template_id: template.id!,
        payload: {
          is_active: !template.is_active,
        },
      })

      await fetchTemplates()

      toast({
        title: template.is_active ? "Template deactivated" : "Template activated",
        description: `${template.template_name} has been ${template.is_active ? "deactivated" : "activated"} successfully`,
      })
    } catch (error) {
      console.error("Error toggling template status:", error)
      toast({
        title: "Error",
        description: "Failed to update template status",
        variant: "destructive",
      })
    }
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (templateToDelete?.id) {
      try {
        // await deleteSalaryTemplate({
        //   salary_template_id: templateToDelete.id,
        // })

        await fetchTemplates()

        toast({
          title: "Template deleted",
          description: `${templateToDelete.template_name} has been deleted successfully`,
          variant: "destructive",
        })

        setIsDeleteDialogOpen(false)
        setTemplateToDelete(null)
      } catch (error) {
        console.error("Error deleting template:", error)
        toast({
          title: "Error",
          description: "Failed to delete template",
          variant: "destructive",
        })
      }
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate monthly salary
  const calculateMonthlySalary = (annualSalary: number) => {
    return annualSalary / 12
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const isLoading = isLoadingTemplates || isCreating || isUpdating 

  if (isLoadingTemplates && templates.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-72 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="h-10 w-[300px] bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-[200px] bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("salary_templates")}</h1>
          <p className="text-muted-foreground mt-1">{t("manage_salary_templates_for_different_roles")}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button onClick={handleAddTemplate} disabled={isLoadingComponents}>
            <Plus className="mr-2 h-4 w-4" />
            {t("add_template")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("salary_templates")}</CardTitle>
          <CardDescription>{t("create_and_manage_salary_templates_for_different_employee_roles")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedRole} onValueChange={handleRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filter_by_role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{t("all_roles")}</SelectItem>
                  <SelectItem value="Principal">{t("principal")}</SelectItem>
                  <SelectItem value="Teacher">{t("teacher")}</SelectItem>
                  <SelectItem value="Admin">{t("admin")}</SelectItem>
                  <SelectItem value="Clerk">{t("clerk")}</SelectItem>
                  <SelectItem value="Accountant">{t("accountant")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search_by_name_or_code")}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          </div>

          {/* Templates Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("template_name")}>
                    <div className="flex items-center">
                      {t("template_name")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("template_code")}>
                    <div className="flex items-center">
                      {t("code")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("annual_ctc")}>
                    <div className="flex items-center">
                      {t("annual_ctc")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>{t("monthly_salary")}</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("is_active")}>
                    <div className="flex items-center">
                      {t("status")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || selectedRole !== "All"
                        ? t("no_templates_match_your_search_criteria")
                        : t("no_templates_found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{template.template_name}</TableCell>
                      <TableCell>{template.template_code}</TableCell>
                      <TableCell>{formatCurrency(template.annual_ctc)}</TableCell>
                      <TableCell>{formatCurrency(calculateMonthlySalary(template.annual_ctc))}</TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              {t("clone")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(template)}>
                              {template.is_active ? (
                                <>
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  {t("mark_as_inactive")}
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  {t("mark_as_active")}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template)}
                              className="text-red-600 hover:text-red-700 focus:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {templates.length > 0 && (
            <SaralPagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalTemplates / pageSize)}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_salary_template")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("are_you_sure_you_want_to_delete_this_template")}? {t("this_action_cannot_be_undone")}.
              {templateToDelete && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-700">{t("warning")}</p>
                      <p className="text-sm text-amber-600">
                        {t("deleting_it_will_remove_the_salary_structure_from_these_employees")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                t("delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter> */}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SalaryTemplatesManagement
