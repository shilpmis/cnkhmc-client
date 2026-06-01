// SalaryComponentsManagement

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Search, Plus, RefreshCw, Edit, Trash2, ArrowUpDown, AlertTriangle } from "lucide-react"
import { SalaryComponentForm } from "./SalaryComponentForm"
import { useSalaryComponents } from "./useSalaryComponents"
import type { SalaryComponent } from "@/types/payroll"

const SalaryComponentsManagement = () => {
  const { t } = useTranslation()
  const { components, isLoading, isRefreshing, fetchComponents, deleteComponent, isDeleting, error } =
    useSalaryComponents()

  // State for UI
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)

  // State for component dialog
  const [isComponentFormOpen, setIsComponentFormOpen] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<SalaryComponent | null>(null)

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [componentToDelete, setComponentToDelete] = useState<SalaryComponent | null>(null)

  // Filter components based on search, type, and tab
  const filteredComponents = components.filter((component) => {
    const matchesSearch =
      component.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (component.component_code && component.component_code.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = selectedType === "all" || component.component_type === selectedType

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && component.is_active) ||
      (activeTab === "inactive" && !component.is_active)

    return matchesSearch && matchesType && matchesTab
  })

  // Sort components
  const sortedComponents = sortConfig
    ? [...filteredComponents].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof SalaryComponent]
        const bValue = b[sortConfig.key as keyof SalaryComponent]

        // Handle null or undefined values
        if (aValue === null || aValue === undefined) return sortConfig.direction === "ascending" ? -1 : 1
        if (bValue === null || bValue === undefined) return sortConfig.direction === "ascending" ? 1 : -1

        // Compare values
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    : filteredComponents

  // Request sort
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Handle add new component
  const handleAddComponent = () => {
    setSelectedComponent(null)
    setIsComponentFormOpen(true)
  }

  // Handle edit component
  const handleEditComponent = (component: SalaryComponent) => {
    setSelectedComponent(component)
    setIsComponentFormOpen(true)
  }

  // Handle delete component
  const handleDeleteComponent = (component: SalaryComponent) => {
    setComponentToDelete(component)
    setIsDeleteDialogOpen(true)
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (componentToDelete) { 
        await deleteComponent(componentToDelete.id)
        .then(() => {
          toast({
            title: "Component deleted",
            description: `${componentToDelete.component_name} has been deleted successfully`,
          })
          setIsDeleteDialogOpen(false)
          setComponentToDelete(null)
        })
        .catch((error) => {
          console.error("Error deleting component:", error)
          toast({
            title: "Error",
            description: error.data.message || "Failed to delete component",
            variant: "destructive",
          })
          // setIsDeleteDialogOpen(false)
          // setComponentToDelete(null)
          return null
        })
    }
  }

  // Handle form close
  const handleFormClose = (refresh = false) => {
    setIsComponentFormOpen(false)
    if (refresh) {
      fetchComponents()
    }
  }

  // Get component badge color based on type
  const getComponentBadgeVariant = (type: string) => {
    switch (type) {
      case "earning":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "deduction":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "benefits":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      default:
        return ""
    }
  }

  if (isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">{t("salary_components")}</h1>
          <p className="text-muted-foreground mt-1">{t("manage_salary_components_for_payroll_calculation")}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchComponents} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          <Button onClick={handleAddComponent}>
            <Plus className="mr-2 h-4 w-4" />
            {t("add_component")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 border border-destructive rounded-md p-4 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">{t("error")}</p>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("salary_components")}</CardTitle>
          <CardDescription>{t("create_and_manage_salary_components_for_employee_payroll")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">{t("all_components")}</TabsTrigger>
              <TabsTrigger value="active">{t("active")}</TabsTrigger>
              <TabsTrigger value="inactive">{t("inactive")}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("component_type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_types")}</SelectItem>
                  <SelectItem value="earning">{t("earnings")}</SelectItem>
                  <SelectItem value="deduction">{t("deductions")}</SelectItem>
                  <SelectItem value="benefits">{t("benefits")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search_by_name_or_code")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          </div>

          {/* Components Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("component_name")}>
                    <div className="flex items-center">
                      {t("name")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("component_code")}>
                    <div className="flex items-center">
                      {t("code")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort("component_type")}>
                    <div className="flex items-center">
                      {t("type")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>{t("calculation_method")}</TableHead>
                  <TableHead>{t("value")}</TableHead>
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
                {components.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                        <h3 className="text-lg font-medium">{t("no_components_found")}</h3>
                        <p className="text-muted-foreground mt-1">{t("no_salary_components_have_been_created_yet")}</p>
                        <Button onClick={handleAddComponent} className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          {t("add_your_first_component")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedComponents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || selectedType !== "all" || activeTab !== "all"
                        ? t("no_components_match_your_search_criteria")
                        : t("no_components_found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedComponents.map((component) => (
                    <TableRow key={component.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{component.component_name}</TableCell>
                      <TableCell>{component.component_code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getComponentBadgeVariant(component.component_type)}>
                          {component.component_type.charAt(0).toUpperCase() + component.component_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {component.calculation_method === "amount" ? t("fixed_amount") : t("percentage_based")}
                      </TableCell>
                      <TableCell>
                        {component.calculation_method === "percentage"
                          ? `${component.percentage}%`
                          : component.amount
                            ? `₹${component.amount.toLocaleString("en-IN")}`
                            : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={component.is_active ? "default" : "secondary"}>
                          {component.is_active ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditComponent(component)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComponent(component)}
                            disabled={component.is_mandatory}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Component Form */}
      {isComponentFormOpen && (
        <SalaryComponentForm isOpen={isComponentFormOpen} onClose={handleFormClose} component={selectedComponent} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_salary_component")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("are_you_sure_you_want_to_delete_this_component")}? {t("this_action_cannot_be_undone")}.
              {componentToDelete && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="font-medium text-amber-700">{t("warning")}</p>
                  <p className="text-sm text-amber-600 mt-1">
                    {t(
                      "deleting_this_component_may_affect_existing_salary_templates_and_employee_payroll_calculations",
                    )}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? t("deleting...") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SalaryComponentsManagement
