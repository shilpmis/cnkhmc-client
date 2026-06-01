import { useState, useCallback, useEffect, useMemo } from "react"
import type { AcademicClasses, ClassData, Division } from "@/types/academic"
import { Edit, PlusCircle, Save, Calendar, Plus, AlertCircle, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SaralCard } from "../../ui/common/SaralCard"
import { Badge } from "../../ui/badge"
import { Checkbox } from "../../ui/checkbox"
import { Button } from "../../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../ui/dialog"
import { Label } from "../../ui/label"
import { Input } from "../../ui/input"
import { useAppDispatch } from "@/redux/hooks/useAppDispatch"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import {
  createClasses,
  createDivision,
  editDivision,
  useGetAcademicClassesQuery,
  useGetAcademicSessionsQuery,
  useSetActiveSessionMutation,
  useGetBatchesQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useDeleteBatchMutation,
} from "@/services/AcademicService"
import { useGetDepartmentsQuery } from "@/services/DepartmentService"
import { selectCurrentUser, selectCurrentSchool } from "@/redux/slices/authSlice"
import type { AvailableClasses, Class } from "@/types/class"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AcademicSessionForm } from "./AcademicSessionForm"
import { AcademicSessionsList } from "./AcademicSessionList"
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
import { useTranslation } from "@/redux/hooks/useTranslation"

// Define the form schema for division
const formSchemaForDivision = z.object({
  class_id: z
    .number({
      message: "Please enter a valid Class Id for division.",
    })
    .nullable(),
  class: z.string({
    message: "Please enter a valid Class for division.",
  }),
  division: z.string().min(1, {
    message: "Please enter valid division",
  }),
  aliases: z
    .string()
    .transform((val) => (val?.trim() === "" ? null : val))
    .refine(
      (val) =>
        val === null ||
        (typeof val === "string" &&
          val.length >= 3 &&
          val.length <= 15 &&
          /^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(val)),
      {
        message:
          "Alias should be at least 3 characters, not more than 15, and contain only letters, numbers, and single spaces",
      }
    )
    .nullable(),
  formType: z.enum(["create", "edit"]),
})

const defaultStandards = [
  { id: 1, class: 'Nursery' },
  { id: 2, class: 'LKG' },
  { id: 3, class: 'UKG' },
  { id: 4, class: '1' },
  { id: 5, class: '2' },
  { id: 6, class: '3' },
  { id: 7, class: '4' },
  { id: 8, class: '5' },
  { id: 9, class: '6' },
  { id: 10, class: '7' },
  { id: 11, class: '8' },
  { id: 12, class: '9' },
  { id: 13, class: '10' },
  { id: 14, class: '11' },
  { id: 15, class: '12' },
]

export default function AcademicSettings() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const school = useAppSelector(selectCurrentSchool) as any
  const currentAcademicSession = useAppSelector((state: any) => state.auth.currentActiveAcademicSession)
  const [activeTab, setActiveTab] = useState("sessions")
  const { t } = useTranslation()

  const isCollege = school?.school_type === "COLLEGE"

  // Fetch academic classes
  const {
    isLoading: isLoadingClasses,
    data: academicClassesForSchool,
    refetch: refetchClasses,
  } = useGetAcademicClassesQuery(user!.school_id)

  // Fetch academic sessions
  const {
    isLoading: isLoadingSessions,
    data: sessionsData,
    refetch: refetchSessions,
  } = useGetAcademicSessionsQuery(user!.school_id)

  // State for academic sessions
  const [activeSession, setActiveSession] = useState<any>(null)
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false)
  const [showNoActiveSessionAlert, setShowNoActiveSessionAlert] = useState(false)

  // State for classes and divisions
  const [selectedClasses, setSelectedClasses] = useState<{ id: number; class: AvailableClasses }[] | null>(null)
  const [academicClasses, setAcademicClasses] = useState<AcademicClasses[]>([])
  const [editingClass, setEditingClass] = useState<ClassData | null>(null)
  const [newDivision, setNewDivision] = useState<{ class: number; aliases: string; division: string } | null>(null)
  const [editingDivision, setEditingDivision] = useState<{ classId: number; division: Division } | null>(null)

  const [isEditDivisionDialogOpen, setIsEditDivisionDialogOpen] = useState(false)
  const [isConfirmSaveDialogOpen, setIsConfirmSaveDialogOpen] = useState(false)
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false)
  const [isDivisionForDialogOpen, setIsDivisionForDialogOpen] = useState(false)

  // Batch states
  const [isNewBatchDialogOpen, setIsNewBatchDialogOpen] = useState(false)
  const { data: batches = [], refetch: refetchBatches } = useGetBatchesQuery(user!.school_id, {
    skip: !isCollege
  })
  const { data: departments = [] } = useGetDepartmentsQuery(
    { school_id: user!.school_id },
    { skip: !isCollege }
  )
  const [createBatch] = useCreateBatchMutation()
  const [newBatchName, setNewBatchName] = useState("")
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")

  // College class states
  const [collegeBatchId, setCollegeBatchId] = useState<string>("")
  const [collegeDeptId, setCollegeDeptId] = useState<string>("")
  const [collegeClassName, setCollegeClassName] = useState<string>("")
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>("all")

  const formForDivsion = useForm<z.infer<typeof formSchemaForDivision>>({
    resolver: zodResolver(formSchemaForDivision),
    defaultValues: {
      class_id: null,
      class: newDivision?.class.toString(),
      division: newDivision?.division,
      aliases: null,
      formType: "create",
    },
  })

  const [setActiveSessionMutation] = useSetActiveSessionMutation()

  // Add this function near the top of the component
  const getMonthName = (monthNumber: string) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return months[Number.parseInt(monthNumber) - 1]
  }

  // Format session name from dates
  const formatSessionName = (startYear: string, endYear: string) => {
    return `${startYear}-${endYear}`
  }

  const disabledClasses = useMemo(() => {
    return academicClasses.filter((c) => c.divisions.length > 0).map((c) => c.class)
  }, [academicClasses])

  const checkedClasses = useMemo(() => {
    const checkedAcademicClasses = academicClasses.filter((c) => c.divisions.length > 0).map((c) => c.class)
    const checkedClasses = selectedClasses ? selectedClasses.map((c) => c.class) : []
    return new Set([...checkedAcademicClasses, ...checkedClasses])
  }, [academicClasses, selectedClasses])

  const handleClassToggle = useCallback((clasObj: { id: number; class: AvailableClasses }) => {
    setSelectedClasses((prevSelectedClasses) => {
      if (!prevSelectedClasses) {
        return [clasObj]
      }

      const isAlreadySelected = prevSelectedClasses.some((c) => c.id === clasObj.id)

      if (isAlreadySelected) {
        const filtered = prevSelectedClasses.filter((c) => c.id !== clasObj.id)
        return filtered.length === 0 ? null : filtered
      }

      return [...prevSelectedClasses, clasObj]
    })
  }, [])

  const handleAddDivision = (classId: number) => {
    classId = Number.parseInt(classId.toString())
    const cls = academicClasses.find((c) => c.id === classId)
    if (cls) {
      const lastDivision = cls.divisions[cls.divisions.length - 1]
      const nextLetter = String.fromCharCode(lastDivision.division.charCodeAt(0) + 1)
      setNewDivision({ division: nextLetter, aliases: `${nextLetter}`, class: classId })
      formForDivsion.reset({
        class_id: cls.id,
        class: cls.class,
        // aliases: nextLetter,
        division: nextLetter,
        formType: "create",
      })
    }
    setIsDivisionForDialogOpen(true)
  }

  const handleEditDivision = (division: Division , clas : AcademicClasses) => {
    formForDivsion.reset({
      class: clas.class, // need to change class type for creation of class ,(API demands number format for create class)
      division: division.division,
      aliases: division.aliases,
      formType: "edit",
      class_id: division.id,
    })
    setIsDivisionForDialogOpen(true)
  }

  const handleEditClass = (cls: ClassData) => {
    setEditingClass(cls)
    setIsEditClassDialogOpen(true)
  }

  const handleSaveEditClass = () => {
    // Implementation remains the same
  }

  const handleSaveButtonForSelectedClasses = () => {
    setSelectedClasses(selectedClasses)
    setIsConfirmSaveDialogOpen(true)
  }

  const confirmSaveSelectionOfClasses = async () => {
    if (selectedClasses && selectedClasses.length > 0) {
      let payload: Omit<Class, "id" | "school_id">[] = []

      payload = selectedClasses.map((clas) => {
        return {
          class: clas.class,
          academic_session_id: currentAcademicSession!.id,
        }
      })

      try {
        const added_class: any = await dispatch(createClasses(payload))

        if (added_class.meta.requestStatus === "fulfilled") {
          // Update the academicClasses state with the new classes
          const newClasses = payload.map((clas, index) => ({
            class: clas.class,
            divisions: [
              {
                id: added_class.payload[0].id,
                school_id: user!.school_id,
                class: clas.class.toString(),
                academic_session_id: currentAcademicSession?.id ?? 0,
              },
            ],
          }))

          setAcademicClasses((prevClasses): any => [...prevClasses, ...newClasses])

          // Clear the selected classes
          setSelectedClasses([])

          toast({
            title: "Classes Added",
            description: `New classes have been added successfully.`,
          })

          refetchClasses()
        } else {
          toast({
            title: "Error",
            description: `Failed to add classes. Please try again.`,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: `An error occurred while adding classes. Please try again.`,
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "No Classes Selected",
        description: `Please select at least one class to add.`,
        variant: "destructive",
      })
    }

    setIsConfirmSaveDialogOpen(false)
  }

  const handleCreateCollegeClass = async () => {
    if (!collegeBatchId || !collegeDeptId || !collegeClassName) {
      toast({ 
        title: t("validation_error"), 
        description: t("please_select_batch_department_and_enter_class_name"),
        variant: "destructive"
      })
      return
    }

    try {
      const selectedBatch = batches.find((b: any) => b.id.toString() === collegeBatchId)
      const selectedDept = departments.find((d: any) => d.id.toString() === collegeDeptId)
      
      const batchPart = selectedBatch?.name || ""
      const deptPart = selectedDept?.code || selectedDept?.name || "DEPT"
      
      // Clean up inputs to remove potential double underscores
      const cleanedClassName = collegeClassName.trim().replace(/\s+/g, '_')
      
      const finalClassName = `${batchPart}_${deptPart}_${cleanedClassName}`

      const payload: any = [{
        class: finalClassName,
        batch_id: Number(collegeBatchId),
        department_id: Number(collegeDeptId),
        academic_session_id: currentAcademicSession!.id
      }]
      
      const result: any = await dispatch(createClasses(payload)).unwrap()
      toast({ title: t("class_added_successfully") })
      setCollegeClassName("")
      refetchClasses()
    } catch (error: any) {
      toast({ 
        title: t("error"), 
        description: error?.message || t("failed_to_add_class"),
        variant: "destructive"
      })
    }
  }

  const confirmDivisionChanges = async () => {
    const payload = formForDivsion.getValues();

    // Ensure aliases is null if empty string or only whitespace
    const aliasesToSend =
      payload.aliases === "" || payload.aliases == null || (typeof payload.aliases === "string" && payload.aliases.trim() === "")
        ? null
        : payload.aliases;

    if (payload.formType === "edit" && payload.class_id) {
      try {
        // Edit division
        const edited_division = await dispatch(
          editDivision({
            class_id: payload.class_id,
            aliases: aliasesToSend,
          }),
        ).unwrap()
        // Update the academicClasses state for the edited division
        setAcademicClasses((prevClasses) =>
          prevClasses.map((cls) => ({
            ...cls,
            divisions: cls.divisions.map((div) =>
              div.id === payload.class_id ? { ...div, aliases: payload.aliases || null } : div,
            ),
          })),
        )
        setIsDivisionForDialogOpen(false)
        setNewDivision(null)
        toast({
          title: "Division Updated",
          description: `Division has been updated successfully.`,
        })
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: `${error[0].message}`,
        })
      }
    } else {
      // Create new division
      try {
        if(!payload.class_id){
          toast({
            title: "Error",
            description: `Please select a class to add division.`,
            variant: "destructive",
          })
          return
        }
        const new_division = await dispatch(
          createDivision({
            class_id: payload.class_id,
            division: payload.division,
            aliases: payload.aliases,
            academic_session_id: currentAcademicSession?.id ?? 0,
          }),
        ).unwrap()
        setAcademicClasses((prevClasses): any =>
          prevClasses.map((cls) =>
            cls.class === payload.class
              ? {
                  ...cls,
                  divisions: [
                    ...cls.divisions,
                    {
                      id: new_division.id,
                      school_id: user!.school_id,
                      class: payload.class.toString(),
                      division: payload.division,
                      aliases: payload.aliases,
                    },
                  ],
                }
              : cls,
          ),
        )
        //refetch again , which stores updates changes in redux store
        setIsDivisionForDialogOpen(false)
        setNewDivision(null)

        toast({
          title: "Division Added",
          description: `New division has been added successfully.`,
        })
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: `${error[0].message}`,
        })
      }
    }
    refetchClasses();
  }

  const handleSessionFormSuccess = () => {
    setIsNewSessionDialogOpen(false)
    refetchSessions()
  }

  const handleActivateSession = async (sessionId: number) => {
    try {
      const result = await setActiveSessionMutation(sessionId).unwrap()
      toast({
        title: "Success",
        description: "Academic session activated successfully",
      })
      window.location.reload();
      // refetchSessions()
    } catch (error: any) {
      console.error("Failed to activate session:", error)

      // Extract error message from different possible error formats
      let errorMessage = "Failed to activate academic session"

      if (error.data?.message) {
        // Handle standard API error format
        errorMessage = error.data.message
      } else if (error.data?.error) {
        // Handle error object format
        errorMessage = error.data.error
      } else if (Array.isArray(error.data)) {
        // Handle array of errors format
        errorMessage = error.data.map((err: any) => err.message || err).join(", ")
      } else if (typeof error.message === "string") {
        // Handle plain error message
        errorMessage = error.message
      } else if (typeof error === "string") {
        // Handle string error
        errorMessage = error
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Update state when data is loaded
  useEffect(() => {
    if (academicClassesForSchool && academicClassesForSchool.length > 0) {
      setAcademicClasses(academicClassesForSchool)
    }
  }, [academicClassesForSchool])

  // useEffect(() => {
  //   console.log("formForDivsion.formState.errors", formForDivsion.formState.errors)
  // }, [formForDivsion.formState.errors])

  // Update the useEffect for setting the active session
  useEffect(() => {
    if (sessionsData && sessionsData.sessions && sessionsData.sessions.length > 0) {
      const session = sessionsData.sessions.find((session: any) => session.is_active)
      if (session?.is_active) {
        setActiveSession(session)
        // If we have an active session and we're on the sessions tab, auto-switch to classes tab
        // if (activeTab === "sessions" && !isLoadingClasses) {
        //   setActiveTab("classes")
        // }
      } else {
        setActiveSession(null)
        setShowNoActiveSessionAlert(true)
      }
    } else {
      setActiveSession(null)
      setShowNoActiveSessionAlert(true)
    }
  }, [sessionsData, activeTab, isLoadingClasses])

  // Check if there's an active session
  const hasActiveSession = !!activeSession

  return (
    <>
      {isLoadingClasses || isLoadingSessions ? (
        <div className="space-y-6 p-4">
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="sessions">{t("academic_sessions")}</TabsTrigger>
              {isCollege && (
                <TabsTrigger value="batches" disabled={!hasActiveSession}>
                  {t("batches")}
                </TabsTrigger>
              )}
              <TabsTrigger value="classes" disabled={!hasActiveSession}>
                {isCollege ? t("year_semester_classes") : t("classes_&_divisions")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="space-y-6">
              <SaralCard
                title={t("academic_session_management")}
                description={t("manage_academic_sessions_for_your_school")}
              >
                <Dialog open={isNewSessionDialogOpen} onOpenChange={setIsNewSessionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("add_new_session")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("create_new_academic_session")}</DialogTitle>
                      <DialogDescription>
                        {t("set_the_start_and_end_dates_for_the_new_academic_session.")}
                      </DialogDescription>
                    </DialogHeader>
                    <AcademicSessionForm onSuccess={handleSessionFormSuccess} />
                  </DialogContent>
                </Dialog>
                {activeSession ? (
                  <div className="mb-6 mt-6 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">{activeSession.session_name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getMonthName(activeSession.start_month.split("-")[1])} {activeSession.start_year} -{" "}
                          {getMonthName(activeSession.end_month.split("-")[1])} {activeSession.end_year}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-lg">
                        {t("current_session")}
                      </Badge>
                    </div>
                  </div>
                ) : ( 
                   <AlertDialog open={showNoActiveSessionAlert} onOpenChange={setShowNoActiveSessionAlert}>
                    <AlertDialogContent className="bg-yellow-50 border-yellow-200">
                      <AlertDialogHeader>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
                            <AlertDialogTitle className="text-yellow-700">{t("no_active_session")}</AlertDialogTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowNoActiveSessionAlert(false)}
                            className="h-6 w-6 rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <AlertDialogDescription className="text-yellow-600">
                          {t(
                            "there_is_no_active_academic_session._please_create_a_new_session_or_activate_an_existing_one.",
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowNoActiveSessionAlert(false)}>
                          {t("close")}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => setIsNewSessionDialogOpen(true)}>
                          {t("create_new_session")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">{t("all_academic_sessions")}</h3>
                  <AcademicSessionsList onActivate={handleActivateSession} />
                </div>
              </SaralCard>
            </TabsContent>

            {isCollege && (
              <TabsContent value="batches" className="space-y-6">
                <SaralCard
                  title={t("batch_management")}
                  description={t("manage_academic_batches_for_your_college")}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">{t("all_batches")}</h3>
                    <Dialog open={isNewBatchDialogOpen} onOpenChange={setIsNewBatchDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("add_new_batch")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t("create_new_batch")}</DialogTitle>
                          <DialogDescription>
                            {t("enter_the_name_for_the_new_batch_eg_2023_2027")}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="batchName" className="text-right">
                              {t("batch_name")}
                            </Label>
                            <Input
                              id="batchName"
                              value={newBatchName}
                              onChange={(e) => setNewBatchName(e.target.value)}
                              className="col-span-3"
                              placeholder="e.g. 2024-2028"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="batchDept" className="text-right">
                              {t("department")}
                            </Label>
                            <div className="col-span-3">
                              <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("select_department")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept: any) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsNewBatchDialogOpen(false)}>
                            {t("cancel")}
                          </Button>
                          <Button onClick={async () => {
                            if (!selectedDepartmentId) {
                              toast({ 
                                title: t("validation_error"), 
                                description: t("please_select_a_department"),
                                variant: "destructive"
                              })
                              return
                            }
                            try {
                              const startDate = currentAcademicSession ? 
                                `${currentAcademicSession.start_year}-${currentAcademicSession.start_month.split("-")[1] || "01"}-01` : 
                                new Date().toISOString().split('T')[0];

                              await createBatch({ 
                                name: newBatchName, 
                                entity_id: user!.school_id,
                                start_date: startDate,
                                department_id: Number(selectedDepartmentId)
                              }).unwrap()
                              toast({ title: t("batch_created_successfully") })
                              setIsNewBatchDialogOpen(false)
                              setNewBatchName("")
                              setSelectedDepartmentId("")
                              refetchBatches()
                            } catch (e) {
                              toast({ title: t("failed_to_create_batch"), variant: "destructive" })
                            }
                          }}>{t("save")}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("batch_name")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch: any) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.name}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {batches.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            {t("no_batches_found")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </SaralCard>
              </TabsContent>
            )}

            <TabsContent value="classes" className="space-y-6">
              {!hasActiveSession ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">{t("no_active_academic_session")}</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {t("please_create_and_activate_an_academic_session_before_managing_classes_and_divisions.")}
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab("sessions")}>
                    {t("go_to_sessions")}
                  </Button>
                </div>
              ) : (
                <>
                    <SaralCard
                      title={isCollege ? t("year_semester_management") : t("class_management")}
                      description={isCollege ? t("manage_years_and_semesters_for_this_academic_session") : t("manage_classes_for_the_current_academic_year")}
                    >
                      {isCollege ? (
                        <div className="space-y-4">
                          <div className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                              <Label>{t("select_batch")}</Label>
                              <Select value={collegeBatchId} onValueChange={setCollegeBatchId}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("choose_a_batch")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {batches.map((b: any) => (
                                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>{t("select_department")}</Label>
                              <Select value={collegeDeptId} onValueChange={setCollegeDeptId}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("choose_a_department")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((d: any) => (
                                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>{t("class_name_year_semester")}</Label>
                              <Input 
                                placeholder={t("eg_1st_year_sem_1")} 
                                value={collegeClassName}
                                onChange={(e) => setCollegeClassName(e.target.value)}
                              />
                            </div>
                            <Button onClick={handleCreateCollegeClass}>
                              <Plus className="mr-2 h-4 w-4" />
                              {t("add_class")}
                            </Button>
                          </div>
                          
                          {/* Live Preview for College Class Name */}
                          {collegeBatchId && collegeClassName && (
                            <div className="mt-2 bg-muted p-2 rounded-md border border-dashed flex items-center gap-2">
                              <span className="text-sm font-semibold">{t("preview")}:</span>
                              <Badge variant="outline" className="bg-white font-mono uppercase tracking-wider">
                                {batches.find((b: any) => b.id.toString() === collegeBatchId)?.name || ""}_
                                {(departments.find((d: any) => d.id.toString() === collegeDeptId)?.code || t("dept")).toUpperCase()}_
                                {collegeClassName.trim().replace(/\s+/g, '_')}
                              </Badge>
                              <span className="text-xs text-muted-foreground italic flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {t("batch_department_year_format")}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid gap-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {defaultStandards.map((cls) => (
                              <div
                                key={cls.id}
                                className="flex items-center justify-between space-x-2 rounded-lg border p-3 hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`class-${cls.id}`}
                                    disabled={disabledClasses.includes(cls.class)}
                                    checked={checkedClasses.has(cls.class)}
                                    onCheckedChange={() => handleClassToggle({class: cls.class as AvailableClasses, id: cls.id})}
                                  />
                                  <label
                                    htmlFor={`class-${cls.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    Class {cls.class}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end">
                            <Button onClick={handleSaveButtonForSelectedClasses} disabled={!selectedClasses}>
                              <Save className="mr-2 h-4 w-4" />
                              {t("save")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </SaralCard>

                  {academicClasses.length > 0 && (
                    <SaralCard
                      title={t("active_classes_&_divisions")}
                      description={t("manage_divisions_and_aliases_for_selected_classes")}
                    >
                      {isCollege && (
                        <div className="mb-6 flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-dashed">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("filter_by_department")}</Label>
                            <Select value={filterDepartmentId} onValueChange={setFilterDepartmentId}>
                              <SelectTrigger className="w-[200px] h-9 text-xs">
                                <SelectValue placeholder={t("all_departments")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t("all_departments")}</SelectItem>
                                {departments.map((d: any) => (
                                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("class")}</TableHead>
                            <TableHead>{t("divisions")}</TableHead>
                            <TableHead className="text-right">{t("actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {academicClasses
                            .filter((std: any) => {
                              if (!isCollege || filterDepartmentId === "all") return true;
                              return std.department_id?.toString() === filterDepartmentId;
                            })
                            .map(
                            (std, index) =>
                              std.divisions.length > 0 && (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{std.class}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2 flex-wrap">
                                      {std.divisions.map((division) => (
                                        <Badge
                                          key={division.id}
                                          variant="secondary"
                                          className="flex items-center gap-1 p-3"
                                        >
                                          <p>
                                            ({std.class}- {division.division})
                                          </p>
                                          <p>{division.aliases}</p>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 p-0 ml-1"
                                            onClick={() => handleEditDivision(division , std)}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button size="sm" variant="outline" onClick={() => handleAddDivision(std.id)}>
                                      <PlusCircle className="mr-2 h-4 w-4" />
                                      {t("add_division")}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ),
                          )}
                        </TableBody>
                      </Table>
                    </SaralCard>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          <Dialog open={isEditClassDialogOpen} onOpenChange={setIsEditClassDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("edit_class")}</DialogTitle>
                <DialogDescription>{t("modify_the_class_name_or_remove_it.")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="className" className="text-right">
                    {t("class_name")}
                  </Label>
                  <Input
                    id="className"
                    value={editingClass?.class || ""}
                    onChange={(e) => setEditingClass((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditClassDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleSaveEditClass}>{t("save_changes")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDivisionDialogOpen} onOpenChange={setIsEditDivisionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("edit_division")}</DialogTitle>
                <DialogDescription>{t("modify_the_division_alias.")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="divisionName" className="text-right">
                    {t("division_name")}
                  </Label>
                  <Input
                    id="divisionName"
                    value={editingDivision?.division.division || ""}
                    disabled
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="divisionAlias" className="text-right">
                    {t("division_alias")}
                  </Label>
                  <Input
                    id="divisionAlias"
                    value={editingDivision?.division.aliases || ""}
                    onChange={(e) =>
                      setEditingDivision((prev) =>
                        prev ? { ...prev, division: { ...prev.division, alias: e.target.value } } : null,
                      )
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDivisionDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={() => {}}>{t("save_changes")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isConfirmSaveDialogOpen} onOpenChange={setIsConfirmSaveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("confirm_changes")}</DialogTitle>
                <DialogDescription>
                  {t("are_you_sure_you_want_to_save_these_changes_to_your_class_selection?")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmSaveDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={confirmSaveSelectionOfClasses}>{t("confirm")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDivisionForDialogOpen} onOpenChange={setIsDivisionForDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {formForDivsion.getValues("formType") === "create" ? t("add") : t("update")} {t("division")}
                </DialogTitle>
                <DialogDescription>{t("confirm_or_modify_the_division_alias.")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Form {...formForDivsion}>
                  <form onSubmit={formForDivsion.handleSubmit(confirmDivisionChanges)} className="space-y-6">
                    <FormField
                      control={formForDivsion.control}
                      name="class"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("class")}</FormLabel>
                          <FormControl>
                            <Input type="text" {...field} value={field.value ?? ""} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={formForDivsion.control}
                      name="division"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("division")}</FormLabel>
                          <FormControl>
                            <Input type="text" {...field} value={field.value ?? ""} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={formForDivsion.control}
                      name="aliases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("aliases")}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder={t("enter_aliases_name_for_class")}
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDivisionForDialogOpen(false)}>
                        {t("cancel")}
                      </Button>
                      <Button type="submit">
                        {formForDivsion.getValues("formType") === "create" ? t("add_a_new") : t("update")} {t("division")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  )
}

