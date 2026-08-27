
import { useState, useEffect, useCallback } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RotateCcw, Save, Trash2, Plus, Loader2, AlertCircle, Beaker, Dumbbell, Calendar, Info, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { parseBackendError } from "@/lib/errorParser"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useLazyGetSubjectsForDivisionQuery } from "@/services/subjects"
import { useLazyGetAllTeachingStaffQuery } from "@/services/StaffService"
import {
  useVerifyPeriodConfigurationForDayMutation,
  useCreateDayWiseTimeTableForDivisonMutation,
  useUpdateDayWiseTimeTableForDivisonMutation,
} from "@/services/timetableService"
import { useLazyGetAllSubjectsQuery, useAssignSubjectToDivisionMutation } from "@/services/subjects"
import type { ClassDayConfigForTimeTable, TimeTableConfigForSchool, SchoolSubject } from "@/types/subjects"
import type { SubjectDivisionMaster } from "@/types/subjects"
import { Badge } from "@/components/ui/badge"

interface TimetableGeneratorProps {
  dayConfig: ClassDayConfigForTimeTable
  divisionId: number
  timetableConfig: TimeTableConfigForSchool
  onSave: () => void
  existingPeriods?: any[]
  isEditing?: boolean
}

// Create a schema for period configuration
const createPeriodSchema = (periodsCount: number) => {
  return z.object({
    periods: z
      .array(
        z.object({
          id: z.number().optional(),
          period_order: z.number(),
          start_time: z.string(),
          end_time: z.string(),
          is_break: z.boolean().default(false),
          subjects_division_masters_id: z.number().default(0).nullable(),
          staff_enrollment_id: z.number().default(0).nullable(),
          lab_id: z.number().nullable(),
          is_pt: z.boolean().default(false),
          is_free_period: z.boolean().default(false),
          duration: z.number(),
        }),
      )
      .length(periodsCount, `Exactly ${periodsCount} periods required`),
  })
}

// Interface for validation errors
interface ValidationError {
  code: string
  message: string
  periodIndex?: number
}

export default function TimetableGenerator({
  dayConfig,
  divisionId,
  timetableConfig,
  onSave,
  existingPeriods = [],
  isEditing = false,
}: TimetableGeneratorProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [getSubjectsForDivision, { data: subjectsData, isLoading: isLoadingSubjects }] =
    useLazyGetSubjectsForDivisionQuery()
  const [getAllSubjects, { data: allSubjectsData, isLoading: isLoadingAllSubjects }] = useLazyGetAllSubjectsQuery()
  const [assignSubjectToDivision] = useAssignSubjectToDivisionMutation()
  const [getAllTeachingStaff, { data: staffData, isLoading: isLoadingStaff }] = useLazyGetAllTeachingStaffQuery()
  const [verifyPeriodConfiguration, { isLoading: isVerifying }] = useVerifyPeriodConfigurationForDayMutation()
  const [createDayWiseTimeTable, { isLoading: isCreating }] = useCreateDayWiseTimeTableForDivisonMutation()
  const [updateDayWiseTimeTable, { isLoading: isUpdating }] = useUpdateDayWiseTimeTableForDivisonMutation()

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [periodsCount, setPeriodsCount] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string>("day_view")
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all")
  const [isAutoGenerating, setIsAutoGenerating] = useState(false)
  const [verificationInProgress, setVerificationInProgress] = useState<boolean>(false)
  const [hasChanges, setHasChanges] = useState<boolean>(false)

  // Initialize form with dynamic schema
  const form = useForm<z.infer<ReturnType<typeof createPeriodSchema>>>({
    resolver: zodResolver(createPeriodSchema(periodsCount || 1)),
    defaultValues: {
      periods: [],
    },
  })

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "periods",
  })

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

      getAllTeachingStaff({
        academic_sessions: currentAcademicSession.id,
      })
    }
  }, [currentAcademicSession, divisionId, getSubjectsForDivision, getAllSubjects, getAllTeachingStaff])

  // Initialize periods from existing data or generate new ones
  useEffect(() => {
    if (existingPeriods.length > 0) {
      // Load existing periods
      const sortedPeriods = [...existingPeriods].sort((a, b) => a.period_order - b.period_order)
      setPeriodsCount(sortedPeriods.length)

      const formattedPeriods = sortedPeriods.map((period) => ({
        id: period.id,
        period_order: period.period_order,
        start_time: period.start_time,
        end_time: period.end_time,
        is_break: period.is_break,
        subjects_division_masters_id: period.subjects_division_masters_id,
        staff_enrollment_id: period.staff_enrollment_id,
        lab_id: period.lab_id,
        is_pt: period.is_pt,
        is_free_period: period.is_free_period,
        duration: calculateDuration(period.start_time, period.end_time),
      }))

      replace(formattedPeriods)
    } else {
      // Generate new periods based on day config
      generatePeriodsFromConfig()
    }
  }, [existingPeriods, dayConfig])

  // Calculate duration between two times
  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    return endMinutes - startMinutes
  }

  // Generate periods from day configuration
  const generatePeriodsFromConfig = () => {
    const [startHour, startMinute] = dayConfig.day_start_time.split(":").map(Number)
    let currentMinutes = startHour * 60 + startMinute
    const periods : any[] = []
    let periodOrder = 1

    // Calculate total periods including breaks
    const totalBreaks = dayConfig.total_breaks || 0
    const regularPeriods = timetableConfig.max_periods_per_day
    const totalPeriods = regularPeriods + totalBreaks

    // Generate periods with breaks
    for (let i = 0; i < totalPeriods; i++) {
      const isBreak: boolean =
        totalBreaks > 0 &&
        (i + 1) % Math.ceil(totalPeriods / (totalBreaks + 1)) === 0 &&
        periods.filter((p) => p.is_break).length < totalBreaks

      const duration : number = isBreak
        ? (Array.isArray(dayConfig.break_durations)
            ? dayConfig.break_durations[periods.filter((p) => p.is_break).length]
            : dayConfig.break_durations) || 15
        : timetableConfig.default_period_duration

      const periodStartHour = Math.floor(currentMinutes / 60)
      const periodStartMinute = currentMinutes % 60
      const periodStartTime = `${periodStartHour.toString().padStart(2, "0")}:${periodStartMinute.toString().padStart(2, "0")}`

      currentMinutes += duration

      const periodEndHour = Math.floor(currentMinutes / 60)
      const periodEndMinute = currentMinutes % 60
      const periodEndTime = `${periodEndHour.toString().padStart(2, "0")}:${periodEndMinute.toString().padStart(2, "0")}`

      periods.push({
        period_order: periodOrder++,
        start_time: periodStartTime,
        end_time: periodEndTime,
        is_break: isBreak,
        subjects_division_masters_id: null,
        staff_enrollment_id: null,
        lab_id: null,
        is_pt: false,
        is_free_period: false,
        duration: duration,
      })
    }

    setPeriodsCount(periods.length)
    replace(periods)
  }

  // Update period duration and recalculate times
  const updatePeriodDuration = (index: number, newDuration: number) => {
    const periods = form.getValues("periods")
    const updatedPeriods = [...periods]

    // Update the specific period duration
    updatedPeriods[index].duration = newDuration

    // Recalculate start and end times for all periods after this one
    let currentMinutes = 0
    if (index === 0) {
      const [startHour, startMinute] = dayConfig.day_start_time.split(":").map(Number)
      currentMinutes = startHour * 60 + startMinute
    } else {
      const [prevEndHour, prevEndMinute] = updatedPeriods[index - 1].end_time.split(":").map(Number)
      currentMinutes = prevEndHour * 60 + prevEndMinute
    }

    for (let i = index; i < updatedPeriods.length; i++) {
      const periodStartHour = Math.floor(currentMinutes / 60)
      const periodStartMinute = currentMinutes % 60
      const periodStartTime = `${periodStartHour.toString().padStart(2, "0")}:${periodStartMinute.toString().padStart(2, "0")}`

      currentMinutes += updatedPeriods[i].duration

      const periodEndHour = Math.floor(currentMinutes / 60)
      const periodEndMinute = currentMinutes % 60
      const periodEndTime = `${periodEndHour.toString().padStart(2, "0")}:${periodEndMinute.toString().padStart(2, "0")}`

      updatedPeriods[i].start_time = periodStartTime
      updatedPeriods[i].end_time = periodEndTime
    }

    replace(updatedPeriods)
    setHasChanges(true)

    // Trigger verification for this specific period after a short delay
    setTimeout(() => {
      verifyConfiguration(index)
    }, 100)
  }

  // Verify a single period configuration
  const verifyConfiguration = useCallback(
    async (periodIndex: number) => {
      const period = form.getValues(`periods.${periodIndex}`)

      if (
        period.is_break ||
        period.is_pt ||
        period.is_free_period ||
        !period.subjects_division_masters_id ||
        !period.staff_enrollment_id
      ) {
        setValidationErrors((prev) => prev.filter((err) => err.periodIndex !== periodIndex))
        return
      }

      try {
        setVerificationInProgress(true)
        const periodPayload = {
          class_day_config_id: dayConfig.id,
          division_id: divisionId,
          period_order: period.period_order,
          start_time: period.start_time,
          end_time: period.end_time,
          is_break: period.is_break,
          subjects_division_masters_id: period.subjects_division_masters_id,
          staff_enrollment_id: period.staff_enrollment_id,
          lab_id: period.lab_id,
          is_pt: period.is_pt,
          is_free_period: period.is_free_period,
        }

        await verifyPeriodConfiguration({ payload: periodPayload }).unwrap()
        setValidationErrors((prev) => prev.filter((err) => err.periodIndex !== periodIndex))
      } catch (error: any) {
        if (error.data) {
          const errorData = error.data
          const newError: ValidationError = {
            code: errorData.code || "UNKNOWN_ERROR",
            message: errorData.message || t("unknown_error"),
            periodIndex: periodIndex,
          }

          setValidationErrors((prev) => {
            const filtered = prev.filter((err) => err.periodIndex !== periodIndex)
            return [...filtered, newError]
          })
        }
      } finally {
        setVerificationInProgress(false)
      }
    },
    [dayConfig.id, divisionId, form, t, verifyPeriodConfiguration],
  )

  // Handle field change and trigger verification
  const handleFieldChange = (index: number, field: string, value: any) => {
    form.setValue(`periods.${index}.${field}` as any, value)
    setHasChanges(true)

    setTimeout(() => {
      verifyConfiguration(index)
    }, 100)
  }

  // Reset to original state
  const handleReset = () => {
    if (existingPeriods.length > 0) {
      const sortedPeriods = [...existingPeriods].sort((a, b) => a.period_order - b.period_order)
      const formattedPeriods = sortedPeriods.map((period) => ({
        id: period.id,
        period_order: period.period_order,
        start_time: period.start_time,
        end_time: period.end_time,
        is_break: period.is_break,
        subjects_division_masters_id: period.subjects_division_masters_id,
        staff_enrollment_id: period.staff_enrollment_id,
        lab_id: period.lab_id,
        is_pt: period.is_pt,
        is_free_period: period.is_free_period,
        duration: calculateDuration(period.start_time, period.end_time),
      }))
      replace(formattedPeriods)
    } else {
      generatePeriodsFromConfig()
    }
    setHasChanges(false)
    setValidationErrors([])
  }

  useEffect(()=>{
    console.log("validationErrors data:", validationErrors)
  } ,[validationErrors])

  // Handle form submission
  const onSubmit = async (data: z.infer<ReturnType<typeof createPeriodSchema>>) => {
    if (validationErrors.length > 0) {
      toast({
        variant: "destructive",
        title: t("validation_errors"),
        description: t("please_fix_validation_errors_before_saving"),
      })
      return
    }
 
    try {
      // Check for subjects that need to be assigned to the division first
      const newSubjectSelections = data.periods.filter(p => 
        !p.is_break && !p.is_pt && !p.is_free_period && 
        p.subjects_division_masters_id === null && 
        (form.getValues() as any).periods[data.periods.indexOf(p)].subjects_division_masters_id_raw?.startsWith("new_")
      );

      // Actually, since the value in the form is a number, we might need a better way to track this.
      // Let's refine handleFieldChange to store the raw value if it's "new_"
      
      // I'll update the data mapping logic here
      const processedPeriods = [];
      
      for (let i = 0; i < data.periods.length; i++) {
        const period = data.periods[i];
        const isSpecialPeriod = period.is_break || period.is_pt || period.is_free_period;
        
        let subjects_division_masters_id = period.subjects_division_masters_id;
        
        // Check if this was a "new_" subject selection
        const rawValue = (form.getValues(`periods.${i}`) as any).subjects_division_masters_id_raw;
        if (!isSpecialPeriod && rawValue?.startsWith("new_")) {
          const subjectId = Number(rawValue.replace("new_", ""));
          
          // Assign subject to division on the fly
          const result = await assignSubjectToDivision({
            academic_session_id: currentAcademicSession!.id,
            division_id: divisionId,
            subjects: [{
              subject_id: subjectId,
              code_for_division: allSubjectsData?.find(s => s.id === subjectId)?.code || ""
            }]
          }).unwrap();
          
          subjects_division_masters_id = result[0].id;
          // Update division subjects list so it doesn't try to re-assign for other periods
          await getSubjectsForDivision({
            academic_session_id: currentAcademicSession!.id,
            division_id: divisionId,
          });
        }

        processedPeriods.push({
          id: period.id,
          period_order: period.period_order,
          start_time: period.start_time,
          end_time: period.end_time,
          is_break: period.is_break,
          subjects_division_masters_id: isSpecialPeriod ? null : subjects_division_masters_id || null,
          staff_enrollment_id: isSpecialPeriod ? null : period.staff_enrollment_id || null,
          lab_id: period.lab_id,
          is_pt: period.is_pt,
          is_free_period: period.is_free_period,
        });
      }

      const periodsPayload = {
        class_day_config_id: dayConfig.id,
        division_id: divisionId,
        periods: processedPeriods,
      }

      console.log("Submitting periods payload:", periodsPayload)
      if (isEditing && existingPeriods.length > 0) {
        await updateDayWiseTimeTable({
          payload: periodsPayload,
        }).unwrap()
      } else {
        await createDayWiseTimeTable({
          payload: periodsPayload,
        }).unwrap()
      }

      toast({
        title: t("success"),
        description: isEditing ? t("timetable_updated_successfully") : t("timetable_created_successfully"),
      })

      setHasChanges(false)
      onSave()
    } catch (error: any) {
      console.error("Error saving timetable:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: parseBackendError(error, t),
      })
    }
  }

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  // Get subject options
  const getSubjectOptions = () => {
    const options: { value: string; label: string; code: string; isNew?: boolean }[] = []

    // Add subjects already assigned to the division
    if (subjectsData) {
      subjectsData.forEach((subject: SubjectDivisionMaster) => {
        options.push({
          value: subject.id.toString(),
          label: subject.subject?.name || `Subject ${subject.id}`,
          code: subject.code_for_division || subject.subject?.code || "",
        })
      })
    }

    // Add subjects from global catalog that are not in this division yet
    if (allSubjectsData) {
      allSubjectsData.forEach((subject: SchoolSubject) => {
        // Filter by selected year
        if (selectedYearFilter !== "all" && subject.year !== selectedYearFilter) {
          return
        }

        const isAlreadyAdded = subjectsData?.some((s: SubjectDivisionMaster) => s.subject_id === subject.id)
        if (!isAlreadyAdded) {
          options.push({
            value: `new_${subject.id}`,
            label: `${subject.name} ${subject.year ? `(${subject.year})` : ""} (Not Assigned)`,
            code: subject.code || "",
            isNew: true,
          })
        }
      })
    }

    return options
  }

  // Get staff options for a specific subject
  const getStaffOptionsForSubject = (subjectId: number | null) => {
    if (!subjectsData || !subjectId) return []
    const subject = subjectsData.find((s: SubjectDivisionMaster) => s.id === subjectId)
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

  // Get lab options
  const getLabOptions = () => {
    if (!timetableConfig.lab_config) return []
    return timetableConfig.lab_config.map((lab) => ({
      value: lab.id.toString(),
      label: lab.name,
    }))
  }

  // Get period background color
  const getPeriodBgColor = (period: any, index: number) => {
    const hasError = validationErrors.some((error) => error.periodIndex === index)

    if (hasError) return "bg-red-50 border-red-200"
    if (period.is_break) return "bg-amber-50 border-amber-200"
    if (period.is_pt) return "bg-purple-50 border-purple-200"
    if (period.lab_id) return "bg-blue-50 border-blue-200"
    if (period.is_free_period) return "bg-gray-50 border-gray-200"
    return "bg-white border-gray-200"
  }

  // Get error message for a specific period
  const getPeriodErrorMessage = (index: number) => {
    const error = validationErrors.find((err) => err.periodIndex === index)
    return error ? error.message : null
  }

  if (isLoadingSubjects || isLoadingStaff) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">{t("loading_data")}</span>
      </div>
    )
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? t("edit_timetable") : t("create_timetable")}
            </h3>
            {hasChanges && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {t("unsaved_changes")}
              </Badge>
            )}
            {verificationInProgress && (
              <div className="flex items-center text-blue-600">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm">{t("verifying")}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 mr-4">
              <Label htmlFor="year-filter" className="text-sm font-medium whitespace-nowrap">
                {t("filter_by_year")}:
              </Label>
              <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
                <SelectTrigger id="year-filter" className="w-[140px] h-9 bg-white">
                  <SelectValue placeholder={t("all_years")} />
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
            </div>
            <Button type="button" variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("reset")}
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isCreating || isUpdating || validationErrors.length > 0}
            >
              {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? t("update_timetable") : t("save_timetable")}
            </Button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>{t("validation_errors")}</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span>
                      {error.message}
                      {error.periodIndex !== undefined && (
                        <Badge variant="outline" className="ml-2">
                          {t("period")} {error.periodIndex + 1}
                        </Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Periods Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("period")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("time")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("duration")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("type")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("subject")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("teacher")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("special")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field, index) => {
                  const periodError = getPeriodErrorMessage(index)

                  return (
                    <tr key={field.id} className={`border-l-4 ${getPeriodBgColor(field, index)}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{field.period_order}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTime(field.start_time)} - {formatTime(field.end_time)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {!field.is_break ? (
                          <Select
                            value={field.duration.toString()}
                            onValueChange={(value) => updatePeriodDuration(index, Number(value))}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dayConfig.allowed_durations.map((duration: any) => (
                                <SelectItem key={duration} value={duration.toString()}>
                                  {duration}m
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-gray-500">{field.duration}m</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            field.is_break
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : field.is_pt
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : field.lab_id
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : field.is_free_period
                                    ? "bg-gray-100 text-gray-800 border-gray-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                          }
                        >
                          {field.is_break
                            ? t("break")
                            : field.is_pt
                              ? t("pt")
                              : field.lab_id
                                ? t("lab")
                                : field.is_free_period
                                  ? t("free")
                                  : t("regular")}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {!field.is_break && (
                          <FormField
                            control={form.control}
                            name={`periods.${index}.subjects_division_masters_id`}
                            render={({ field: subjectField }) => (
                              <FormItem className="m-0">
                                <Select
                                  value={(form.getValues(`periods.${index}`) as any).subjects_division_masters_id_raw || subjectField.value?.toString() || "none"}
                                  onValueChange={(value) => {
                                    if (value.startsWith("new_")) {
                                      form.setValue(`periods.${index}.subjects_division_masters_id_raw` as any, value)
                                      form.setValue(`periods.${index}.subjects_division_masters_id` as any, null)
                                    } else {
                                      form.setValue(`periods.${index}.subjects_division_masters_id_raw` as any, null)
                                      handleFieldChange(
                                        index,
                                        "subjects_division_masters_id",
                                        value === "none" ? null : Number(value),
                                      )
                                    }
                                    setHasChanges(true)
                                    handleFieldChange(index, "staff_enrollment_id", null)
                                  }}
                                  disabled={field.is_break || field.is_pt || field.is_free_period}
                                >
                                  <SelectTrigger className="w-40 h-8">
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {!field.is_break && (
                          <FormField
                            control={form.control}
                            name={`periods.${index}.staff_enrollment_id`}
                            render={({ field: teacherField }) => {
                              const staffOptions = getStaffOptionsForSubject(
                                form.getValues(`periods.${index}.subjects_division_masters_id`),
                              )
                              return (
                                <FormItem className="m-0">
                                  <Select
                                    value={teacherField.value?.toString() || "none"}
                                    onValueChange={(value) => {
                                      handleFieldChange(
                                        index,
                                        "staff_enrollment_id",
                                        value === "none" ? null : Number(value),
                                      )
                                    }}
                                    disabled={
                                      field.is_break ||
                                      field.is_pt ||
                                      field.is_free_period ||
                                      !form.getValues(`periods.${index}.subjects_division_masters_id`) ||
                                      staffOptions.length === 0
                                    }
                                  >
                                    <SelectTrigger className="w-40 h-8">
                                      <SelectValue placeholder={t("select_teacher")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">{t("no_teacher")}</SelectItem>
                                      {staffOptions.length === 0 ? (
                                        <div className="px-2 py-1 text-xs text-destructive">
                                          {t("no_teacher_assigned_for_this_subject")}
                                        </div>
                                      ) : (
                                        staffOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label} {option.code ? `(${option.code})` : ""}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )
                            }}
                          />
                        )}
                        {periodError && (
                          <div className="text-xs text-red-500 mt-1 flex items-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            {periodError}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {!field.is_break && (
                          <div className="flex flex-wrap gap-1">
                            <FormField
                              control={form.control}
                              name={`periods.${index}.is_pt`}
                              render={({ field: ptField }) => (
                                <FormItem className="flex items-center space-x-1 m-0">
                                  <FormControl>
                                    <Button
                                      type="button"
                                      variant={ptField.value ? "default" : "outline"}
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => {
                                        const newValue = !ptField.value
                                        handleFieldChange(index, "is_pt", newValue)
                                        if (newValue) {
                                          handleFieldChange(index, "is_free_period", false)
                                          handleFieldChange(index, "lab_id", null)
                                          handleFieldChange(index, "subjects_division_masters_id", null)
                                          handleFieldChange(index, "staff_enrollment_id", null)
                                        }
                                      }}
                                    >
                                      <Dumbbell className="h-3 w-3 mr-1" />
                                      {t("pt")}
                                    </Button>
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            {timetableConfig.lab_enabled && (
                              <FormField
                                control={form.control}
                                name={`periods.${index}.lab_id`}
                                render={({ field: labField }) => (
                                  <FormItem className="flex items-center space-x-1 m-0">
                                    <Select
                                      value={labField.value?.toString() || "none"}
                                      onValueChange={(value) => {
                                        handleFieldChange(index, "lab_id", value !== "none" ? Number(value) : null)
                                        if (value !== "none") {
                                          handleFieldChange(index, "is_pt", false)
                                          handleFieldChange(index, "is_free_period", false)
                                        }
                                      }}
                                    >
                                      <SelectTrigger className={`h-6 px-2 text-xs ${labField.value ? 'w-auto min-w-[60px]' : 'w-10'}`}>
                                        <div className="flex items-center gap-1">
                                          <Beaker className="h-3 w-3" />
                                          {labField.value && (
                                            <span className="truncate max-w-[80px]">
                                              {getLabOptions().find(o => o.value === labField.value?.toString())?.label}
                                            </span>
                                          )}
                                        </div>
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">{t("no_lab")}</SelectItem>
                                        {getLabOptions().map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            )}

                            <FormField
                              control={form.control}
                              name={`periods.${index}.is_free_period`}
                              render={({ field: freeField }) => (
                                <FormItem className="flex items-center space-x-1 m-0">
                                  <FormControl>
                                    <Button
                                      type="button"
                                      variant={freeField.value ? "default" : "outline"}
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => {
                                        const newValue = !freeField.value
                                        handleFieldChange(index, "is_free_period", newValue)
                                        if (newValue) {
                                          handleFieldChange(index, "is_pt", false)
                                          handleFieldChange(index, "lab_id", null)
                                          handleFieldChange(index, "subjects_division_masters_id", null)
                                          handleFieldChange(index, "staff_enrollment_id", null)
                                        }
                                      }}
                                    >
                                      {t("free")}
                                    </Button>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Form>
  )
}
