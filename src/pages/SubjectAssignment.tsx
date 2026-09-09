
import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
import { Loader2, Plus, AlertCircle, Check, UserPlus, Users, Search, Ban, Trash2 } from "lucide-react"
import {
  useLazyGetAllSubjectsQuery,
  useAssignSubjectToDivisionMutation,
  useLazyGetSubjectsForDivisionQuery,
  useAssignStaffToSubjectsMutation,
  useUnassignStaffFromSubjectMutation,
} from "@/services/subjects"
import { useLazyGetAllTeachingStaffQuery } from "@/services/StaffService"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SubjectDivisionMaster, SubjectDivisionStaffMaster, SchoolSubject } from "@/types/subjects"
import type { StaffType } from "@/types/staff"
import { UserRole } from "@/types/user"

// Define the subject assignment form schema
const subjectAssignmentSchema = z.object({
  subject_id: z.number({
    required_error: "Please select a subject",
  }),
  code_for_division: z.string().min(1, {
    message: "Code for this division is required.",
  }),
  description: z.string().optional(),
})

// Updated teacher assignment form schema for single teacher selection
const teacherAssignmentSchema = z.object({
  staff_enrollment_id: z.number({
    required_error: "Please select a teacher",
  }),
  notes: z.string().optional(),
})

export default function SubjectAssignment() {
  const { t } = useTranslation()
  const authState = useAppSelector(selectAuthState)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const AcademicClasses = useAppSelector(selectAcademicClasses)
  const AcademicDivisions = useAppSelector(selectAllAcademicClasses)

  // States
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDivision, setSelectedDivision] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<SubjectDivisionMaster | null>(null)
  const [teachingStaff, setTeachingStaff] = useState<StaffType[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // API hooks
  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
  const [getAllSubjects, { data: allSubjects, isLoading: isLoadingSubjects }] = useLazyGetAllSubjectsQuery()
  const [getSubjectsForDivision, { data: divisionSubjects, isLoading: isLoadingDivisionSubjects }] =
    useLazyGetSubjectsForDivisionQuery()
  const [assignSubjectToDivision, { isLoading: isAssigning }] = useAssignSubjectToDivisionMutation()
  const [getTeachingStaff, { isLoading: isLoadingTeachers }] = useLazyGetAllTeachingStaffQuery()
  const [assignStaffToSubjects, { isLoading: isAssigningTeachers }] = useAssignStaffToSubjectsMutation()
  const [unassignStaffFromSubject, { isLoading: isUnassigningTeacher }] = useUnassignStaffFromSubjectMutation()

  // Setup forms
  const form = useForm<z.infer<typeof subjectAssignmentSchema>>({
    resolver: zodResolver(subjectAssignmentSchema),
    defaultValues: {
      code_for_division: "",
      description: "",
    },
  })

  const teacherForm = useForm<z.infer<typeof teacherAssignmentSchema>>({
    resolver: zodResolver(teacherAssignmentSchema),
    defaultValues: {
      staff_enrollment_id: undefined,
      notes: "",
    },
  })

  // Initial load of academic classes
  useEffect(() => {
    if (!AcademicClasses && authState.user) {
      getAcademicClasses(authState.user.school_id)
    }
  }, [AcademicClasses, authState.user, getAcademicClasses])

  // Load all subjects when current academic session changes
  useEffect(() => {
    if (currentAcademicSession) {
      getAllSubjects({ academic_session_id: currentAcademicSession.id })
    }
  }, [currentAcademicSession, getAllSubjects])

  // Load teaching staff when needed
  const loadTeachingStaff = useCallback(async () => {
    if (currentAcademicSession) {
      const response = await getTeachingStaff({
        academic_sessions: currentAcademicSession.id,
      })
      if (response.data) {
        setTeachingStaff(response.data)
      }
    }
  }, [currentAcademicSession, getTeachingStaff])

  // Load teaching staff when teacher dialog opens
  useEffect(() => {
    if (isTeacherDialogOpen) {
      loadTeachingStaff()
      // Reset the form when opening the dialog
      teacherForm.reset({
        staff_enrollment_id: undefined,
        notes: "",
      })
    }
  }, [isTeacherDialogOpen, loadTeachingStaff, teacherForm])

  // Handle class change
  const handleClassChange = useCallback((value: string) => {
    setSelectedClass(value)
    
    // Auto-select the first division if it exists for this class
    if (AcademicClasses) {
      const classObj = AcademicClasses.find((cls) => cls.id.toString() === value)
      if (classObj && classObj.divisions && classObj.divisions.length > 0) {
        const firstDivId = classObj.divisions[0].id.toString()
        setSelectedDivision(firstDivId)
        
        if (currentAcademicSession) {
          getSubjectsForDivision({
            academic_session_id: currentAcademicSession.id,
            division_id: Number(firstDivId),
          })
        }
      } else {
        setSelectedDivision("")
      }
    } else {
      setSelectedDivision("")
    }
  }, [AcademicClasses, currentAcademicSession, getSubjectsForDivision])

  // Handle division change
  const handleDivisionChange = useCallback(
    async (value: string) => {
      if (AcademicClasses && currentAcademicSession && value) {
        setSelectedDivision(value)

        // Load subjects for this division
        await getSubjectsForDivision({
          academic_session_id: currentAcademicSession.id,
          division_id: Number(value),
        })
      }
    },
    [AcademicClasses, currentAcademicSession, getSubjectsForDivision],
  )

  // Get the selected class object
  const selectedClassObj = useMemo(() => {
    if (!AcademicClasses || !selectedClass) return null
    return AcademicClasses.find((cls) => cls.id.toString() === selectedClass)
  }, [AcademicClasses, selectedClass])

  // Get filtered divisions based on selected class
  const filteredDivisions = useMemo(() => {
    return selectedClassObj ? selectedClassObj.divisions : []
  }, [selectedClassObj])

  // Get available subjects for assignment (those not already assigned)
  const availableSubjects = useMemo(() => {
    if (!allSubjects) return []

    // Filter out subjects that are already assigned to THIS division
    let filtered = allSubjects
    if (divisionSubjects) {
      filtered = allSubjects.filter((subject) => !divisionSubjects.some((ds) => ds.subject_id === subject.id))
    }

    // Filter by year if it's a college class (e.g. "2026_BHMS_1st_year")
    if (selectedClassObj && selectedClassObj.class) {
      const className = selectedClassObj.class.toLowerCase()
      
      // Try to find if class name contains "1st_year", "2nd_year", etc.
      // We map these to our Subject year field "1st Year", "2nd Year", etc.
      const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]
      const matchedYear = years.find(y => {
        const normalizedYUnderscore = y.toLowerCase().replace(" ", "_") // "1st_year"
        const normalizedYSpace = y.toLowerCase() // "1st year"
        return className.includes(normalizedYUnderscore) || className.includes(normalizedYSpace)
      })

      if (matchedYear) {
        // Only show subjects that match this year OR subjects that have no year assigned
        filtered = filtered.filter(s => s.year === matchedYear || !s.year)
      }
    }

    return filtered
  }, [allSubjects, divisionSubjects, selectedClassObj])

  const isTeacher = authState.user?.system_role === UserRole.SCHOOL_TEACHER

  const visibleSubjects = useMemo(() => {
    if (!divisionSubjects) return []
    if (isTeacher) {
      const activeEnrollment = authState.user?.staff?.enrollments?.find(
        (e: any) => Number(e.academic_session_id) === Number(currentAcademicSession?.id)
      )
      const teacherEnrollmentId = activeEnrollment?.id || authState.user?.staff?.staff_enrollment_id

      return divisionSubjects.filter((item) =>
        item.subject_staff_divisioin_master?.some(
          (teacher) =>
            (teacherEnrollmentId && Number(teacher.staff_enrollment_id) === Number(teacherEnrollmentId)) ||
            (teacher.staff_enrollment?.staff_id && Number(teacher.staff_enrollment.staff_id) === Number(authState.user?.staff_id))
        )
      )
    }
    return divisionSubjects
  }, [divisionSubjects, isTeacher, authState.user?.staff?.staff_enrollment_id, authState.user?.staff?.enrollments, currentAcademicSession?.id, authState.user?.staff_id])

  // Get assigned teachers for a subject
  const getAssignedTeachers = (subject: SubjectDivisionMaster) => {
    return subject.subject_staff_divisioin_master || []
  }

  // Get already assigned teacher IDs for the selected subject
  const getAssignedTeacherIds = useMemo(() => {
    if (!selectedSubject) return []
    const assignedTeachers = getAssignedTeachers(selectedSubject)
    return assignedTeachers.map((teacher) => teacher.staff_enrollment_id)
  }, [selectedSubject])

  // Filter teaching staff based on search term
  const filteredTeachingStaff = useMemo(() => {
    if (!teachingStaff) return []

    // First filter out staff who don't have an enrollment in the current session
    let filtered = teachingStaff.filter(staff => staff.staff_enrollment_id != null)

    // Then filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter((staff) => {
        const fullName = `${staff.first_name || ""} ${staff.middle_name || ""} ${staff.last_name || ""}`.toLowerCase()
        const employeeCode = staff.employee_code?.toLowerCase() || ""
        const searchLower = searchTerm.toLowerCase()

        return fullName.includes(searchLower) || employeeCode.includes(searchLower)
      })
    }

    return filtered
  }, [teachingStaff, searchTerm])

  // Check if a teacher is already assigned to the selected subject
  const isTeacherAssigned = useCallback(
    (teacherId: number) => {
      return getAssignedTeacherIds.includes(teacherId)
    },
    [getAssignedTeacherIds],
  )

  // Handle form submission for subject assignment
  const onSubmit = async (data: z.infer<typeof subjectAssignmentSchema>) => {
    if (!currentAcademicSession || !selectedDivision) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("please_select_a_division_first"),
      })
      return
    }

    try {
      await assignSubjectToDivision({
        academic_session_id: currentAcademicSession.id,
        division_id: Number(selectedDivision),
        subjects: [
          {
            subject_id: data.subject_id,
            code_for_division: data.code_for_division,
            description: data.description,
          },
        ],
      })

      toast({
        title: t("subject_assigned"),
        description: t("subject_has_been_assigned_to_division_successfully"),
      })

      // Reset form and close dialog
      form.reset()
      setIsDialogOpen(false)

      // Refresh subjects for division
      if (selectedDivision && currentAcademicSession) {
        getSubjectsForDivision({
          academic_session_id: currentAcademicSession.id,
          division_id: Number(selectedDivision),
        })
      }
    } catch (error) {
      console.error("Error assigning subject:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_assign_subject"),
      })
    }
  }

  // Handle form submission for teacher assignment
  const onTeacherSubmit = async (data: z.infer<typeof teacherAssignmentSchema>) => {
    if (!selectedSubject) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("no_subject_selected"),
      })
      return
    }

    try {
      await assignStaffToSubjects({
        payload: {
          subjects_division_id: selectedSubject.id,
          staff_enrollment_ids: [data.staff_enrollment_id], // Send as array with single item
          notes: data.notes,
        },
      })

      toast({
        title: t("teacher_assigned"),
        description: t("teacher_has_been_assigned_to_subject_successfully"),
      })

      // Reset form and close dialog
      teacherForm.reset()
      setIsTeacherDialogOpen(false)

      // Refresh subjects for division
      if (selectedDivision && currentAcademicSession) {
        getSubjectsForDivision({
          academic_session_id: currentAcademicSession.id,
          division_id: Number(selectedDivision),
        })
      }
    } catch (error) {
      console.error("Error assigning teacher:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_assign_teacher"),
      })
    }
  }

  const handleUnassignTeacher = async (teacherId: number) => {
    try {
      await unassignStaffFromSubject({ id: teacherId }).unwrap()
      
      toast({
        title: t("teacher_unassigned"),
        description: t("teacher_has_been_unassigned_from_subject_successfully"),
      })

      // Refresh subjects for division
      if (selectedDivision && currentAcademicSession) {
        getSubjectsForDivision({
          academic_session_id: currentAcademicSession.id,
          division_id: Number(selectedDivision),
        })
      }
    } catch (error) {
      console.error("Error unassigning teacher:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_unassign_teacher"),
      })
    }
  }


  // Open teacher assignment dialog
  const openTeacherDialog = (subject: SubjectDivisionMaster) => {
    setSelectedSubject(subject)
    setSearchTerm("")
    setIsTeacherDialogOpen(true)
  }

  // Get the selected division object
  const selectedDivisionObj = useMemo(() => {
    if (!AcademicDivisions || !selectedDivision) return null
    return AcademicDivisions.find((d) => d.id.toString() === selectedDivision)
  }, [AcademicDivisions, selectedDivision])


  // Format teacher name
  const formatTeacherName = (staff: SubjectDivisionStaffMaster) => {
    const staffData = staff.staff_enrollment?.staff
    if (!staffData) return "Unknown"

    return `${staffData.first_name || ""} ${staffData.middle_name || ""} ${staffData.last_name || ""}`.trim()
  }

  // Get teacher initials for avatar
  const getTeacherInitials = (staff: SubjectDivisionStaffMaster) => {
    console.log("staff", staff) 
    const staffData = staff.staff_enrollment?.staff
    if (!staffData) return "??"

    const firstName = staffData.first_name || ""
    const lastName = staffData.last_name || ""

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Format staff name
  const formatStaffName = (staff: StaffType) => {
    return `${staff.first_name || ""} ${staff.middle_name || ""} ${staff.last_name || ""}`.trim()
  }

  // Get staff initials
  const getStaffInitials = (staff: StaffType) => {
    const firstName = staff.first_name || ""
    const lastName = staff.last_name || ""

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("subject_assignment")}</CardTitle>
          <CardDescription>{t("assign_subjects_to_divisions_for_the_current_academic_year")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Class and Division Selection */}
          <div className="grid grid-cols-1 gap-4 mb-6">
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
                      {cls.class}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display warning when no academic classes exist */}
          {(!AcademicClasses || AcademicClasses.length === 0) && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>{t("no_academic_classes_found")}</AlertTitle>
              <AlertDescription>{t("you_need_to_create_academic_classes_before_assigning_subjects")}</AlertDescription>
            </Alert>
          )}

          {/* No subjects warning */}
          {selectedDivision && !isLoadingSubjects && availableSubjects.length === 0 && (
            <Alert className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>{t("no_subjects_available")}</AlertTitle>
              <AlertDescription>{t("no_subjects_are_available_for_assignment")}</AlertDescription>
            </Alert>
          )}

          {/* Division Subject Selection Section */}
          {selectedDivision && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {t("subjects_for")} {selectedClassObj ? selectedClassObj.class : ""}{" "}
                  {selectedDivisionObj ? selectedDivisionObj.division : ""}
                </h3>

                {!isTeacher && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={availableSubjects.length === 0}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("assign_subject")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("assign_subject_to_division")}</DialogTitle>
                        <DialogDescription>
                          {t("assign_a_subject_to")} {selectedClassObj ? selectedClassObj.class : ""}{" "}
                          {selectedDivisionObj ? selectedDivisionObj.division : ""}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="subject_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("subject")}</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(Number(value))}
                                  value={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("select_subject")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableSubjects.map((subject) => (
                                      <SelectItem key={subject.id} value={subject.id.toString()}>
                                        {subject.name} {subject.code ? `(${subject.code})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="code_for_division"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("subject_code_for_division")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("eg_math_10a")} {...field} />
                                </FormControl>
                                <FormDescription>
                                  {t("a_code_specific_to_this_subject_for_this_division")}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("description")}</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={t("enter_description_for_this_subject_in_this_division")}
                                    className="resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              {t("cancel")}
                            </Button>
                            <Button type="submit" disabled={isAssigning}>
                              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {t("assign_subject")}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <Separator />

              {isLoadingDivisionSubjects ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : visibleSubjects && visibleSubjects.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("subject_name")}</TableHead>
                        <TableHead>{t("subject_code")}</TableHead>
                        <TableHead>{t("division_specific_code")}</TableHead>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead>{t("assigned_teachers")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        {!isTeacher && <TableHead className="text-right">{t("actions")}</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleSubjects.map((item) => {
                        const assignedTeachers = getAssignedTeachers(item)
                        const hasAssignedTeachers = assignedTeachers.length > 0

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.subject?.name || "-"}</TableCell>
                            <TableCell>{item.subject?.code || "-"}</TableCell>
                            <TableCell>{item.code_for_division}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.description || "-"}</TableCell>
                            <TableCell>
                              {hasAssignedTeachers ? (
                                <div className="flex -space-x-2 overflow-hidden">
                                  {assignedTeachers.slice(0, 3).map((teacher) => (
                                    <Avatar key={teacher.id} className="border-2 border-background h-8 w-8">
                                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                        {getTeacherInitials(teacher)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {assignedTeachers.length > 3 && (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium border-2 border-background">
                                      +{assignedTeachers.length - 3}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">{t("no_teachers_assigned")}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.status === "Active" ? "default" : "secondary"}>{item.status}</Badge>
                            </TableCell>
                            {!isTeacher && (
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openTeacherDialog(item)}
                                  className="h-8 px-2 lg:px-3"
                                >
                                  <UserPlus className="h-4 w-4 mr-0 lg:mr-2" />
                                  <span className="hidden lg:inline">{t("assign_teacher")}</span>
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{t("no_subjects_assigned")}</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {isTeacher
                      ? t("no_subjects_have_been_assigned_to_you_yet")
                      : t("no_subjects_have_been_assigned_to_this_division_yet")}
                  </p>
                  {!isTeacher && availableSubjects.length > 0 && (
                    <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("assign_your_first_subject")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No division selected message */}
          {!selectedDivision && AcademicClasses && AcademicClasses.length > 0 && (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t("select_a_division")}</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {t("please_select_a_class_and_division_to_manage_subjects")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teacher Assignment Dialog */}
      <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {t("assign_teacher_to")} {selectedSubject?.subject?.name || t("subject")}
            </DialogTitle>
            <DialogDescription>
              {t("assign_a_teacher_to_subject_for")} {selectedClassObj ? selectedClassObj.class : ""}{" "}
              {selectedDivisionObj ? selectedDivisionObj.division : ""}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="assign" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assign">{t("assign_teacher")}</TabsTrigger>
              <TabsTrigger value="current">{t("assigned_teachers")}</TabsTrigger>
            </TabsList>

            <TabsContent value="assign" className="space-y-4 py-4">
              <Form {...teacherForm}>
                <form onSubmit={teacherForm.handleSubmit(onTeacherSubmit)} className="space-y-4">
                  <div className="relative mb-4">
                    <Input
                      placeholder={t("search_teachers")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>

                  <FormField
                    control={teacherForm.control}
                    name="staff_enrollment_id"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">{t("select_teacher")}</FormLabel>
                          <FormDescription>{t("select_a_teacher_to_assign_to_this_subject")}</FormDescription>
                        </div>

                        {isLoadingTeachers ? (
                          <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : filteredTeachingStaff.length > 0 ? (
                          <ScrollArea className="h-[300px] border rounded-md p-4">
                            <RadioGroup
                              onValueChange={(value) => field.onChange(Number(value))}
                              value={field.value?.toString()}
                              className="space-y-2"
                            >
                              {filteredTeachingStaff.map((teacher) => {
                                const alreadyAssigned = isTeacherAssigned(teacher.staff_enrollment_id)

                                return (
                                  <div
                                    key={teacher.staff_enrollment_id}
                                    className={`flex items-center space-x-3 space-y-0 rounded-md border p-4 ${
                                      alreadyAssigned ? "bg-muted opacity-60" : ""
                                    }`}
                                  >
                                    {alreadyAssigned ? (
                                      <div className="h-4 w-4 flex items-center justify-center">
                                        <Ban className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    ) : (
                                      <RadioGroupItem
                                        value={teacher.staff_enrollment_id.toString()}
                                        id={`teacher-${teacher.staff_enrollment_id}`}
                                        disabled={alreadyAssigned}
                                      />
                                    )}
                                    <div className="flex items-center space-x-3 flex-1">
                                      <Avatar>
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                          {getStaffInitials(teacher)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="space-y-1">
                                        <Label
                                          htmlFor={
                                            alreadyAssigned ? undefined : `teacher-${teacher.staff_enrollment_id}`
                                          }
                                          className={`text-sm font-medium leading-none ${
                                            alreadyAssigned ? "text-muted-foreground" : ""
                                          }`}
                                        >
                                          {formatStaffName(teacher)}
                                          {alreadyAssigned && (
                                            <Badge variant="outline" className="ml-2 bg-muted">
                                              {t("already_assigned")}
                                            </Badge>
                                          )}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                          {teacher.employee_code} | {teacher.qualification || t("not_specified")}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </RadioGroup>
                          </ScrollArea>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{searchTerm ? t("no_matching_teachers") : t("no_teaching_staff")}</AlertTitle>
                            <AlertDescription>
                              {searchTerm
                                ? t("no_teachers_match_your_search")
                                : t("no_teaching_staff_available_for_assignment")}
                            </AlertDescription>
                          </Alert>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={teacherForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("notes")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("enter_any_notes_about_this_assignment")}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsTeacherDialogOpen(false)}>
                      {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={isAssigningTeachers}>
                      {isAssigningTeachers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("assign_teacher")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="current">
              {selectedSubject && getAssignedTeachers(selectedSubject).length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("teacher_name")}</TableHead>
                        <TableHead>{t("employee_code")}</TableHead>
                        <TableHead>{t("qualification")}</TableHead>
                        <TableHead>{t("notes")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAssignedTeachers(selectedSubject).map((teacher) => {
                        const staffData = teacher.staff_enrollment?.staff
                        return (
                          <TableRow key={teacher.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {getTeacherInitials(teacher)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{formatTeacherName(teacher)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{staffData?.employee_code || "-"}</TableCell>
                            <TableCell>{staffData?.qualification || "-"}</TableCell>
                            <TableCell>{teacher.notes || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                                {teacher.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUnassignTeacher(teacher.id)}
                                disabled={isUnassigningTeacher}
                              >
                                {isUnassigningTeacher ? (
                                  <Loader2 className="h-4 w-4 animate-spin lg:mr-2" />
                                ) : (
                                  <Trash2 className="h-4 w-4 lg:mr-2" />
                                )}
                                <span className="hidden lg:inline">{t("unassign")}</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{t("no_teachers_assigned")}</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {t("no_teachers_have_been_assigned_to_this_subject_yet")}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
