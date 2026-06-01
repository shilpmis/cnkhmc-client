import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { AlertCircle, Calendar, Download, Eye, FileText, Loader2, Plus, Printer, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useFetchAllSalaryComponentQuery,
  useIndexStaffWithPayrollQuery,
  useCreateDraftForStaffPayrollMutation,
  useUpdateDraftForStaffPayrollMutation,
  useFetchSingleStaffSalaryTemplateQuery,
} from "@/services/PayrollService"
import type {
  StaffEnrollmentForPayroll,
  StaffPayRun,
  TypeForUpdateStaffPayRun,
  SalaryTemplateComponentForStaff,
  SalaryComponent,
} from "@/types/payroll"
import { useAppDispatch } from "@/redux/hooks/useAppDispatch"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectAccademicSessionsForSchool } from "@/redux/slices/authSlice"

// Form schema for notes and status update
const payslipUpdateSchema = z.object({
  template_name: z.string().min(2).max(50).optional(),
  notes: z.string().nullable().optional(),
  status: z
    .enum(["draft", "pending", "processing", "partially_paid", "paid", "failed", "cancelled", "on_hold"])
    .optional(),
})

// Utility function to get component details from salary components array
const getComponentDetails = (componentId: number, salaryComponents: SalaryComponent[]) => {
  const component = salaryComponents.find((c) => c.id === componentId)
  return (
    component || {
      id: componentId,
      component_name: "Unknown Component",
      component_code: null,
      component_type: "earning" as const,
      description: null,
      calculation_method: "amount" as const,
      amount: null,
      percentage: null,
      is_based_on_annual_ctc: false,
      name_in_payslip: "Unknown Component",
      is_taxable: false,
      pro_rata_calculation: false,
      consider_for_epf: false,
      consider_for_esi: false,
      consider_for_esic: false,
      is_mandatory: false,
      is_mandatory_for_all_templates: false,
      is_active: false,
      deduction_frequency: null,
      deduction_type: null,
      benefit_frequency: null,
      benefit_type: null,
      school_id: 0,
      academic_session_id: 0,
      created_at: "",
      updated_at: "",
    }
  )
}

export default function PayRun() {
  // State
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0"))
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [viewTemplateDialog, setViewTemplateDialog] = useState<boolean>(false)
  const [viewDraftDialog, setViewDraftDialog] = useState<boolean>(false)
  const [selectedStaffEnrollment, setSelectedStaffEnrollment] = useState<StaffEnrollmentForPayroll | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)
  const [currentDraft, setCurrentDraft] = useState<StaffPayRun | null>(null)
  const [payrunTemplateId, setPayrunTemplateId] = useState<number | null>(null)
  const [shouldUpdateDraft, setShouldUpdateDraft] = useState<boolean>(false)
  const [selectedPayRun, setSelectedPayRun] = useState<Omit<StaffPayRun, "payroll_components"> | null>(null)
  const [updatingPayrollId, setUpdatingPayrollId] = useState<number | null>(null)

  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  // RTK Query hooks
  const {
    data: staffEnrollmentsResponse,
    isLoading: isLoadingEnrollments,
    error: enrollmentsError,
    refetch: refetchEnrollments,
  } = useIndexStaffWithPayrollQuery(
    {
      month: selectedMonth,
      year: selectedYear.toString(),
    },
    {
      refetchOnMountOrArgChange: true,
      skip: !isInitialized,
    },
  )

  // Add an effect to refetch data when year or month changes
  useEffect(() => {
    if (isInitialized) {
      refetchEnrollments()
    }
  }, [selectedYear, selectedMonth, refetchEnrollments, isInitialized])

  // Extract staff enrollments
  const staffEnrollments = staffEnrollmentsResponse?.data || []

  const { data: salaryComponents = [] } = useFetchAllSalaryComponentQuery({
    academic_session: CurrentAcademicSessionForSchool!.id,
  })

  // Fetch staff salary template when a staff is selected
  const {
    data: staffSalaryTemplate,
    isLoading: isLoadingTemplate,
    error: templateError,
  } = useFetchSingleStaffSalaryTemplateQuery(
    { staff_id: selectedStaffEnrollment?.staff_id || 0 },
    { skip: !selectedStaffEnrollment },
  )

  const [createDraft, { isLoading: isCreatingDraft }] = useCreateDraftForStaffPayrollMutation()
  const [updateDraft, { isLoading: isUpdatingDraft }] = useUpdateDraftForStaffPayrollMutation()

  // Form for updating payslip
  const form = useForm<z.infer<typeof payslipUpdateSchema>>({
    resolver: zodResolver(payslipUpdateSchema),
    defaultValues: {
      template_name: "",
      notes: "",
      status: "draft",
    },
  })

  // Update form when staff salary template is loaded
  useEffect(() => {
    if (staffSalaryTemplate && viewTemplateDialog) {
      form.reset({
        template_name: staffSalaryTemplate.template_name,
        notes: "",
        status: "draft",
      })
    }
  }, [staffSalaryTemplate, form, viewTemplateDialog])

  // Get current date for validation
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  // Get unique years from academic sessions
  const AcademicSessionsForSchool = useAppSelector(selectAccademicSessionsForSchool)
  const academicYears = AcademicSessionsForSchool
    ? Array.from(
        new Set([
          ...AcademicSessionsForSchool.map((session) => Number(session.start_year)),
          ...AcademicSessionsForSchool.map((session) => Number(session.end_year)),
        ]),
      ).sort((a, b) => b - a)
    : [currentYear, currentYear - 1, currentYear - 2]

  // Validation functions
  const isYearDisabled = (year: number) => {
    return year > currentYear
  }

  const isMonthDisabled = (month: string) => {
    if (selectedYear < currentYear) return false
    return selectedYear === currentYear && Number.parseInt(month) > currentMonth
  }

  // Months for dropdown
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  // Helper function to find pay run for current month/year
  const getCurrentPayRun = useCallback(
    (enrollment: StaffEnrollmentForPayroll) => {
      if (!enrollment.pay_runs || enrollment.pay_runs.length === 0) return null

      const payRun = enrollment.pay_runs.find(
        (payRun) => payRun.payroll_month === selectedMonth && payRun.payroll_year === selectedYear.toString(),
      )

      return payRun || null
    },
    [selectedMonth, selectedYear],
  )

  // Create a memoized function to create a draft from a template
  const createDraftFromTemplate = useCallback(
    (staffEnrollment: StaffEnrollmentForPayroll) => {
      if (!staffEnrollment.staff_salary_templates) return null

      const template = staffEnrollment.staff_salary_templates

      return {
        id: template.id,
        base_template_id: template.base_template_id,
        staff_enrollments_id: staffEnrollment.id,
        payroll_month: selectedMonth,
        payroll_year: selectedYear.toString(),
        template_name: template.template_name,
        template_code: template.template_code,
        based_anual_ctc: Number(template.annual_ctc),
        total_payroll: Number(template.annual_ctc) / 12,
        notes: "Draft payslip",
        status: "draft" as
          | "draft"
          | "pending"
          | "processing"
          | "partially_paid"
          | "paid"
          | "failed"
          | "cancelled"
          | "on_hold",
        payroll_components: [],
      }
    },
    [selectedMonth, selectedYear],
  )

  // Handle view template button click
  const handleViewTemplate = (staffEnrollment: StaffEnrollmentForPayroll) => {
    setSelectedStaffEnrollment(staffEnrollment)

    if (staffEnrollment.staff_salary_templates) {
      setSelectedTemplate(staffEnrollment.staff_salary_templates)

      // Pre-fill the form
      form.reset({
        template_name: staffEnrollment.staff_salary_templates.template_name,
        notes: "",
        status: "draft",
      })
    }

    setViewTemplateDialog(true)
  }

  // Handle view draft button click
  const handleViewDraft = (
    staffEnrollment: StaffEnrollmentForPayroll,
    templateId: number,
    existingPayRun: Omit<StaffPayRun, "payroll_components"> | null = null,
  ) => {
    // Set the selected staff enrollment
    setSelectedStaffEnrollment(staffEnrollment)
    setPayrunTemplateId(templateId)

    // If there's an existing pay run, use it
    if (existingPayRun) {
      setSelectedPayRun(existingPayRun)

      // Create a draft with the existing pay run data
      const draft: StaffPayRun = {
        ...existingPayRun,
        payroll_components: [], // Will be populated later
      }

      setCurrentDraft(draft)

      // Reset the form with the existing pay run values
      form.reset({
        template_name: existingPayRun.template_name,
        notes: existingPayRun.notes || "",
        status: existingPayRun.status || "draft",
      })
    } else {
      // Create a new draft
      const draft = createDraftFromTemplate(staffEnrollment)

      if (!draft) {
        toast({
          title: "Error",
          description: "Could not create draft from template.",
          variant: "destructive",
        })
        return
      }

      setCurrentDraft(draft)
      setSelectedPayRun(null)

      // Reset the form with draft values
      form.reset({
        template_name: draft.template_name,
        notes: draft.notes || "",
        status: draft.status || "draft",
      })
    }

    // Set flag to update draft with components when template is loaded
    setShouldUpdateDraft(true)

    // Open the dialog
    setViewDraftDialog(true)
  }

  // Update current draft when staff salary template is loaded
  useEffect(() => {
    if (staffSalaryTemplate && viewDraftDialog && currentDraft && shouldUpdateDraft) {
      // Only update once
      setShouldUpdateDraft(false)

      // Create payroll components based on the actual template components
      const payrollComponents = staffSalaryTemplate.template_components.map(
        (component: SalaryTemplateComponentForStaff) => {
          // Get component details from salary components array
          const componentDetails = getComponentDetails(component.salary_components_id, salaryComponents)

          // Use values from template component but get name and type from component details
          return {
            salary_components_id: component.salary_components_id,
            payslip_name: componentDetails.name_in_payslip || componentDetails.component_name,
            amount: component.amount ? Number(component.amount) : null,
            percentage: component.percentage ? Number(component.percentage) : 0,
            is_based_on_annual_ctc: componentDetails.is_based_on_annual_ctc,
            is_based_on_basic_pay: !componentDetails.is_based_on_annual_ctc,
            is_modofied: false,
            component_type: componentDetails.component_type,
          }
        },
      )

      // Update the draft with components
      setCurrentDraft((prev) => (prev ? { ...prev, payroll_components: payrollComponents } : null))
    }
  }, [staffSalaryTemplate, viewDraftDialog, currentDraft, salaryComponents, shouldUpdateDraft])

  // Handle create draft button click
  const handleCreateDraft = async () => {
    if (!selectedStaffEnrollment?.staff_salary_templates || !staffSalaryTemplate) {
      toast({
        title: "Error",
        description: "Salary template data is not available.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a new draft based on the template
      const template = selectedStaffEnrollment.staff_salary_templates

      // Create payroll components based on the actual template components
      const payrollComponents = staffSalaryTemplate.template_components.map(
        (component: SalaryTemplateComponentForStaff) => {
          // Get component details from salary components array
          const componentDetails = getComponentDetails(component.salary_components_id, salaryComponents)

          // Use values from template component but get name and type from component details
          return {
            salary_components_id: component.salary_components_id,
            payslip_name: componentDetails.name_in_payslip || componentDetails.component_name,
            amount: component.amount ? Number(component.amount) : null,
            percentage: component.percentage ? Number(component.percentage) : 0,
            is_based_on_annual_ctc: componentDetails.is_based_on_annual_ctc,
            is_based_on_basic_pay: !componentDetails.is_based_on_annual_ctc,
            is_modofied: false,
            component_type: componentDetails.component_type,
          }
        },
      )

      const draftData: StaffPayRun = {
        id: template.base_template_id,
        base_template_id: template.base_template_id,
        staff_enrollments_id: selectedStaffEnrollment.id,
        payroll_month: selectedMonth,
        payroll_year: selectedYear.toString(),
        template_name: form.getValues("template_name") || template.template_name,
        template_code: template.template_code,
        based_anual_ctc: Number(template.annual_ctc),
        total_payroll: Number(template.annual_ctc) / 12,
        notes: form.getValues("notes") || "",
        status: "draft" as
          | "draft"
          | "pending"
          | "processing"
          | "partially_paid"
          | "paid"
          | "failed"
          | "cancelled"
          | "on_hold",
        payroll_components: payrollComponents,
      }

      const createdDraft = await createDraft({ payload: draftData }).unwrap()

      // Close template dialog first
      setViewTemplateDialog(false)

      // Then update state and open draft dialog
      setCurrentDraft(createdDraft)
      setPayrunTemplateId(createdDraft.base_template_id)
      setSelectedPayRun(createdDraft)

      // Reset the form with the created draft values
      form.reset({
        template_name: createdDraft.template_name,
        notes: createdDraft.notes || "",
        status: createdDraft.status || "draft",
      })

      toast({
        title: "Draft Created",
        description: "Payslip draft has been created successfully.",
        variant: "default",
      })

      // Open draft dialog
      setViewDraftDialog(true)
    } catch (err) {
      console.error("Error creating draft:", err)
      toast({
        title: "Error",
        description: "Failed to create payslip draft.",
        variant: "destructive",
      })
    }
  }

  // Handle update draft (including status change)
  const onSubmitDraftUpdate = async (values: z.infer<typeof payslipUpdateSchema>) => {
    if (!selectedStaffEnrollment || !payrunTemplateId) return

    // Check if the current status is already "paid" - if so, prevent changes
    if (currentDraft?.status === "paid") {
      toast({
        title: "Cannot Update",
        description: "Payslips with 'paid' status cannot be modified.",
        variant: "destructive",
      })
      return
    }

    try {
      const updateData: TypeForUpdateStaffPayRun = {
        template_name: values.template_name || "",
        notes: values.notes ?? null,
        status: values.status as TypeForUpdateStaffPayRun["status"],
      }

      await updateDraft({
        payload: updateData,
        staff_id: selectedStaffEnrollment.staff_id,
        payrun_template_id: payrunTemplateId,
      }).unwrap()

      // Create a new draft object instead of modifying the existing one
      const updatedDraft = {
        ...currentDraft!,
        template_name: values.template_name || currentDraft!.template_name,
        notes: values.notes || "",
        status: values.status || currentDraft!.status,
      }

      setCurrentDraft(updatedDraft)

      toast({
        title: "Draft Updated",
        description: `Payslip draft has been updated to ${values.status} status.`,
        variant: "default",
      })

      // Close draft dialog if status is paid
      if (values.status === "paid") {
        setViewDraftDialog(false)
        // Refresh the staff enrollments to reflect the updated status
        refetchEnrollments()
      }
    } catch (err) {
      console.error("Error updating draft:", err)
      toast({
        title: "Error",
        description: "Failed to update payslip draft.",
        variant: "destructive",
      })
    }
  }

  // Filter staff enrollments based on search query
  const filteredStaffEnrollments = staffEnrollments.filter((enrollment) => {
    if (!enrollment) return false

    const searchLower = searchQuery.toLowerCase()
    const staffName = enrollment.staff?.first_name || ""
    const staffEmail = enrollment.staff?.email || ""
    const staffDesignation = enrollment.staff?.role_type?.role || ""

    return (
      staffName.toLowerCase().includes(searchLower) ||
      staffEmail.toLowerCase().includes(searchLower) ||
      staffDesignation.toLowerCase().includes(searchLower) ||
      (enrollment.staff_salary_templates &&
        enrollment.staff_salary_templates.template_name.toLowerCase().includes(searchLower))
    )
  })

  // Get status badge color
  const getStatusBadgeColor = (status: string | undefined) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "partially_paid":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
      case "failed":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      case "on_hold":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "draft":
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Calculate earnings, deductions and net pay
  const calculatePayrollSummary = (draft: StaffPayRun | null) => {
    if (!draft) return { earnings: 0, deductions: 0, netPay: 0 }
    if (!draft.payroll_components || draft.payroll_components.length === 0) {
      return { earnings: 0, deductions: 0, netPay: 0 }
    }

    let totalEarnings = 0
    let totalDeductions = 0

    draft.payroll_components.forEach((component) => {
      // Find component details from salary components array
      const componentDetails = getComponentDetails(component.salary_components_id, salaryComponents)

      // If component details not found, try to use component's own type if available
      const componentType = componentDetails.component_type || "earning"

      let amount = 0

      if (component.amount !== null) {
        amount = component.amount
      } else if (component.percentage) {
        if (component.is_based_on_annual_ctc) {
          amount = (draft.based_anual_ctc * component.percentage) / 100 / 12
        } else if (component.is_based_on_basic_pay) {
          // Assuming basic pay is the first component with id 1
          const basicPayComponent = draft.payroll_components.find((c) => c.salary_components_id === 1)
          if (basicPayComponent && basicPayComponent.percentage) {
            const basicPay = (draft.based_anual_ctc * basicPayComponent.percentage) / 100 / 12
            amount = (basicPay * component.percentage) / 100
          }
        }
      }

      if (componentType === "earning") {
        totalEarnings += amount
      } else {
        totalDeductions += amount
      }
    })

    return {
      earnings: totalEarnings,
      deductions: totalDeductions,
      netPay: totalEarnings - totalDeductions,
    }
  }

  // Reset state when dialogs close
  const handleTemplateDialogClose = (open: boolean) => {
    if (!open) {
      // Only reset state when closing
      setSelectedTemplate(null)
      form.reset({
        template_name: "",
        notes: "",
        status: "draft",
      })
    }
    setViewTemplateDialog(open)
  }

  const handleDraftDialogClose = (open: boolean) => {
    if (!open) {
      // Only reset state when closing
      setCurrentDraft(null)
      setShouldUpdateDraft(false)
      setSelectedPayRun(null)
      form.reset({
        template_name: "",
        notes: "",
        status: "draft",
      })
    }
    setViewDraftDialog(open)
  }

  // Handle status update directly from the table
  const handleStatusUpdate = async (
    staffEnrollment: StaffEnrollmentForPayroll,
    payRun: Omit<StaffPayRun, "payroll_components">,
    newStatus: TypeForUpdateStaffPayRun["status"],
  ): Promise<void> => {
    // Check if the current status is already "paid" - if so, prevent changes
    if (payRun.status === "paid") {
      toast({
        title: "Cannot Update",
        description: "Payslips with 'paid' status cannot be modified.",
        variant: "destructive",
      })
      return Promise.reject("Payslip is already paid")
    }

    try {
      const updateData: TypeForUpdateStaffPayRun = {
        template_name: payRun.template_name,
        notes: payRun.notes ?? null,
        status: newStatus,
      }

      await updateDraft({
        payload: updateData,
        staff_id: staffEnrollment.staff_id,
        payrun_template_id: payRun.base_template_id,
      }).unwrap()

      toast({
        title: "Status Updated",
        description: `Payslip status has been updated to ${newStatus}.`,
        variant: "default",
      })

      // Refresh the staff enrollments to reflect the updated status
      await refetchEnrollments()

      return Promise.resolve()
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: "Error",
        description: "Failed to update payslip status.",
        variant: "destructive",
      })
      return Promise.reject(err)
    }
  }

  // Handle print payslip
  const handlePrintPayslip = useCallback(() => {
    // You could implement a more sophisticated print functionality here
    // For now, we'll just use the browser's print functionality
    window.print()
  }, [])

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      setIsInitialized(true)
    }
  }, [selectedYear, selectedMonth])

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">PayRun Management</h1>
          <div className="flex items-center space-x-2">
            {/* <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Bulk PayRun
            </Button> */}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>PayRun for Period</CardTitle>
            <CardDescription>Select a month and year to view and manage payroll for that period.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Year</label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year} value={year.toString()} disabled={isYearDisabled(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Month</label>
                    <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value} disabled={isMonthDisabled(month.value)}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, or designation..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {enrollmentsError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load staff enrollments. Please try again.</AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Salary Template</TableHead>
                    <TableHead>Annual CTC</TableHead>
                    <TableHead>Monthly CTC</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingEnrollments ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading staff data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredStaffEnrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {searchQuery ? "No matching employees found" : "No employees found for this period"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaffEnrollments.map((enrollment) => {
                      // Find pay run for current month/year
                      const currentPayRun = getCurrentPayRun(enrollment)
                      const monthlyCTC = enrollment.staff_salary_templates
                        ? Number.parseFloat(enrollment.staff_salary_templates.annual_ctc.toString()) / 12
                        : 0

                      return (
                        <TableRow key={enrollment.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                                {false ? (
                                  <img
                                    src={"/placeholder.svg"}
                                    alt={enrollment.staff?.first_name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                    {enrollment.staff?.first_name?.charAt(0) || "?"}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{enrollment.staff?.first_name}</p>
                                <p className="text-sm text-gray-500">{enrollment.staff?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{enrollment.staff?.role_type?.role}</TableCell>
                          <TableCell>
                            {enrollment.staff_salary_templates ? (
                              enrollment.staff_salary_templates.template_name
                            ) : (
                              <Badge variant="destructive" className="text-white">No Salary Template</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {enrollment.staff_salary_templates
                              ? `₹${Number.parseFloat(enrollment.staff_salary_templates.annual_ctc.toString()).toLocaleString()}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {monthlyCTC > 0
                              ? `₹${monthlyCTC.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {currentPayRun ? (
                              currentPayRun.status === "paid" ? (
                                <Badge variant="outline" className={getStatusBadgeColor(currentPayRun.status)}>
                                  {currentPayRun.status}
                                </Badge>
                              ) : (
                                <div className="flex items-center">
                                  {updatingPayrollId === currentPayRun.id ? (
                                    <div className="flex items-center">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span className="text-sm">Updating...</span>
                                    </div>
                                  ) : (
                                    <Select
                                      value={currentPayRun.status}
                                      onValueChange={(value) => {
                                        setUpdatingPayrollId(currentPayRun.id)
                                        handleStatusUpdate(
                                          enrollment,
                                          currentPayRun,
                                          value as TypeForUpdateStaffPayRun["status"],
                                        ).finally(() => {
                                          setUpdatingPayrollId(null)
                                        })
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[130px]">
                                        <SelectValue>
                                          <div className="flex items-center">
                                            <Badge
                                              variant="outline"
                                              className={getStatusBadgeColor(currentPayRun.status)}
                                            >
                                              {currentPayRun.status}
                                            </Badge>
                                          </div>
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="on_hold">On Hold</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              )
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                Not Processed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {enrollment.staff_salary_templates ? (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => handleViewTemplate(enrollment)}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>

                                  {currentPayRun ? (
                                    currentPayRun.status === "paid" ? (
                                      <Button variant="outline" size="sm" onClick={handlePrintPayslip}>
                                        <Printer className="h-4 w-4 mr-1" />
                                        Print Payslip
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (enrollment.staff_salary_templates?.id) {
                                            handleViewDraft(
                                              enrollment,
                                              enrollment.staff_salary_templates.id,
                                              currentPayRun,
                                            )
                                          }
                                        }}
                                      >
                                        <FileText className="h-4 w-4 mr-1" />
                                        Update Status
                                      </Button>
                                    )
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (enrollment.staff_salary_templates?.id) {
                                          handleViewDraft(enrollment, enrollment.staff_salary_templates.id)
                                        }
                                      }}
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      Create Draft
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button variant="outline" size="sm" disabled>
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Create Template First
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">Showing {filteredStaffEnrollments.length} employees</div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* View Template Dialog */}
      <Dialog open={viewTemplateDialog} onOpenChange={handleTemplateDialogClose}>
        <DialogContent className="max-w-3xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary Template Details</DialogTitle>
            <DialogDescription>View salary template details and create a payslip draft.</DialogDescription>
          </DialogHeader>

          {isLoadingTemplate ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : templateError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load salary template. Please try again.</AlertDescription>
            </Alert>
          ) : selectedStaffEnrollment?.staff_salary_templates &&
            selectedStaffEnrollment.staff &&
            staffSalaryTemplate ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 overflow-hidden">
                  {false ? (
                    <img
                      src={"/placeholder.svg"}
                      alt={selectedStaffEnrollment?.staff.first_name || ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                      {selectedStaffEnrollment.staff.first_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedStaffEnrollment.staff.first_name}</h3>
                  <p className="text-sm text-gray-500">{selectedStaffEnrollment.staff.role_type?.role}</p>
                  <p className="text-sm text-gray-500">{selectedStaffEnrollment.staff.email}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Template Details</h4>
                  <p className="font-medium mt-1">{staffSalaryTemplate.template_name}</p>
                  <p className="text-sm text-gray-500 mt-1">Code: {staffSalaryTemplate.template_code}</p>
                  <p className="text-sm mt-1">{staffSalaryTemplate.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Salary Details</h4>
                  <p className="font-medium mt-1">
                    Annual CTC: ₹{Number.parseFloat(staffSalaryTemplate.annual_ctc.toString()).toLocaleString()}
                  </p>
                  <p className="text-sm mt-1">
                    Monthly Salary: ₹
                    {(Number.parseFloat(staffSalaryTemplate.annual_ctc.toString()) / 12).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Display template components */}
              <div>
                <h4 className="font-medium mb-2">Salary Components</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount/Percentage</TableHead>
                        <TableHead>Based On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffSalaryTemplate.template_components.map(
                        (component: SalaryTemplateComponentForStaff, index: number) => {
                          // Get component details from salary components array
                          const componentDetails = getComponentDetails(component.salary_components_id, salaryComponents)

                          return (
                            <TableRow key={index}>
                              <TableCell>{componentDetails.component_name}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    componentDetails.component_type === "earning"
                                      ? "bg-green-50 text-green-700"
                                      : "bg-red-50 text-red-700"
                                  }
                                >
                                  {componentDetails.component_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {component.amount
                                  ? `₹${Number(component.amount).toLocaleString()}`
                                  : component.percentage
                                    ? `${component.percentage}%`
                                    : "-"}
                              </TableCell>
                              <TableCell>
                                {componentDetails.is_based_on_annual_ctc
                                  ? "Annual CTC"
                                  : !componentDetails.is_based_on_annual_ctc
                                    ? "Basic Pay"
                                    : "-"}
                              </TableCell>
                            </TableRow>
                          )
                        },
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Payslip Information</h4>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="template_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payslip Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter payslip name" {...field} />
                          </FormControl>
                          <FormDescription>Name that will appear on the payslip</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any notes for this payslip"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>Optional notes for the payslip</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p>No template data available.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleTemplateDialogClose(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateDraft}
              disabled={isCreatingDraft || !selectedStaffEnrollment?.staff_salary_templates || !staffSalaryTemplate}
            >
              {isCreatingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Draft Dialog */}
      <Dialog open={viewDraftDialog} onOpenChange={handleDraftDialogClose}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslip Draft</DialogTitle>
            <DialogDescription>
              Review and manage payslip draft for {selectedStaffEnrollment?.staff?.first_name}.
            </DialogDescription>
          </DialogHeader>

          {!currentDraft ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : currentDraft && selectedStaffEnrollment?.staff ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 overflow-hidden">
                    {false ? (
                      <img
                        src={"/placeholder.svg"}
                        alt={selectedStaffEnrollment?.staff.first_name || ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                        {selectedStaffEnrollment.staff.first_name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedStaffEnrollment.staff.first_name}</h3>
                    <p className="text-sm text-gray-500">{selectedStaffEnrollment.staff.role_type?.role}</p>
                  </div>
                </div>
                <Badge className={getStatusBadgeColor(currentDraft.status)}>{currentDraft.status || "Draft"}</Badge>
              </div>

              <Separator />

              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Payslip Details</TabsTrigger>
                  <TabsTrigger value="components">Salary Components</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Payslip Information</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Payslip Name:</span>
                          <span className="font-medium">{currentDraft.template_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Payslip Code:</span>
                          <span className="font-medium">{currentDraft.template_code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Period:</span>
                          <span className="font-medium">
                            {months.find((m) => m.value === currentDraft.payroll_month)?.label}{" "}
                            {currentDraft.payroll_year}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Salary Details</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Annual CTC:</span>
                          <span className="font-medium">₹{currentDraft.based_anual_ctc.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Monthly Salary:</span>
                          <span className="font-medium">
                            ₹
                            {(currentDraft.based_anual_ctc / 12).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Total Payroll:</span>
                          <span className="font-medium">₹{Number(currentDraft.total_payroll).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                    <p className="mt-2 text-sm p-3 bg-gray-50 rounded-md min-h-[60px]">
                      {currentDraft.notes || "No notes provided."}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="components" className="pt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Based On</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentDraft.payroll_components && currentDraft.payroll_components.length > 0 ? (
                          currentDraft.payroll_components.map((component, index) => {
                            const componentDetails = getComponentDetails(
                              component.salary_components_id,
                              salaryComponents,
                            )

                            let calculatedAmount = 0
                            if (component.amount !== null) {
                              calculatedAmount = component.amount
                            } else if (component.percentage) {
                              if (component.is_based_on_annual_ctc) {
                                calculatedAmount = (currentDraft.based_anual_ctc * component.percentage) / 100 / 12
                              } else if (component.is_based_on_basic_pay) {
                                // Find basic pay component
                                const basicPayComponent = currentDraft.payroll_components.find(
                                  (c) => c.salary_components_id === 1,
                                )
                                if (basicPayComponent && basicPayComponent.percentage) {
                                  const basicPay =
                                    (currentDraft.based_anual_ctc * basicPayComponent.percentage) / 100 / 12
                                  calculatedAmount = (basicPay * component.percentage) / 100
                                }
                              }
                            }

                            return (
                              <TableRow key={index}>
                                <TableCell>{component.payslip_name}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      componentDetails.component_type === "earning"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-red-50 text-red-700"
                                    }
                                  >
                                    {componentDetails.component_type || "Unknown"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {component.amount !== null ? `₹${component.amount.toLocaleString()}` : "-"}
                                </TableCell>
                                <TableCell>{component.percentage ? `${component.percentage}%` : "-"}</TableCell>
                                <TableCell>
                                  {component.is_based_on_annual_ctc
                                    ? "Annual CTC"
                                    : component.is_based_on_basic_pay
                                      ? "Basic Pay"
                                      : "-"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  ₹{calculatedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              Loading components...
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="pt-4">
                  {(() => {
                    const { earnings, deductions, netPay } = calculatePayrollSummary(currentDraft)

                    return (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold text-green-600">
                                ₹{earnings.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-gray-500">Total Deductions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold text-red-600">
                                ₹{deductions.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-gray-500">Net Pay</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold">
                                ₹{netPay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {currentDraft.status !== "paid" && (
                          <div className="rounded-md border p-4">
                            <h4 className="font-medium mb-4">Payment Details</h4>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmitDraftUpdate)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="template_name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Payslip Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter payslip name"
                                          {...field}
                                          value={field.value || currentDraft.template_name}
                                          disabled={currentDraft?.status === "paid"}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="notes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Notes</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Add any notes for this payslip"
                                          {...field}
                                          value={field.value || ""}
                                          disabled={currentDraft?.status === "paid"}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="status"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Status</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value || currentDraft.status}
                                        disabled={currentDraft?.status === "paid"}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="draft">Draft</SelectItem>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="processing">Processing</SelectItem>
                                          <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                          <SelectItem value="paid">Paid</SelectItem>
                                          <SelectItem value="failed">Failed</SelectItem>
                                          <SelectItem value="cancelled">Cancelled</SelectItem>
                                          <SelectItem value="on_hold">On Hold</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="flex justify-end gap-2 pt-2">
                                  <Button
                                    type="submit"
                                    variant={form.getValues("status") === "paid" ? "default" : "outline"}
                                    disabled={isUpdatingDraft || (currentDraft?.status as string) === "paid"}
                                  >
                                    {isUpdatingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Status
                                  </Button>
                                  {form.getValues("status") !== "paid" && (currentDraft?.status as string) !== "paid" && (
                                    <Button
                                      type="button"
                                      onClick={() => {
                                        form.setValue("status", "paid")
                                        form.handleSubmit(onSubmitDraftUpdate)()
                                      }}
                                      disabled={isUpdatingDraft}
                                    >
                                      Mark as Paid
                                    </Button>
                                  )}
                                </div>
                              </form>
                            </Form>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p>No draft data available.</p>
            </div>
          )}

          {currentDraft?.status === "paid" && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Paid Status</AlertTitle>
              <AlertDescription>This payslip has been marked as paid and cannot be modified.</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDraftDialogClose(false)}>
              Close
            </Button>
            {currentDraft?.status === "paid" ? (
              <Button variant="outline" onClick={handlePrintPayslip}>
                <Printer className="mr-2 h-4 w-4" />
                Print Payslip
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  form.setValue("status", "paid")
                  form.handleSubmit(onSubmitDraftUpdate)()
                }}
                disabled={isUpdatingDraft || !currentDraft}
              >
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
