import type React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Loader2, Receipt, AlertCircle, Info, CheckCircle2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import type { InstallmentBreakdown, AppliedConcessioinToStudent, FeePaymentRequest } from "@/types/fees"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetAllConcessionsQuery, usePayMultipleInstallmentsMutation } from "@/services/feesService"
import { Switch } from "@/components/ui/switch"
import { NumberInput } from "@/components/ui/NumberInput"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"

// Extended interface for installment breakdown with additional fields
interface ExtendedInstallmentBreakdown extends InstallmentBreakdown {
  original_amount?: string
  discounted_amount?: string
  paid_amount?: string
  remaining_amount?: string
  carry_forward_amount?: string
  payment_status?: string
  is_paid?: boolean
  payment_date?: string | null
  transaction_reference?: string | null
  amount_paid_as_carry_forward?: string
  applied_concession?:
  | {
    concession_id: number
    applied_amount: number
  }[]
  | null
}

// Update the payment form schema to include cheque as a payment option
const feePaymentSchema = z.object({
  payment_mode: z.enum(['Cash', 'Online', 'Bank Transfer', 'Cheque', 'UPI', 'Full Discount'], {
    required_error: "Payment mode is required",
  }),
  transaction_reference: z.string().optional(),
  payment_date: z.string().min(1, "Payment date is required"),
  remarks: z.string().optional(),
  apply_concession: z.boolean().default(false),
  use_carry_forward: z.boolean().default(false),
  pay_full_amount: z.boolean().default(true),
})

// Update the props interface to use the extended type
interface PayFeesDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccessfulSubmit: () => void
  enrolled_academic_session_id : number
  installments: ExtendedInstallmentBreakdown[]
  studentId: number
  totalAmount: number
  studentConcessions?: AppliedConcessioinToStudent[]
  planConcessions?: any[]
  availableConcessionBalance?: {
    student_concession: number
    plan_concession: number
  }
}

const PayFeesDialog: React.FC<PayFeesDialogProps> = ({
  isOpen,
  onClose,
  onSuccessfulSubmit,
  installments,
  studentId,
  totalAmount,
  studentConcessions = [],
  planConcessions = [],
  enrolled_academic_session_id,
  availableConcessionBalance = { student_concession: 0, plan_concession: 0 },
}) => {
  const { t } = useTranslation()

  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  // Fetch concession types from API
  const { data: concessionTypes, isLoading: isLoadingConcessionTypes } = useGetAllConcessionsQuery(
    { academic_session_id: CurrentAcademicSessionForSchool!.id },
    { skip: !CurrentAcademicSessionForSchool!.id },
  )

  const [payInstallments, { isLoading: isPaymentProcessing }] = usePayMultipleInstallmentsMutation()
  const [discountedAmounts, setDiscountedAmounts] = useState<Record<number, number>>({})
  const [totalDiscountApplied, setTotalDiscountApplied] = useState(0)
  const [finalPaymentAmount, setFinalPaymentAmount] = useState(totalAmount)
  const [partialPaymentAmounts, setPartialPaymentAmounts] = useState<Record<number, number>>({})
  const [remainingAmounts, setRemainingAmounts] = useState<Record<number, number>>({})
  const [carryForwardAmounts, setCarryForwardAmounts] = useState<Record<number, number>>({})

  const form = useForm<z.infer<typeof feePaymentSchema>>({
    resolver: zodResolver(feePaymentSchema),
    defaultValues: {
      payment_mode: "Cash",
      transaction_reference: "",
      payment_date: new Date().toISOString().split("T")[0],
      remarks: "",
      apply_concession: false,
      use_carry_forward: false,
      pay_full_amount: true,
    },
  })


  // Get concession name from ID using the API data
  const getConcessionNameFromId = (concessionId: number): string => {
    if (!concessionId) return t("unknown_concession")

    // First check if we have the concession in our API data
    if (concessionTypes && concessionTypes.length > 0) {
      const concession = concessionTypes.find((type) => type.id === concessionId)
      if (concession) {
        return concession.name
      }
    }

    // Fallback to a generic name with the ID
    return `${t("concession")} ${concessionId}`
  }

  // Watch for form field changes
  const applyConcession = form.watch("apply_concession")
  const useCarryForward = form.watch("use_carry_forward")
  const payFullAmount = form.watch("pay_full_amount")

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "₹0.00"
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Initialize payment amounts when installments change
  useEffect(() => {
    const initialPartialAmounts: Record<number, number> = {}
    const initialRemainingAmounts: Record<number, number> = {}
    const initialCarryForwardAmounts: Record<number, number> = {}

    installments.forEach((installment) => {
      const amount = Number(installment.installment_amount || 0)
      const discountedAmount = Number(installment.discounted_amount || 0)
      const payableAmount = amount - discountedAmount

      initialPartialAmounts[installment.id] = payableAmount
      initialRemainingAmounts[installment.id] = 0

      // Initialize carry forward amounts if available
      const carryForward = Number(installment.carry_forward_amount || 0)
      if (carryForward > 0) {
        initialCarryForwardAmounts[installment.id] = carryForward
      } else {
        initialCarryForwardAmounts[installment.id] = 0
      }
    })

    setPartialPaymentAmounts(initialPartialAmounts)
    setRemainingAmounts(initialRemainingAmounts)
    setCarryForwardAmounts(initialCarryForwardAmounts)
  }, [installments])

  // Update discount amount for an installment
  const updateDiscountAmount = (installmentId: number, amount: string) => {
    const numAmount = Number(amount) || 0

    // Ensure discount doesn't exceed installment amount
    const installment = installments.find((i) => i.id === installmentId)
    if (installment) {
      const maxDiscount = Number(installment.installment_amount)
      const validAmount = Math.min(numAmount, maxDiscount)

      setDiscountedAmounts((prev) => ({
        ...prev,
        [installmentId]: validAmount,
      }))
    }
  }

  // Update partial payment amount
  const updatePartialPaymentAmount = (installmentId: number, amount: string) => {
    const numAmount = Number(amount) || 0
    const installment = installments.find((i) => i.id === installmentId)

    if (installment) {
      const originalAmount = Number(installment.installment_amount || 0)
      const discountAmount = Number(installment.discounted_amount || 0) + (discountedAmounts[installmentId] || 0)
      const maxPayable = originalAmount - discountAmount

      // Ensure partial payment doesn't exceed payable amount
      const validAmount = Math.min(numAmount, maxPayable)

      setPartialPaymentAmounts((prev) => ({
        ...prev,
        [installmentId]: validAmount,
      }))

      // Update remaining amount
      setRemainingAmounts((prev) => ({
        ...prev,
        [installmentId]: maxPayable - validAmount,
      }))
    }
  }

  // Update carry forward amount
  const updateCarryForwardAmount = (installmentId: number, amount: string) => {
    const numAmount = Number(amount) || 0
    const installment = installments.find((i) => i.id === installmentId)

    if (installment) {
      const maxCarryForward = Number(installment.carry_forward_amount || 0)

      // Ensure carry forward doesn't exceed available amount
      const validAmount = Math.min(numAmount, maxCarryForward)

      setCarryForwardAmounts((prev) => ({
        ...prev,
        [installmentId]: validAmount,
      }))
    }
  }

  // Calculate total discount and final payment amount
  useEffect(() => {
    let totalDiscount = 0
    let finalAmount = 0

    installments.forEach((installment) => {
      // Get the original amount
      const originalAmount = Number(installment.installment_amount || 0)

      // Get the pre-applied discount (if any)
      const preAppliedDiscount = Number(installment.discounted_amount || 0)

      // Get additional discount for this installment
      const additionalDiscount = discountedAmounts[installment.id] || 0

      // Calculate total discount
      const totalInstallmentDiscount = preAppliedDiscount + additionalDiscount
      totalDiscount += additionalDiscount

      if (payFullAmount) {
        // Full payment calculation
        finalAmount += originalAmount - totalInstallmentDiscount
      } else {
        // Partial payment calculation
        finalAmount += partialPaymentAmounts[installment.id] || 0
      }

      // Add carry forward if enabled
      if (useCarryForward) {
        finalAmount += carryForwardAmounts[installment.id] || 0
      }
    })

    setTotalDiscountApplied(totalDiscount)
    setFinalPaymentAmount(finalAmount)
  }, [discountedAmounts, installments, partialPaymentAmounts, payFullAmount, useCarryForward, carryForwardAmounts])

  // Reset discounted amounts when dialog opens/closes or when apply_concession changes
  useEffect(() => {
    if (!applyConcession) {
      setDiscountedAmounts({})
    }
  }, [applyConcession, isOpen])

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingPaymentValues, setPendingPaymentValues] = useState<z.infer<typeof feePaymentSchema> | null>(null)

  // Intercept submit to show confirmation dialog
  const handleSubmit = async (values: z.infer<typeof feePaymentSchema>) => {
    setPendingPaymentValues(values)
    setShowConfirmDialog(true)
  }

  // Actual payment logic, called after confirmation
  const handleConfirmedPayment = async () => {
    if (!pendingPaymentValues) return
    try {
      // Create an array of payment objects for each installment
      const installmentPayments: FeePaymentRequest[] = installments.map((installment: any) => {
        // Get the original amount
        const originalAmount = Number(installment.installment_amount || 0)

        // Get the pre-applied discount (if any)
        const preAppliedDiscount = Number(installment.discounted_amount || 0)

        // Get additional discount applied in this dialog
        const additionalDiscount = discountedAmounts[installment.id] || 0

        // Calculate total discount
        const totalDiscount = preAppliedDiscount + additionalDiscount

        // Calculate paid amount based on full or partial payment
        let paidAmount = 0
        let remainingAmount = 0
        let carryForwardAmount = 0

        // Check if this is a carry-forward payment for an already paid installment
        const isCarryForwardPayment = installment.is_paid && Number(installment.carry_forward_amount || 0) > 0

        if (isCarryForwardPayment) {
          // For carry-forward payments, set paid_amount, discounted_amount, and remaining_amount to 0
          paidAmount = 0
          remainingAmount = 0
          // Use the carry-forward amount from the installment
          carryForwardAmount = carryForwardAmounts[installment.id] || Number(installment.carry_forward_amount || 0)
        } else if (pendingPaymentValues.pay_full_amount) {
          paidAmount = originalAmount - totalDiscount
          remainingAmount = 0
        } else {
          paidAmount = partialPaymentAmounts[installment.id] || 0
          remainingAmount = remainingAmounts[installment.id] || 0

          // If user is paying less than the full amount, the difference becomes carry forward
          // Only if they've explicitly chosen to use carry forward
          if (pendingPaymentValues.use_carry_forward) {
            carryForwardAmount = originalAmount - totalDiscount - paidAmount - remainingAmount
            if (carryForwardAmount < 0) carryForwardAmount = 0
          }
        }

        // Add existing carry forward amount if enabled and not already a carry-forward payment
        if (!isCarryForwardPayment && pendingPaymentValues.use_carry_forward && Number(installment.carry_forward_amount || 0) > 0) {
          carryForwardAmount += carryForwardAmounts[installment.id] || 0
        }

        // Prepare applied concessions array
        let appliedConcessions = null

        // First, check if the installment already has applied concessions
        if (installment.applied_concession && installment.applied_concession.length > 0) {
          // Always include existing concessions, regardless of whether new ones are being added
          appliedConcessions = [...installment.applied_concession]
        }

        // Now add new concessions if additional discount is being applied and not a carry-forward payment
        if (!isCarryForwardPayment && additionalDiscount > 0 && studentConcessions && studentConcessions.length > 0) {
          // Initialize the array if it doesn't exist yet
          if (!appliedConcessions) {
            appliedConcessions = []
          }

          // Find applicable concessions for this fee type
          const applicableConcessions = studentConcessions.filter(
            (concession) => !concession.fees_type_id || concession.fees_type_id === installment.fee_plan_details_id,
          )

          if (applicableConcessions.length > 0) {
            // Apply the first applicable concession
            const concession = applicableConcessions[0]
            appliedConcessions.push({
              concession_id: concession.concession_id,
              applied_amount: additionalDiscount,
            })
          }
        }

        // Verify that paid_amount + discounted_amount + remaining_amount = original_amount
        // Skip this check for carry-forward payments
        if (!isCarryForwardPayment) {
          const totalAccountedFor = paidAmount + totalDiscount + remainingAmount
          if (Math.abs(totalAccountedFor - originalAmount) > 0.01) {
            // Adjust remaining amount to ensure the equation balances
            remainingAmount = originalAmount - paidAmount - totalDiscount
          }
        }

        return {
          fee_plan_details_id: installment.fee_plan_details_id,
          installment_id: installment.id,
          paid_amount: paidAmount,
          discounted_amount: isCarryForwardPayment ? 0 : totalDiscount,
          paid_as_refund: false,
          refunded_amount: 0,
          payment_mode: pendingPaymentValues.payment_mode,
          transaction_reference: pendingPaymentValues.transaction_reference || "",
          payment_date: pendingPaymentValues.payment_date,
          remarks: pendingPaymentValues.remarks || "",
          remaining_amount: remainingAmount,
          amount_paid_as_carry_forward: carryForwardAmount,
          applied_concessions: appliedConcessions,
          repaid_installment: Boolean(installment.is_paid) || isCarryForwardPayment,
        }
      })

      // Create the final payment request object
      const paymentRequest = {
        student_id: studentId,
        installments: installmentPayments,
        academic_session_id : enrolled_academic_session_id ?? CurrentAcademicSessionForSchool!.id,
      }

      console.log("Payment request:", paymentRequest)

      // Send payment request to API
      await payInstallments(paymentRequest).unwrap()

      toast({
        title: "Payment Successful",
        description: `Payment of ${formatCurrency(finalPaymentAmount)} has been recorded.`,
      })

      setShowConfirmDialog(false)
      setPendingPaymentValues(null)
      onSuccessfulSubmit()
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
      })
    }
  }

  // Calculate total available concession
  const totalAvailableConcession =
    availableConcessionBalance.student_concession + availableConcessionBalance.plan_concession

  // Calculate total carry forward available
  const totalCarryForwardAvailable = installments.reduce((total, installment) => {
    return total + Number(installment.carry_forward_amount || 0)
  }, 0)

  return (
    <>
      {/* Main Payment Dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Receipt className="mr-2 h-5 w-5" />
              {t("process_fee_payment")}
            </DialogTitle>
          </DialogHeader>

          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <p className="text-sm text-blue-700 font-medium">
              {t("payment_amount")}: <span className="font-bold">{formatCurrency(totalAmount)}</span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              For {installments.length} installment{installments.length !== 1 ? "s" : ""}
            </p>

            {totalAvailableConcession > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                  {t("available_concession_balance")}:{" "}
                  <span className="font-semibold">{formatCurrency(totalAvailableConcession)}</span>
                </p>
                {availableConcessionBalance.student_concession > 0 && (
                  <p className="text-xs text-blue-600">
                    {t("student_concession")}: {formatCurrency(availableConcessionBalance.student_concession)}
                  </p>
                )}
                {availableConcessionBalance.plan_concession > 0 && (
                  <p className="text-xs text-blue-600">
                    {t("plan_concession")}: {formatCurrency(availableConcessionBalance.plan_concession)}
                  </p>
                )}
              </div>
            )}

            {totalCarryForwardAvailable > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                  {t("available_carry_forward")}:{" "}
                  <span className="font-semibold">{formatCurrency(totalCarryForwardAvailable)}</span>
                </p>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="payment_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_mode")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">{t("cash")}</SelectItem>
                        <SelectItem value="Online">{t("online")}</SelectItem>
                        <SelectItem value="Bank Transfer">{t("bank_transfer")}</SelectItem>
                        <SelectItem value="Cheque">{t("cheque")}</SelectItem>
                        <SelectItem value="Full Discount">{t("full Discount")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transaction_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("transaction_reference")} (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("enter_reference_number")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_date")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("remarks")} (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("add_any_additional_notes")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4 rounded-md border p-4">
                <FormField
                  control={form.control}
                  name="pay_full_amount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>{t("pay_full_amount")}</FormLabel>
                        <FormDescription>{t("pay_the_entire_installment_amount")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

              {totalCarryForwardAvailable > 0 && (
                <FormField
                  control={form.control}
                  name="use_carry_forward"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>{t("use_carry_forward")}</FormLabel>
                        <FormDescription>{t("apply_carry_forward_amount_from_previous_installments")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            {installments.some(
              (installment) => installment.is_paid && Number(installment.carry_forward_amount || 0) > 0,
            ) && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">{t("carry_forward_payment")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>{t("carry_forward_payment")}</AlertTitle>
                      <AlertDescription>
                        {t("you_are_paying_carry_forward_amount_for_installments_that_have_already_been_paid")}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3 mt-4">
                      {installments
                        .filter((installment) => installment.is_paid && Number(installment.carry_forward_amount || 0) > 0)
                        .map((installment) => (
                          <div key={installment.id} className="bg-blue-50 p-3 rounded-md">
                            <p className="font-medium">
                              {t("installment")} #{installment.installment_no}
                            </p>
                            <p className="text-sm text-blue-700">
                              {t("carry_forward_amount")}: {formatCurrency(installment.carry_forward_amount)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("this_amount_will_be_paid_as_carry_forward_for_future_installments")}
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            {!payFullAmount && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("partial_payment_details")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t("partial_payment")}</AlertTitle>
                    <AlertDescription>
                      {t("enter_the_amount_you_want_to_pay_for_each_installment._remaining_amount_will_be_due.")}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {installments.map((installment) => {
                      const originalAmount = Number(installment.installment_amount || 0)
                      const preAppliedDiscount = Number(installment.discounted_amount || 0)
                      const additionalDiscount = discountedAmounts[installment.id] || 0
                      const totalDiscount = preAppliedDiscount + additionalDiscount
                      const maxPayable = originalAmount - totalDiscount

                      return (
                        <div key={installment.id} className="grid grid-cols-2 gap-4 items-center border-b pb-3">
                          <div>
                            <p className="font-medium text-sm">
                              {t("installment")} #{installment.installment_no}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("payable_amount")}: {formatCurrency(maxPayable)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Amount to pay"
                                value={partialPaymentAmounts[installment.id] || ""}
                                onChange={(e) => updatePartialPaymentAmount(installment.id, e.target.value)}
                                className="w-full"
                                min="0"
                                max={maxPayable}
                              />
                            </div>
                            {remainingAmounts[installment.id] > 0 && (
                              <p className="text-xs text-amber-600 mt-1">
                                {t("remaining")}: {formatCurrency(remainingAmounts[installment.id])}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            {applyConcession && totalAvailableConcession > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("apply_concession_to_installments")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("concession_application")}</AlertTitle>
                    <AlertDescription>
                      {t(
                        "enter_the_discount_amount_for_each_installment._total_discount_cannot_exceed_your_available_concession_balance_of",
                      )}{" "}
                      {formatCurrency(totalAvailableConcession)}.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {installments.map((installment) => {
                      const originalAmount = Number(installment.installment_amount || 0)
                      const preAppliedDiscount = Number(installment.discounted_amount || 0)
                      const alreadyDiscountedAmount = originalAmount - preAppliedDiscount
                      const isCarryForwardPayment =
                        installment.is_paid && Number(installment.carry_forward_amount || 0) > 0

                      // Skip carry-forward payments for concession application
                      if (isCarryForwardPayment) {
                        return (
                          <div
                            key={installment.id}
                            className="grid grid-cols-2 gap-4 items-center border-b pb-3 bg-blue-50 p-2 rounded"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {t("installment")} #{installment.installment_no}
                              </p>
                              <p className="text-xs text-blue-600">
                                {t("carry_forward_payment")} - {t("concessions_not_applicable")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-600">
                                {t("carry_forward_amount")}: {formatCurrency(installment.carry_forward_amount)}
                              </p>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={installment.id} className="grid grid-cols-2 gap-4 items-center border-b pb-3">
                          <div>
                            <p className="font-medium text-sm">
                              {t("installment")} #{installment.installment_no}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("original_amount")}: {formatCurrency(originalAmount)}
                            </p>
                            {preAppliedDiscount > 0 && (
                              <p className="text-xs text-green-600">
                                {t("already_discounted")}: {formatCurrency(preAppliedDiscount)}
                              </p>
                            )}
                            {installment.applied_concession && installment.applied_concession.length > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                {installment.applied_concession.map((concession, idx) => (
                                  <div key={idx} className="flex items-center">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    <span>
                                      Concession: {getConcessionNameFromId(concession.concession_id)} ({formatCurrency(concession.applied_amount)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Additional discount"
                                value={discountedAmounts[installment.id] || ""}
                                onChange={(e) => updateDiscountAmount(installment.id, e.target.value)}
                                className="w-full"
                                min="0"
                                max={alreadyDiscountedAmount}
                              />
                            </div>
                            {discountedAmounts[installment.id] > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                {t("final_amount")}:{" "}
                                {formatCurrency(alreadyDiscountedAmount - (discountedAmounts[installment.id] || 0))}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {totalDiscountApplied > 0 && (
                    <div className="bg-green-50 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-700">{t("total_discount_applied")}:</span>
                        <span className="text-sm font-bold text-green-700">{formatCurrency(totalDiscountApplied)}</span>
                      </div>

                      {totalDiscountApplied > totalAvailableConcession && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>{t("discount_exceeds_available_balance")}</AlertTitle>
                          <AlertDescription>
                            {t(
                              "the_total_discount_amount_exceeds_your_available_concession_balance._please_reduce_the_discount_amount.",
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {useCarryForward && totalCarryForwardAvailable > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("apply_carry_forward_amount")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t("carry_forward_application")}</AlertTitle>
                    <AlertDescription>
                      {t("specify_how_much_of_the_carry_forward_amount_you_want_to_apply_to_this_payment.")}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {installments.map((installment) => {
                      const carryForwardAmount = Number(installment.carry_forward_amount || 0)
                      const isCarryForwardPayment = installment.is_paid && carryForwardAmount > 0

                      if (carryForwardAmount <= 0) return null

                      return (
                        <div key={installment.id} className="grid grid-cols-2 gap-4 items-center border-b pb-3">
                          <div>
                            <p className="font-medium text-sm">
                              {t("installment")} #{installment.installment_no}
                            </p>
                            <p className="text-xs text-blue-600">
                              {t("available_carry_forward")}: {formatCurrency(carryForwardAmount)}
                            </p>
                            {isCarryForwardPayment && (
                              <p className="text-xs font-medium text-blue-700">
                                {t("this_is_a_carry_forward_payment")}
                              </p>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <NumberInput
                                decimal={true}
                                placeholder="Amount to use"
                                value={carryForwardAmounts[installment.id] !== undefined ? String(carryForwardAmounts[installment.id]) : ""}
                                onChange={(value) => value && updateCarryForwardAmount(installment.id, value)}
                                className="w-full"
                                min="0"
                                max={carryForwardAmount}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            <Separator className="my-4" />
            {/* Add a special section for carry-forward payments */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("payment_summary")}:</p>
              <div className="bg-gray-50 rounded-md p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{t("original_amount")}:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(installments.reduce((sum, i) => sum + Number(i.installment_amount || 0), 0))}
                    </span>
                  </div>

                  {/* Only show pre-applied discount if not all installments are carry-forward payments */}
                  {!installments.every((i) => i.is_paid && Number(i.carry_forward_amount || 0) > 0) && (
                    <div className="flex justify-between">
                      <span className="text-sm">{t("pre_applied_discount")}:</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(installments.reduce((sum, i) => sum + Number(i.discounted_amount || 0), 0))}
                      </span>
                    </div>
                  )}

                  {totalDiscountApplied > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">{t("additional_discount")}:</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(totalDiscountApplied)}</span>
                    </div>
                  )}

                  {installments.some((i) => i.is_paid && Number(i.carry_forward_amount || 0) > 0) && (
                    <div className="flex justify-between">
                      <span className="text-sm">{t("carry_forward_payment")}:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {formatCurrency(
                          installments
                            .filter((i) => i.is_paid && Number(i.carry_forward_amount || 0) > 0)
                            .reduce((sum, i) => sum + Number(i.carry_forward_amount || 0), 0),
                        )}
                      </span>
                    </div>
                  )}

                  {useCarryForward && (
                    <div className="flex justify-between">
                      <span className="text-sm">{t("carry_forward_applied")}:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {formatCurrency(Object.values(carryForwardAmounts).reduce((sum, amount) => sum + amount, 0))}
                      </span>
                    </div>
                  )}

                  {!payFullAmount &&
                    !installments.every((i) => i.is_paid && Number(i.carry_forward_amount || 0) > 0) && (
                      <div className="flex justify-between">
                        <span className="text-sm">{t("remaining_amount")}:</span>
                        <span className="text-sm font-medium text-amber-600">
                          {formatCurrency(Object.values(remainingAmounts).reduce((sum, amount) => sum + amount, 0))}
                        </span>
                      </div>
                    )}

                  <Separator className="my-2" />

                  <div className="flex justify-between">
                    <span className="text-sm font-bold">{t("final_payment_amount")}:</span>
                    <span className="text-sm font-bold">{formatCurrency(finalPaymentAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPaymentProcessing}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  isPaymentProcessing ||
                  (applyConcession && totalDiscountApplied > totalAvailableConcession) ||
                  (!payFullAmount && Object.values(partialPaymentAmounts).reduce((sum, amount) => sum + amount, 0) <= 0)
                }
              >
                {isPaymentProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("processing")}...
                  </>
                ) : (
                  `${t("submit_payment")} (${formatCurrency(finalPaymentAmount)})`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialog */}
    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center">
            <Info className="mr-2 h-5 w-5 text-blue-600" />
            {t("confirm_payment")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <p className="text-sm text-gray-700">
            {t("please_confirm_you_want_to_pay_the_following_amount")}
          </p>
          <div className="flex items-center justify-between bg-blue-50 rounded px-3 py-2">
            <span className="text-sm">{t("final_payment_amount")}:</span>
            <span className="font-bold text-blue-700">{formatCurrency(finalPaymentAmount)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirmedPayment}
            disabled={isPaymentProcessing}
          >
            {isPaymentProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("processing")}...
              </>
            ) : (
              t("confirm_and_pay")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default PayFeesDialog
