"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
import {
  Loader2,
  Search,
  AlertTriangle,
  UserCheck,
  UserMinus,
  UserX,
  Truck,
  GraduationCap,
  Ban,
  Check,
  AlertCircle,
  Info,
} from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import {
  useFetchStudentEnrollmentsForDivisionQuery,
  useMigrateStudentMutation,
  useDropStudentMutation,
  useUpdaeStudentStatusToCompleteMutation,
  useSuspensendStudentMutation,
  useAutoAssignRollNumbersMutation,
  useManuallyUpdateRollNumberMutation
} from "@/services/StudentManagementService"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useNavigate } from "react-router-dom"
import type { StudentEnrollment } from "@/types/student"
import type {
  ReqBodyForStundetMigration,
  ReqBodyForDropStudent,
  ReqBodyForStudentCompletion,
  ReqBodyForStudentSuspension,
} from "@/types/student"

// Define form schema for status update
const statusUpdateSchema = z.object({
  status: z.enum(["pursuing", "drop", "migrated", "completed", "suspended"]),
  remarks: z.string().min(1, "Remarks are required").max(500, "Remarks must be less than 500 characters"),
  new_division_id: z.number().optional(),
})

// Define form schema for removing suspension
const removeSuspensionSchema = z.object({
  status: z.enum(["pursuing", "drop", "failed"]),
  remarks: z.string().min(1, "Remarks are required when changing from suspension"),
})

// Define migration form schema
const migrationSchema = z.object({
  status: z.literal("migrated"),
  remarks: z.string().min(1, "Remarks are required for migration").max(500, "Remarks must be less than 500 characters"),
  class_id: z.number().min(1, "Class selection is required"),
  new_division_id: z.number().min(1, "Division selection is required"),
  is_migration_for_class: z.number().default(1),
})

// Define drop student form schema
const dropStudentSchema = z.object({
  remarks: z
    .string()
    .min(1, "Reason is required for dropping a student")
    .max(500, "Reason must be less than 500 characters"),
})

// Define complete student form schema
const completeStudentSchema = z.object({
  remarks: z
    .string()
    .min(1, "Reason is required for completing a student")
    .max(500, "Reason must be less than 500 characters"),
})

// Define suspension form schema
const suspensionSchema = z.object({
  remarks: z.string().min(1, "Reason is required for suspension").max(500, "Reason must be less than 500 characters"),
  status: z.enum(["suspended", "remove_suspension"]),
})

const ManageStudents: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const authState = useAppSelector(selectAuthState)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const AcademicClasses = useAppSelector(selectAcademicClasses)
  const AcademicDivisions = useAppSelector(selectAllAcademicClasses)

  const [currentPage, setCurrentPage] = useState(1)
  const [requireDivision, setRequireDivision] = useState(false)

  // Filter states
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDivision, setSelectedDivision] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Dialog states
  const [selectedStudent, setSelectedStudent] = useState<StudentEnrollment | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [showSuspensionDialog, setShowSuspensionDialog] = useState(false)
  const [showRemoveSuspensionDialog, setShowRemoveSuspensionDialog] = useState(false)
  const [showDropDialog, setShowDropDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertDialogMessage, setAlertDialogMessage] = useState("")
  const [alertDialogTitle, setAlertDialogTitle] = useState("")

  // Migration state variables
  const [migrationSelectedClass, setMigrationSelectedClass] = useState<string>("")
  const [migrationAvailableDivisions, setMigrationAvailableDivisions] = useState<any[]>([])

  // API mutation hooks
  const [migrateStudent, { isLoading: isMigratingStudent }] = useMigrateStudentMutation()
  const [dropStudent, { isLoading: isDroppingStudent }] = useDropStudentMutation()
  const [completeStudent, { isLoading: isCompletingStudent }] = useUpdaeStudentStatusToCompleteMutation()
  const [suspendStudent, { isLoading: isSuspendingStudent }] = useSuspensendStudentMutation()

  const [autoAssignRollNumbers, { isLoading: isAutoAssigningRollNumbers }] = useAutoAssignRollNumbersMutation()
  const [manuallyUpdateRollNumber, { isLoading: isManuallyUpdatingRollNumber }] = useManuallyUpdateRollNumberMutation()

  // Data fetching hooks
  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()

  // Forms
  const statusUpdateForm = useForm<z.infer<typeof statusUpdateSchema>>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: "pursuing",
      remarks: "",
    },
  })

  const migrationForm = useForm<z.infer<typeof migrationSchema>>({
    resolver: zodResolver(migrationSchema),
    defaultValues: {
      status: "migrated",
      remarks: "",
      class_id: 0,
      new_division_id: 0,
      is_migration_for_class: 1,
    },
  })

  const dropStudentForm = useForm<z.infer<typeof dropStudentSchema>>({
    resolver: zodResolver(dropStudentSchema),
    defaultValues: {
      remarks: "",
    },
  })

  const completeStudentForm = useForm<z.infer<typeof completeStudentSchema>>({
    resolver: zodResolver(completeStudentSchema),
    defaultValues: {
      remarks: "",
    },
  })

  const suspensionForm = useForm<z.infer<typeof suspensionSchema>>({
    resolver: zodResolver(suspensionSchema),
    defaultValues: {
      status: "suspended",
      remarks: "",
    },
  })

  const removeSuspensionForm = useForm<z.infer<typeof removeSuspensionSchema>>({
    resolver: zodResolver(removeSuspensionSchema),
    defaultValues: {
      status: "pursuing",
      remarks: "",
    },
  })

  // Load students based on filters
  const handleDivisionChange = useCallback(
    async (value: string) => {
      if (AcademicClasses && currentAcademicSession) {
        const selectedClassObj = AcademicClasses.find((cls) => cls.id.toString() === selectedClass)

        if (selectedClassObj) {
          const selectedDiv = selectedClassObj.divisions.find((div) => div.id.toString() === value)

          if (selectedDiv) {
            setSelectedDivision(value)
            setRequireDivision(false)
            setCurrentPage(1)

            // Division selection will trigger refetch via dependency change
          }
        }
      }
    },
    [AcademicClasses, currentAcademicSession, selectedClass],
  )

  const handleClassChange = useCallback((value: string) => {
    setSelectedClass(value === "_empty" ? "" : value)
    setSelectedDivision("") // Reset division when class changes
  }, [])

  // Add the RTK query hook after the useState declarations
  const {
    data: enrollmentsData,
    isLoading,
    refetch,
  } = useFetchStudentEnrollmentsForDivisionQuery(
    {
      division_id: selectedDivision ? Number.parseInt(selectedDivision) : 0,
      page: currentPage,
      // academic_session: currentAcademicSession?.id || 0,
    },
    {
      skip: !selectedDivision || !currentAcademicSession,
      refetchOnMountOrArgChange: true,
    },
  )

  // Update the studentEnrollments and meta references
  const studentEnrollments = enrollmentsData?.data || []
  const meta = enrollmentsData?.meta || {
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  }

  // Initial load of academic classes
  useEffect(() => {
    if (!AcademicClasses && authState.user) {
      getAcademicClasses(authState.user.school_id)
    }
  }, [AcademicClasses, authState.user, getAcademicClasses])

  // Effect to reset requireDivision flag when division is selected
  useEffect(() => {
    if (selectedDivision) {
      setRequireDivision(false)
    }
  }, [selectedDivision])

  // Auto-select the first class and division when data is loaded
  useEffect(() => {
    if (AcademicClasses && AcademicClasses.length > 0 && !selectedClass && currentAcademicSession) {
      // Find first class with divisions
      const firstClassWithDivisions = AcademicClasses.find((cls) => cls.divisions.length > 0)
      if (firstClassWithDivisions) {
        // Set the first class
        setSelectedClass(firstClassWithDivisions.id.toString())

        // Set the first division of that class if it exists
        if (firstClassWithDivisions.divisions.length > 0) {
          const firstDivision = firstClassWithDivisions.divisions[0]
          setSelectedDivision(firstDivision.id.toString())
        }
      }
    }
  }, [AcademicClasses, selectedClass, currentAcademicSession])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Function to check if a class is the highest grade
  const isHighestGradeClass = (classId: number): boolean => {
    if (!AcademicClasses || AcademicClasses.length === 0) return false

    // Find the highest class grade
    const highestClass = Math.max(...AcademicClasses.map((cls) => Number(cls.class)))

    // Find the class object for the given classId
    const classObj = AcademicClasses.find((cls) => cls.id === classId)

    // Check if this class has the highest grade
    return classObj ? Number(classObj.class) === highestClass : false
  }

  // Handle status update
  const handleStatusUpdate = async (student: StudentEnrollment, newStatus: string) => {
    // Check for restrictions
    if (newStatus === "promoted" || newStatus === "failed") {
      setAlertDialogTitle(t("action_not_allowed"))
      setAlertDialogMessage(t("promoted_and_failed_statuses_can_only_be_set_from_promotion_section"))
      setShowAlertDialog(true)
      return
    }

    if (newStatus === "transfered") {
      setAlertDialogTitle(t("action_not_allowed"))
      setAlertDialogMessage(t("transferred_status_is_currently_disabled"))
      setShowAlertDialog(true)
      return
    }

    // Check if student is already dropped
    if (student.status === "drop") {
      setAlertDialogTitle(t("action_not_allowed"))
      setAlertDialogMessage(t("students_with_drop_status_cannot_be_updated"))
      setShowAlertDialog(true)
      return
    }

    // Check if student is already completed
    if (student.status === "completed") {
      setAlertDialogTitle(t("action_not_allowed"))
      setAlertDialogMessage(t("students_with_completed_status_cannot_be_updated"))
      setShowAlertDialog(true)
      return
    }

    setSelectedStudent(student)

    // Handle special cases
    if (newStatus === "migrated") {
      // Reset migration form values
      migrationForm.reset({
        status: "migrated",
        remarks: "",
        class_id: 0,
        new_division_id: 0,
        is_migration_for_class: 1,
      })

      setMigrationSelectedClass("")
      setMigrationAvailableDivisions([])
      setSelectedStudent(student)
      setShowMigrationDialog(true)
      return
    }

    if (newStatus === "suspended") {
      suspensionForm.reset({
        status: "suspended",
        remarks: "",
      })
      setShowSuspensionDialog(true)
      return
    }

    if (newStatus === "drop") {
      dropStudentForm.reset({
        remarks: "",
      })
      setShowDropDialog(true)
      return
    }

    if (newStatus === "completed") {
      // Find the student's current class
      const studentDivision = AcademicDivisions?.find((div) => div.id === student.division_id)
      const studentClassId = studentDivision ? studentDivision.class_id : null

      // Check if the student is in the highest grade class
      if (studentClassId && !isHighestGradeClass(studentClassId)) {
        setAlertDialogTitle(t("action_not_allowed"))
        setAlertDialogMessage(t("completed_status_can_only_be_applied_to_students_in_the_highest_grade"))
        setShowAlertDialog(true)
        return
      }

      completeStudentForm.reset({
        remarks: "",
      })
      setShowCompleteDialog(true)
      return
    }

    if (student.status === "suspended" && newStatus !== "suspended") {
      setShowRemoveSuspensionDialog(true)
      removeSuspensionForm.setValue("status", newStatus as any)
      return
    }

    // General status update
    statusUpdateForm.setValue("status", newStatus as any)
    setShowStatusDialog(true)
  }

  // Handle migration submission
  const onMigrationSubmit = async (data: z.infer<typeof migrationSchema>) => {
    if (!selectedStudent) return

    try {
      // Find the target class
      const targetClass = AcademicClasses?.find((c) => c.id === data.class_id)

      // Prepare payload for migration
      const payload: ReqBodyForStundetMigration = {
        reason: data.remarks,
        migrated_class: data.class_id,
        migrated_division: data.new_division_id,
        is_migration_for_class: data.is_migration_for_class,
      }

      // Call the migration API
      const response = await migrateStudent({
        student_enrollment_id: selectedStudent.id,
        payload,
      }).unwrap()

      toast({
        title: t("student_migrated"),
        description: t("student_has_been_migrated_successfully"),
      })
      setShowMigrationDialog(false)
      refetch() // Refetch data after update
    } catch (error: any) {
      console.error("Error migrating student:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_migrate_student"),
      })
    }
  }

  // Handle drop student submission
  const onDropStudentSubmit = async (data: z.infer<typeof dropStudentSchema>) => {
    if (!selectedStudent) return

    try {
      // Prepare payload for dropping student
      const payload: ReqBodyForDropStudent = {
        reason: data.remarks,
      }

      // Call the drop student API
      const response = await dropStudent({
        student_enrollment_id: selectedStudent.id,
        payload,
      }).unwrap()

      toast({
        title: t("student_dropped"),
        description: t("student_has_been_dropped_successfully"),
      })
      setShowDropDialog(false)
      refetch() // Refetch data after update
    } catch (error: any) {
      console.error("Error dropping student:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_drop_student"),
      })
    }
  }

  // Handle complete student submission
  const onCompleteStudentSubmit = async (data: z.infer<typeof completeStudentSchema>) => {
    if (!selectedStudent) return

    try {
      // Prepare payload for completing student
      const payload: ReqBodyForStudentCompletion = {
        reason: data.remarks,
      }

      // Call the complete student API
      const response = await completeStudent({
        student_enrollment_id: selectedStudent.id,
        payload,
      }).unwrap()

      toast({
        title: t("student_completed"),
        description: t("student_has_been_marked_as_completed_successfully"),
      })
      setShowCompleteDialog(false)
      refetch() // Refetch data after update
    } catch (error: any) {
      console.error("Error completing student:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_complete_student"),
      })
    }
  }

  // Handle suspension submission
  const onSuspensionSubmit = async (data: z.infer<typeof suspensionSchema>) => {
    if (!selectedStudent) return

    try {
      // Prepare payload for suspending student
      const payload: ReqBodyForStudentSuspension = {
        reason: data.remarks,
        status: "suspended",
      }

      // Call the suspend student API
      const response = await suspendStudent({
        student_enrollment_id: selectedStudent.id,
        payload,
      }).unwrap()

      toast({
        title: t("student_suspended"),
        description: t("student_has_been_suspended_successfully"),
      })
      setShowSuspensionDialog(false)
      refetch() // Refetch data after update
    } catch (error: any) {
      console.error("Error suspending student:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_suspend_student"),
      })
    }
  }

  // Handle remove suspension submission
  const onRemoveSuspensionSubmit = async (data: z.infer<typeof removeSuspensionSchema>) => {
    if (!selectedStudent) return

    try {
      // Prepare payload for removing suspension
      const payload: ReqBodyForStudentSuspension = {
        reason: data.remarks,
        status: "remove_suspension",
      }

      // Call the suspend student API with remove_suspension status
      const response = await suspendStudent({
        student_enrollment_id: selectedStudent.id,
        payload,
      }).unwrap()

      toast({
        title: t("suspension_removed"),
        description: t("student_suspension_has_been_removed_successfully"),
      })
      setShowRemoveSuspensionDialog(false)
      refetch() // Refetch data after update
    } catch (error: any) {
      console.error("Error removing student suspension:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_remove_student_suspension"),
      })
    }
  }

  // Get filtered divisions based on selected class
  const getFilteredDivisions = () => {
    if (!AcademicClasses || !selectedClass) return []

    const selectedClassObj = AcademicClasses.find((cls) => cls.id.toString() === selectedClass)
    return selectedClassObj ? selectedClassObj.divisions : []
  }

  // Handle migration class change
  const handleMigrationClassChange = (classId: string) => {
    if (!AcademicClasses) return

    setMigrationSelectedClass(classId)

    // Find the selected class
    const selectedClassObj = AcademicClasses.find((cls) => cls.id.toString() === classId)

    if (selectedClassObj) {
      // Set available divisions for this class
      setMigrationAvailableDivisions(selectedClassObj.divisions)

      // Reset the division selection in the form
      migrationForm.setValue("new_division_id", 0)

      // Set the class_id in the form
      migrationForm.setValue("class_id", selectedClassObj.id)
    } else {
      setMigrationAvailableDivisions([])
    }
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pursuing: "bg-green-100 text-green-800",
      promoted: "bg-blue-100 text-blue-800",
      failed: "bg-amber-100 text-amber-800",
      drop: "bg-red-100 text-red-800",
      migrated: "bg-purple-100 text-purple-800",
      completed: "bg-indigo-100 text-indigo-800",
      suspended: "bg-gray-100 text-gray-800",
      transfered: "bg-teal-100 text-teal-800",
    }

    return (
      <Badge variant="outline" className={`${statusColors[status] || ""} capitalize`}>
        {status}
      </Badge>
    )
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pursuing":
        return <UserCheck className="h-4 w-4 text-green-600" />
      case "promoted":
        return <GraduationCap className="h-4 w-4 text-blue-600" />
      case "failed":
        return <UserX className="h-4 w-4 text-amber-600" />
      case "drop":
        return <UserMinus className="h-4 w-4 text-red-600" />
      case "migrated":
      case "transfered":
        return <Truck className="h-4 w-4 text-purple-600" />
      case "completed":
        return <GraduationCap className="h-4 w-4 text-indigo-600" />
      case "suspended":
        return <Ban className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  // Get available status options based on current status
  const getAvailableStatusOptions = (currentStatus: string) => {
    // If student is dropped, no status changes allowed
    if (currentStatus === "drop") {
      return []
    }

    // If student is completed, no status changes allowed
    if (currentStatus === "completed") {
      return []
    }

    // If student is suspended, only allow removing suspension to pursuing
    if (currentStatus === "suspended") {
      return ["pursuing"]
    }

    // For other statuses, show all applicable options
    const allStatuses = ["pursuing", "drop", "migrated", "completed", "suspended"]
    return allStatuses.filter(
      (status) => status !== currentStatus && status !== "promoted" && status !== "failed" && status !== "transfered",
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("student_management")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("manage_student_enrollment_statuses_and_academic_progression")}
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("student_management")}</CardTitle>
          <CardDescription>{t("select_classes_to_update_status_students_to_the_next_academic_year")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Display warning when no academic classes exist */}
          {(!AcademicClasses || AcademicClasses.length === 0) && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>{t("no_academic_classes_found")}</AlertTitle>
              <AlertDescription>
                {authState.user?.role_id === 1 ? (
                  <>
                    {t("you_need_to_create_academic_classes_before_managing_students.")}
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/d/settings/academic")}
                        className="bg-white text-destructive hover:bg-white/90"
                      >
                        {t("create_academic_classes")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>{t("the_administrator_has_not_created_any_academic_classes_yet.")}</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Status Rules Information */}
          <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800">{t("student_status_rules")}</AlertTitle>
            <AlertDescription className="text-blue-700">
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li>{t("dropped_students_cannot_have_their_status_changed")}</li>
                <li>{t("completed_students_cannot_have_their_status_changed")}</li>
                <li>{t("completed_status_can_only_be_applied_to_students_in_the_highest_grade")}</li>
                <li>{t("suspended_students_can_only_be_changed_to_pursuing_status")}</li>
              </ul>
            </AlertDescription>
          </Alert>

          {requireDivision && (
            <div className="mb-4 p-4 border rounded-md bg-amber-50 text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p>{t("please_select_a_division_to_view_students")}</p>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="class-filter">{t("class")}</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder={t("select_class")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty" disabled>
                    {t("select_class")}
                  </SelectItem>
                  {AcademicClasses?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      Class {cls.class}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="division-filter" className={requireDivision ? "text-amber-800 font-medium" : ""}>
                {t("division")} {requireDivision && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={selectedDivision}
                onValueChange={handleDivisionChange}
                disabled={!getFilteredDivisions().length}
              >
                <SelectTrigger
                  id="division-filter"
                  className={requireDivision ? "border-amber-500 ring-1 ring-amber-500" : ""}
                >
                  <SelectValue placeholder={t("select_division")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty" disabled>
                    {t("select_division")}
                  </SelectItem>
                  {getFilteredDivisions().map((division) => (
                    <SelectItem key={division.id} value={division.id.toString()}>
                      {`${division.division} ${division.aliases ? "-" + division.aliases : ""}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {requireDivision && <p className="text-xs text-amber-800 mt-1">{t("division_selection_is_required")}</p>}
            </div>

            <div>
              <Label htmlFor="status-filter">{t("status")}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder={t("all_statuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_statuses")}</SelectItem>
                  <SelectItem value="pursuing">{t("pursuing")}</SelectItem>
                  <SelectItem value="promoted">{t("promoted")}</SelectItem>
                  <SelectItem value="failed">{t("failed")}</SelectItem>
                  <SelectItem value="drop">{t("drop")}</SelectItem>
                  <SelectItem value="migrated">{t("migrated")}</SelectItem>
                  <SelectItem value="completed">{t("completed")}</SelectItem>
                  <SelectItem value="suspended">{t("suspended")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">{t("search")}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t("search_by_name_or_gr_number")}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                disabled={!selectedDivision || isAutoAssigningRollNumbers}
                onClick={async () => {
                  if (selectedDivision) {
                    try {
                      await autoAssignRollNumbers({ division_id: Number(selectedDivision) }).unwrap()
                      toast({
                        title: t("success"),
                        description: t("roll_numbers_assigned_successfully"),
                      })
                      refetch()
                    } catch (error: any) {
                      toast({
                        title: t("error"),
                        description: error.data?.message || t("failed_to_assign_roll_numbers"),
                        variant: "destructive",
                      })
                    }
                  }
                }}
              >
                {isAutoAssigningRollNumbers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("auto_assign_roll_numbers")}
              </Button>
            </div>
          </div>

          {/* Student List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : studentEnrollments.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("gr_number")}</TableHead>
                      <TableHead>{t("roll_number")}</TableHead>
                      <TableHead>{t("student_name")}</TableHead>
                      <TableHead>{t("enrollment_code")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("remarks")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentEnrollments
                      .filter((enrollment) => {
                        // Filter by status if not "all"
                        if (selectedStatus !== "all" && enrollment.status !== selectedStatus) {
                          return false
                        }

                        // Filter by search query
                        if (searchQuery === "") return true

                        return (
                          enrollment.student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          enrollment.student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          enrollment.student.gr_no?.toString().includes(searchQuery)
                        )
                      })
                      .map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell>{enrollment.student.gr_no}</TableCell>
                          <TableCell>
                            {enrollment.student.fourth_year_roll_number || enrollment.student.third_year_roll_number || enrollment.student.second_year_roll_number || enrollment.student.first_year_roll_number || "-"}
                          </TableCell>
                          <TableCell>
                            {`${enrollment.student.first_name} ${enrollment.student.middle_name || ""} ${enrollment.student.last_name}`}
                          </TableCell>
                          <TableCell>{enrollment.student.enrollment_code}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(enrollment.status)}
                              {renderStatusBadge(enrollment.status)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{enrollment.remarks || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Select
                              disabled={
                                enrollment.status === "drop" ||
                                enrollment.status === "completed" ||
                                getAvailableStatusOptions(enrollment.status).length === 0
                              }
                              onValueChange={(value) => handleStatusUpdate(enrollment, value)}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder={t("change_status")} />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableStatusOptions(enrollment.status).map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(status)}
                                      <span className="capitalize">{t(status)}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                                {getAvailableStatusOptions(enrollment.status).length === 0 && (
                                  <SelectItem value="none" disabled>
                                    {t("no_status_changes_available")}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4">
                <SaralPagination
                  currentPage={meta.current_page}
                  totalPages={meta.last_page}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t("no_students_found")}</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {!selectedDivision
                  ? t("please_select_a_division_to_view_students")
                  : t("no_students_match_your_current_filters")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Dialog */}
      <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("migrate_student")}</DialogTitle>
            <DialogDescription>
              {selectedStudent && (
                <span>
                  {t("migrating_student")}: {selectedStudent.student.first_name} {selectedStudent.student.last_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...migrationForm}>
            <form onSubmit={migrationForm.handleSubmit(onMigrationSubmit)} className="space-y-4">
              {/* Class Selection */}
              <FormField
                control={migrationForm.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("target_class")}</FormLabel>
                    <Select onValueChange={(value) => handleMigrationClassChange(value)} value={migrationSelectedClass}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_target_class")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_empty" disabled>
                          {t("select_class")}
                        </SelectItem>
                        {AcademicClasses?.filter((cls) => {
                          // Only show classes that are higher than or equal to the student's current class
                          if (!selectedStudent) return true

                          // Find the student's current class
                          const studentDivision = AcademicDivisions?.find(
                            (div) => div.id === selectedStudent.division_id,
                          )

                          if (!studentDivision) return true

                          const studentClass = AcademicClasses?.find((c) => c.id === studentDivision.class_id)

                          if (!studentClass) return true

                          // Allow migration to same or higher class number
                          // Assuming class is a number or can be compared
                          return cls.class >= studentClass.class
                        }).map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            Class {cls.class}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("select_the_class_to_which_the_student_is_migrating")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Division Selection - Only enabled if class is selected */}
              <FormField
                control={migrationForm.control}
                name="new_division_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("target_division")}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number.parseInt(value))}
                      value={field.value ? field.value.toString() : ""}
                      disabled={!migrationSelectedClass || migrationAvailableDivisions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_target_division")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_empty" disabled>
                          {t("select_division")}
                        </SelectItem>
                        {migrationAvailableDivisions
                          .filter((division) => {
                            // Don't allow migration to the same division
                            if (!selectedStudent) return true
                            return division.id !== selectedStudent.division_id
                          })
                          .map((division) => (
                            <SelectItem key={division.id} value={division.id.toString()}>
                              {`${division.division} ${division.aliases ? "-" + division.aliases : ""}`}
                            </SelectItem>
                          ))}
                        {migrationAvailableDivisions.length > 0 &&
                          migrationAvailableDivisions.filter((d) => d.id !== selectedStudent?.division_id).length ===
                            0 && (
                            <SelectItem value="none" disabled>
                              {t("no_available_divisions_for_migration")}
                            </SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("select_the_division_to_which_the_student_is_migrating")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={migrationForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("migration_reason")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("enter_reason_for_migration")}
                        className="resize-none"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormDescription>{t("provide_reason_for_student_migration")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowMigrationDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isMigratingStudent ||
                    !migrationForm.getValues().new_division_id ||
                    !migrationForm.getValues().class_id
                  }
                >
                  {isMigratingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("confirm_migration")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Drop Student Dialog */}
      <Dialog open={showDropDialog} onOpenChange={setShowDropDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("drop_student")}</DialogTitle>
            <DialogDescription>
              {selectedStudent && (
                <span>
                  {t("dropping_student")}: {selectedStudent.student.first_name} {selectedStudent.student.last_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...dropStudentForm}>
            <form onSubmit={dropStudentForm.handleSubmit(onDropStudentSubmit)} className="space-y-4">
              <FormField
                control={dropStudentForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("drop_reason")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("enter_reason_for_dropping_student")}
                        className="resize-none"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormDescription>{t("provide_detailed_reason_for_dropping_student")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 text-sm font-medium">{t("warning")}</AlertTitle>
                <AlertDescription className="text-amber-700 text-sm">
                  {t("dropping_a_student_is_permanent_and_cannot_be_undone")}
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDropDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isDroppingStudent} variant="destructive">
                  {isDroppingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("confirm_drop")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Complete Student Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("complete_student")}</DialogTitle>
            <DialogDescription>
              {selectedStudent && (
                <span>
                  {t("marking_student_as_completed")}: {selectedStudent.student.first_name}{" "}
                  {selectedStudent.student.last_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...completeStudentForm}>
            <form onSubmit={completeStudentForm.handleSubmit(onCompleteStudentSubmit)} className="space-y-4">
              <FormField
                control={completeStudentForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("completion_reason")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("enter_reason_for_marking_student_as_completed")}
                        className="resize-none"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormDescription>{t("provide_reason_for_marking_student_as_completed")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 text-sm font-medium">{t("warning")}</AlertTitle>
                <AlertDescription className="text-amber-700 text-sm">
                  {t("marking_a_student_as_completed_is_permanent_and_cannot_be_undone")}
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCompleteDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isCompletingStudent}>
                  {isCompletingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("mark_as_completed")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Suspension Dialog */}
      <Dialog open={showSuspensionDialog} onOpenChange={setShowSuspensionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("suspend_student")}</DialogTitle>
            <DialogDescription>
              {selectedStudent && (
                <span>
                  {t("suspending_student")}: {selectedStudent.student.first_name} {selectedStudent.student.last_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...suspensionForm}>
            <form onSubmit={suspensionForm.handleSubmit(onSuspensionSubmit)} className="space-y-4">
              <FormField
                control={suspensionForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suspension_reason")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("enter_reason_for_suspension")}
                        className="resize-none"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormDescription>{t("provide_detailed_reason_for_student_suspension")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 text-sm font-medium">{t("note")}</AlertTitle>
                <AlertDescription className="text-blue-700 text-sm">
                  {t("suspended_students_can_be_restored_to_pursuing_status_later")}
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSuspensionDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isSuspendingStudent} variant="destructive">
                  {isSuspendingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("confirm_suspension")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove Suspension Dialog */}
      <Dialog open={showRemoveSuspensionDialog} onOpenChange={setShowRemoveSuspensionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("remove_student_suspension")}</DialogTitle>
            <DialogDescription>
              {selectedStudent && (
                <span>
                  {t("removing_suspension_for")}: {selectedStudent.student.first_name}{" "}
                  {selectedStudent.student.last_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...removeSuspensionForm}>
            <form onSubmit={removeSuspensionForm.handleSubmit(onRemoveSuspensionSubmit)} className="space-y-4">
              <FormField
                control={removeSuspensionForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("new_status")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_new_status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pursuing">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <span>{t("pursuing")}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("student_will_be_restored_to_pursuing_status")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={removeSuspensionForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("remarks")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("enter_remarks_for_removing_suspension")}
                        className="resize-none"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormDescription>{t("provide_reason_for_removing_suspension")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRemoveSuspensionDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isSuspendingStudent}>
                  {isSuspendingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("remove_suspension")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              <Check className="mr-2 h-4 w-4" />
              {t("okay")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ManageStudents
