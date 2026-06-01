

"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Loader2,
  Edit,
  Save,
  RotateCcw,
  BookOpen,
  Users,
  Dumbbell,
  Coffee,
  Beaker,
  Clock,
  Wand2,
  Trash2,
  CheckCircle,
  Settings,
  Plus,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useLazyGetSubjectsForDivisionQuery } from "@/services/subjects"
import { useLazyGetTeachingStaffQuery } from "@/services/StaffService"
import {
  useAutoGenerateTimeTableForWeekMutation,
  useCreateDayWiseTimeTableForDivisonMutation,
  useLazyFetchTimeTableConfigForDivisionQuery,
  useDeleteDayWiseTimeTableForDivisonMutation,
} from "@/services/timetableService"
import { useLazyGetAllSubjectsQuery, useAssignSubjectToDivisionMutation } from "@/services/subjects"
import type { WeeklyTimeTableForDivision, TimeTableConfigForSchool, SubjectDivisionMaster, SchoolSubject } from "@/types/subjects"
import type { StaffType } from "@/types/staff"
import ApiService from "@/services/ApiService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

interface AutoTimetableGeneratorProps {
  divisionId: number
  timetableConfig: TimeTableConfigForSchool
  onSave: () => void
  onCancel: () => void
  hasExistingTimetable?: boolean
}

// Schema for auto-generation configuration
const autoGenerationConfigSchema = z.object({
  free_periods_count: z.number().min(0).max(10),
  max_consecutive_periods: z.number().min(1).max(8).nullable(),
  include_pt_periods: z.boolean(),
  selected_labs: z.array(z.number()),
  subject_preferences: z.array(
    z.object({
      subject_id: z.number(),
      priority: z.number().min(1).max(5),
      periods_per_week: z.number().min(1).max(10),
    }),
  ),
  breaks: z.array(
    z.object({
      period_order: z.number(),
      duration: z.number().min(5).max(60),
    })
  ),
})

export default function AutoTimetableGenerator({
  divisionId,
  timetableConfig,
  onSave,
  onCancel,
  hasExistingTimetable = false,
}: AutoTimetableGeneratorProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  // API hooks
  const [autoGenerateTimeTable, { isLoading: isGenerating }] = useAutoGenerateTimeTableForWeekMutation()
  const [createDayWiseTimeTable, { isLoading: isSaving }] = useCreateDayWiseTimeTableForDivisonMutation()
  const [deleteDayWiseTimeTable, { isLoading: isDeleting }] = useDeleteDayWiseTimeTableForDivisonMutation()
  const [getSubjectsForDivision, { data: subjectsData }] = useLazyGetSubjectsForDivisionQuery()
  const [getAllSubjects, { data: allSubjectsData }] = useLazyGetAllSubjectsQuery()
  const [assignSubjectToDivision] = useAssignSubjectToDivisionMutation()
  const [getTeachingStaff, { data: staffData }] = useLazyGetTeachingStaffQuery()
  const [fetchTimeTableConfig] = useLazyFetchTimeTableConfigForDivisionQuery()

  // State management
  const [generatedTimetable, setGeneratedTimetable] = useState<WeeklyTimeTableForDivision[]>([])
  const [editingTimetable, setEditingTimetable] = useState<WeeklyTimeTableForDivision[]>([])
  const [subjects, setSubjects] = useState<SubjectDivisionMaster[]>([])
  const [staff, setStaff] = useState<StaffType[]>([])
  const [activeDay, setActiveDay] = useState<string>("mon")
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all")
  const [hasGenerated, setHasGenerated] = useState(false)
  const [editingMode, setEditingMode] = useState(false)
  const [showConfiguration, setShowConfiguration] = useState(true)
  const [coverageReport, setCoverageReport] = useState<any[]>([])
  const [calendarSettings, setCalendarSettings] = useState<any>(null)
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false)

  // Load coverage report and calendar settings
  useEffect(() => {
    if (currentAcademicSession) {
      ApiService.get(`lesson-plans/reports/coverage/${currentAcademicSession.id}`)
        .then((res: any) => {
          setCoverageReport(res.data || [])
        })
        .catch((err: any) => {
          console.error("Error fetching coverage report:", err)
        })

      ApiService.get(`academic-calendar-settings/${currentAcademicSession.id}`)
        .then((res: any) => {
          setCalendarSettings(res.data || null)
        })
        .catch((err: any) => {
          console.error("Error fetching calendar settings:", err)
        })
    }
  }, [currentAcademicSession])

  // Calculate working days count per day of the week
  const workingDaysCount = useMemo(() => {
    const counts = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 }
    if (!currentAcademicSession) return counts

    try {
      let startStr = currentAcademicSession.start_month
      let endStr = currentAcademicSession.end_month

      if (startStr && !startStr.includes("-")) {
        startStr = `${currentAcademicSession.start_year}-${startStr}`
      }
      if (endStr && !endStr.includes("-")) {
        endStr = `${currentAcademicSession.end_year}-${endStr}`
      }

      const startDate = new Date(startStr)
      const endDate = new Date(endStr)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { mon: 40, tue: 40, wed: 40, thu: 40, fri: 40, sat: 40 }
      }

      // Adjust end date to last day of month
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)

      const holidays = new Set(calendarSettings?.non_working_dates || [])
      const isSatWorking = calendarSettings?.is_saturday_working !== false

      const current = new Date(startDate)
      const dayMap: Record<number, keyof typeof counts> = {
        1: "mon",
        2: "tue",
        3: "wed",
        4: "thu",
        5: "fri",
        6: "sat",
      }

      while (current <= endDate) {
        const dayOfWeek = current.getDay() // 0 = Sunday, 6 = Saturday
        const dateString = current.toISOString().split("T")[0]

        if (dayOfWeek !== 0 && !holidays.has(dateString)) {
          if (dayOfWeek !== 6 || isSatWorking) {
            const key = dayMap[dayOfWeek]
            if (key) {
              counts[key]++
            }
          }
        }
        current.setDate(current.getDate() + 1)
      }
    } catch (e) {
      console.error("Error calculating working days count", e)
      return { mon: 40, tue: 40, wed: 40, thu: 40, fri: 40, sat: 40 }
    }
    return counts
  }, [currentAcademicSession, calendarSettings])

  // Helper to calculate duration in minutes
  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    return endMinutes - startMinutes
  }

  // Map subjects to their total weekly minutes in the timetable and then to total session hours
  const unfulfilledSubjects = useMemo(() => {
    if (!editingTimetable.length || !subjects.length) return []

    // Calculate weekly minutes for each subject_division_master ID
    const weeklyMinutes: Record<number, number> = {}
    subjects.forEach((s) => {
      weeklyMinutes[s.id] = 0
    })

    editingTimetable.forEach((dayTimetable) => {
      const dayConfig = timetableConfig.class_day_config.find((config) => config.id === dayTimetable.class_day_config_id)
      if (!dayConfig) return

      const dayValue = dayConfig.day as keyof typeof workingDaysCount
      const dayWorkingCount = workingDaysCount[dayValue] || 0

      dayTimetable.periods.forEach((period) => {
        if (!period.is_break && !period.is_pt && !period.is_free_period && period.subjects_division_masters_id) {
          const duration = calculateDuration(period.start_time, period.end_time)
          const sdmId = period.subjects_division_masters_id
          if (weeklyMinutes[sdmId] !== undefined) {
            weeklyMinutes[sdmId] += (duration * dayWorkingCount)
          } else {
            weeklyMinutes[sdmId] = (duration * dayWorkingCount)
          }
        }
      })
    })

    // Now map subject_division_master ID to Subject ID and compare total hours with lesson plan requirements
    const result: Array<{ id: number; name: string; requiredHours: number; allocatedHours: number }> = []

    subjects.forEach((s) => {
      const lpReportItem = coverageReport.find((r) => r.subjectId === s.subject_id || r.subject_id === s.subject_id)
      const requiredHours = lpReportItem ? lpReportItem.totalHours || 0 : 0

      if (requiredHours > 0) {
        const totalMinutes = weeklyMinutes[s.id] || 0
        const allocatedHours = totalMinutes / 60

        if (allocatedHours < requiredHours) {
          result.push({
            id: s.subject_id,
            name: s.subject?.name || t("unknown_subject"),
            requiredHours,
            allocatedHours,
          })
        }
      }
    })

    return result
  }, [editingTimetable, subjects, workingDaysCount, coverageReport, timetableConfig, t])

  // Configuration form
  const configForm = useForm<z.infer<typeof autoGenerationConfigSchema>>({
    resolver: zodResolver(autoGenerationConfigSchema),
    defaultValues: {
      free_periods_count: 2,
      max_consecutive_periods: timetableConfig.teacher_max_periods_per_day,
      include_pt_periods: timetableConfig.pt_enabled,
      selected_labs: [],
      subject_preferences: [],
      breaks: [
        { period_order: 3, duration: 15 }, // Default break after 3rd period
      ],
    },
  })

  // Days configuration
  const days = [
    { value: "mon", label: t("monday") },
    { value: "tue", label: t("tuesday") },
    { value: "wed", label: t("wednesday") },
    { value: "thu", label: t("thursday") },
    { value: "fri", label: t("friday") },
    { value: "sat", label: t("saturday") },
  ]

  // Load subjects and staff data
  useEffect(() => {
    if (currentAcademicSession && divisionId) {
      getSubjectsForDivision({
        academic_session_id: currentAcademicSession.id,
        division_id: divisionId,
      })

      getAllSubjects({
        academic_session_id: currentAcademicSession.id,
      })

      getTeachingStaff({
        academic_sessions: currentAcademicSession.id,
      })
    }
  }, [currentAcademicSession, divisionId, getSubjectsForDivision, getAllSubjects, getTeachingStaff])

  // Set subjects and staff when data is loaded
  useEffect(() => {
    if (subjectsData) {
      setSubjects(subjectsData)
      // Initialize subject preferences
      const preferences = subjectsData.map((subject, index) => ({
        subject_id: subject.subject_id,
        priority: 3, // Default priority
        periods_per_week: 4, // Default periods per week
      }))
      configForm.setValue("subject_preferences", preferences)
    }
    if (staffData) {
      setStaff(staffData.data || [])
    }
  }, [subjectsData, staffData, configForm])

  // Initialize editing timetable when generated timetable changes
  useEffect(() => {
    if (generatedTimetable.length > 0) {
      setEditingTimetable(JSON.parse(JSON.stringify(generatedTimetable)))
    }
  }, [generatedTimetable])

  // Handle configuration submission and auto-generation
  const handleConfigurationSubmit = async (data: z.infer<typeof autoGenerationConfigSchema>) => {
    try {
      const autoGenerationPayload = {
        division_id: divisionId,
        academic_session_id: currentAcademicSession!.id,
        configuration: {
          free_periods_count: data.free_periods_count,
          max_consecutive_periods: data.max_consecutive_periods || 2,
          include_pt_periods: data.include_pt_periods,
          selected_labs: data.selected_labs,
          subject_preferences: data.subject_preferences,
          breaks: data.breaks,
          // Additional configuration from timetable config
          max_periods_per_day: timetableConfig.max_periods_per_day,
          default_period_duration: timetableConfig.default_period_duration,
          lab_enabled: timetableConfig.lab_enabled,
          pt_enabled: timetableConfig.pt_enabled,
        },
      }

      console.log("Auto-generation payload:", autoGenerationPayload)

      const result = await autoGenerateTimeTable(autoGenerationPayload).unwrap()
      setGeneratedTimetable(result.timetable)
      setHasGenerated(true)
      setEditingMode(false)
      setShowConfiguration(false)

      toast({
        title: t("success"),
        description: t("timetable_generated_successfully"),
      })
    } catch (error: any) {
      console.error("Error generating timetable:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_generate_timetable"),
      })
    }
  }

  // Handle save timetable
  const handleSaveTimetable = async () => {
    try {
      // If we are regenerating, delete existing timetable first
      if (hasExistingTimetable) {
        await deleteDayWiseTimeTable({
          school_timetable_config_id: timetableConfig.id,
          division_id: divisionId,
        }).unwrap()
      }

      for (const dayTimetable of editingTimetable) {
        const periodsPayload = {
          class_day_config_id: dayTimetable.class_day_config_id,
          division_id: divisionId,
          periods: dayTimetable.periods.map((period) => ({
            period_order: period.period_order,
            start_time: period.start_time,
            end_time: period.end_time,
            is_break: period.is_break,
            subjects_division_masters_id:
              period.is_break || period.is_pt || period.is_free_period ? null : period.subjects_division_masters_id,
            staff_enrollment_id:
              period.is_break || period.is_pt || period.is_free_period ? null : period.staff_enrollment_id,
            lab_id: period.lab_id,
            is_pt: period.is_pt,
            is_free_period: period.is_free_period,
          })),
        }

        await createDayWiseTimeTable({ payload: periodsPayload }).unwrap()
      }

      toast({
        title: t("success"),
        description: t("timetable_saved_successfully"),
      })

      onSave()
    } catch (error: any) {
      console.error("Error saving timetable:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_save_timetable"),
      })
    }
  }

  // Handle save individual day
  const handleSaveDay = async (dayTimetable: WeeklyTimeTableForDivision) => {
    try {
      const periodsPayload = {
        class_day_config_id: dayTimetable.class_day_config_id,
        division_id: divisionId,
        periods: dayTimetable.periods.map((period) => ({
          period_order: period.period_order,
          start_time: period.start_time,
          end_time: period.end_time,
          is_break: period.is_break,
          subjects_division_masters_id:
            period.is_break || period.is_pt || period.is_free_period ? null : period.subjects_division_masters_id,
          staff_enrollment_id:
            period.is_break || period.is_pt || period.is_free_period ? null : period.staff_enrollment_id,
          lab_id: period.lab_id,
          is_pt: period.is_pt,
          is_free_period: period.is_free_period,
        })),
      }

      await createDayWiseTimeTable({ payload: periodsPayload }).unwrap()

      toast({
        title: t("success"),
        description: t("day_timetable_saved_successfully"),
      })

      return true
    } catch (error: any) {
      console.error("Error saving day timetable:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_save_day_timetable"),
      })
      return false
    }
  }

  // Reset to generated timetable
  const handleResetChanges = () => {
    setEditingTimetable(JSON.parse(JSON.stringify(generatedTimetable)))
    setEditingMode(false)
    toast({
      title: t("changes_reset"),
      description: t("timetable_reset_to_generated_version"),
    })
  }

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  // Get day config by day value
  const getDayConfig = (dayValue: string) => {
    return timetableConfig.class_day_config.find((config) => config.day === dayValue)
  }

  // Get timetable for specific day
  const getDayTimetable = (dayValue: string) => {
    const dayConfig = getDayConfig(dayValue)
    if (!dayConfig) return null

    return editingTimetable.find((tt) => tt.class_day_config_id === dayConfig.id)
  }

  // Get subject name
  const getSubjectName = (subjectId: number | null) => {
    if (!subjectId) return t("no_subject")
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.subject?.name || t("unknown_subject") : t("unknown_subject")
  }

  // Get subject code
  const getSubjectCode = (subjectId: number | null) => {
    if (!subjectId) return ""
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.code_for_division || subject.subject?.code || "" : ""
  }

  // Get teacher name
  const getTeacherName = (staffId: number | null) => {
    if (!staffId) return t("no_teacher")
    const teacher = staff.find((s) => s.staff_enrollment_id === staffId)
    if (!teacher) return t("unknown_teacher")
    return `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim()
  }

  // Get lab name
  const getLabName = (labId: number | null) => {
    if (!labId) return null
    const lab = timetableConfig.lab_config.find((lab) => lab.id === labId)
    return lab ? lab.name : t("unknown_lab")
  }

  // Get period icon
  const getPeriodIcon = (period: any) => {
    if (period.is_break) return <Coffee className="h-4 w-4 text-amber-600" />
    if (period.is_pt) return <Dumbbell className="h-4 w-4 text-purple-600" />
    if (period.lab_id) return <Beaker className="h-4 w-4 text-blue-600" />
    if (period.is_free_period) return <Clock className="h-4 w-4 text-gray-600" />
    return <BookOpen className="h-4 w-4 text-green-600" />
  }

  // Get period background color
  const getPeriodBgColor = (period: any) => {
    if (period.is_break) return "bg-amber-50"
    if (period.is_pt) return "bg-purple-50"
    if (period.lab_id) return "bg-blue-50"
    if (period.is_free_period) return "bg-gray-50"
    return "bg-green-50"
  }

  // Get period type badge
  const getPeriodTypeBadge = (period: any) => {
    if (period.is_break) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          {t("break")}
        </Badge>
      )
    }
    if (period.is_pt) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          {t("pt")}
        </Badge>
      )
    }
    if (period.lab_id) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {t("lab")}
        </Badge>
      )
    }
    if (period.is_free_period) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          {t("free")}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        {t("regular")}
      </Badge>
    )
  }

  // Handle adding a subject from global list
  const handleAddGlobalSubject = async (subjectId: number) => {
    try {
      const subject = allSubjectsData?.find(s => s.id === subjectId)
      if (!subject) return

      // Assign subject to division
      await assignSubjectToDivision({
        academic_session_id: currentAcademicSession!.id,
        division_id: divisionId,
        subjects: [{
          subject_id: subjectId,
          code_for_division: subject.code || ""
        }]
      }).unwrap()

      // Refresh division subjects
      await getSubjectsForDivision({
        academic_session_id: currentAcademicSession!.id,
        division_id: divisionId,
      })
      
      toast({
        title: t("subject_added"),
        description: t("subject_assigned_to_division_successfully"),
      })
    } catch (error: any) {
      console.error("Error adding global subject:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_add_subject"),
      })
    }
  }

  // Get subject options
  const getSubjectOptions = () => {
    if (!subjects) return []
    return subjects.map((subject) => ({
      value: subject.id.toString(),
      label: subject.subject?.name || `Subject ${subject.id}`,
      code: subject.code_for_division || subject.subject?.code,
    }))
  }

  // Get staff options for a specific subject
  const getStaffOptionsForSubject = (subjectId: number | null) => {
    if (!subjects || !subjectId) return []
    const subject = subjects.find((s) => s.id === subjectId)
    if (!subject) return []

    return (subject.subject_staff_divisioin_master || [])
      .filter((ssm) => ssm.status === "Active" && ssm.staff_enrollment && ssm.staff_enrollment.status === "Retained")
      .map((ssm) => {
        const staff = ssm.staff_enrollment.staff
        return {
          value: ssm.staff_enrollment_id.toString(),
          label: `${staff?.first_name || ""} ${staff?.last_name || ""}`.trim(),
          code: staff?.employee_code,
        }
      })
  }

  // Update period in editing timetable
  const updatePeriod = (dayValue: string, periodIndex: number, field: string, value: any) => {
    const dayConfig = getDayConfig(dayValue)
    if (!dayConfig) return

    setEditingTimetable((prev) => {
      const newTimetable = [...prev]
      const dayTimetableIndex = newTimetable.findIndex((tt) => tt.class_day_config_id === dayConfig.id)

      if (dayTimetableIndex !== -1) {
        const updatedPeriods = [...newTimetable[dayTimetableIndex].periods]
        updatedPeriods[periodIndex] = {
          ...updatedPeriods[periodIndex],
          [field]: value,
        }

        if (field === "subjects_division_masters_id") {
          updatedPeriods[periodIndex].staff_enrollment_id = null
        }

        newTimetable[dayTimetableIndex] = {
          ...newTimetable[dayTimetableIndex],
          periods: updatedPeriods,
        }

        setEditingMode(true)
      }

      return newTimetable
    })
  }

  // Render configuration form
  const renderConfigurationForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>{t("auto_generation_configuration")}</span>
        </CardTitle>
        <CardDescription>{t("configure_parameters_for_automatic_timetable_generation")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...configForm}>
          <form onSubmit={configForm.handleSubmit(handleConfigurationSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={configForm.control}
                name="free_periods_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("free_periods_per_week")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>{t("number_of_free_periods_to_include_in_the_timetable")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="max_consecutive_periods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("max_consecutive_periods")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="8"
                        placeholder={t("no_limit")}
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>{t("maximum_consecutive_periods_for_teachers")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {timetableConfig.lab_enabled && (
              <FormField
                control={configForm.control}
                name="selected_labs"
                render={() => (
                  <FormItem className="space-y-4">
                    <div>
                      <FormLabel>{t("available_labs")}</FormLabel>
                      <FormDescription>{t("select_labs_to_include_in_the_timetable")}</FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {timetableConfig.lab_config.map((lab) => (
                        <FormField
                          key={lab.id}
                          control={configForm.control}
                          name="selected_labs"
                          render={({ field }) => {
                            return (
                              <FormItem key={lab.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(lab.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, lab.id])
                                        : field.onChange(field.value?.filter((value) => value !== lab.id))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {lab.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">{t("break_management")}</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentBreaks = configForm.getValues("breaks")
                    configForm.setValue("breaks", [
                      ...currentBreaks,
                      { period_order: currentBreaks.length + 4, duration: 15 },
                    ])
                  }}
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  {t("add_break")}
                </Button>
              </div>
              <FormDescription>{t("define_fixed_breaks_in_the_timetable")}</FormDescription>

              <div className="space-y-3">
                {configForm.watch("breaks").map((_, index) => (
                  <div key={index} className="flex items-end space-x-4">
                    <FormField
                      control={configForm.control}
                      name={`breaks.${index}.period_order`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t("after_period")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max={timetableConfig.max_periods_per_day}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name={`breaks.${index}.duration`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t("duration_min")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="5"
                              max="60"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mb-2 text-red-500"
                      onClick={() => {
                        const currentBreaks = configForm.getValues("breaks")
                        configForm.setValue(
                          "breaks",
                          currentBreaks.filter((_, i) => i !== index),
                        )
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-base">{t("subject_preferences")}</FormLabel>
                  <FormDescription>{t("set_priority_and_periods_per_week_for_each_subject")}</FormDescription>
                </div>
                
                {allSubjectsData && allSubjectsData.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder={t("filter_year")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("all_years")}</SelectItem>
                        <SelectItem value="1st Year">{t("1st_year")}</SelectItem>
                        <SelectItem value="2nd Year">{t("2nd_year")}</SelectItem>
                        <SelectItem value="3rd Year">{t("3rd_year")}</SelectItem>
                        <SelectItem value="4th Year">{t("4th_year")}</SelectItem>
                        <SelectItem value="5th Year">{t("5th_year")}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select onValueChange={(val) => handleAddGlobalSubject(Number(val))}>
                      <SelectTrigger className="w-[180px] h-9">
                        <Plus className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t("add_subject")} />
                      </SelectTrigger>
                      <SelectContent>
                        {allSubjectsData
                          .filter(gs => {
                            const notAdded = !subjects.some(s => s.subject_id === gs.id);
                            const matchesYear = selectedYearFilter === "all" || gs.year === selectedYearFilter;
                            return notAdded && matchesYear;
                          })
                          .map(gs => (
                            <SelectItem key={gs.id} value={gs.id.toString()}>
                              {gs.name} {gs.year ? `(${gs.year})` : ""}
                            </SelectItem>
                          ))
                        }
                        {allSubjectsData.filter(gs => {
                            const notAdded = !subjects.some(s => s.subject_id === gs.id);
                            const matchesYear = selectedYearFilter === "all" || gs.year === selectedYearFilter;
                            return notAdded && matchesYear;
                          }).length === 0 && (
                          <SelectItem value="none" disabled>{t("no_subjects_found")}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto">
                {subjects.map((subject, index) => (
                  <div key={subject.id} className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">
                      {subject.subject?.name}
                      {subject.code_for_division && (
                        <span className="text-sm text-muted-foreground ml-2">({subject.code_for_division})</span>
                      )}
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={configForm.control}
                        name={`subject_preferences.${index}.priority`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t("priority")} (1-5)</FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground">
                              {field.value === 1 && t("lowest")}
                              {field.value === 2 && t("low")}
                              {field.value === 3 && t("medium")}
                              {field.value === 4 && t("high")}
                              {field.value === 5 && t("highest")}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={configForm.control}
                        name={`subject_preferences.${index}.periods_per_week`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t("periods_per_week")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("generating_timetable")}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    {t("generate_timetable")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )

  // Render weekly overview
  const renderWeeklyOverview = () => {
    const maxPeriods = Math.max(
      ...timetableConfig.class_day_config.map((config) => {
        const dayTimetable = editingTimetable.find((tt) => tt.class_day_config_id === config.id)
        return dayTimetable ? dayTimetable.periods.length : 0
      }),
    )

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-muted font-medium text-left">{t("day")}</th>
              {Array.from({ length: maxPeriods }, (_, i) => (
                <th key={i} className="border p-2 bg-muted font-medium text-center">
                  {t("period")} {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const dayConfig = getDayConfig(day.value)
              const dayTimetable = getDayTimetable(day.value)

              if (!dayConfig || !dayTimetable) return null

              return (
                <tr key={day.value}>
                  <th className="border p-2 bg-muted font-medium text-left">{day.label}</th>
                  {Array.from({ length: maxPeriods }, (_, i) => {
                    const period = dayTimetable.periods[i]

                    if (!period) {
                      return (
                        <td key={i} className="border p-2 text-center text-muted-foreground text-sm">
                          -
                        </td>
                      )
                    }

                    return (
                      <td key={i} className={`border p-2 ${getPeriodBgColor(period)}`}>
                        <div className="flex flex-col h-full min-h-[80px]">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              {getPeriodIcon(period)}
                              <span className="text-xs font-medium">
                                {formatTime(period.start_time)} - {formatTime(period.end_time)}
                              </span>
                            </div>
                            {getPeriodTypeBadge(period)}
                          </div>

                          {!period.is_break && (
                            <>
                              {period.subjects_division_masters_id && !period.is_free_period && (
                                <div className="text-sm font-medium">
                                  {getSubjectName(period.subjects_division_masters_id)}
                                  {getSubjectCode(period.subjects_division_masters_id) && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({getSubjectCode(period.subjects_division_masters_id)})
                                    </span>
                                  )}
                                </div>
                              )}

                              {period.staff_enrollment_id && !period.is_free_period && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {getTeacherName(period.staff_enrollment_id)}
                                  </span>
                                </div>
                              )}

                              {period.lab_id && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Beaker className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{getLabName(period.lab_id)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Render day editor
  const renderDayEditor = (dayValue: string) => {
    const dayTimetable = getDayTimetable(dayValue)
    if (!dayTimetable) return null

    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => handleSaveDay(dayTimetable)} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {t("save")} {days.find((d) => d.value === dayValue)?.label}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted font-medium text-center">{t("period")}</th>
                <th className="border p-2 bg-muted font-medium text-center">{t("time")}</th>
                <th className="border p-2 bg-muted font-medium text-center">{t("type")}</th>
                <th className="border p-2 bg-muted font-medium text-center">{t("subject")}</th>
                <th className="border p-2 bg-muted font-medium text-center">{t("teacher")}</th>
                <th className="border p-2 bg-muted font-medium text-center">{t("lab")}</th>
              </tr>
            </thead>
            <tbody>
              {dayTimetable.periods.map((period, index) => (
                <tr key={index} className={getPeriodBgColor(period)}>
                  <td className="border p-2 text-center">{period.period_order}</td>
                  <td className="border p-2 text-center">
                    {formatTime(period.start_time)} - {formatTime(period.end_time)}
                  </td>
                  <td className="border p-2 text-center">{getPeriodTypeBadge(period)}</td>
                  <td className="border p-2 text-center">
                    {!period.is_break && !period.is_pt && !period.is_free_period ? (
                      <Select
                        value={period.subjects_division_masters_id?.toString() || "none"}
                        onValueChange={(value) =>
                          updatePeriod(
                            dayValue,
                            index,
                            "subjects_division_masters_id",
                            value === "none" ? null : Number(value),
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder={t("select_subject")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("no_subject")}</SelectItem>
                          {getSubjectOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label} {option.code ? `(${option.code})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {!period.is_break && !period.is_pt && !period.is_free_period ? (
                      <Select
                        value={period.staff_enrollment_id?.toString() || "none"}
                        onValueChange={(value) =>
                          updatePeriod(dayValue, index, "staff_enrollment_id", value === "none" ? null : Number(value))
                        }
                        disabled={!period.subjects_division_masters_id}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder={t("select_teacher")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("no_teacher")}</SelectItem>
                          {getStaffOptionsForSubject(period.subjects_division_masters_id).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label} {option.code ? `(${option.code})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="border p-2 text-center">{period.lab_id ? getLabName(period.lab_id) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showConfiguration ? (
        renderConfigurationForm()
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="h-5 w-5" />
              <span>{t("automatic_timetable_generation")}</span>
            </CardTitle>
            <CardDescription>{t("generated_timetable_ready_for_review_and_customization")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {unfulfilledSubjects.length > 0 && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 rounded-2xl mb-4">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="font-bold text-red-800">
                  {t("lesson_plan_hours_warning") || "Syllabus Hours Under-Allocation Warning"}
                </AlertTitle>
                <AlertDescription className="text-xs text-red-700 mt-1">
                  {t("subjects_under_allocated_message") || "The following subjects are allocated fewer hours in the timetable than required by their lesson plans:"}
                  <ul className="list-disc pl-5 mt-2 space-y-1 font-semibold">
                    {unfulfilledSubjects.map((sub: { id: number; name: string; requiredHours: number; allocatedHours: number }) => (
                      <li key={sub.id}>
                        {sub.name}: {sub.allocatedHours.toFixed(1)}h {t("allocated") || "allocated"} / {sub.requiredHours.toFixed(1)}h {t("required") || "required"}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">{t("timetable_generated_successfully")}</span>
                  {editingMode && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {t("unsaved_changes")}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowConfiguration(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    {t("reconfigure")}
                  </Button>

                  {editingMode && (
                    <Button variant="outline" size="sm" onClick={handleResetChanges}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t("reset_changes")}
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={onCancel}>
                    {t("cancel")}
                  </Button>

                  <Button 
                    onClick={() => {
                      if (unfulfilledSubjects.length > 0) {
                        setIsConfirmSaveOpen(true)
                      } else {
                        handleSaveTimetable()
                      }
                    }} 
                    disabled={isSaving} 
                    size="sm"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {t("save_timetable")}
                  </Button>
                </div>
              </div>

              <Tabs value={activeDay} onValueChange={setActiveDay}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="overview">{t("weekly_overview")}</TabsTrigger>
                    {days.map((day) => {
                      const dayConfig = getDayConfig(day.value)
                      const dayTimetable = getDayTimetable(day.value)

                      return (
                        <TabsTrigger key={day.value} value={day.value} disabled={!dayConfig || !dayTimetable}>
                          {day.label}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </div>

                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("weekly_timetable_overview")}</CardTitle>
                      <CardDescription>{t("complete_weekly_view_of_the_generated_timetable")}</CardDescription>
                    </CardHeader>
                    <CardContent>{renderWeeklyOverview()}</CardContent>
                  </Card>
                </TabsContent>

                {days.map((day) => (
                  <TabsContent key={day.value} value={day.value}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Edit className="h-5 w-5" />
                          <span>
                            {t("edit")} {day.label}
                          </span>
                        </CardTitle>
                        <CardDescription>{t("customize_the_timetable_for_this_day")}</CardDescription>
                      </CardHeader>
                      <CardContent>{renderDayEditor(day.value)}</CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              {t("unfulfilled_hours_warning") || "Hours Under-Allocation Warning"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 leading-relaxed text-sm">
              {t("unfulfilled_hours_warning_description") || "The following subjects do not meet their required lesson plan hours in this timetable configuration:"}
              <ul className="list-disc pl-5 mt-2 space-y-1 font-semibold text-red-600">
                {unfulfilledSubjects.map((sub: { id: number; name: string; requiredHours: number; allocatedHours: number }) => (
                  <li key={sub.id}>
                    {sub.name}: {sub.allocatedHours.toFixed(1)}h {t("allocated") || "allocated"} / {sub.requiredHours.toFixed(1)}h {t("required") || "required"}
                  </li>
                ))}
              </ul>
              <br />
              {t("confirm_save_timetable_anyway") || "Do you still want to save the timetable anyway?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsConfirmSaveOpen(false)
                handleSaveTimetable()
              }}
              className="bg-amber-600 hover:bg-amber-700 rounded-xl"
            >
              {t("save_anyway") || "Save Anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
