"use client"
import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Plus, Search, Link, Eye, X, RefreshCw, Filter } from "lucide-react"
import { AddConcessionForm } from "./AddConcessionForm"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { ApplyConcessionForm } from "./ApplyConcessionForm"
import { ConcessionDetailDialog } from "./ConcessionDetailsDialog"
import {
  useLazyGetConcessionsQuery,
  useCreateConcessionsMutation,
  useUpdateConcessionsMutation,
  useApplyConcessionsToPlanMutation,
  useApplyConcessionsToStudentMutation,
} from "@/services/feesService"
import { toast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  ApplyConcessionToPlanData,
  ApplyConcessionToStudentData,
  ConcessionFormData,
} from "@/utils/fees.validation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import {
  selectAccademicSessionsForSchool,
  selectActiveAccademicSessionsForSchool,
  selectAuthState,
} from "@/redux/slices/authSlice"
import type { Concession } from "@/types/fees"
import { UserRole } from "@/types/user"
import { SaralPagination } from "@/components/ui/common/SaralPagination"

// Inline debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface FilterState {
  academicYear: number
  status: "all" | "active" | "inactive"
  category: string
  searchTerm: string
}

export const ConcessionManagement: React.FC = () => {
  const authState = useAppSelector(selectAuthState)
  const AcademicSessionsForSchool = useAppSelector(selectAccademicSessionsForSchool)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
  const { t } = useTranslation()

  // Queries and mutations
  const [getConcessions, { data: concessions, isLoading, isFetching }] = useLazyGetConcessionsQuery()
  const [createConcession, { isLoading: isCreating }] = useCreateConcessionsMutation()
  const [updateConcession, { isLoading: isUpdating }] = useUpdateConcessionsMutation()
  const [ApplyConcessionToPlan, { isLoading: ApplyingConcessionToPlan }] = useApplyConcessionsToPlanMutation()
  const [ApplyConcessionToStudent, { isLoading: ApplyingConcessionToStudent }] = useApplyConcessionsToStudentMutation()

  // Local state - Initialize with proper defaults
  const [filters, setFilters] = useState<FilterState>(() => ({
    academicYear: CurrentAcademicSessionForSchool?.id || 0,
    status: "all",
    category: "all",
    searchTerm: "",
  }))

  const [currentPage, setCurrentPage] = useState(1)

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500)

  const [dialogState, setDialogState] = useState<{
    type: "add" | "edit" | "apply" | "details" | null
    isOpen: boolean
    concession: Concession | null
  }>({
    type: null,
    isOpen: false,
    concession: null,
  })

  // Get unique categories from current data for filter options
  const availableCategories = useMemo(() => {
    if (!concessions?.data) return []
    return [...new Set(concessions.data.map((c: Concession) => c.category))].filter(Boolean)
  }, [concessions?.data])

  // Set academic year if not already set and session is available
  useEffect(() => {
    if (filters.academicYear === 0 && CurrentAcademicSessionForSchool?.id) {
      setFilters((prev) => ({
        ...prev,
        academicYear: CurrentAcademicSessionForSchool.id,
      }))
    }
    // Only run when academic year is 0 and session is available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.academicYear, CurrentAcademicSessionForSchool?.id])

  // Fetch concessions data utility
  const fetchConcessionsData = async () => {
    if (!filters.academicYear) return
    try {
      await getConcessions({
        academic_session: filters.academicYear,
        status: filters.status === "all" ? undefined : filters.status,
        category: filters.category === "all" ? undefined : filters.category,
        search_term: debouncedSearchTerm || undefined,
        page: currentPage,
      }).unwrap()
    } catch (error) {
      console.error("Failed to fetch concessions:", error)
      toast({
        title: t("error"),
        description: t("failed_to_fetch_concessions"),
        variant: "destructive",
      })
    }
  }

  // Fetch data when filters change
  useEffect(() => {
    fetchConcessionsData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.academicYear, filters.status, filters.category, debouncedSearchTerm, currentPage])

  // Handle filter changes
  const handleAcademicYearChange = (value: string) => {
    setFilters((prev) => ({ ...prev, academicYear: Number.parseInt(value) }))
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value as "all" | "active" | "inactive" }))
    setCurrentPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, category: value }))
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }))
    setCurrentPage(1)
  }

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Clear individual filter
  const clearFilter = (key: keyof FilterState) => {
    if (key === "academicYear") {
      setFilters((prev) => ({ ...prev, academicYear: CurrentAcademicSessionForSchool?.id || 0 }))
    } else if (key === "status") {
      setFilters((prev) => ({ ...prev, status: "all" }))
    } else if (key === "category") {
      setFilters((prev) => ({ ...prev, category: "all" }))
    } else {
      setFilters((prev) => ({ ...prev, searchTerm: "" }))
    }
    setCurrentPage(1)
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      academicYear: CurrentAcademicSessionForSchool?.id || 0,
      status: "all",
      category: "all",
      searchTerm: "",
    })
    setCurrentPage(1)
  }

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.searchTerm.trim()) count++
    if (filters.status !== "all") count++
    if (filters.category !== "all") count++
    return count
  }, [filters])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-green-600 font-medium"
      case "inactive":
        return "text-red-600 font-medium"
      default:
        return "text-green-600 font-medium"
    }
  }

  // Handle adding a new concession
  const handleAddConcession = async (data: ConcessionFormData) => {
    try {
      await createConcession({
        payload: {
          name: data.name,
          description: data.description,
          applicable_to: data.applicable_to,
          category: data.category,
          status: "Active",
          academic_session_id: CurrentAcademicSessionForSchool!.id,
          school_id: authState.user!.school_id,
          concessions_to: data.concessions_to,
        },
      }).unwrap()

      fetchConcessionsData()
      toast({
        title: t("success"),
        description: t("concession_created_successfully"),
      })
      closeDialog()
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.data?.message || t("failed_to_create_concession"),
        variant: "destructive",
      })
    }
  }

  // Handle updating a concession
  const handleUpdateConcession = async (data: ConcessionFormData) => {
    if (!dialogState.concession) return

    try {
      await updateConcession({
        concession_id: dialogState.concession.id,
        payload: {
          name: data.name,
          description: data.description,
          category: data.category,
          status: data.status,
        },
      }).unwrap()

      fetchConcessionsData()
      toast({
        title: t("success"),
        description: t("concession_updated_successfully"),
      })
      closeDialog()
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.data?.message || t("failed_to_update_concession"),
        variant: "destructive",
      })
    }
  }

  // Handle applying a concession
  const handleApplyConcession = async (data: ApplyConcessionToStudentData | ApplyConcessionToPlanData) => {
    if (!dialogState.concession) return

    try {
      if (dialogState.concession.applicable_to === "plan") {
        await ApplyConcessionToPlan({
          payload: {
            concession_id: data.concession_id,
            fees_plan_id: data.fees_plan_id,
            fees_type_ids: data.fees_type_ids,
            deduction_type: data.deduction_type,
            amount: data.fixed_amount,
            percentage: data.percentage,
          },
        }).unwrap()
      } else if (dialogState.concession.applicable_to === "students" && "student_id" in data) {
        await ApplyConcessionToStudent({
          payload: {
            student_id: data.student_id,
            concession_id: data.concession_id,
            fees_plan_id: data.fees_plan_id,
            fees_type_ids: data.fees_type_ids,
            deduction_type: data.deduction_type,
            amount: data.fixed_amount,
            percentage: data.percentage,
          },
        }).unwrap()
      }

      closeDialog()
      toast({
        title: t("success"),
        description: t("concession_applied_successfully"),
      })
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.data?.message || t("failed_to_apply_concession"),
        variant: "destructive",
      })
    }
  }

  // Dialog management functions
  const openDialog = (type: "add" | "edit" | "apply" | "details", concession: Concession | null = null) => {
    setDialogState({ type, isOpen: true, concession })
  }

  const closeDialog = () => {
    setDialogState({ type: null, isOpen: false, concession: null })
  }

  // Refresh data
  const refreshData = () => {
    fetchConcessionsData()
    toast({
      title: t("data_refreshed"),
      description: t("concession_data_refreshed_successfully"),
    })
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("concession_management")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading || isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isFetching ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
          {(authState.user?.role === UserRole.ADMIN || authState.user?.role === UserRole.PRINCIPAL) && (
            <Button onClick={() => openDialog("add")}>
              <Plus className="mr-2 h-4 w-4" /> {t("add_concession")}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <span>{t("filter_concessions")}</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">
                  {activeFiltersCount} {t("active")}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Academic Year Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("academic_year")}</label>
              <Select value={filters.academicYear.toString()} onValueChange={handleAcademicYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_academic_year")} />
                </SelectTrigger>
                <SelectContent>
                  {AcademicSessionsForSchool?.map((session) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.session_name}
                      {session.is_active && ` (${t("current")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("status")}</label>
              <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_statuses")}</SelectItem>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="inactive">{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("category")}</label>
              <Select value={filters.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_categories")}</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("search")}</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("search_concessions")}
                  className="pl-8"
                  value={filters.searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {filters.searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => clearFilter("searchTerm")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">{t("active_filters")}:</span>

              {filters.searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("search")}: "{filters.searchTerm}"
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => clearFilter("searchTerm")}
                  />
                </Badge>
              )}

              {filters.status !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("status")}: {t(filters.status)}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => clearFilter("status")} />
                </Badge>
              )}

              {filters.category !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("category")}: {filters.category}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => clearFilter("category")}
                  />
                </Badge>
              )}

              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-3 w-3 mr-1" />
                {t("clear_all")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("concessions")}</span>
            {(isLoading || isFetching) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                {t("loading")}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead>{t("applicable_to")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isFetching ? (
                  <LoadingSkeleton />
                ) : !concessions?.data || concessions.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="h-8 w-8" />
                        <p className="text-lg font-medium">
                          {activeFiltersCount > 0 ? t("no_concessions_match_filters") : t("no_concessions_found")}
                        </p>
                        <p className="text-sm">
                          {activeFiltersCount > 0
                            ? t("try_adjusting_your_filters")
                            : t("create_your_first_concession_to_get_started")}
                        </p>
                        {activeFiltersCount > 0 && (
                          <Button variant="outline" size="sm" onClick={clearAllFilters}>
                            {t("clear_all_filters")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  concessions.data.map((concession) => (
                    <TableRow key={concession.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{concession.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{concession.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={concession.description}>
                          {concession.description}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="secondary">{concession.applicable_to}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={getStatusColor(concession.status || "Active")}>
                          {concession.status || "Active"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openDialog("details", concession)}>
                            <Eye className="h-3 w-3 mr-1" />
                            {t("view")}
                          </Button>

                          {authState.user?.role === UserRole.ADMIN && (
                            <Button variant="outline" size="sm" onClick={() => openDialog("edit", concession)}>
                              <Pencil className="h-3 w-3 mr-1" />
                              {t("edit")}
                            </Button>
                          )}

                          {authState.user?.role === UserRole.ADMIN && (
                            <Button variant="outline" size="sm" onClick={() => openDialog("apply", concession)}>
                              <Link className="h-3 w-3 mr-1" />
                              {t("apply")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )))
                }
              </TableBody>
            </Table>

            {/* Pagination */}
            {(concessions?.meta && concessions.data.length > 0) && (
              <div className="flex justify-center p-4 border-t">
                <SaralPagination
                  currentPage={concessions.meta.current_page || concessions.meta.currentPage}
                  totalPages={concessions.meta.last_page || concessions.meta.lastPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Add/Edit Concession Dialog */}
      <Dialog
        open={dialogState.isOpen && (dialogState.type === "add" || dialogState.type === "edit")}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{dialogState.type === "edit" ? t("edit_concession") : t("add_new_concession")}</DialogTitle>
          </DialogHeader>
          <AddConcessionForm
            initialData={dialogState.concession}
            onSubmit={dialogState.type === "edit" ? handleUpdateConcession : handleAddConcession}
            onCancel={closeDialog}
            isSubmitting={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Apply Concession Dialog */}
      <Dialog open={dialogState.isOpen && dialogState.type === "apply"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogState.concession?.applicable_to === "plan"
                ? t("apply_concession_to_fee_plan")
                : t("apply_concession_to_student")}
            </DialogTitle>
          </DialogHeader>
          {dialogState.concession && (
            <ApplyConcessionForm
              concession={dialogState.concession}
              onSubmit={handleApplyConcession}
              isApplyingConcesson={ApplyingConcessionToPlan || ApplyingConcessionToStudent}
              onCancel={closeDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Concession Details Dialog */}
      <Dialog
        open={dialogState.isOpen && dialogState.type === "details"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t("concession_details")}</DialogTitle>
          </DialogHeader>
          {dialogState.concession &&
            <ConcessionDetailDialog
              concessionId={dialogState.concession.id}
              isOpen={dialogState.isOpen}
            />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
