"use client"
import { useState, useEffect, useMemo } from "react"
import type React from "react"

import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, ArrowUpDown, Eye, ExternalLink } from "lucide-react"
import { useLazyGetStudentFeesDetailsForClassQuery } from "@/services/feesService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import type { AcademicClasses, Division } from "@/types/academic"
import type { StudentWithFeeStatus } from "@/types/fees"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import StudentFeesStatus from "@/pages/StundetFeesStatus"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// Session storage keys for this page
const SESSION_SELECTED_CLASS_KEY = "studentFeeMgmt_selected_class_id"
const SESSION_SELECTED_DIVISION_KEY = "studentFeeMgmt_selected_division_id"
const SESSION_SELECTED_PAGE_KEY = "studentFeeMgmt_selected_page"

const StudentFeesManagement: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const authState = useAppSelector(selectAuthState)
  const academicClasses = useAppSelector(selectAcademicClasses)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  // API hooks
  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
  const [getClassFeesStatus, { data: feesData, isLoading, isError, error: errorWhileFetchingClassFees }] =
    useLazyGetStudentFeesDetailsForClassQuery()

  // State for class/division selection and filtering
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [students, setStudents] = useState<StudentWithFeeStatus[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // State for student details modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [selectedStudentName, setSelectedStudentName] = useState<string>("")
  const [hasRestoredSession, setHasRestoredSession] = useState(false)

  // Load state from sessionStorage ONLY after academicClasses are loaded
  useEffect(() => {
    if (!academicClasses || academicClasses.length === 0 || hasRestoredSession) return
    const savedClass = sessionStorage.getItem(SESSION_SELECTED_CLASS_KEY)
    const savedDivision = sessionStorage.getItem(SESSION_SELECTED_DIVISION_KEY)
    const savedPage = sessionStorage.getItem(SESSION_SELECTED_PAGE_KEY)

    let classToSet = ""
    let divisionToSet: Division | null = null
    let pageToSet = 1

    if (savedClass && academicClasses.some((cls) => cls.class.toString() === savedClass)) {
      classToSet = savedClass
      const classObj = academicClasses.find((cls) => cls.class.toString() === savedClass)
      if (classObj && savedDivision) {
        const division = classObj.divisions.find((div) => div.id.toString() === savedDivision)
        if (division) {
          divisionToSet = division
        }
      }
      if (savedPage && !isNaN(Number(savedPage))) {
        pageToSet = Number(savedPage)
      }
    } else {
      // fallback to first class/division
      const firstClassWithDivisions = academicClasses.find((cls) => cls.divisions.length > 0)
      if (firstClassWithDivisions) {
        classToSet = firstClassWithDivisions.class.toString()
        divisionToSet = firstClassWithDivisions.divisions[0]
      }
    }

    setSelectedClass(classToSet)
    setSelectedDivision(divisionToSet)
    setCurrentPage(pageToSet)
    setHasRestoredSession(true)

    // Fetch data if both class and division are set
    if (classToSet && divisionToSet && currentAcademicSession) {
      getClassFeesStatus({
        class_id: divisionToSet.id,
        academic_session: currentAcademicSession.id,
        page: pageToSet,
      })
    }
  }, [academicClasses, currentAcademicSession, hasRestoredSession])

  // Save state to sessionStorage
  const saveStateToSessionStorage = (classId: string, divisionId: string | number | null, page: number) => {
    sessionStorage.setItem(SESSION_SELECTED_CLASS_KEY, classId)
    sessionStorage.setItem(SESSION_SELECTED_DIVISION_KEY, divisionId ? divisionId.toString() : "")
    sessionStorage.setItem(SESSION_SELECTED_PAGE_KEY, page.toString())
  }

  // Get available divisions for selected class
  const availableDivisions = useMemo<AcademicClasses | null>(() => {
    if (academicClasses && selectedClass) {
      return academicClasses.filter((cls) => cls.class.toString() === selectedClass)[0]
    }
    return null
  }, [academicClasses, selectedClass])

  // Handle class selection change
  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedDivision(null)
    setCurrentPage(1)
    saveStateToSessionStorage(value, null, 1)
  }

  // Handle division selection change
  const handleDivisionChange = async (value: string) => {
    if (academicClasses) {
      const selectedDiv = academicClasses
        .filter((cls) => cls.class.toString() === selectedClass)[0]
        .divisions.filter((div) => div.id.toString() === value)

      setSelectedDivision(selectedDiv[0])
      setCurrentPage(1)
      saveStateToSessionStorage(selectedClass, selectedDiv[0].id, 1)

      try {
        await getClassFeesStatus({
          class_id: selectedDiv[0].id,
          academic_session: currentAcademicSession!.id,
          page: 1,
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: t("failed_to_fetch_fees_data"),
          description: t("please_try_again_later"),
        })
      }
    }
  }

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!students) return []

    return students.filter((student) => {
      const fullName = `${student.first_name} ${student.middle_name} ${student.last_name}`.toLowerCase()
      const grNumber = student.gr_no != null ? student.gr_no.toString() : ""

      return fullName.includes(searchTerm.toLowerCase()) || grNumber.includes(searchTerm.toLowerCase())
    })
  }, [students, searchTerm])

  // Sort students based on sort config
  const sortedStudents = useMemo(() => {
    if (!sortConfig) return filteredStudents

    return [...filteredStudents].sort((a, b) => {
      if (!sortConfig.key) return 0

      let aValue, bValue

      // Handle nested properties
      if (sortConfig.key.includes(".")) {
        const [parent, child] = sortConfig.key.split(".")
        aValue = (a[parent as keyof typeof a] as any)[child]
        bValue = (b[parent as keyof typeof b] as any)[child]
      } else {
        aValue = a[sortConfig.key as keyof typeof a]
        bValue = b[sortConfig.key as keyof typeof b]
      }

      // Convert to numbers for numeric comparison if needed
      if (typeof aValue === "string" && !isNaN(Number(aValue))) {
        aValue = Number(aValue)
        bValue = Number(bValue)
      }

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
  }, [filteredStudents, sortConfig])

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // View student details in modal
  const handleViewDetails = (studentId: number) => {
    setSelectedStudentId(studentId)
    setIsModalOpen(true)
  }

  const handleGenerateReceipt = (studentId: number) => {
    console.log("Generate receipt for student ID:", studentId)
  }

  // Navigate to full details page
  const handleViewFullDetails = (studentId: number) => {
    navigate(`/d/fee/student/${studentId}`)
  }

  // Get status badge variant based on fee status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default"
      case "Partially Paid":
        return "outline"
      case "Overdue":
        return "destructive"
      default:
        return "secondary"
    }
  }

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Initialize data
  useEffect(() => {
    if (!academicClasses && authState.user) {
      getAcademicClasses(authState.user.school_id)
    }
  }, [academicClasses, authState.user, getAcademicClasses])

  // Only auto-select first class/division if session restore has NOT happened
  useEffect(() => {
    if (academicClasses && academicClasses.length > 0 && !selectedClass && !hasRestoredSession) {
      const firstClassWithDivisions = academicClasses.find((cls) => cls.divisions.length > 0)
      if (firstClassWithDivisions) {
        setSelectedClass(firstClassWithDivisions.class.toString())
        setSelectedDivision(firstClassWithDivisions.divisions[0])
        getClassFeesStatus({
          class_id: firstClassWithDivisions.divisions[0].id,
          academic_session: currentAcademicSession!.id,
        })
      }
    }
  }, [academicClasses, selectedClass, currentAcademicSession, hasRestoredSession])

  // Update students when fees data changes
  useEffect(() => {
    if (feesData) {
      setStudents(feesData.data as unknown as StudentWithFeeStatus[])
    }
  }, [feesData])

  const hasFeesPlan = feesData && (feesData as any).hasFeesPlan !== false
  const hasStudents = feesData && (feesData as any).hasStudents !== false

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{t("student_fee_management")}</h2>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" /> {t("filter_students")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="class-select" className="text-sm font-medium text-gray-700 mb-1 block">
                {t("class")}
              </label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("select_class")} />
                </SelectTrigger>
                <SelectContent>
                  {academicClasses?.map((cls, index) =>
                    cls.divisions.length > 0 ? (
                      <SelectItem key={index} value={cls.class.toString()}>
                        {t("class")} {cls.class}
                      </SelectItem>
                    ) : null,
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="division-select" className="text-sm font-medium text-gray-700 mb-1 block">
                {t("division")}
              </label>
              <Select
                value={selectedDivision ? selectedDivision.id.toString() : ""}
                onValueChange={handleDivisionChange}
                disabled={!selectedClass}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("select_division")} />
                </SelectTrigger>
                <SelectContent>
                  {availableDivisions?.divisions.map((division, index) => (
                    <SelectItem key={index} value={division.id.toString()}>
                      {`${division.division} ${division.aliases ? "- " + division.aliases : ""}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-9 transform -translate-y-1/2 text-gray-400" />
            <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1 block">
              {t("search")}
            </label>
            <Input
              id="search"
              placeholder={t("search_by_name_or_gr_number")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {!hasFeesPlan && !isLoading && !isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-amber-50/40 via-white to-amber-50/10 border border-amber-100 rounded-lg m-6 shadow-sm">
              <div className="p-4 bg-amber-100/80 text-amber-800 rounded-full mb-4 shadow-inner">
                <Filter className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">
                {t("no_active_fees_plan_found")}
              </h3>
              <p className="text-sm text-amber-700 max-w-md mb-6 leading-relaxed">
                {t("there_is_no_active_fees_plan_configured_for_this_class_in_the_current_academic_year._an_active_plan_is_required_to_track_student_fees_and_collect_payments.")}
              </p>
              <Button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("switch-fees-tab", { detail: "fee-plans" }))
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                {t("set_up_fees_plan")}
              </Button>
            </div>
          ) : !hasStudents && !isLoading && !isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-blue-50/40 via-white to-blue-50/10 border border-blue-100 rounded-lg m-6 shadow-sm">
              <div className="p-4 bg-blue-100/80 text-blue-800 rounded-full mb-4 shadow-inner">
                <ArrowUpDown className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                {t("no_pursuing_students")}
              </h3>
              <p className="text-sm text-blue-700 max-w-md mb-6 leading-relaxed">
                {t("no_students_are_currently_enrolled_as_pursuing_in_this_division_for_the_selected_academic_session._please_ensure_students_are_admitted_or_promoted.")}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">
                        <div className="flex items-center cursor-pointer" onClick={() => requestSort("first_name")}>
                          {t("student_name")}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center cursor-pointer" onClick={() => requestSort("gr_no")}>
                          {t("gr_number")}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => requestSort("fees_status.total_amount")}
                        >
                          {t("total_fees")}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => requestSort("fees_status.paid_amount")}
                        >
                          {t("paid_amount")}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => requestSort("fees_status.due_amount")}
                        >
                          {t("due_amount")}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center cursor-pointer" onClick={() => requestSort("fees_status.status")}>
                          {t("status")}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      // Loading skeleton
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-6 w-[200px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-[80px]" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-9 w-[100px] ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-red-500">
                          {(errorWhileFetchingClassFees as any)?.data?.message ||
                            t("failed_to_load_fees_data._please_try_again.")}
                        </TableCell>
                      </TableRow>
                    ) : sortedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {searchTerm
                            ? t("no_students_match_your_search_criteria")
                            : t("no_students_found_in_this_class_division")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedStudents.map((student) => (
                        <TableRow key={student.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {student.first_name} {student.middle_name} {student.last_name}
                          </TableCell>
                          <TableCell>{student.gr_no}</TableCell>
                          <TableCell>{formatCurrency(student.fees_status.total_amount)}</TableCell>
                          <TableCell>{formatCurrency(student.fees_status.paid_amount)}</TableCell>
                          <TableCell className="font-medium text-red-600">
                            {formatCurrency(
                              Number(student.fees_status.total_amount) - Number(student.fees_status.paid_amount),
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(student.fees_status.status) as any}>
                              {student.fees_status.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewDetails(student.id)
                                }
                                title={t("quick_view")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewFullDetails(student.id)}
                                title={t("full_details_and_management")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {feesData && feesData.meta && selectedDivision && (
                <div className="p-4">
                  <SaralPagination
                    currentPage={feesData.meta.current_page}
                    totalPages={feesData.meta.last_page}
                    onPageChange={(page) => {
                      setCurrentPage(page)
                      saveStateToSessionStorage(selectedClass, selectedDivision.id, page)
                      getClassFeesStatus({
                        class_id: selectedDivision.id,
                        academic_session: currentAcademicSession!.id,
                        page,
                      })
                    }}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedStudentId ? (
            <>
              <StudentFeesStatus
                studentId={selectedStudentId}
                onClose={() => setIsModalOpen(false)}
                mode="dialog"
              />
            </>
          ) : (
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-medium">Loading student fee details...</h3>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default StudentFeesManagement
