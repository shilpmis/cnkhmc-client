import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, Settings2, Info, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useCreateTimeTableConfigMutation, useUpdateTimeTableConfigMutation } from "@/services/timetableService"
import type { TimeTableConfigForSchool } from "@/types/subjects"

// Define the schema for timetable configuration
const timetableConfigSchema = z.object({
  academic_session_id: z.number(),
  max_periods_per_day: z.number().min(1, "Must have at least 1 period per day").max(12, "Maximum 12 periods per day"),
  default_period_duration: z
    .number()
    .min(30, "Period must be at least 30 minutes")
    .max(120, "Period cannot exceed 2 hours"),
  allowed_period_durations: z.array(z.number()).min(1, "At least one period duration is required"),
  lab_enabled: z.boolean(),
  pt_enabled: z.boolean(),
  period_gap_duration: z.number().nullable(),
  teacher_max_periods_per_day: z.number().nullable(),
  teacher_max_periods_per_week: z.number().nullable(),
  is_lab_included_in_max_periods: z.boolean(),
})

type GeneralSettingsProps = {
  existingConfig: TimeTableConfigForSchool | null
  academicSession: any
  onConfigSaved: () => void
}

export default function GeneralSettings({ existingConfig, academicSession, onConfigSaved }: GeneralSettingsProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [periodDuration, setPeriodDuration] = useState<string>("")

  // RTK Query hooks
  const [createTimeTableConfig, { isLoading: isCreating, error: createError }] = useCreateTimeTableConfigMutation()
  const [updateTimeTableConfig, { isLoading: isUpdating, error: updateError }] = useUpdateTimeTableConfigMutation()

  // Set up general settings form
  const form = useForm<z.infer<typeof timetableConfigSchema>>({
    resolver: zodResolver(timetableConfigSchema),
    defaultValues: existingConfig
      ? {
          academic_session_id: academicSession?.id || 0,
          max_periods_per_day: existingConfig.max_periods_per_day,
          default_period_duration: existingConfig.default_period_duration,
          allowed_period_durations: existingConfig.allowed_period_durations,
          lab_enabled: existingConfig.lab_enabled,
          pt_enabled: existingConfig.pt_enabled,
          period_gap_duration: existingConfig.period_gap_duration,
          teacher_max_periods_per_day: existingConfig.teacher_max_periods_per_day,
          teacher_max_periods_per_week: existingConfig.teacher_max_periods_per_week,
          is_lab_included_in_max_periods: existingConfig.is_lab_included_in_max_periods,
        }
      : {
          academic_session_id: academicSession?.id || 0,
          max_periods_per_day: 8,
          default_period_duration: 45,
          allowed_period_durations: [45],
          lab_enabled: false,
          pt_enabled: false,
          period_gap_duration: null,
          teacher_max_periods_per_day: null,
          teacher_max_periods_per_week: null,
          is_lab_included_in_max_periods: true,
        },
  })

  // Open dialog to add/edit configuration
  const openConfigDialog = () => {
    if (existingConfig) {
      form.reset({
        academic_session_id: academicSession?.id || 0,
        max_periods_per_day: existingConfig.max_periods_per_day,
        default_period_duration: existingConfig.default_period_duration,
        allowed_period_durations: existingConfig.allowed_period_durations,
        lab_enabled: existingConfig.lab_enabled,
        pt_enabled: existingConfig.pt_enabled,
        period_gap_duration: existingConfig.period_gap_duration,
        teacher_max_periods_per_day: existingConfig.teacher_max_periods_per_day,
        teacher_max_periods_per_week: existingConfig.teacher_max_periods_per_week,
        is_lab_included_in_max_periods: existingConfig.is_lab_included_in_max_periods,
      })
    }
    setIsDialogOpen(true)
  }

  // Handle general settings form submission
  const onSubmit = async (data: z.infer<typeof timetableConfigSchema>) => {
    try {
      if (!academicSession) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: t("no_active_academic_session"),
        })
        return
      }

      // Ensure academic_session_id is set
      data.academic_session_id = academicSession.id

      if (!existingConfig) {
        // Create new configuration
        await createTimeTableConfig({
          payload: data,
        }).unwrap()

        toast({
          title: t("success"),
          description: t("timetable_configuration_created_successfully"),
        })
      } else {
        // Update existing configuration
        await updateTimeTableConfig({
          config_id: existingConfig.id,
          payload: data,
        }).unwrap()

        toast({
          title: t("success"),
          description: t("timetable_configuration_updated_successfully"),
        })
      }

      // Close dialog and refresh data
      setIsDialogOpen(false)
      onConfigSaved()

      // If labs are enabled, suggest going to lab tab
      if (data.lab_enabled) {
        toast({
          title: t("lab_configuration"),
          description: t("you_have_enabled_labs_consider_configuring_them_in_the_lab_settings_tab"),
        })
      }
    } catch (error: any) {
      console.error("Error saving general settings:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.data?.message || t("failed_to_save_general_settings"),
      })
    }
  }

  // Add a new allowed period duration
  const addPeriodDuration = () => {
    const duration = Number.parseInt(periodDuration)
    if (!duration || isNaN(duration) || duration < 30 || duration > 120) {
      toast({
        variant: "destructive",
        title: t("invalid_duration"),
        description: t("period_duration_must_be_between_30_and_120_minutes"),
      })
      return
    }

    const currentDurations = form.getValues("allowed_period_durations") || []
    if (currentDurations.includes(duration)) {
      toast({
        variant: "destructive",
        title: t("duplicate_duration"),
        description: t("this_duration_is_already_in_the_list"),
      })
      return
    }

    form.setValue("allowed_period_durations", [...currentDurations, duration])
    setPeriodDuration("")
  }

  // Remove an allowed period duration
  const removePeriodDuration = (duration: number) => {
    const currentDurations = form.getValues("allowed_period_durations") || []
    form.setValue(
      "allowed_period_durations",
      currentDurations.filter((d) => d !== duration),
    )
  }

  // Get error message from RTK Query error
  const getErrorMessage = () => {
    const error = createError || updateError
    if (!error) return null

    if ("data" in error) {
      return (error as any).data?.message || t("an_error_occurred")
    }
    return t("an_error_occurred")
  }

  // Render configuration summary card
  const renderConfigSummary = () => {
    if (!existingConfig) {
      return (
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Info className="h-5 w-5 mr-2 text-muted-foreground" />
              {t("no_timetable_configuration")}
            </CardTitle>
            <CardDescription>{t("no_timetable_configuration_exists_for_this_academic_session")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={openConfigDialog}>
              <Plus className="h-4 w-4 mr-2" />
              {t("create_configuration")}
            </Button>
          </CardFooter>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{t("timetable_configuration")}</CardTitle>
            <Button variant="outline" size="sm" onClick={openConfigDialog}>
              <Settings2 className="h-4 w-4 mr-2" />
              {t("update")}
            </Button>
          </div>
          <CardDescription>
            {t("configuration_for")} {academicSession?.session_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("maximum_periods_per_day")}:</span>
              <span className="font-medium">{existingConfig.max_periods_per_day}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("default_period_duration")}:</span>
              <span className="font-medium">
                {existingConfig.default_period_duration} {t("minutes")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("period_gap_duration")}:</span>
              <span className="font-medium">
                {existingConfig.period_gap_duration === null
                  ? t("none")
                  : `${existingConfig.period_gap_duration} ${t("minutes")}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("allowed_period_durations")}:</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {existingConfig.allowed_period_durations.map((duration) => (
                  <Badge key={duration} variant="outline" className="text-xs">
                    {duration} {t("min")}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("physical_training")}:</span>
              <Badge variant={existingConfig.pt_enabled ? "default" : "outline"} className="text-xs">
                {existingConfig.pt_enabled ? t("enabled") : t("disabled")}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("lab_periods")}:</span>
              <Badge variant={existingConfig.lab_enabled ? "default" : "outline"} className="text-xs">
                {existingConfig.lab_enabled ? t("enabled") : t("disabled")}
              </Badge>
            </div>
            {existingConfig.lab_enabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("include_labs_in_max_periods")}:</span>
                <Badge
                  variant={existingConfig.is_lab_included_in_max_periods ? "default" : "outline"}
                  className="text-xs"
                >
                  {existingConfig.is_lab_included_in_max_periods ? t("yes") : t("no")}
                </Badge>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("teacher_max_periods_per_day")}:</span>
              <span className="font-medium">
                {existingConfig.teacher_max_periods_per_day === null
                  ? t("no_limit")
                  : existingConfig.teacher_max_periods_per_day}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("teacher_max_periods_per_week")}:</span>
              <span className="font-medium">
                {existingConfig.teacher_max_periods_per_week === null
                  ? t("no_limit")
                  : existingConfig.teacher_max_periods_per_week}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error display */}
      {getErrorMessage() && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{getErrorMessage()}</AlertDescription>
        </Alert>
      )}

      {/* Configuration summary */}
      {renderConfigSummary()}

      {/* Add/Edit Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {existingConfig ? t("update_timetable_configuration") : t("create_timetable_configuration")}
            </DialogTitle>
            <DialogDescription>
              {existingConfig
                ? t("update_the_timetable_configuration_for_this_academic_session")
                : t("create_a_new_timetable_configuration_for_this_academic_session")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Form content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="max_periods_per_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">{t("maximum_periods_per_day")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          required
                        />
                      </FormControl>
                      <FormDescription>{t("the_maximum_number_of_periods_in_a_school_day")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="period_gap_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("period_gap_duration_minutes")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>{t("duration_of_break_between_periods_in_minutes")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="pt_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t("physical_training")}</FormLabel>
                        <FormDescription>{t("enable_physical_training_in_timetable")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lab_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t("lab_periods")}</FormLabel>
                        <FormDescription>{t("enable_lab_periods_in_timetable")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("lab_enabled") && (
                <FormField
                  control={form.control}
                  name="is_lab_included_in_max_periods"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t("include_labs_in_max_periods")}</FormLabel>
                        <FormDescription>{t("count_lab_periods_towards_maximum_periods_per_day")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <Separator className="my-6" />

              <FormField
                control={form.control}
                name="default_period_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required">{t("default_period_duration_minutes")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        required
                      />
                    </FormControl>
                    <FormDescription>{t("standard_duration_for_periods_in_minutes")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel className="required">{t("allowed_period_durations")}</FormLabel>
                <FormDescription>{t("define_all_allowed_period_durations_for_the_timetable")}</FormDescription>

                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder={t("duration_in_minutes")}
                    value={periodDuration}
                    onChange={(e) => setPeriodDuration(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <Button type="button" onClick={addPeriodDuration} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("add")}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {form.watch("allowed_period_durations")?.map((duration: number) => (
                    <Badge key={duration} variant="secondary" className="px-3 py-1">
                      {duration} {t("minutes")}
                      <button
                        type="button"
                        className="ml-2 hover:text-destructive transition-colors"
                        onClick={() => removePeriodDuration(duration)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {form.formState.errors.allowed_period_durations && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.allowed_period_durations.message as string}
                  </p>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-6">
                <h3 className="text-lg font-medium">{t("teacher_workload_settings")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="teacher_max_periods_per_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("maximum_periods_per_day_for_teachers")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t("no_limit")}
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>{t("leave_empty_for_no_limit")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teacher_max_periods_per_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("maximum_periods_per_week_for_teachers")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t("no_limit")}
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>{t("leave_empty_for_no_limit")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {existingConfig ? t("update_configuration") : t("create_configuration")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
