import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Calendar, Clock, Copy, Edit, Info, Loader2, Plus, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import type { TimeTableConfigForSchool, ClassDayConfigForTimeTable } from "@/types/subjects"
import {
  useCreateDayWiseTimeTableConfigForClassMutation,
  useUpdateDayWiseTimeTableConfigForClassMutation,
  useDeleteDayWiseTimeTableConfigForClassMutation,
  useDeleteDayWiseTimeTableForAllDivisionsMutation,
} from "@/services/timetableService"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ClassDaySettingsProps = {
  existingConfig: TimeTableConfigForSchool | null
  academicSession: any
  onConfigSaved: () => void
}

// Define the schema for class day configuration
const createClassDayConfigSchema = (totalBreaks: number | null) => {
  return z.object({
    class_id: z.number({
      required_error: "Class is required",
    }),
    day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat"], {
      required_error: "Day is required",
    }),
    allowed_durations: z.array(z.string()).min(1, "At least one duration is required"),
    max_consecutive_periods: z.number().nullable(),
    total_breaks: z.number().nullable(),
    break_durations: z.array(z.number()).length(totalBreaks || 0, `Exactly ${totalBreaks} break duration(s) required`),
    day_start_time: z.string().min(1, "Start time is required"),
    day_end_time: z.string().min(1, "End time is required"),
  })
}

// Schema for copy day configuration
const copyDayConfigSchema = z.object({
  sourceDay: z.enum(["mon", "tue", "wed", "thu", "fri", "sat"], {
    required_error: "Source day is required",
  }),
  targetDays: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat"])).min(1, "Select at least one target day"),
})

// Schema for clone class configuration
const cloneClassConfigSchema = z.object({
  sourceClassId: z.string({
    required_error: "Source class is required",
  }),
})

export default function ClassDaySettingsForTimeTable({
  existingConfig,
  academicSession,
  onConfigSaved,
}: ClassDaySettingsProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const academicClasses = useAppSelector(selectAcademicClasses)
  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()

  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDay, setSelectedDay] = useState<string>("mon")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(null)
  const [totalBreaks, setTotalBreaks] = useState<number | null>(null)

  // New state for dialogs
  const [isCopyDayDialogOpen, setIsCopyDayDialogOpen] = useState(false)
  const [isCloneClassDialogOpen, setIsCloneClassDialogOpen] = useState(false)
  const [isDeleteClassConfigDialogOpen, setIsDeleteClassConfigDialogOpen] = useState(false)
  const [isOverwritePeriodsDialogOpen, setIsOverwritePeriodsDialogOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 })

  // Create form with dynamic schema based on totalBreaks
  const form = useForm<z.infer<ReturnType<typeof createClassDayConfigSchema>>>({
    resolver: zodResolver(createClassDayConfigSchema(totalBreaks)),
    defaultValues: {
      class_id: 0,
      day: "mon",
      allowed_durations: [],
      max_consecutive_periods: null,
      total_breaks: null,
      break_durations: [],
      day_start_time: "08:00",
      day_end_time: "15:00",
    },
  })

  // Form for copying day configuration
  const copyDayForm = useForm<z.infer<typeof copyDayConfigSchema>>({
    resolver: zodResolver(copyDayConfigSchema),
    defaultValues: {
      sourceDay: selectedDay as any,
      targetDays: [],
    },
  })

  // Form for cloning class configuration
  const cloneClassForm = useForm<z.infer<typeof cloneClassConfigSchema>>({
    resolver: zodResolver(cloneClassConfigSchema),
    defaultValues: {
      sourceClassId: "",
    },
  })

  // RTK Query hooks
  const [createDayWiseTimeTableConfigForClass] = useCreateDayWiseTimeTableConfigForClassMutation()
  const [updateDayWiseTimeTableConfigForClass] = useUpdateDayWiseTimeTableConfigForClassMutation()
  const [deleteDayWiseTimeTableConfigForClass] = useDeleteDayWiseTimeTableConfigForClassMutation()
  const [deleteAllPeriodsForClassDay] = useDeleteDayWiseTimeTableForAllDivisionsMutation()

  // Load academic classes if not already loaded
  useEffect(() => {
    if (!academicClasses && academicSession) {
      getAcademicClasses(academicSession.school_id)
    }
  }, [academicClasses, academicSession, getAcademicClasses])

  // Update copy day form when selected day changes
  useEffect(() => {
    copyDayForm.setValue("sourceDay", selectedDay as any)
  }, [selectedDay, copyDayForm])

  // Get existing configurations for the selected class and day
  const getExistingConfig = () => {
    if (!existingConfig || !existingConfig.class_day_config || !selectedClass) return null

    return existingConfig.class_day_config.find(
      (config: ClassDayConfigForTimeTable) =>
        config.class_id === Number.parseInt(selectedClass) && config.day === selectedDay,
    )
  }

  // Get existing configuration for a specific class and day
  const getConfigForClassAndDay = (classId: number, day: string) => {
    if (!existingConfig || !existingConfig.class_day_config) return null

    return existingConfig.class_day_config.find(
      (config: ClassDayConfigForTimeTable) => config.class_id === classId && config.day === day,
    )
  }

  // Get classes with configurations
  const getClassesWithConfigurations = () => {
    if (!existingConfig || !existingConfig.class_day_config || !academicClasses) return []

    // Get unique class IDs that have configurations
    const classIdsWithConfig = [...new Set(existingConfig.class_day_config.map((config) => config.class_id))]

    // Return classes that have configurations
    return academicClasses.filter((cls) => classIdsWithConfig.includes(cls.id))
  }

  // Update form schema when totalBreaks changes
  useEffect(() => {
    form.clearErrors("break_durations")

    // Ensure break_durations array has correct length
    const currentBreakDurations = form.getValues("break_durations") || []
    if (totalBreaks === null) {
      form.setValue("break_durations", [])
    } else if (currentBreakDurations.length < totalBreaks) {
      form.setValue("break_durations", [
        ...currentBreakDurations,
        ...Array(totalBreaks - currentBreakDurations.length).fill(0),
      ])
    } else if (currentBreakDurations.length > totalBreaks) {
      form.setValue("break_durations", currentBreakDurations.slice(0, totalBreaks))
    }
  }, [totalBreaks, form])

  // Load existing configuration when class or day changes
  useEffect(() => {
    const config = getExistingConfig()
    if (config) {
      // Convert break_durations to array if it's not already
      let breakDurations = Array.isArray(config.break_durations)
        ? config.break_durations
        : config.break_durations
          ? [config.break_durations]
          : []

      // Ensure we have the right number of break durations based on total_breaks
      if (config.total_breaks && breakDurations.length < config.total_breaks) {
        // Add missing break durations with default value of 0
        breakDurations = [...breakDurations, ...Array(config.total_breaks - breakDurations.length).fill(0)]
      }

      // Set total breaks first so the schema updates
      setTotalBreaks(config.total_breaks)

      // Convert allowed_durations to strings if they are numbers
      const allowedDurations = Array.isArray(config.allowed_durations)
        ? config.allowed_durations.map((duration) => duration.toString())
        : []

      // Then reset the form with all values
      form.reset({
        class_id: config.class_id,
        day: config.day,
        allowed_durations: allowedDurations,
        max_consecutive_periods: config.max_consecutive_periods,
        total_breaks: config.total_breaks,
        break_durations: breakDurations,
        day_start_time: config.day_start_time,
        day_end_time: config.day_end_time,
      })

      setCurrentConfigId(config.id)
    } else {
      setTotalBreaks(null)
      form.reset({
        class_id: Number.parseInt(selectedClass) || 0,
        day: selectedDay as any,
        allowed_durations: [],
        max_consecutive_periods: null,
        total_breaks: null,
        break_durations: [],
        day_start_time: "08:00",
        day_end_time: "15:00",
      })
      setCurrentConfigId(null)
    }
  }, [selectedClass, selectedDay, existingConfig, form])

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  // Get day name from day code
  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      mon: t("monday"),
      tue: t("tuesday"),
      wed: t("wednesday"),
      thu: t("thursday"),
      fri: t("friday"),
      sat: t("saturday"),
    }
    return days[day] || day
  }

  // Get class name from class ID
  const getClassName = (classId: number) => {
    if (!academicClasses) return t("unknown_class")
    const cls = academicClasses.find((c) => c.id === classId)
    return cls ? `${cls.class}` : t("unknown_class")
  }

  // Handle form submission
  const onSubmit = async (data: z.infer<ReturnType<typeof createClassDayConfigSchema>>) => {
    try {
      if (!existingConfig) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: t("general_settings_must_be_saved_first"),
        })
        return
      }

      // Check if critical fields changed and periods exist
      const config = getExistingConfig()
      const hasPeriods = config && config.period_config && config.period_config.length > 0
      
      if (currentConfigId && hasPeriods) {
        const allowedDurationsNumbers = data.allowed_durations.map(d => Number.parseInt(d))
        const isCriticalChange = 
          JSON.stringify(config.allowed_durations) !== JSON.stringify(allowedDurationsNumbers) ||
          config.max_consecutive_periods !== data.max_consecutive_periods ||
          config.day_start_time !== data.day_start_time ||
          config.day_end_time !== data.day_end_time
          
        if (isCriticalChange) {
          setPendingFormData(data)
          setIsOverwritePeriodsDialogOpen(true)
          return
        }
      }

      await performSave(data)
    } catch (error: any) {
      console.error("Error saving class schedule:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description:
          error.data?.message ||
          (currentConfigId ? t("failed_to_update_class_schedule") : t("failed_to_create_class_schedule")),
      })
    }
  }

  const performSave = async (data: any) => {
    setIsLoading(true)
    try {
      // Add school_timetable_config_id to the payload and convert strings to numbers
      const finalPayload = {
        ...data,
        school_timetable_config_id: existingConfig!.id,
        allowed_durations: data.allowed_durations.map((d: any) => Number.parseInt(d)),
      }

      if (currentConfigId) {
        // Update existing configuration
        await updateDayWiseTimeTableConfigForClass({
          class_id: Number.parseInt(selectedClass),
          class_day_config_id: currentConfigId,
          payload: {
            allowed_durations: finalPayload.allowed_durations,
            max_consecutive_periods: data.max_consecutive_periods,
            total_breaks: data.total_breaks,
            break_durations: data.break_durations,
            day_start_time: data.day_start_time,
            day_end_time: data.day_end_time,
          },
        }).unwrap()
      } else {
        // Create new configuration
        await createDayWiseTimeTableConfigForClass({ payload: finalPayload }).unwrap()
      }

      toast({
        title: t("success"),
        description: currentConfigId
          ? t("class_schedule_updated_successfully")
          : t("class_schedule_created_successfully"),
      })

      // Exit edit mode and refresh data
      setIsEditing(false)
      onConfigSaved()
    } finally {
      setIsLoading(false)
    }
  }

  const handleOverwriteAndSave = async () => {
    if (!pendingFormData || !currentConfigId) return
    
    setIsLoading(true)
    try {
      // 1. Delete all periods for this day config
      await deleteAllPeriodsForClassDay({ class_day_config_id: currentConfigId }).unwrap()
      
      // 2. Perform the save
      await performSave(pendingFormData)
      
      setIsOverwritePeriodsDialogOpen(false)
      setPendingFormData(null)
    } catch (error: any) {
      console.error("Error overwriting and saving:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_update_configuration"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle copy day configuration
  const handleCopyDayConfig = async (data: z.infer<typeof copyDayConfigSchema>) => {
    try {
      if (!existingConfig || !selectedClass) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: t("no_class_or_configuration_selected"),
        })
        return
      }

      setIsProcessing(true)
      setProcessingProgress({ current: 0, total: data.targetDays.length })

      // Get source day configuration
      const sourceConfig = getConfigForClassAndDay(Number.parseInt(selectedClass), data.sourceDay)
      if (!sourceConfig) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: t("current_class_has_no_configuration_to_copy"),
        })
        setIsProcessing(false)
        return
      }

      // Copy configuration to target days
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < data.targetDays.length; i++) {
        const targetDay = data.targetDays[i]
        setProcessingProgress({ current: i + 1, total: data.targetDays.length })

        try {
          // Check if target day already has configuration
          const targetConfig = getConfigForClassAndDay(Number.parseInt(selectedClass), targetDay)

          const payload = {
            school_timetable_config_id: existingConfig.id,
            class_id: Number.parseInt(selectedClass),
            day: targetDay,
            allowed_durations: sourceConfig.allowed_durations,
            max_consecutive_periods: sourceConfig.max_consecutive_periods,
            total_breaks: sourceConfig.total_breaks,
            break_durations: sourceConfig.break_durations,
            day_start_time: sourceConfig.day_start_time,
            day_end_time: sourceConfig.day_end_time,
            is_working_day: sourceConfig.is_working_day,
          }

          if (targetConfig) {
            // Update existing configuration
            await updateDayWiseTimeTableConfigForClass({
              class_id: Number.parseInt(selectedClass),
              class_day_config_id: targetConfig.id,
              payload: {
                allowed_durations: sourceConfig.allowed_durations,
                max_consecutive_periods: sourceConfig.max_consecutive_periods,
                total_breaks: sourceConfig.total_breaks,
                break_durations: sourceConfig.break_durations,
                day_start_time: sourceConfig.day_start_time,
                day_end_time: sourceConfig.day_end_time,
              },
            }).unwrap()
          } else {
            // Create new configuration
            await createDayWiseTimeTableConfigForClass({ payload }).unwrap()
          }

          successCount++
        } catch (error) {
          console.error(`Error copying to ${targetDay}:`, error)
          failCount++
          // Continue with other days even if one fails
        }
      }

      // Close dialog and show results
      setIsCopyDayDialogOpen(false)

      if (failCount === 0) {
        toast({
          title: t("success"),
          description: t("day_configuration_copied_successfully"),
        })
      } else {
        toast({
          variant: "destructive",
          title: "Partial Success",
          description: `Copied to ${successCount} days, failed for ${failCount} out of ${data.targetDays.length} days.`,
        })
      }

      // Refresh data
      onConfigSaved()
    } catch (error: any) {
      console.error("Error copying day configuration:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_copy_day_configuration"),
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle clone class configuration
  const handleCloneClassConfig = async (data: z.infer<typeof cloneClassConfigSchema>) => {
    try {
      if (!existingConfig || !selectedClass) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: t("no_class_or_configuration_selected"),
        })
        return
      }

      setIsProcessing(true)
      const sourceClassId = Number.parseInt(data.sourceClassId)
      const targetClassId = Number.parseInt(selectedClass)

      // Get all configurations for the source class
      const sourceConfigs = existingConfig.class_day_config.filter((config) => config.class_id === sourceClassId)

      if (sourceConfigs.length === 0) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: t("source_class_has_no_configuration"),
        })
        setIsProcessing(false)
        return
      }

      // Calculate total operations
      const totalOperations = sourceConfigs.length
      setProcessingProgress({ current: 0, total: totalOperations })

      let successCount = 0
      let failCount = 0

      // Copy configurations to target class
      for (let i = 0; i < sourceConfigs.length; i++) {
        const sourceConfig = sourceConfigs[i]
        setProcessingProgress({ current: i + 1, total: totalOperations })

        try {
          // Check if target class already has configuration for this day
          const targetConfig = getConfigForClassAndDay(targetClassId, sourceConfig.day)

          const payload = {
            school_timetable_config_id: existingConfig.id,
            class_id: targetClassId,
            day: sourceConfig.day,
            allowed_durations: sourceConfig.allowed_durations,
            max_consecutive_periods: sourceConfig.max_consecutive_periods,
            total_breaks: sourceConfig.total_breaks,
            break_durations: sourceConfig.break_durations,
            day_start_time: sourceConfig.day_start_time,
            day_end_time: sourceConfig.day_end_time,
            is_working_day: sourceConfig.is_working_day,
          }

          if (targetConfig) {
            // Update existing configuration
            await updateDayWiseTimeTableConfigForClass({
              class_id: targetClassId,
              class_day_config_id: targetConfig.id,
              payload: {
                allowed_durations: sourceConfig.allowed_durations,
                max_consecutive_periods: sourceConfig.max_consecutive_periods,
                total_breaks: sourceConfig.total_breaks,
                break_durations: sourceConfig.break_durations,
                day_start_time: sourceConfig.day_start_time,
                day_end_time: sourceConfig.day_end_time,
              },
            }).unwrap()
          } else {
            // Create new configuration
            await createDayWiseTimeTableConfigForClass({ payload }).unwrap()
          }

          successCount++
        } catch (error) {
          console.error(`Error cloning day ${sourceConfig.day}:`, error)
          failCount++
          // Continue with other configurations even if one fails
        }
      }

      // Close dialog and show results
      setIsCloneClassDialogOpen(false)

      if (failCount === 0) {
        toast({
          title: t("success"),
          description: t("class_configuration_cloned_successfully"),
        })
      } else {
        toast({
          variant: "destructive",
          title: "Partial Success",
          description: `Cloned ${successCount} out of ${totalOperations} days. ${failCount} failed.`,
        })
      }

      // Refresh data
      onConfigSaved()
    } catch (error: any) {
      console.error("Error cloning class configuration:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_clone_class_configuration"),
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle delete class configuration
  const handleDeleteClassConfig = async () => {
    try {
      if (!existingConfig || !selectedClass) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: t("no_class_or_configuration_selected"),
        })
        return
      }

      setIsProcessing(true)

      // Get all configurations for the selected class
      const classConfigs = existingConfig.class_day_config.filter(
        (config) => config.class_id === Number.parseInt(selectedClass),
      )

      if (classConfigs.length === 0) {
        toast({
          variant: "destructive",
          title: t("info"),
          description: t("no_configurations_to_delete"),
        })
        setIsProcessing(false)
        setIsDeleteClassConfigDialogOpen(false)
        return
      }

      setProcessingProgress({ current: 0, total: classConfigs.length })

      let successCount = 0
      let failCount = 0

      // Delete all configurations for the class
      for (let i = 0; i < classConfigs.length; i++) {
        const config = classConfigs[i]
        setProcessingProgress({ current: i + 1, total: classConfigs.length })

        try {
          await deleteDayWiseTimeTableConfigForClass({ id: config.id }).unwrap()
          successCount++
        } catch (error) {
          console.error(`Error deleting config ${config.id}:`, error)
          failCount++
          // Continue with other configurations even if one fails
        }
      }

      // Close dialog and show results
      setIsDeleteClassConfigDialogOpen(false)

      if (failCount === 0) {
        toast({
          title: t("success"),
          description: t("class_configuration_deleted_successfully"),
        })
      } else {
        toast({
          variant: "destructive",
          title: "Partial Success",
          description: `Deleted ${successCount} out of ${classConfigs.length} configurations. ${failCount} failed.`,
        })
      }

      // Refresh data
      onConfigSaved()
    } catch (error: any) {
      console.error("Error deleting class configuration:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_delete_class_configuration"),
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Open copy day dialog
  const openCopyDayDialog = () => {
    if (!selectedClass) {
      toast({
        variant: "destructive",
        title: t("warning"),
        description: t("please_select_a_class_first"),
      })
      return
    }

    const sourceConfig = getExistingConfig()
    if (!sourceConfig) {
      toast({
        variant: "destructive",
        title: t("warning"),
        description: t("current_class_has_no_configuration_to_copy"),
      })
      return
    }

    copyDayForm.reset({
      sourceDay: selectedDay as any,
      targetDays: [],
    })
    setIsCopyDayDialogOpen(true)
  }

  // Open clone class dialog
  const openCloneClassDialog = () => {
    if (!selectedClass) {
      toast({
        variant: "destructive",
        title: t("warning"),
        description: t("please_select_a_class_first"),
      })
      return
    }

    // Get classes with configurations
    const classesWithConfig = getClassesWithConfigurations()

    if (classesWithConfig.length === 0) {
      toast({
        variant: "destructive",
        title: t("warning"),
        description: t("no_classes_with_configuration_available"),
      })
      return
    }

    cloneClassForm.reset({
      sourceClassId: "",
    })
    setIsCloneClassDialogOpen(true)
  }

  // If no classes are available, show a message
  if (!academicClasses || academicClasses.length === 0) {
    return (
      <Alert>
        <Info className="h-5 w-5" />
        <AlertTitle>{t("no_classes_available")}</AlertTitle>
        <AlertDescription>{t("please_create_academic_classes_first")}</AlertDescription>
      </Alert>
    )
  }

  // Get all configurations for the selected class
  const classConfigurations =
    existingConfig?.class_day_config?.filter(
      (config: ClassDayConfigForTimeTable) => config.class_id === Number.parseInt(selectedClass),
    ) || []

  // Days of the week
  const days = [
    { value: "mon", label: t("monday") },
    { value: "tue", label: t("tuesday") },
    { value: "wed", label: t("wednesday") },
    { value: "thu", label: t("thursday") },
    { value: "fri", label: t("friday") },
    { value: "sat", label: t("saturday") },
  ]

  // Get current configuration
  const currentConfig = getExistingConfig()

  // Get allowed period durations from general settings
  const allowedPeriodDurations = existingConfig?.allowed_period_durations?.map((duration) => duration.toString()) || []

  // Get classes with configurations (excluding the current class)
  const classesWithConfig = getClassesWithConfigurations().filter((cls) => cls.id.toString() !== selectedClass)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <Label htmlFor="class-select">{t("select_class")}</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger id="class-select">
              <SelectValue placeholder={t("select_a_class")} />
            </SelectTrigger>
            <SelectContent>
              {academicClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.class}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClass && (
          <div className="flex items-end gap-2 ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={openCopyDayDialog} disabled={isProcessing || isLoading}>
                    <Copy className="h-4 w-4 mr-2" />
                    {t("copy_day")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("copy_current_day_configuration_to_other_days")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openCloneClassDialog}
                    disabled={isProcessing || isLoading}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t("clone_class")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("clone_another_class_configuration_to_this_class")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteClassConfigDialogOpen(true)}
                    disabled={isProcessing || isLoading || classConfigurations.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("reset_class")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("delete_all_configurations_for_this_class")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {!selectedClass ? (
        <div className="text-center py-8 border rounded-md">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Info className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">{t("no_class_selected")}</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            {t("please_select_a_class_to_configure_its_schedule")}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              {t("schedule_for")} {getClassName(Number.parseInt(selectedClass))}
            </h3>

            <div className="flex items-center gap-2">
              {classConfigurations.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {classConfigurations.length} {t("days_configured")}
                </Badge>
              )}
            </div>
          </div>

          <Tabs value={selectedDay} onValueChange={setSelectedDay}>
            <TabsList className="mb-6">
              {days.map((day) => {
                const hasConfig = classConfigurations.some((config) => config.day === day.value)
                return (
                  <TabsTrigger key={day.value} value={day.value} className="relative">
                    {day.label}
                    {hasConfig && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {days.map((day) => (
              <TabsContent key={day.value} value={day.value}>
                <Card>
                  <CardContent className="pt-6">
                    {!isEditing && currentConfig ? (
                      <div className="border rounded-md p-6 relative">
                        <div className="absolute top-4 right-4 flex space-x-2">
                          <Button variant="outline" size="sm" onClick={toggleEditMode}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t("edit")}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">{t("school_hours")}</h4>
                            <div className="flex items-center space-x-2 mb-4">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {currentConfig.day_start_time || ""} - {currentConfig.day_end_time}
                              </span>
                            </div>

                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              {t("allowed_period_durations")}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {currentConfig.allowed_durations.map((duration: any) => (
                                <Badge key={duration} variant="secondary">
                                  {duration} {t("minutes")}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              {t("period_constraints")}
                            </h4>
                            <ul className="space-y-2 text-sm">
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">{t("max_consecutive_periods")}:</span>
                                <span className="font-medium">
                                  {currentConfig.max_consecutive_periods === null
                                    ? t("no_limit")
                                    : currentConfig.max_consecutive_periods}
                                </span>
                              </li>
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">{t("total_breaks")}:</span>
                                <span className="font-medium">
                                  {currentConfig.total_breaks === null ? t("none") : currentConfig.total_breaks}
                                </span>
                              </li>
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">{t("break_durations")}:</span>
                                <span className="font-medium">
                                  {Array.isArray(currentConfig.break_durations)
                                    ? currentConfig.break_durations.join(", ") + " " + t("minutes")
                                    : currentConfig.break_durations === null
                                      ? t("not_specified")
                                      : `${currentConfig.break_durations} ${t("minutes")}`}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : isEditing || !currentConfig ? (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="day_start_time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="required">{t("day_start_time")}</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormDescription>{t("when_the_school_day_starts")}</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="day_end_time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="required">{t("day_end_time")}</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormDescription>{t("when_the_school_day_ends")}</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="allowed_durations"
                            render={() => (
                              <FormItem>
                                <div className="mb-4">
                                  <FormLabel className="required">{t("allowed_period_durations")}</FormLabel>
                                  <FormDescription>{t("select_allowed_period_durations_for_this_day")}</FormDescription>
                                </div>

                                {allowedPeriodDurations.length > 0 ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {allowedPeriodDurations.map((duration) => (
                                      <FormField
                                        key={duration}
                                        control={form.control}
                                        name="allowed_durations"
                                        render={({ field }) => {
                                          return (
                                            <FormItem
                                              key={duration}
                                              className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value?.includes(duration)}
                                                  onCheckedChange={(checked) => {
                                                    return checked
                                                      ? field.onChange([...field.value, duration])
                                                      : field.onChange(
                                                          field.value?.filter((value) => value !== duration),
                                                        )
                                                  }}
                                                />
                                              </FormControl>
                                              <FormLabel className="text-sm font-normal cursor-pointer">
                                                {duration} {t("minutes")}
                                              </FormLabel>
                                            </FormItem>
                                          )
                                        }}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>{t("no_durations_available")}</AlertTitle>
                                    <AlertDescription>
                                      {t("please_define_allowed_period_durations_in_general_settings_first")}
                                    </AlertDescription>
                                  </Alert>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="max_consecutive_periods"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("max_consecutive_periods")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder={t("no_limit")}
                                      {...field}
                                      value={field.value === null || field.value === undefined ? "" : field.value}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        field.onChange(value === "" ? null : Number(value))
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>{t("maximum_consecutive_periods_without_a_break")}</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="total_breaks"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("total_breaks")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder={t("no_breaks")}
                                      {...field}
                                      value={field.value === null || field.value === undefined ? "" : field.value}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        const numValue = value === "" ? null : Number(value)
                                        field.onChange(numValue)
                                        setTotalBreaks(numValue)
                                      }}
                                      min="0"
                                      max="10"
                                    />
                                  </FormControl>
                                  <FormDescription>{t("number_of_breaks_in_the_day")}</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {totalBreaks && totalBreaks > 0 ? (
                            <div className="space-y-4">
                              <FormLabel>{t("break_durations")}</FormLabel>
                              <FormDescription>{t("duration_of_each_break_in_minutes")}</FormDescription>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {Array.from({ length: totalBreaks }).map((_, index) => (
                                  <FormField
                                    key={index}
                                    control={form.control}
                                    name={`break_durations.${index}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>
                                          {t("break")} {index + 1}
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            placeholder={t("duration_in_minutes")}
                                            {...field}
                                            value={field.value || ""}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            min="0"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="flex justify-end space-x-2 pt-4">
                            {isEditing && (
                              <Button type="button" variant="outline" onClick={toggleEditMode}>
                                {t("cancel")}
                              </Button>
                            )}
                            <Button type="submit" disabled={isLoading}>
                              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {currentConfigId ? t("update_schedule") : t("save_schedule")}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">
                          {t("no_schedule_for")} {getDayName(day.value)}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-4">
                          {t("no_schedule_has_been_configured_for_this_day")}
                        </p>
                        <Button onClick={toggleEditMode}>
                          <Plus className="h-4 w-4 mr-2" />
                          {t("configure_schedule")}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* Copy Day Configuration Dialog */}
      <Dialog open={isCopyDayDialogOpen} onOpenChange={(open) => !isProcessing && setIsCopyDayDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("copy_day_configuration")}</DialogTitle>
            <DialogDescription>{t("copy_configuration_from_one_day_to_others")}</DialogDescription>
          </DialogHeader>

          {isProcessing ? (
            <div className="py-6 space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">{t("copying_configuration")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("processing_day")} {processingProgress.current} {t("of")} {processingProgress.total}
                </p>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <Form {...copyDayForm}>
              <form onSubmit={copyDayForm.handleSubmit(handleCopyDayConfig)} className="space-y-4">
                <FormField
                  control={copyDayForm.control}
                  name="sourceDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("source_day")}</FormLabel>
                      <Select disabled={true} value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_source_day")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>{t("configuration_will_be_copied_from_this_day")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={copyDayForm.control}
                  name="targetDays"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="required">{t("target_days")}</FormLabel>
                        <FormDescription>{t("select_days_to_copy_configuration_to")}</FormDescription>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {days
                          .filter((day) => day.value !== copyDayForm.getValues("sourceDay"))
                          .map((day) => (
                            <FormField
                              key={day.value}
                              control={copyDayForm.control}
                              name="targetDays"
                              render={({ field }) => {
                                return (
                                  <FormItem key={day.value} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(day.value as any)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, day.value as any])
                                            : field.onChange(field.value?.filter((value) => value !== day.value))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">{day.label}</FormLabel>
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

                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("warning")}</AlertTitle>
                  <AlertDescription>
                    {t("this_will_overwrite_existing_configurations_for_selected_days")}
                  </AlertDescription>
                </Alert>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCopyDayDialogOpen(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit">{t("copy_configuration")}</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Clone Class Configuration Dialog */}
      <Dialog open={isCloneClassDialogOpen} onOpenChange={(open) => !isProcessing && setIsCloneClassDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("clone_class_configuration")}</DialogTitle>
            <DialogDescription>{t("clone_configuration_from_another_class_to_this_class")}</DialogDescription>
          </DialogHeader>

          {isProcessing ? (
            <div className="py-6 space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">{t("cloning_configuration")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("processing_day")} {processingProgress.current} {t("of")} {processingProgress.total}
                </p>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <Form {...cloneClassForm}>
              <form onSubmit={cloneClassForm.handleSubmit(handleCloneClassConfig)} className="space-y-4">
                <FormField
                  control={cloneClassForm.control}
                  name="sourceClassId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">{t("select_source_class")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_class_to_clone_from")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classesWithConfig.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("configuration_will_be_cloned_from_this_class_to")}{" "}
                        {getClassName(Number.parseInt(selectedClass))}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("warning")}</AlertTitle>
                  <AlertDescription>
                    {t("this_will_overwrite_existing_configurations_for")}{" "}
                    {getClassName(Number.parseInt(selectedClass))}
                  </AlertDescription>
                </Alert>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCloneClassDialogOpen(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit">{t("clone_configuration")}</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Class Configuration Dialog */}
      <Dialog
        open={isDeleteClassConfigDialogOpen}
        onOpenChange={(open) => !isProcessing && setIsDeleteClassConfigDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("delete_class_configuration")}</DialogTitle>
            <DialogDescription>{t("delete_all_schedule_configurations_for_this_class")}</DialogDescription>
          </DialogHeader>

          {isProcessing ? (
            <div className="py-6 space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">{t("deleting_configuration")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("processing_item")} {processingProgress.current} {t("of")} {processingProgress.total}
                </p>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("warning")}</AlertTitle>
                  <AlertDescription>
                    {t("this_will_permanently_delete_all_schedule_configurations_for")}
                    <strong className="ml-1">{getClassName(Number.parseInt(selectedClass))}</strong>.
                    {t("this_action_cannot_be_undone")}
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDeleteClassConfigDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteClassConfig}>
                  {t("delete_configuration")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Overwrite Periods Confirmation Dialog */}
      <Dialog 
        open={isOverwritePeriodsDialogOpen} 
        onOpenChange={(open) => !isLoading && setIsOverwritePeriodsDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("existing_timetable_detected")}</DialogTitle>
            <DialogDescription>
              {t("updating_critical_fields_requires_clearing_existing_periods")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("warning")}</AlertTitle>
              <AlertDescription>
                {t("this_will_delete_the_entire_timetable_for")} 
                <strong className="mx-1">{getDayName(selectedDay)}</strong> 
                {t("across_all_divisions_of")} 
                <strong className="ml-1">{getClassName(Number.parseInt(selectedClass))}</strong>.
                {t("this_action_cannot_be_undone")}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOverwritePeriodsDialogOpen(false)}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleOverwriteAndSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("clear_and_update")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
