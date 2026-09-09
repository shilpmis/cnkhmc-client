"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { selectCurrentUser } from "@/redux/slices/authSlice"
import {
  ArrowUpRight,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  UserPlus,
  GraduationCap,
  ArrowRight,
  FileDown,
  FileUp,
  Users,
  Info,
} from "lucide-react"
import { useGetAcademicClassesQuery, useGetAcademicSessionsQuery } from "@/services/AcademicService"
import {
  useExportStudentsListMutation,
  useGetPromotionHistoryQuery,
  useHoldBackStudentMutation,
  useLazyGetStudentsForPromotionQuery,
  usePromoteStudentsMutation,
  usePromoteSingleStudentMutation,
  useTransferStudentMutation,
} from "@/services/PromotionService"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface Student {
  id: number
  student: {
    id: number
    first_name: string
    middle_name: string
    last_name: string
    gr_no: number
    roll_number: number
    gender: string
    birth_date: string
    primary_mobile: number
    father_name: string
    mother_name: string
    is_active: number
    fees_status?: {
      id: number
      student_id: number
      academic_session_id: number
      fees_plan_id: number
      total_amount: string
      discounted_amount: string
      paid_amount: string
      due_amount: string
      status: string
      total_refund_amount: string
      refunded_amount: string
    }
  }
  class: {
    id: number
    class: number
    division: string
    aliases: string | null
  }
  academic_session_id: number
  division_id: number
  status: string
  promotionStatus?: "promoted" | "held" | "pending"
}

interface AcademicSession {
  id: number
  name: string
  is_active: boolean
  school_id: number
  start_month: string
  end_month: string
  start_year: string
  end_year: string
  session_name: string
}

export function StudentPromotionManagement() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const academicClassesFromStore = useAppSelector(selectAcademicClasses)
  const user = useAppSelector(selectCurrentUser)

  // State for academic sessions
  const [sourceAcademicSession, setSourceAcademicSession] = useState<string>("")
  const [targetAcademicSession, setTargetAcademicSession] = useState<string>("")

  // State for class selection
  const [sourceClass, setSourceClass] = useState<string>("")
  const [sourceDivision, setSourceDivision] = useState<string>("")
  const [targetClass, setTargetClass] = useState<string>("")
  const [targetDivision, setTargetDivision] = useState<string>("")

  // State for students
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Dialog states
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false)
  const [isPromoteSingleDialogOpen, setIsPromoteSingleDialogOpen] = useState(false)
  const [isHoldBackDialogOpen, setIsHoldBackDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<Student | null>(null)

  // Promotion remarks
  const [promotionRemarks, setPromotionRemarks] = useState("")

  // Tabs
  const [activeTab, setActiveTab] = useState("current")

  // Notes for held back students
  const [holdBackReason, setHoldBackReason] = useState("")

  // Transfer details
  const [transferSchool, setTransferSchool] = useState("")
  const [transferDate, setTransferDate] = useState("")
  const [transferCertificate, setTransferCertificate] = useState<File | null>(null)

  // RTK Query hooks
  const { data: academicSessionsData, isLoading: isLoadingAcademicSessions } = useGetAcademicSessionsQuery(
    user?.school_id || 0,
  )

  // Fetch academic classes directly from the API
  const { data: academicClassesData, isLoading: isLoadingAcademicClasses } = useGetAcademicClassesQuery(
    user?.school_id || 0,
  )

  const [getStudentsForPromotion, { data: studentsData, isLoading: isLoadingStudents }] =
    useLazyGetStudentsForPromotionQuery()
  const [promoteStudents, { isLoading: isPromoting }] = usePromoteStudentsMutation()
  const [promoteSingleStudent, { isLoading: isPromotingSingle }] = usePromoteSingleStudentMutation()
  const [holdBackStudent, { isLoading: isHoldingBack }] = useHoldBackStudentMutation()
  const [transferStudent, { isLoading: isTransferring }] = useTransferStudentMutation()
  const { data: promotionHistoryData, isLoading: isLoadingHistory } = useGetPromotionHistoryQuery(
    Number.parseInt(sourceAcademicSession) || 0,
    { skip: !sourceAcademicSession || activeTab !== "history" },
  )
  const [exportStudentsList, { isLoading: isExporting }] = useExportStudentsListMutation()

  // Derived state
  const academicSessions = useMemo(() => {
    if (!academicSessionsData) return []

    // Check if the data is in the expected format

    // Extract sessions from the response
    let sessions = []

    // Handle the specific response structure where sessions are under a "sessions" key
    if (academicSessionsData && academicSessionsData.sessions && Array.isArray(academicSessionsData.sessions)) {
      sessions = academicSessionsData.sessions.filter((session: { id: any }) => session.id)
    }
    // Handle other possible response structures
    else if (Array.isArray(academicSessionsData)) {
      sessions = academicSessionsData.filter((session) => session.id)
    } else if (academicSessionsData.data && Array.isArray(academicSessionsData.data)) {
      sessions = academicSessionsData.data.filter((session: { id: any }) => session.id)
    } else {
      console.error("Unexpected academic sessions data format:", academicSessionsData)
      return []
    }

    // Sort sessions by year (descending)
    sessions.sort((a: any, b: any) => {
      const yearA = Number.parseInt(a.start_year || a.session_name?.split("-")[0] || "0")
      const yearB = Number.parseInt(b.start_year || b.session_name?.split("-")[0] || "0")
      return yearB - yearA
    })

    return sessions
  }, [academicSessionsData])

  // Use academicClassesData from API if available, otherwise fall back to store
  const academicClasses = useMemo(() => {
    if (academicClassesData && academicClassesData.length > 0) {
      return academicClassesData
    }
    return academicClassesFromStore || []
  }, [academicClassesData, academicClassesFromStore])

  const students = useMemo(() => {
    if (!studentsData?.data?.students) return []
    return studentsData.data.students.map((student: any) => ({
      ...student,
      promotionStatus: "pending", // Default status for all students
    }))
  }, [studentsData])

  const totalPages = useMemo(() => studentsData?.data?.pagination?.last_page || 1, [studentsData])
  const promotionHistory = useMemo(() => promotionHistoryData?.data || [], [promotionHistoryData])

  // Fetch students when source class or division changes
  useEffect(() => {
    if (sourceAcademicSession && (sourceClass || sourceDivision)) {
      fetchStudents()
    }
  }, [sourceClass, sourceDivision])

  // Set default academic sessions when data is loaded
  useEffect(() => {
    if (academicSessions.length > 0) {
      // Find current active session
      const currentSession = academicSessions.find((session: { is_active: any }) => session.is_active)

      if (currentSession) {
        setSourceAcademicSession(currentSession.id.toString())

        // Find next academic session for target (if exists)
        const currentYear = Number.parseInt(
          currentSession.start_year || currentSession.session_name?.split("-")[0] || "0",
        )

        const nextSession = academicSessions.find((session: any) => {
          const sessionYear = Number.parseInt(session.start_year || session.session_name?.split("-")[0] || "0")
          return sessionYear === currentYear + 1
        })

        if (nextSession) {
          setTargetAcademicSession(nextSession.id.toString())
        } else {
          // If there's no next session, use the current one
          setTargetAcademicSession(currentSession.id.toString())
        }
      }
    }
  }, [academicSessions])

  // Fetch students based on selected filters
  const fetchStudents = () => {
    if (!sourceAcademicSession) {
      toast({
        title: "Missing Selection",
        description: "Please select a source academic year",
        variant: "destructive",
      })
      return
    }

    // Create query parameters object
    const queryParams = {
      limit: itemsPerPage,
    }

    // Add division_id as a query parameter if selected
    if (sourceDivision && sourceDivision !== "all") {
      // Extract the numeric ID from the division value if needed
      const divisionId = sourceDivision.startsWith("division-")
        ? sourceDivision.replace("division-", "")
        : sourceDivision

      // @ts-ignore - Adding division_id to query params
      queryParams.division_id = Number.parseInt(divisionId)
    }

    getStudentsForPromotion({
      academic_session_id: Number.parseInt(sourceAcademicSession),
      class_id: sourceClass ? Number.parseInt(sourceClass) : undefined,
      page: currentPage,
      ...queryParams,
    })
    setHasSearched(true)
  }

  // Handle source class change
  const handleSourceClassChange = (value: string) => {
    setSourceClass(value)
    setSourceDivision("")
    setHasSearched(false)

    // Auto-select target class (same or next class)
    let nextClass = value;
    
    // Check standard pre-primary progression
    const prePrimaryMap: Record<string, string> = {
      "nursery": "LKG",
      "lkg": "UKG",
      "ukg": "1"
    }
    
    if (prePrimaryMap[value.toLowerCase()]) {
      nextClass = prePrimaryMap[value.toLowerCase()];
    }
    // Then try standard numeric promotion (e.g. "1" -> "2")
    else if (!isNaN(Number.parseInt(value)) && Number.parseInt(value).toString() === value) {
      nextClass = (Number.parseInt(value) + 1).toString()
    } 
    // Then try ordinal matching for any number (e.g. "1st year" -> "2nd year", "9th" -> "10th")
    else {
      // This regex matches numbers with their ordinal suffix (e.g. 1st, 2nd, 3rd, 4th)
      const ordinalMatch = value.match(/(\d+)(st|nd|rd|th)/i);
      
      if (ordinalMatch) {
        const num = Number.parseInt(ordinalMatch[1]);
        const nextNum = num + 1;
        
        // Determine the correct ordinal suffix for the next number
        let nextSuffix = "th";
        const lastDigit = nextNum % 10;
        const lastTwoDigits = nextNum % 100;
        
        if (lastTwoDigits < 11 || lastTwoDigits > 13) {
          if (lastDigit === 1) nextSuffix = "st";
          else if (lastDigit === 2) nextSuffix = "nd";
          else if (lastDigit === 3) nextSuffix = "rd";
        }
        
        // Preserve original case of the suffix if possible, or just use lowercase
        const isUpper = ordinalMatch[2] === ordinalMatch[2].toUpperCase();
        if (isUpper) nextSuffix = nextSuffix.toUpperCase();
        
        // Replace the matched ordinal with the new one
        nextClass = value.replace(ordinalMatch[0], `${nextNum}${nextSuffix}`);
      }
      // Word-based ordinals fallback
      else if (value.toLowerCase().includes("first")) {
        nextClass = value.replace(/first/i, "second").replace(/First/g, "Second").replace(/FIRST/g, "SECOND")
      } else if (value.toLowerCase().includes("second")) {
        nextClass = value.replace(/second/i, "third").replace(/Second/g, "Third").replace(/SECOND/g, "THIRD")
      } else if (value.toLowerCase().includes("third")) {
        nextClass = value.replace(/third/i, "fourth").replace(/Third/g, "Fourth").replace(/THIRD/g, "FOURTH")
      } else if (value.toLowerCase().includes("fourth")) {
        nextClass = value.replace(/fourth/i, "fifth").replace(/Fourth/g, "Fifth").replace(/FOURTH/g, "FIFTH")
      } else if (value.toLowerCase().includes("fifth")) {
        nextClass = value.replace(/fifth/i, "sixth").replace(/Fifth/g, "Sixth").replace(/FIFTH/g, "SIXTH")
      }
    }

    // Check if the next class exists in academicClasses
    const nextClassExists = academicClasses.some((cls) => cls.class === nextClass)

    if (nextClassExists) {
      setTargetClass(nextClass)
    } else {
      // If next class doesn't exist by name/number, try to find it in the sorted array
      const currentIndex = academicClasses.findIndex((cls) => cls.class === value)
      if (currentIndex >= 0 && currentIndex + 1 < academicClasses.length) {
        setTargetClass(academicClasses[currentIndex + 1].class)
      } else {
        // If next class doesn't exist, use the current class
        setTargetClass(value)
      }
    }

    setTargetDivision("")
  }

  // Handle source division change
  const handleSourceDivisionChange = (value: string) => {
    setSourceDivision(value)
    setHasSearched(false)

    // If target class is the same as source class, auto-select the same division
    if (targetClass === sourceClass && value !== "all") {
      setTargetDivision(value)
    }
  }

  // Helper function to check if student can be promoted based on fee status
  const canPromoteBasedOnFeeStatus = (student: Student) => {
    // If fee status is not available / missing, do not block promotion
    if (!student.student?.fees_status) return true

    const restrictedStatuses = ["Pending", "Overdue"]
    return !restrictedStatuses.includes(student.student.fees_status.status)
  }

  // Toggle select individual student
  const toggleSelectStudent = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    } else {
      // Find the student
      const student = filteredStudents.find((s) => s.student.id === studentId)

      // Check if student can be promoted based on fee status
      if (student && !canPromoteBasedOnFeeStatus(student)) {
        toast({
          title: "Cannot Select Student",
          description: "This student cannot be promoted due to pending fee payments.",
          variant: "destructive",
        })
        return
      }

      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  // Handle promotion of selected students (bulk)
  const handlePromoteStudents = async () => {
    if (!targetClass || !targetAcademicSession) {
      toast({
        title: "Validation Error",
        description: "Please select target class and academic session",
        variant: "destructive",
      })
      return
    }

    if (selectedStudents.length === 0) {
      toast({
        title: "No Students Selected",
        description: "Please select at least one student to promote",
        variant: "destructive",
      })
      return
    }

    // Check if all selected students can be promoted based on fee status
    const studentsWithFeeIssues = filteredStudents.filter(
      (student) => selectedStudents.includes(student.student.id) && !canPromoteBasedOnFeeStatus(student),
    )

    if (studentsWithFeeIssues.length > 0) {
      toast({
        title: "Fee Payment Issues",
        description: `${studentsWithFeeIssues.length} selected students have pending fee payments and cannot be promoted.`,
        variant: "destructive",
      })
      return
    }

    try {
      const result = await promoteStudents({
        source_academic_session_id: Number.parseInt(sourceAcademicSession),
        target_academic_session_id: Number.parseInt(targetAcademicSession),
        target_class_id: Number.parseInt(targetClass),
        target_division_id: targetDivision && targetDivision !== "auto" ? Number.parseInt(targetDivision) : null,
        student_ids: selectedStudents,
        status: "promoted",
      }).unwrap()

      if (result.success) {
        toast({
          title: "Success",
          description: `${selectedStudents.length} students promoted successfully`,
        })

        // Reset selection and refresh students
        setSelectedStudents([])
        fetchStudents()
      } else {
        toast({
          title: "Error",
          description: JSON.stringify(result.data) || "Failed to promote students",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to promote students. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPromoteDialogOpen(false)
    }
  }

  // Handle promotion of a single student
  const handlePromoteSingleStudent = async () => {
    if (
      !selectedStudentForAction ||
      !targetClass ||
      !targetAcademicSession ||
      !targetDivision ||
      targetDivision === "auto"
    ) {
      toast({
        title: "Validation Error",
        description: "Please select target class, division, and academic session",
        variant: "destructive",
      })
      return
    }

    // Check if student can be promoted based on fee status
    if (!canPromoteBasedOnFeeStatus(selectedStudentForAction)) {
      toast({
        title: "Cannot Promote Student",
        description: "This student cannot be promoted due to pending fee payments.",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await promoteSingleStudent({
        source_academic_session_id: Number.parseInt(sourceAcademicSession),
        target_academic_session_id: Number.parseInt(targetAcademicSession),
        source_division_id: selectedStudentForAction.division_id,
        target_division_id: Number.parseInt(targetDivision),
        student_id: selectedStudentForAction?.student?.id,
        status: "promoted",
        remarks: promotionRemarks || "Promoted to next class",
      }).unwrap()

      if (result.success) {
        toast({
          title: "Success",
          description: `Student ${selectedStudentForAction.student.first_name} promoted successfully`,
        })

        // Refresh students
        fetchStudents()
      } else {
        console.log("result result", result)
        toast({
          title: "Error",
          description: result.message || "Failed to promote student",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.log("error occured while promoting student", error)

      toast({
        title: "Error",
        description: error.message || "Failed to promote student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPromoteSingleDialogOpen(false)
      setPromotionRemarks("")
    }
  }

  // Handle hold back student
  const handleHoldBackStudent = async () => {
    if (!selectedStudentForAction) return

    try {
      const result = await holdBackStudent({
        student_id: selectedStudentForAction?.student?.id,
        remark: holdBackReason,
        source_academic_session_id: Number.parseInt(sourceAcademicSession),
        target_academic_session_id: Number.parseInt(targetAcademicSession),
      }).unwrap()

      if (result.success) {
        toast({
          title: "Success",
          description: `Student ${selectedStudentForAction.student.first_name} held back successfully`,
        })

        // Refresh students
        fetchStudents()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to hold back student",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to hold back student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsHoldBackDialogOpen(false)
      setHoldBackReason("")
    }
  }

  // Handle transfer student
  const handleTransferStudent = async () => {
    if (!selectedStudentForAction) return

    if (!transferSchool || !transferDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append("student_id", selectedStudentForAction.id.toString())
      formData.append("transfer_school", transferSchool)
      formData.append("transfer_date", transferDate)
      formData.append("academic_session_id", sourceAcademicSession)

      if (transferCertificate) {
        formData.append("certificate", transferCertificate)
      }

      const result = await transferStudent(formData).unwrap()

      if (result.success) {
        toast({
          title: "Success",
          description: `Student ${selectedStudentForAction.student.first_name} transferred successfully`,
        })

        // Refresh students
        fetchStudents()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to transfer student",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to transfer student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTransferDialogOpen(false)
      setTransferSchool("")
      setTransferDate("")
      setTransferCertificate(null)
    }
  }

  // Handle file upload for transfer certificate
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTransferCertificate(e.target.files[0])
    }
  }

  // Toggle select all students
  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((item) => item.student.id))
    }
  }

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students

    return students.filter((student) => {
      const fullName =
        `${student.student.first_name} ${student.student.middle_name || ""} ${student.student.last_name || ""}`.toLowerCase()
      const searchLower = searchTerm.toLowerCase()

      return (
        fullName.includes(searchLower) ||
        (student.student.gr_no != null && student.student.gr_no.toString().includes(searchTerm)) ||
        (student.student.roll_number && student.student.roll_number.toString().includes(searchTerm))
      )
    })
  }, [students, searchTerm])

  // // Use server-side pagination
  // const paginatedStudents = students

  // Get available divisions for source class
  const availableSourceDivisions = useMemo(() => {
    if (!sourceClass || !academicClasses) return []

    const selectedClass = academicClasses.find((cls) => cls.class === sourceClass)
    return selectedClass ? selectedClass.divisions : []
  }, [sourceClass, academicClasses])

  // Get available divisions for target class
  const availableTargetDivisions = useMemo(() => {
    if (!targetClass || !academicClasses) return []

    const selectedClass = academicClasses.find((cls) => cls.class === targetClass)
    return selectedClass ? selectedClass.divisions : []
  }, [targetClass, academicClasses])

  // Handle page change
  const handlePageChange = (page: number) => {
    // Instead of setting state and then fetching, we'll fetch with the provided page number directly
    if (hasSearched && sourceAcademicSession && (sourceClass || sourceDivision)) {
      // Create query parameters object with the new page number
      const queryParams = {
        limit: itemsPerPage,
      }

      // Add division_id as a query parameter if selected
      if (sourceDivision && sourceDivision !== "all") {
        const divisionId = sourceDivision.startsWith("division-")
          ? sourceDivision.replace("division-", "")
          : sourceDivision

        // @ts-ignore - Adding division_id to query params
        queryParams.division_id = Number.parseInt(divisionId)
      }

      // Call the API with the new page number
      getStudentsForPromotion({
        academic_session_id: Number.parseInt(sourceAcademicSession),
        class_id: sourceClass ? Number.parseInt(sourceClass) : undefined,
        page: page, // Use the page parameter directly
        ...queryParams,
      })
    }

    // Update the state after initiating the fetch
    setCurrentPage(page)
  }

  // Export students list
  const handleExportStudents = async () => {
    if (!sourceAcademicSession) {
      toast({
        title: "Missing Selection",
        description: "Please select a source academic year",
        variant: "destructive",
      })
      return
    }
    try {
      const blob = await exportStudentsList({
        academic_session_id: Number.parseInt(sourceAcademicSession),
        class_id: sourceClass ? Number.parseInt(sourceClass) : undefined,
        division_id: sourceDivision && sourceDivision !== "all" ? Number.parseInt(sourceDivision) : undefined,
      }).unwrap()

      // Create a download link for the blob
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `students-list-${new Date().toISOString().split("T")[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast({
        title: "Success",
        description: "Students list exported successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export students list",
        variant: "destructive",
      })
    }
  }

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [sourceClass, sourceDivision])

  // Reset search when filters change
  useEffect(() => {
    setSearchTerm("")
  }, [sourceAcademicSession, sourceClass, sourceDivision])

  // Determine if any loading state is active
  const isLoading =
    isLoadingAcademicSessions ||
    isLoadingStudents ||
    isPromoting ||
    isPromotingSingle ||
    isHoldingBack ||
    isTransferring ||
    isExporting ||
    isLoadingAcademicClasses

  useEffect(() => {
    console.log("selectedStudentForAction", selectedStudentForAction)
  }, [])
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("student_promotion")}</h1>
          <p className="text-muted-foreground mt-1">{t("manage_student_promotions_to_the_next_academic_year")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("current_students")}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            {t("promotion_history")}
          </TabsTrigger>
        </TabsList>

        {/* Current Students Tab */}
        <TabsContent value="current">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">{t("student_promotion_management")}</CardTitle>
              <CardDescription>
                {t("select_source_and_target_classes_to_promote_students_to_the_next_academic_year")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Academic Session Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label>{t("source_academic_year")}</Label>
                  <Select value={sourceAcademicSession} onValueChange={setSourceAcademicSession}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicSessions && academicSessions.length > 0 ? (
                        academicSessions.map((session: any) => (
                          <SelectItem key={session.id} value={session.id.toString()}>
                            {session.session_name || `${session.start_year}-${session.end_year}`}{" "}
                            {session.is_active ? "(Current)" : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-sessions" disabled>
                          {t("no_academic_sessions_available")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("target_academic_year")}</Label>
                  <Select value={targetAcademicSession} onValueChange={setTargetAcademicSession}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicSessions && academicSessions.length > 0 ? (
                        academicSessions.map((session: any) => (
                          <SelectItem
                            key={session.id}
                            value={session.id.toString()}
                            disabled={Number(session.id) === Number(sourceAcademicSession)}
                          >
                            {session.session_name || `${session.start_year}-${session.end_year}`}{" "}
                            {session.is_active ? "(Current)" : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-sessions" disabled>
                          {t("no_academic_sessions_available")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Class Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">{t("source_class")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("class")}</Label>
                      <Select value={sourceClass} onValueChange={handleSourceClassChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_class")} />
                        </SelectTrigger>
                        <SelectContent>
                          {academicClasses?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.class}>
                              {cls.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("division")}</Label>
                      <Select value={sourceDivision} onValueChange={handleSourceDivisionChange} disabled={!sourceClass}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_division")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("all_divisions")}</SelectItem>
                          {availableSourceDivisions.map((div) => (
                            <SelectItem key={div.id} value={div.id.toString()}>
                              {div.division || "Unnamed"} {div.aliases && `(${div.aliases})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">{t("target_class")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("class")}</Label>
                      <Select value={targetClass} onValueChange={setTargetClass}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_class")} />
                        </SelectTrigger>
                        <SelectContent>
                          {academicClasses?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.class}>
                              {cls.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("division")}</Label>
                      <Select value={targetDivision} onValueChange={setTargetDivision} disabled={!targetClass}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_division")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">{t("auto_assign")}</SelectItem>
                          {availableTargetDivisions.map((div) => (
                            <SelectItem key={div.id} value={div.id.toString()}>
                              {div.division || "Unnamed"} {div.aliases && `(${div.aliases})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={t("search_students...")}
                      className="pl-8 w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* <Button variant="outline" size="sm" onClick={fetchStudents} disabled={isLoading}>
                    <Filter className="mr-2 h-4 w-4" />
                    {t("apply_filters")}
                  </Button> */}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedStudents.length === 0) {
                        toast({
                          title: "No Students Selected",
                          description: "Please select at least one student to promote",
                          variant: "destructive",
                        })
                        return
                      }
                      setIsPromoteDialogOpen(true)
                    }}
                    disabled={selectedStudents.length === 0 || !targetClass || !targetAcademicSession}
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    {t("promote_selected")} ({selectedStudents.length})
                  </Button>

                  {/* <Button variant="outline" size="sm" onClick={handleExportStudents} disabled={isLoading}>
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("export")}
                  </Button> */}
                </div>
              </div>

              {/* Student List */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>{t("gr_no")}</TableHead>
                      <TableHead>{t("roll_no")}</TableHead>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("current_class")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("promotion_status")}</TableHead>
                      <TableHead>{t("fee_status")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingStudents ? (
                      Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <TableRow key={index}>
                            <TableCell colSpan={8} className="h-16 text-center">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : !hasSearched ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center py-4">
                            <Info className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">
                              {t(
                                "please_select_academic_session_ class,_and_division,_then_click_apply_filters_to_view_students",
                              )}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <TableRow key={student.student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.student.id)}
                              onCheckedChange={() => toggleSelectStudent(student.student.id)}
                              disabled={
                                student.status !== "pursuing" ||
                                student.promotionStatus === "promoted" ||
                                !canPromoteBasedOnFeeStatus(student)
                              }
                            />
                          </TableCell>
                          <TableCell>{student.student.gr_no}</TableCell>
                          <TableCell>{student.student.roll_number}</TableCell>
                          <TableCell className="font-medium">
                            {student.student.first_name} {student.student.middle_name} {student.student.last_name}
                          </TableCell>
                          <TableCell>
                            Class {academicClassesFromStore
                              ? `${academicClassesFromStore.find(cls => cls.id === student.class.class_id)?.class || "Loading..."} ${student.class.division}`
                              : "Loading ..."}
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.status === "pursuing" ? "default" : "secondary"}>
                              {student.status === "pursuing"
                                ? "Active"
                                : student.status === "transferred"
                                  ? "Transferred"
                                  : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {student.promotionStatus === "promoted" ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                {t("promoted")}
                              </Badge>
                            ) : student.promotionStatus === "held" ? (
                              <Badge variant="destructive" className="bg-red-100 text-white hover:bg-red-100">
                                <XCircle className="mr-1 h-3 w-3" />
                                {t("held_back")}
                              </Badge>
                            ) : (
                              <Badge variant="outline">{t("pending")}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.student.fees_status ? (
                              <Badge
                                variant={
                                  student.student.fees_status.status === "Paid"
                                    ? "default"
                                    : student.student.fees_status.status === "Partially Paid"
                                      ? "outline"
                                      : "destructive"
                                }
                                className={
                                  student.student.fees_status.status === "Paid"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : student.student.fees_status.status === "Partially Paid"
                                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                      : "bg-red-100 text-red-800 hover:bg-red-100"
                                }
                              >
                                {student.student.fees_status.status}
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-100 text-white hover:bg-red-100">
                                Not Available
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudentForAction(student)
                                  setIsPromoteSingleDialogOpen(true)
                                }}
                                disabled={
                                  student.status !== "pursuing" ||
                                  student.promotionStatus !== "pending" ||
                                  !canPromoteBasedOnFeeStatus(student)
                                }
                              >
                                {t("promote")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudentForAction(student)
                                  setIsHoldBackDialogOpen(true)
                                }}
                                disabled={student.status !== "pursuing" || student.promotionStatus !== "pending"}
                              >
                                {t("hold_back")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudentForAction(student)
                                  setIsTransferDialogOpen(true)
                                }}
                                disabled={student.status !== "pursuing"}
                              >
                                {t("transfer")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          {t("no_students_found")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredStudents.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <SaralPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
              )}

              {/* Promotion Summary */}
              {selectedStudents.length > 0 && (
                <div className="mt-6 p-4 border rounded-md bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{t("promotion_summary")}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedStudents.length} {t("students_selected_for_promotion")}
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsPromoteDialogOpen(true)}
                      disabled={!targetClass || !targetAcademicSession}
                    >
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      {t("promote_selected_students")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotion History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">{t("promotion_history")}</CardTitle>
              <CardDescription>{t("view_history_of_all_student_promotions_across_academic_years")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-40">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : promotionHistory.length > 0 ? (
                <div className="space-y-6">
                  {promotionHistory.map((history) => (
                    <Card key={history.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium">
                              {history.sourceAcademicSession} to {history.targetAcademicSession}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(history.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0">
                            <Badge variant="outline" className="text-primary">
                              {history.studentCount} {t("students")}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-center my-4">
                          <div className="text-center px-4 py-2 border rounded-md bg-muted/30">
                            <p className="text-sm font-medium">
                              Class {history.sourceClass} {history.sourceDivision}
                            </p>
                            <p className="text-xs text-muted-foreground">{history.sourceAcademicSession}</p>
                          </div>
                          <ArrowRight className="mx-4 text-muted-foreground" />
                          <div className="text-center px-4 py-2 border rounded-md bg-primary/10">
                            <p className="text-sm font-medium">
                              Class {history.targetClass} {history.targetDivision}
                            </p>
                            <p className="text-xs text-muted-foreground">{history.targetAcademicSession}</p>
                          </div>
                        </div>

                        <div className="flex justify-end mt-4">
                          <Button variant="outline" size="sm">
                            <FileDown className="mr-2 h-4 w-4" />
                            {t("export_details")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">{t("no_promotion_history")}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    {t("you_haven't_promoted_any_students_yet._promote_students_to_see_the_history_here.")}
                  </p>
                  <Button onClick={() => setActiveTab("current")}>{t("go_to_student_promotion")}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Promote Students Dialog (Bulk) */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("promote_students")}</DialogTitle>
            <DialogDescription>
              {t(`you_are_about_to_promote ${selectedStudents.length} students_to_the_next_class.`)}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-center my-4">
              <div className="text-center px-4 py-2 border rounded-md bg-muted/30">
                <p className="text-sm font-medium">
                  Class {sourceClass}{" "}
                  {sourceDivision === "all"
                    ? "All Divisions"
                    : availableSourceDivisions.find((div) => div.id.toString() === sourceDivision)?.division ||
                    sourceDivision}
                </p>
                <p className="text-xs text-muted-foreground">
                  {academicSessions.find((s: any) => s.id.toString() === sourceAcademicSession)?.session_name}
                </p>
              </div>
              <ArrowRight className="mx-4 text-muted-foreground" />
              <div className="text-center px-4 py-2 border rounded-md bg-primary/10">
                <p className="text-sm font-medium">
                  Class
                  {academicClassesFromStore ?
                    academicClassesFromStore.find(cls => cls.class === targetClass)?.class
                    : "Loading.."}
                  {" "}
                  {targetDivision === "auto"
                    ? "Auto Assign"
                    : availableTargetDivisions.find((div) => div.id.toString() === targetDivision)?.division ||
                    targetDivision}
                </p>
                <p className="text-xs text-muted-foreground">
                  {
                    academicSessions.find((s: AcademicSession) => s.id.toString() === targetAcademicSession)
                      ?.session_name
                  }
                </p>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("important")}</AlertTitle>
              <AlertDescription>
                {t(
                  "this_action_will_promote_the_selected_students_to_the_next_class_for_the_new_academic_year._make_sure_you_have_selected_the_correct_students_and_target_class.",
                )}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handlePromoteStudents} disabled={isPromoting}>
              {isPromoting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("promoting...")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> {t("confirm_promotion")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote Single Student Dialog */}
      <Dialog open={isPromoteSingleDialogOpen} onOpenChange={setIsPromoteSingleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("promote_student")}</DialogTitle>
            <DialogDescription>
              {selectedStudentForAction && (
                <>
                  {t("you_are_about_to_promote")}
                  {selectedStudentForAction.student.first_name}
                  {t("to_the_next_class.")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="text-center px-4 py-2 border rounded-md bg-muted/30">
              <p className="text-sm font-medium">
                Class{" "}
                {academicClassesFromStore
                  ? academicClassesFromStore.find(cls => cls.id === selectedStudentForAction?.class.class)?.class
                  : "Loading.."}
                {selectedStudentForAction?.class?.division}
              </p>
              <p className="text-xs text-muted-foreground">
                {academicSessions.find((s: any) => s.id.toString() === sourceAcademicSession)?.session_name}
              </p>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="promotionRemarks">{t("remarks")}</Label>
                <Textarea
                  id="promotionRemarks"
                  value={promotionRemarks}
                  onChange={(e) => setPromotionRemarks(e.target.value)}
                  placeholder={t("enter_remarks_about_this_promotion")}
                  className="mt-1"
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("note")}</AlertTitle>
                <AlertDescription>
                  {t("make_sure_you_have_selected_the_correct_target_class_and_division_for_this_student.")}
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteSingleDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handlePromoteSingleStudent} disabled={isPromotingSingle}>
              {isPromotingSingle ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("promoting...")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> {t("promote_student")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hold Back Student Dialog */}
      <Dialog open={isHoldBackDialogOpen} onOpenChange={setIsHoldBackDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("hold_back_student")}</DialogTitle>
            <DialogDescription>
              {selectedStudentForAction && (
                <>
                  {t("you_are_about_to_hold_back")}
                  {selectedStudentForAction.student.first_name}
                  {t("in_the_current_class.")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-center my-4">
              <div className="text-center px-4 py-2 border rounded-md bg-muted/30">
                <p className="text-sm font-medium">
                  Class{" "}
                  {academicClassesFromStore ?
                    academicClassesFromStore.find(cls => cls.id === selectedStudentForAction?.class.class)?.class
                   :  "Loading.."}
                  {selectedStudentForAction?.class?.division}
                </p>
                <p className="text-xs text-muted-foreground">
                  {academicSessions.find((s: any) => s.id.toString() === sourceAcademicSession)?.session_name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="holdBackReason">{t("reason_for_holding_back")}</Label>
                <Input
                  id="holdBackReason"
                  value={holdBackReason}
                  onChange={(e) => setHoldBackReason(e.target.value)}
                  placeholder={t("enter_reason")}
                  className="mt-1"
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("note")}</AlertTitle>
                <AlertDescription>
                  {t("the_student_will_remain_in_the_current_class_for_the_next_academic_year.")}
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHoldBackDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" className="text-white" onClick={handleHoldBackStudent} disabled={isHoldingBack}>
              {isHoldingBack ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("processing...")}
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" /> {t("hold_back_student")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Student Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("transfer_student")}</DialogTitle>
            <DialogDescription>
              {selectedStudentForAction && (
                <>
                  {t("enter_transfer_details_for")}
                  {selectedStudentForAction.student.first_name}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="transferSchool">{t("transfer_to_school")}</Label>
                <Input
                  id="transferSchool"
                  value={transferSchool}
                  onChange={(e) => setTransferSchool(e.target.value)}
                  placeholder={t("enter_school_name")}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="transferDate">{t("transfer_date")}</Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="transferCertificate">{t("transfer_certificate")} (Optional)</Label>
                <Input id="transferCertificate" type="file" onChange={handleFileChange} className="mt-1" />
              </div>

              <Separator />

              <div className="flex items-center p-4 border rounded-md bg-muted/30">
                <UserPlus className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm font-medium">{t("student_details")}</p>
                  {selectedStudentForAction && (
                    <p className="text-sm text-muted-foreground">
                      {selectedStudentForAction?.student.first_name} {selectedStudentForAction?.student.middle_name}{" "}
                      {selectedStudentForAction?.student.last_name} - Class{" "}
                      {selectedStudentForAction
                        ? typeof selectedStudentForAction.class.class === "number"
                          ? selectedStudentForAction.class.class
                          : selectedStudentForAction.class.id ||
                          (selectedStudentForAction.class.class &&
                            typeof selectedStudentForAction.class.class === "object"
                            ? selectedStudentForAction.class.id
                            : "")
                        : ""}{" "}
                      {selectedStudentForAction?.class?.division}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 text-center px-4 py-2 border rounded-md bg-muted/30">
                <p className="text-sm font-medium">Current Academic Session</p>
                <p className="text-xs text-muted-foreground">
                  {academicSessions.find((s: any) => s.id.toString() === sourceAcademicSession)?.session_name}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleTransferStudent} disabled={isTransferring || !transferSchool || !transferDate}>
              {isTransferring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("processing...")}
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" /> {t("complete_transfer")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
