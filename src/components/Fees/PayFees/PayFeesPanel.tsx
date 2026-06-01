import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, ArrowUpDown, FileText, CreditCard, Download } from 'lucide-react'
import { useLazyGetStudentFeesDetailsForClassQuery, useGetAllFeesTypeQuery } from "@/services/feesService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import { selectActiveAccademicSessionsForSchool, selectAuthState, selectAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import type { AcademicClasses, Division } from "@/types/academic"
import type { StudentWithFeeStatus } from "@/types/fees"
import { toast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import StudentFeesPanel from "@/pages/StudentFeesPanel"

// Format currency function for global use
export function formatCurrency(amount: string | number | null | undefined) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0.00"
  return `₹${Number(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`
}

// Add getFeeTypeName function using feeTypes from API
const getFeeTypeName = (feeTypeId: number, feeTypes: any[] | undefined, t: (key: string) => string): string => {
  if (!feeTypeId) return t("unknown_fee_type")
  if (feeTypes && feeTypes.length > 0) {
    const feeType = feeTypes.find((type: any) => type.id === feeTypeId)
    if (feeType) {
      return feeType.name
    }
  }
  return `${t("fee_type")} ${feeTypeId}`
}

// Utility keys for session storage
const SESSION_SELECTED_CLASS_KEY = "saral_selected_class_id"
const SESSION_SELECTED_DIVISION_KEY = "saral_selected_division_id"
const SESSION_SELECTED_SESSION_KEY = "saral_selected_academic_session_id"

const PayFeesPanel: React.FC = () => {
  const navigate = useNavigate()
  const authState = useAppSelector(selectAuthState)
  const academicClasses = useAppSelector(selectAcademicClasses)
  const academicSessions = useAppSelector(selectAccademicSessionsForSchool)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  const { t } = useTranslation()
  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
  const [getClassFeesStatus, { data: feesData, isLoading, isError, error: errorWhileFetchingClassFees }] =
    useLazyGetStudentFeesDetailsForClassQuery()

  // Read initial values from sessionStorage
  const getInitialClass = () => sessionStorage.getItem(SESSION_SELECTED_CLASS_KEY) || ""
  const getInitialDivision = () => sessionStorage.getItem(SESSION_SELECTED_DIVISION_KEY)
  const getInitialSession = () => sessionStorage.getItem(SESSION_SELECTED_SESSION_KEY)

  const [selectedClass, setSelectedClass] = useState<string>(getInitialClass())
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [selectedSession, setSelectedSession] = useState<string>(getInitialSession() || (currentAcademicSession?.id?.toString() || ""))
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [students, setStudents] = useState<StudentWithFeeStatus[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  // Update sessionStorage when academic year changes
  useEffect(() => {
    if (selectedSession) {
      sessionStorage.setItem(SESSION_SELECTED_SESSION_KEY, selectedSession)
    }
  }, [selectedSession])

  // Fetch fee types when component mounts (use selectedSession)
  const { data: feeTypes } = useGetAllFeesTypeQuery(
    { academic_session_id: Number(selectedSession) || 0, applicable_to: "All" },
    { skip: !selectedSession }
  )

  // Get available divisions for selected class
  const availableDivisions = useMemo<AcademicClasses | null>(() => {
    if (academicClasses && selectedClass) {
      return academicClasses.filter((cls) => cls.class.toString() === selectedClass)[0]
    }
    return null
  }, [academicClasses, selectedClass])

  // On mount, if sessionStorage has division, set it
  useEffect(() => {
    if (academicClasses && selectedClass && selectedSession) {
      const classObj = academicClasses.find((cls) => cls.class.toString() === selectedClass)
      if (classObj && classObj.divisions.length > 0) {
        let divisionToSet: Division | null = null
        const storedDivisionId = getInitialDivision()
        if (storedDivisionId) {
          divisionToSet = classObj.divisions.find((div) => div.id.toString() === storedDivisionId) || null
        }
        if (!divisionToSet) {
          divisionToSet = classObj.divisions[0]
        }
        setSelectedDivision(divisionToSet)
        // Fetch fees data for this class and division
        if (divisionToSet && selectedSession) {
          getClassFeesStatus({
            class_id: divisionToSet.id,
            academic_session: Number(selectedSession),
            page: 1
          })
        }
      }
    }
  }, [academicClasses, selectedClass, selectedSession, getClassFeesStatus])

  // Handle class selection change
  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    sessionStorage.setItem(SESSION_SELECTED_CLASS_KEY, value)
    setSelectedDivision(null)
    setCurrentPage(1)
    sessionStorage.removeItem(SESSION_SELECTED_DIVISION_KEY)
  }

  // Handle division selection change
  const handleDivisionChange = async (value: string) => {
    if (academicClasses && selectedSession) {
      const selectedDiv = academicClasses
        .filter((cls) => cls.class.toString() === selectedClass)[0]
        .divisions.filter((div) => div.id.toString() === value)

      setSelectedDivision(selectedDiv[0])
      setCurrentPage(1)
      sessionStorage.setItem(SESSION_SELECTED_DIVISION_KEY, value)

      try {
        await getClassFeesStatus({
          class_id: selectedDiv[0].id,
          academic_session: Number(selectedSession),
          page: 1
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: t("failed_to_fetch_fees_data"),
          description: t("please_try_again_later")
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

  // Handle opening payment dialog
  const handleViewDetails = (studentId: number) => {
    setSelectedStudentId(studentId)
    setIsPaymentDialogOpen(true)
  }

  // Handle direct navigation to student fees page
  const handleNavigateToStudentFees = (studentId: number) => {
    navigate(`${studentId}?session_id=${selectedSession}`)
  }

  // Get status badge variant based on fee status
  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
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

  // Generate report for class
  const handleGenerateClassReport = () => {
    if (!selectedDivision) {
      toast({
        variant: "destructive",
        title: t("no_class_selected"),
        description: t("please_select_a_class_and_division_to_generate_report")
      })
      return
    }
    
    toast({
      title: t("generating_report"),
      description: t("class_fee_report_is_being_generated")
    })
    
    // Implement report generation functionality
    console.log("Generating report for class", selectedClass, "division", selectedDivision.division)
  }

  // Initialize data
  useEffect(() => {
    if (!academicClasses && authState.user) {
      getAcademicClasses(authState.user.school_id)
    }
  }, [academicClasses, authState.user, getAcademicClasses])

  // Auto-select first class and division when academicClasses are loaded
  useEffect(() => {
    if (academicClasses && academicClasses.length > 0 && !selectedClass) {
      // Find first class with divisions
      const firstClassWithDivisions = academicClasses.find((cls) => cls.divisions.length > 0)

      if (firstClassWithDivisions) {
        // Set the first class
        setSelectedClass(firstClassWithDivisions.class.toString())

        // Set the first division of that class
        if (firstClassWithDivisions.divisions.length > 0) {
          const firstDivision = firstClassWithDivisions.divisions[0]
          setSelectedDivision(firstDivision)

          // Fetch fees data for this class and division
          if (selectedSession) {
            getClassFeesStatus({
              class_id: firstDivision.id,
              academic_session: Number(selectedSession),
              page: 1
            })
          }
        }
      }
    }
  }, [academicClasses, selectedClass, selectedSession, getClassFeesStatus])

  // Update students when fees data changes
  useEffect(() => {
    if (feesData && feesData.data) {
      setStudents(feesData.data as unknown as StudentWithFeeStatus[])
    }
  }, [feesData])

  return (
    <div className="p-6 bg-gradient-to-b from-white to-gray-50 shadow-md rounded-lg max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <CreditCard className="mr-3 h-7 w-7 text-primary" /> {t("fee_management")}
        </h2>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {/* <Button variant="outline" className="flex items-center" onClick={handleGenerateClassReport}>
            <FileText className="mr-2 h-4 w-4" /> {t("class_report")}
          </Button> */}
        </div>
      </div>

      <Card className="mb-6 shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="flex items-center text-gray-700">
            <Filter className="mr-2 h-5 w-5 text-gray-500" /> {t("filter_students")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row justify-between gap-4 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="session-select" className="text-sm font-medium text-gray-700 mb-1 block">
                {t("academic_year")}
              </label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("select_academic_year")} />
                </SelectTrigger>
                <SelectContent>
                  {academicSessions?.map((session) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.session_name} {Boolean(session.is_active) && `(${t("current")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          {/* <div className="relative flex-grow max-w-md">
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
          </div> */}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
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
                        {formatCurrency((Number(student.fees_status.total_amount) - Number(student.fees_status.paid_amount)))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(student.fees_status.status)}>
                          {student.fees_status.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            className="bg-primary hover:bg-primary/90"
                            size="sm"
                            onClick={() => handleNavigateToStudentFees(student.id)}
                            title={t("view_full_details")}
                          >
                            {t("fees_details")}
                          </Button>
                          {/* <Button
                            onClick={() => handleViewDetails(student.id)}
                            className="bg-primary hover:bg-primary/90"
                            size="sm"
                          >
                            {t("pay_fees")}
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {feesData && feesData.meta && selectedDivision && (
            <div className="p-4 border-t">
              <SaralPagination
                currentPage={feesData.meta.current_page}
                totalPages={feesData.meta.last_page}
                onPageChange={(page) => {
                  setCurrentPage(page)
                  getClassFeesStatus({
                    class_id: selectedDivision.id,
                    academic_session: Number(selectedSession),
                    page,
                  })
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      {/* <Dialog 
        open={isPaymentDialogOpen} 
        onOpenChange={(open) => {
          if (!open) setIsPaymentDialogOpen(false)
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          {selectedStudentId && (
            <StudentFeesPanel
              studentId={selectedStudentId}
              onClose={() => setIsPaymentDialogOpen(false)}
              onSuccess={() => {
                setIsPaymentDialogOpen(false)
                // Refresh the student list after payment
                if (selectedDivision) {
                  getClassFeesStatus({
                    class_id: selectedDivision.id,
                    academic_session: Number(selectedSession),
                    page: currentPage,
                  })
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog> */}
    </div>
  )
}

export default PayFeesPanel