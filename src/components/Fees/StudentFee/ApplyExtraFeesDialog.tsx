import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useApplyExtraFeesPlanOnStudentFeesPlanMutation, useLazyGetAllFeesTypeQuery } from "@/services/feesService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { toast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, Info, Plus } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, addMonths } from "date-fns"
import { NumberInput } from "@/components/ui/NumberInput"
import type { RequestForApplyExtraFees } from "@/types/fees"

// Define the installment types
const installmentTypes = [
  { value: "Monthly", label: "Monthly", maxInstallments: 12 },
  { value: "Quarterly", label: "Quarterly", maxInstallments: 4 },
  { value: "Half Yearly", label: "Half-Yearly", maxInstallments: 2 },
  { value: "Yearly", label: "Yearly", maxInstallments: 1 },
  { value: "Admission", label: "One-time (Admission)", maxInstallments: 1 },
]

// Form schema for extra fees
const extraFeesSchema = z.object({
  fees_type_id: z.number({ required_error: "Please select a fee type" }),
  installment_type: z.string({ required_error: "Please select an installment type" }),
  total_installment: z.union([
    z.string().refine(
      (val) => {
        const num = Number.parseInt(val, 10)
        return !isNaN(num) && num >= 1 && num <= 12
      },
      { message: "Must be between 1 and 12 installments" },
    ),
    z.number().min(1).max(12),
  ]),
  total_amount: z.union([
    z.string().refine(
      (val) => {
        const num = Number.parseInt(val, 10)
        return !isNaN(num) && num >= 1 && num <= 1000000
      },
      { message: "Amount must be between 1 and 10,00,000" },
    ),
    z.number().min(1).max(1000000),
  ]),
  installment_breakDowns: z
    .array(
      z.object({
        installment_no: z.number(),
        due_date: z.string(),
        installment_amount: z.union([
          z.string().refine(
            (val) => {
              const num = Number.parseInt(val, 10)
              return !isNaN(num) && num >= 0 && num <= 1000000
            },
            { message: "Amount must be between 0 and 10,00,000" },
          ),
          z.number().min(0).max(1000000),
        ]),
      }),
    )
    .refine(
      (data) => {
        // Validate that sum of installment amounts equals total amount
        const totalAmount =
          typeof data[0]?.installment_amount === "string"
            ? Number.parseFloat(
                data
                  .reduce((sum, item) => sum + Number.parseFloat((item.installment_amount as string) || "0"), 0)
                  .toFixed(2),
              )
            : data.reduce((sum, item) => sum + ((item.installment_amount as number) || 0), 0)

        const formTotalAmount =
          typeof form?.getValues().total_amount === "string"
            ? Number.parseFloat(form.getValues().total_amount || "0")
            : form?.getValues().total_amount || 0

        return Math.abs(totalAmount - formTotalAmount) < 0.01 // Allow for small floating point differences
      },
      {
        message: "Sum of installment amounts must equal total amount",
      },
    ),
})

type ExtraFeesFormValues = z.infer<typeof extraFeesSchema>

// Form component props
interface ApplyExtraFeesDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  studentId: number
  feesPlanId: number
  enrolled_academic_session_id : number
}

// Global form variable for use in schema refinement
let form: any = null

const ApplyExtraFeesDialog: React.FC<ApplyExtraFeesDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studentId,
  feesPlanId,
  enrolled_academic_session_id
}) => {
  const { t } = useTranslation()
  const [formError, setFormError] = useState<string | null>(null)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [applyExtraFees, { isLoading: isApplyingExtraFees }] = useApplyExtraFeesPlanOnStudentFeesPlanMutation()
  const [getAllFeesType, { data: feesTypes, isLoading: isLoadingFeesTypes }] = useLazyGetAllFeesTypeQuery()

  // Initialize form
  const formInstance = useForm<ExtraFeesFormValues>({
    resolver: zodResolver(extraFeesSchema),
    defaultValues: {
      fees_type_id: 0,
      installment_type: "",
      total_installment: "1",
      total_amount: "0",
      installment_breakDowns: [],
    },
  })

  // Set global form variable for schema refinement
  form = formInstance

  // Watch form values for changes
  const installmentType = formInstance.watch("installment_type")
  const totalInstallments = formInstance.watch("total_installment")
  const totalAmount = formInstance.watch("total_amount")

  // Generate empty installment breakdowns based on count
  const generateEmptyInstallmentBreakdowns = (count: number, installmentType: string) => {
    const breakdowns = []
    let startDate = new Date()

    // Set appropriate start date based on installment type
    if (installmentType === "Monthly") {
      startDate = addMonths(new Date(), 1)
    } else if (installmentType === "Quarterly") {
      const currentMonth = startDate.getMonth()
      const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3
      startDate = new Date(startDate.getFullYear(), nextQuarterMonth, 1)
    } else if (installmentType === "Half Yearly") {
      const currentMonth = startDate.getMonth()
      const nextHalfYear = currentMonth < 6 ? 6 : 0
      startDate = new Date(startDate.getFullYear() + (nextHalfYear === 0 ? 1 : 0), nextHalfYear, 1)
    } else if (installmentType === "Yearly") {
      startDate = new Date(startDate.getFullYear() + 1, 0, 1)
    } else if (installmentType === "Admission") {
      startDate = new Date()
    }

    for (let i = 0; i < count; i++) {
      let dueDate

      if (installmentType === "Monthly") {
        dueDate = addMonths(startDate, i)
      } else if (installmentType === "Quarterly") {
        dueDate = addMonths(startDate, i * 3)
      } else if (installmentType === "Half Yearly") {
        dueDate = addMonths(startDate, i * 6)
      } else if (installmentType === "Yearly") {
        dueDate = addMonths(startDate, i * 12)
      } else {
        dueDate = startDate
      }

      breakdowns.push({
        installment_no: i + 1,
        due_date: format(dueDate, "yyyy-MM-dd"),
        installment_amount: "0",
      })
    }

    return breakdowns
  }

  // Distribute total amount evenly across installments
  const distributeAmount = () => {
    const numInstallments =
      typeof totalInstallments === "string" ? Number.parseInt(totalInstallments, 10) : totalInstallments

    const amount = typeof totalAmount === "string" ? Number.parseFloat(totalAmount) : totalAmount

    if (!numInstallments || !amount) return

    // Calculate base amount per installment (truncated to 2 decimal places)
    const baseAmount = Math.floor((amount * 100) / numInstallments) / 100

    // Calculate the total of all base amounts
    const baseTotal = Number((baseAmount * numInstallments).toFixed(2))

    // Calculate the remainder (what's left after distributing the base amount)
    const remainder = Number((amount - baseTotal).toFixed(2))

    // Convert remainder to cents for easier distribution
    let remainderCents = Math.round(remainder * 100)

    // Get current breakdowns
    const currentBreakdowns = formInstance.getValues("installment_breakDowns")

    // Create updated breakdowns with distributed amounts
    const updatedBreakdowns = currentBreakdowns.map((breakdown, idx) => {
      // If there's remainder to distribute and we're not at the last item
      if (remainderCents > 0 && idx < numInstallments) {
        // Add 1 cent to this installment
        const adjustedAmount = baseAmount + 0.01
        remainderCents--
        return {
          ...breakdown,
          installment_amount: adjustedAmount.toFixed(2),
        }
      }

      return {
        ...breakdown,
        installment_amount: baseAmount.toFixed(2),
      }
    })

    // Double-check the total to ensure it matches exactly
    const distributedTotal = updatedBreakdowns.reduce((sum, item) => sum + Number(item.installment_amount), 0)

    // If there's still a tiny difference due to floating point precision, adjust the last installment
    if (Math.abs(distributedTotal - amount) > 0.001) {
      const diff = Number((amount - distributedTotal).toFixed(2))
      const lastIdx = updatedBreakdowns.length - 1
      const lastAmount = Number(updatedBreakdowns[lastIdx].installment_amount)
      updatedBreakdowns[lastIdx].installment_amount = (lastAmount + diff).toFixed(2)
    }

    // Update form with distributed amounts
    formInstance.setValue("installment_breakDowns", updatedBreakdowns, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  // Handle installment type change
  const handleInstallmentTypeChange = (value: string) => {
    formInstance.setValue("installment_type", value)

    // Find the max installments for this type
    const typeConfig = installmentTypes.find((type) => type.value === value)
    const maxInstallments = typeConfig?.maxInstallments || 12

    // Set default installment count based on type
    let defaultCount = maxInstallments
    if (value === "Yearly" || value === "Admission") {
      defaultCount = 1
    }

    formInstance.setValue("total_installment", defaultCount.toString())

    // Generate empty installment breakdowns
    const breakdowns = generateEmptyInstallmentBreakdowns(defaultCount, value)
    formInstance.setValue("installment_breakDowns", breakdowns)
  }

  // Handle installment count change
  const handleInstallmentCountChange = (value: string) => {
    const count = Number.parseInt(value, 10)
    if (isNaN(count) || count < 1) return

    formInstance.setValue("total_installment", value)

    // Generate empty installment breakdowns
    const breakdowns = generateEmptyInstallmentBreakdowns(count, installmentType)
    formInstance.setValue("installment_breakDowns", breakdowns)
  }

  // Handle form submission
  const onSubmit = async (values: ExtraFeesFormValues) => {
    setFormError(null)

    if (!currentAcademicSession) {
      setFormError("No active academic session found")
      return
    }

    try {
      const payload: RequestForApplyExtraFees = {
        student_id: studentId,
        academic_session_id: enrolled_academic_session_id ?? currentAcademicSession.id,
        fees_plan_id: feesPlanId,
        fees_type_id: values.fees_type_id,
        installment_type: values.installment_type as any,
        total_installment:
          typeof values.total_installment === "string"
            ? Number.parseInt(values.total_installment, 10)
            : values.total_installment,
        total_amount:
          typeof values.total_amount === "string" ? Number.parseFloat(values.total_amount) : values.total_amount,
        installment_breakDowns: values.installment_breakDowns.map((breakdown) => ({
          installment_no: breakdown.installment_no,
          due_date: breakdown.due_date,
          installment_amount:
            typeof breakdown.installment_amount === "string"
              ? Number.parseFloat(breakdown.installment_amount)
              : breakdown.installment_amount,
        })),
      }

      const response = await applyExtraFees({ payload }).unwrap()

      if (response) {
        toast({
          title: t("success"),
          description: t("extra_fees_applied_successfully"),
        })
        onSuccess()
        onClose()
      } else {
        setFormError("Failed to apply extra fees. Please try again.")
      }
    } catch (error : any) {
        toast({
          variant: "destructive", 
          title: t("failed_to_apply_extra_fees"),
          description: error?.data?.message || t("failed_to_apply_extra_fees"),
        })
    //   console.error("Error applying extra fees:", error)
      setFormError(error?.data?.message ?? "An unexpected error occurred. Please try again.")
    }
  }

  // Fetch fee types on component mount
  useEffect(() => {
    if (isOpen && currentAcademicSession) {
      getAllFeesType({
        academic_session_id: enrolled_academic_session_id ?? currentAcademicSession.id,
        applicable_to: "student",
      })
    }
  }, [isOpen, currentAcademicSession, getAllFeesType])

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormError(null)
      formInstance.reset({
        fees_type_id: 0,
        installment_type: "",
        total_installment: "1",
        total_amount: "0",
        installment_breakDowns: [],
      })
    }
  }, [isOpen, formInstance])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Apply Extra Fees
          </DialogTitle>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-700">About Extra Fees</AlertTitle>
          <AlertDescription className="text-blue-600">
            Extra fees are additional charges applied to a student outside of their regular fee plan. These can include
            special activities, materials, or other one-time charges.
          </AlertDescription>
        </Alert>

        <Form {...formInstance}>
          <form onSubmit={formInstance.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={formInstance.control}
                name="fees_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number.parseInt(value, 10))}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingFeesTypes ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : feesTypes && feesTypes.length > 0 ? (
                          feesTypes.map((feeType) => (
                            <SelectItem key={feeType.id} value={feeType.id.toString()}>
                              {feeType.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No fee types found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formInstance.control}
                name="installment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installment Type</FormLabel>
                    <Select onValueChange={handleInstallmentTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select installment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {installmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formInstance.control}
                name="total_installment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Installments</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        {...field}
                        onChange={(e) => handleInstallmentCountChange(e.target.value)}
                        disabled={installmentType === "Yearly" || installmentType === "Admission"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formInstance.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <NumberInput
                        decimal={true}
                        value={field.value.toString()}
                        onChange={(value) => {
                          field.onChange(value)
                          // Reset installment amounts when total changes
                          const breakdowns = formInstance.getValues("installment_breakDowns")
                          if (breakdowns.length > 0) {
                            const resetBreakdowns = breakdowns.map((breakdown) => ({
                              ...breakdown,
                              installment_amount: "0",
                            }))
                            formInstance.setValue("installment_breakDowns", resetBreakdowns)
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {formInstance.getValues("installment_breakDowns").length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Installment Breakdown</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={distributeAmount}
                    disabled={!totalAmount || Number(totalAmount) <= 0}
                  >
                    Distribute Amount Evenly
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Installment #</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formInstance.getValues("installment_breakDowns").map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Controller
                              control={formInstance.control}
                              name={`installment_breakDowns.${index}.due_date`}
                              render={({ field }) => <Input type="date" {...field} className="w-full" />}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              control={formInstance.control}
                              name={`installment_breakDowns.${index}.installment_amount`}
                              render={({ field }) => (
                                <NumberInput
                                  decimal={true}
                                  value={field.value.toString()}
                                  onChange={field.onChange}
                                  className="w-full"
                                />
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Show total of installment amounts */}
                <div className="text-right text-sm">
                  Total: ₹
                  {formInstance
                    .getValues("installment_breakDowns")
                    .reduce((sum, item) => sum + Number(item.installment_amount || 0), 0)
                    .toFixed(2)}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isApplyingExtraFees}>
                {isApplyingExtraFees && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Extra Fees
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ApplyExtraFeesDialog
