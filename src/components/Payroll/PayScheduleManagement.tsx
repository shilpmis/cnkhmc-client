"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarDays, Clock, AlertCircle, Info, CalendarIcon, CheckCircle2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

// Define the schema for the pay schedule form
const payScheduleSchema = z.object({
  payFrequency: z.enum(["Monthly", "Bi-Weekly", "Weekly"]),
  workingDays: z.array(z.string()).min(1, { message: "Select at least one working day" }),
  payDayType: z.enum(["specific-day", "last-working-day"]),
  payDay: z.number().min(1).max(31).optional(),
  firstPayPeriod: z.date(),
  attendanceCycle: z.string(),
  reportGenerationDay: z.number().min(1).max(31),
  nextPayDate: z.date(),
})

// Define types for our component
type PaySchedule = z.infer<typeof payScheduleSchema> & {
  isConfigured: boolean
  hasProcessedPayrun: boolean
}

// Define types for upcoming payruns
type PayRun = {
  period: string
  date: string
  status: "pending" | "processing" | "completed" | "next"
}

const PayScheduleManagement = () => {
  const { t } = useTranslation()

  // State for pay schedule and UI
  const [paySchedule, setPaySchedule] = useState<PaySchedule>({
    payFrequency: "Monthly",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    payDayType: "specific-day",
    payDay: 5,
    firstPayPeriod: new Date(2025, 3, 1), // April 2025
    attendanceCycle: "29th - 28th",
    reportGenerationDay: 5,
    nextPayDate: new Date(2025, 4, 5), // May 5, 2025
    isConfigured: true,
    hasProcessedPayrun: false,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isChangePayDayDialogOpen, setIsChangePayDayDialogOpen] = useState(false)
  const [isConfirmChangeDialogOpen, setIsConfirmChangeDialogOpen] = useState(false)
  const [upcomingPayruns, setUpcomingPayruns] = useState<PayRun[]>([])

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof payScheduleSchema>>({
    resolver: zodResolver(payScheduleSchema),
    defaultValues: {
      payFrequency: paySchedule.payFrequency,
      workingDays: paySchedule.workingDays,
      payDayType: paySchedule.payDayType,
      payDay: paySchedule.payDay,
      firstPayPeriod: paySchedule.firstPayPeriod,
      attendanceCycle: paySchedule.attendanceCycle,
      reportGenerationDay: paySchedule.reportGenerationDay,
      nextPayDate: paySchedule.nextPayDate,
    },
  })

  // Load data with simulated delay
  useEffect(() => {
    const timer = setTimeout(() => {
      // Generate upcoming payruns based on pay schedule
      generateUpcomingPayruns()
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Update form when pay schedule changes
  useEffect(() => {
    form.reset({
      payFrequency: paySchedule.payFrequency,
      workingDays: paySchedule.workingDays,
      payDayType: paySchedule.payDayType,
      payDay: paySchedule.payDay,
      firstPayPeriod: paySchedule.firstPayPeriod,
      attendanceCycle: paySchedule.attendanceCycle,
      reportGenerationDay: paySchedule.reportGenerationDay,
      nextPayDate: paySchedule.nextPayDate,
    })
  }, [paySchedule, form])

  // Generate upcoming payruns based on pay schedule
  const generateUpcomingPayruns = () => {
    const payruns: PayRun[] = []
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    // Generate 6 upcoming payruns
    for (let i = 0; i < 6; i++) {
      const month = (currentMonth + i) % 12
      const year = currentYear + Math.floor((currentMonth + i) / 12)
      const payDay = paySchedule.payDay || 5

      // Create a date for the pay day
      let payDate = new Date(year, month, payDay)

      // If it's a weekend or holiday, adjust to previous working day
      // This is a simplified version - in a real app, you'd check against actual holidays
      if (payDate.getDay() === 0 || payDate.getDay() === 6) {
        // If weekend, move to Friday
        payDate = new Date(year, month, payDay - (payDate.getDay() === 0 ? 2 : 1))
      }

      payruns.push({
        period: format(new Date(year, month, 1), "MMMM yyyy"),
        date: format(payDate, "dd/MM/yyyy"),
        status: i === 0 ? "next" : "pending",
      })
    }

    setUpcomingPayruns(payruns)
  }

  // Handle opening the change pay day dialog
  const handleOpenChangePayDay = () => {
    if (paySchedule.hasProcessedPayrun) {
      toast({
        title: "Cannot change pay schedule",
        description: "Pay schedule cannot be edited once you process the first pay run.",
        variant: "destructive",
      })
      return
    }
    setIsChangePayDayDialogOpen(true)
  }

  // Handle form submission
  const onSubmit = (values: z.infer<typeof payScheduleSchema>) => {
    setIsChangePayDayDialogOpen(false)
    setIsConfirmChangeDialogOpen(true)
    // We'll update the pay schedule after confirmation
  }

  // Handle confirming the changes
  const handleConfirmChanges = () => {
    const values = form.getValues()
    setPaySchedule({
      ...paySchedule,
      payDayType: values.payDayType,
      payDay: values.payDay,
      attendanceCycle: values.attendanceCycle,
      reportGenerationDay: values.reportGenerationDay,
      nextPayDate: values.nextPayDate,
    })

    // Regenerate upcoming payruns with new schedule
    setTimeout(() => {
      generateUpcomingPayruns()
    }, 100)

    setIsConfirmChangeDialogOpen(false)
    toast({
      title: "Pay schedule updated",
      description: "Your pay schedule has been updated successfully.",
    })
  }

  // Format working days for display
  const formatWorkingDays = (days: string[]) => {
    return days.map((day) => day.substring(0, 3)).join(", ")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-72 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("pay_schedule")}</h1>
          <p className="text-muted-foreground mt-1">{t("manage_your_organization_payroll_schedule")}</p>
        </div>
      </div>

      <Alert variant="destructive" className="bg-amber-50 text-amber-800 border-amber-200">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("note")}</AlertTitle>
        <AlertDescription>{t("pay_schedule_cannot_be_edited_once_you_process_the_first_pay_run")}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{t("organization_payroll_schedule")}</CardTitle>
          <CardDescription>{t("this_organizations_payroll_runs_on_this_schedule")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("pay_frequency")}</h3>
                  <p className="font-medium">{paySchedule.payFrequency}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("working_days")}</h3>
                  <p className="font-medium">{formatWorkingDays(paySchedule.workingDays)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("pay_day")}</h3>
                  <p className="font-medium">
                    {paySchedule.payDayType === "last-working-day"
                      ? t("last_working_day_of_every_month")
                      : `${paySchedule.payDay}${t("th")} ${t("of_every_month")}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenChangePayDay}
                  disabled={paySchedule.hasProcessedPayrun}
                >
                  {t("change")}
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("first_pay_period")}</h3>
                  <p className="font-medium">{format(paySchedule.firstPayPeriod, "MMMM yyyy")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("attendance_cycle")}</h3>
                  <p className="font-medium">{paySchedule.attendanceCycle}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("report_generation_day")}</h3>
                  <p className="font-medium">
                    {paySchedule.reportGenerationDay}
                    {t("th")} {t("of_every_month")}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("next_pay_date")}</h3>
                  <p className="font-medium">{format(paySchedule.nextPayDate, "dd/MM/yyyy")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">{t("upcoming_payruns")}</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pay_period")}</TableHead>
                    <TableHead>{t("pay_date")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingPayruns.map((payrun, index) => (
                    <TableRow key={index} className={payrun.status === "next" ? "bg-green-50" : ""}>
                      <TableCell className="font-medium">
                        {payrun.period}
                        {payrun.status === "next" && (
                          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                            {t("next_payrun")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{payrun.date}</TableCell>
                      <TableCell>
                        {payrun.status === "next" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {t("upcoming")}
                            </div>
                          </Badge>
                        ) : payrun.status === "completed" ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <div className="flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t("completed")}
                            </div>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            <div className="flex items-center">
                              <CalendarDays className="h-3 w-3 mr-1" />
                              {t("scheduled")}
                            </div>
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Pay Day Dialog */}
      <Dialog open={isChangePayDayDialogOpen} onOpenChange={setIsChangePayDayDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("change_pay_day")}</DialogTitle>
            <DialogDescription>{t("update_your_organizations_pay_day_and_related_settings")}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t("pay_your_employees_on")}</h3>

                <FormField
                  control={form.control}
                  name="payDayType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="last-working-day" id="last-working-day" />
                            <Label htmlFor="last-working-day">{t("the_last_working_day_of_every_month")}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="specific-day" id="specific-day" />
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="specific-day">{t("day")}</Label>
                              {field.value === "specific-day" && (
                                <Select
                                  value={String(form.watch("payDay"))}
                                  onValueChange={(value) => form.setValue("payDay", Number(value))}
                                >
                                  <SelectTrigger className="w-[80px]">
                                    <SelectValue placeholder="Day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                      <SelectItem key={day} value={String(day)}>
                                        {day}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <span>{t("of_every_month")}</span>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">
                  {t("salary_for_the_month_of")} {format(new Date(), "MMMM yyyy")} {t("will_be_paid_on")}
                </h3>

                <FormField
                  control={form.control}
                  name="nextPayDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t(
                      "when_payday_falls_on_a_non_working_day_or_a_holiday_employees_will_get_paid_on_the_previous_working_day",
                    )}
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t("attendance_cycle")}</h3>
                <FormField
                  control={form.control}
                  name="attendanceCycle"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_attendance_cycle")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1st - 31st">{t("1st_to_31st")}</SelectItem>
                          <SelectItem value="26th - 25th">{t("26th_to_25th")}</SelectItem>
                          <SelectItem value="29th - 28th">{t("29th_to_28th")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("define_the_start_and_end_days_of_your_organisations_attendance_cycle")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t("payroll_report_generation_day")}</h3>
                <FormField
                  control={form.control}
                  name="reportGenerationDay"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_day")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={String(day)}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("choose_when_to_generate_payroll_reports_from_leave_and_attendance_data")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <p>{t("before_you_select_the_date_for_payroll_report_generation_ensure_that")}:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>
                        {t("there_are_3_7_days_between")} {t("the_end_date_of_the")}{" "}
                        {t("attendance_cycle_and_the_payroll_report_day")}
                      </li>
                      <li>{t("the_day_of_payroll_report_generation_falls_before_the_payday")}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsChangePayDayDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit">{t("save_changes")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirm Changes Dialog */}
      <AlertDialog open={isConfirmChangeDialogOpen} onOpenChange={setIsConfirmChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_pay_schedule_changes")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("are_you_sure_you_want_to_update_your_pay_schedule")}? {t("this_will_affect_all_upcoming_payruns")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChanges}>{t("confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PayScheduleManagement
