import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Loader2, AlertCircle, Calculator, DollarSign, CheckCircle2, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import type { InstallmentBreakdown, AppliedConcessioinToStudent, FeePaymentRequest, FeesPlanDetail, FeePlanDetail } from "@/types/fees"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePayMultipleInstallmentsMutation } from "@/services/feesService"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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

// Interface for installment allocation
interface InstallmentAllocation {
  installment: ExtendedInstallmentBreakdown
  allocatedAmount: number
  remainingAmount: number
  isSelected: boolean
  maxPayableAmount: number
  basePayableAmount: number // Base amount without carry forward
  carryForwardAmount: number // Carry forward amount for this installment
}

// Payment form schema
const flexiblePaymentSchema = z.object({
  payment_amount: z.number().min(0.01, "Payment amount must be greater than 0"),
  payment_mode: z.enum(["Cash", "Online", "Bank Transfer", "Cheque", "UPI"], {
    required_error: "Payment mode is required",
  }),
  transaction_reference: z.string().optional(),
  payment_date: z.string().min(1, "Payment date is required"),
  remarks: z.string().optional(),
  auto_distribute: z.boolean().default(true),
  include_carry_forward: z.boolean().default(true), // Default to true for better UX
})

interface FlexiblePaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccessfulSubmit: () => void
  enrolled_academic_session_id: number
  availableInstallments: ExtendedInstallmentBreakdown[]
  studentId: number
  feesPlanDetail: FeePlanDetail[]
  studentConcessions?: AppliedConcessioinToStudent[]
  planConcessions?: any[]
  availableConcessionBalance?: {
    student_concession: number
    plan_concession: number
  }
  getFeeTypeName: (feeTypeId: number) => string
}

const FlexiblePaymentDialog: React.FC<FlexiblePaymentDialogProps> = ({
  isOpen,
  onClose,
  onSuccessfulSubmit,
  availableInstallments,
  studentId,
  feesPlanDetail,
  studentConcessions = [],
  planConcessions = [],
  enrolled_academic_session_id,
  availableConcessionBalance = { student_concession: 0, plan_concession: 0 },
  getFeeTypeName,
}) => {
  const { t } = useTranslation()
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [payInstallments, { isLoading: isPaymentProcessing }] = usePayMultipleInstallmentsMutation()
  const [installmentAllocations, setInstallmentAllocations] = useState<InstallmentAllocation[]>([])
  const [totalAllocated, setTotalAllocated] = useState(0)
  const [remainingToAllocate, setRemainingToAllocate] = useState(0)
  const [totalCarryForwardAmount, setTotalCarryForwardAmount] = useState(0)
  const [carryForwardByFeeType, setCarryForwardByFeeType] = useState<Record<string, number>>({})

  const form = useForm<z.infer<typeof flexiblePaymentSchema>>({
    resolver: zodResolver(flexiblePaymentSchema),
    defaultValues: {
      payment_amount: 0,
      payment_mode: "Cash",
      transaction_reference: "",
      payment_date: new Date().toISOString().split("T")[0],
      remarks: "",
      auto_distribute: true,
      include_carry_forward: true,
    },
  })

  const paymentAmount = form.watch("payment_amount")
  const autoDistribute = form.watch("auto_distribute")
  const includeCarryForward = form.watch("include_carry_forward")

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "₹0.00"
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // const getFeeTypeName = (feeTypeId: number): string => {
  //   if (!feeTypeId) return t("unknown_fee_type")

  //   // First check if we have the fee type in our API data
  //   if (feeTypes && feeTypes.length > 0) {
  //     const feeType = feeTypes.find((type: FeesType) => type.id === feeTypeId)
  //     if (feeType) {
  //       return feeType.name
  //     }
  //   }
  //   // Fallback to a generic name with the ID
  //   return `${t("fee_type")} ${feeTypeId}`
  // }

  // Initialize installment allocations
  useEffect(() => {
    const allocations: InstallmentAllocation[] = availableInstallments.map((installment) => {
      // If installment is partially paid, only allow remaining_amount to be paid
      const isPartiallyPaid = installment.is_paid && installment.payment_status === "Partially Paid";
      const originalAmount = Number(installment.installment_amount || 0);
      const discountedAmount = Number(installment.discounted_amount || 0);
      const carryForwardAmount = Number(installment.carry_forward_amount || 0);
      const remainingAmount = Number(installment.remaining_amount || 0);

      let basePayableAmount = originalAmount - discountedAmount;
      let maxPayableAmount = basePayableAmount + (includeCarryForward ? carryForwardAmount : 0);

      if (isPartiallyPaid) {
        // Only allow remaining amount to be paid
        basePayableAmount = remainingAmount;
        maxPayableAmount = remainingAmount;
      }

      return {
        installment,
        allocatedAmount: 0,
        remainingAmount: maxPayableAmount,
        isSelected: false,
        maxPayableAmount,
        basePayableAmount: basePayableAmount, // Add this to track base amount separately
        carryForwardAmount: carryForwardAmount, // Add this to track carry forward separately
      }
    })

    // Calculate total carry forward amount grouped by fee type
    const carryForwardByFeeType = availableInstallments.reduce(
      (acc, installment) => {
        const feeTypeId = feesPlanDetail.find(
        (fee_plan) => fee_plan.id === installment.fee_plan_details_id)?.fees_type_id || 0;
        const feeTypeName = getFeeTypeName(feeTypeId)
        const carryForward = Number(installment.carry_forward_amount || 0)

        if (carryForward > 0) {
          if (!acc[feeTypeName]) {
            acc[feeTypeName] = 0
          }
          acc[feeTypeName] += carryForward
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const totalCarryForward = Object.values(carryForwardByFeeType).reduce((sum, amount) => sum + amount, 0)

    setTotalCarryForwardAmount(totalCarryForward)
    setCarryForwardByFeeType(carryForwardByFeeType)
    setInstallmentAllocations(allocations)
  }, [availableInstallments, includeCarryForward])

  // Auto-distribute payment amount across installments
  useEffect(() => {
    if (autoDistribute && paymentAmount > 0) {
      autoDistributePayment(paymentAmount)
    }
  }, [paymentAmount, autoDistribute])

  // Calculate totals
  useEffect(() => {
    const allocated = installmentAllocations.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0)
    setTotalAllocated(allocated)
    setRemainingToAllocate(paymentAmount - allocated)
  }, [installmentAllocations, paymentAmount])

  // Auto-distribute payment logic
  const autoDistributePayment = (amount: number) => {
    let remainingAmount = amount
    const newAllocations = [...installmentAllocations]

    // Reset all allocations
    newAllocations.forEach((allocation) => {
      allocation.allocatedAmount = 0
      allocation.remainingAmount = allocation.maxPayableAmount
      allocation.isSelected = false
    })

    // Sort installments by priority (due date, then amount)
    const sortedAllocations = newAllocations.sort((a, b) => {
      const dateA = new Date(a.installment.due_date || "")
      const dateB = new Date(b.installment.due_date || "")
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime()
      }
      return a.maxPayableAmount - b.maxPayableAmount
    })

    // Distribute amount across installments
    for (const allocation of sortedAllocations) {
      if (remainingAmount <= 0) break

      // Calculate available amount for this installment
      const baseAmount = allocation.basePayableAmount
      const carryForwardAmount = includeCarryForward ? allocation.carryForwardAmount : 0
      const maxPayableAmount = baseAmount + carryForwardAmount

      const amountToAllocate = Math.min(remainingAmount, maxPayableAmount)
      if (amountToAllocate > 0) {
        allocation.allocatedAmount = amountToAllocate
        allocation.remainingAmount = maxPayableAmount - amountToAllocate
        allocation.isSelected = true
        remainingAmount -= amountToAllocate
      }
    }

    setInstallmentAllocations(newAllocations)
  }

  // Manual allocation update
  const updateInstallmentAllocation = (index: number, amount: string) => {
    const numAmount = Number(amount) || 0
    const newAllocations = [...installmentAllocations]
    const allocation = newAllocations[index]

    // Validate amount doesn't exceed max payable
    const validAmount = Math.min(numAmount, allocation.maxPayableAmount)

    allocation.allocatedAmount = validAmount
    allocation.remainingAmount = allocation.maxPayableAmount - validAmount
    allocation.isSelected = validAmount > 0

    setInstallmentAllocations(newAllocations)
  }

  // Toggle installment selection
  const toggleInstallmentSelection = (index: number) => {
    const newAllocations = [...installmentAllocations]
    const allocation = newAllocations[index]

    if (allocation.isSelected) {
      // Deselect - reset allocation
      allocation.allocatedAmount = 0
      allocation.remainingAmount = allocation.maxPayableAmount
      allocation.isSelected = false
    } else {
      // Select - allocate remaining amount or max payable
      const amountToAllocate = Math.min(remainingToAllocate + allocation.allocatedAmount, allocation.maxPayableAmount)
      allocation.allocatedAmount = amountToAllocate
      allocation.remainingAmount = allocation.maxPayableAmount - amountToAllocate
      allocation.isSelected = true
    }

    setInstallmentAllocations(newAllocations)
  }

  // Validate payment allocation
  const validatePaymentAllocation = () => {
    const errors: string[] = []

    if (paymentAmount <= 0) {
      errors.push("Payment amount must be greater than 0")
    }

    if (totalAllocated !== paymentAmount) {
      errors.push(
        `Total allocated amount (${formatCurrency(totalAllocated)}) must equal payment amount (${formatCurrency(paymentAmount)})`,
      )
    }

    const selectedAllocations = installmentAllocations.filter((a) => a.isSelected)
    if (selectedAllocations.length === 0) {
      errors.push("At least one installment must be selected")
    }

    // Enhanced validation for carry forward scenarios
    selectedAllocations.forEach((allocation, index) => {
      if (allocation.allocatedAmount > allocation.maxPayableAmount) {
        errors.push(
          `Allocation for installment ${index + 1} exceeds maximum payable amount of ${formatCurrency(allocation.maxPayableAmount)}`,
        )
      }
    })

    return errors
  }

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof flexiblePaymentSchema>) => {
    try {
      const validationErrors = validatePaymentAllocation()
      if (validationErrors.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: validationErrors.join(", "),
        })
        return
      }

      console.log("installmentAllocations:", installmentAllocations)

      // Create payment requests for selected installments
      const installmentPayments: FeePaymentRequest[] = installmentAllocations
        .filter((allocation) => allocation.isSelected && allocation.allocatedAmount > 0)
        .map((allocation) => {
          const installment = allocation.installment
          const originalAmount = Number(installment.installment_amount || 0)
          const preAppliedDiscount = Number(installment.discounted_amount || 0)
          const carryForwardAmount = Number(installment.carry_forward_amount || 0)
          const totalAllocated = allocation.allocatedAmount

          // Calculate how much goes to carry forward vs regular payment
          let amountPaidAsCarryForward = 0
          let regularPaidAmount = totalAllocated

          if (includeCarryForward && carryForwardAmount > 0) {
            // Prioritize carry forward payment
            amountPaidAsCarryForward = Math.min(totalAllocated, carryForwardAmount)
            regularPaidAmount = Math.max(0, totalAllocated - amountPaidAsCarryForward)
          }

          const remainingAmount = allocation.remainingAmount

          // Prepare applied concessions array (preserve existing)
          let appliedConcessions = null
          if (installment.applied_concession && installment.applied_concession.length > 0) {
            appliedConcessions = [...installment.applied_concession]
          }

          return {
            fee_plan_details_id: installment.fee_plan_details_id!,
            installment_id: installment.id,
            paid_amount: regularPaidAmount,
            discounted_amount: preAppliedDiscount,
            paid_as_refund: false,
            refunded_amount: 0,
            payment_mode: values.payment_mode,
            transaction_reference: values.transaction_reference || "",
            payment_date: values.payment_date,
            remarks:
              values.remarks ||
              `Flexible payment - Regular: ${formatCurrency(regularPaidAmount)}${amountPaidAsCarryForward > 0 ? `, Carry Forward: ${formatCurrency(amountPaidAsCarryForward)}` : ""}`,
            remaining_amount: remainingAmount,
            amount_paid_as_carry_forward: amountPaidAsCarryForward,
            applied_concessions: appliedConcessions,
            repaid_installment: installment.is_paid ? true : false, // Mark as repaid if already paid
          }
    })

      // Create the final payment request object
      const paymentRequest = {
        student_id: studentId,
        installments: installmentPayments,
        academic_session_id: enrolled_academic_session_id ?? CurrentAcademicSessionForSchool!.id,
      }

      console.log("Flexible Payment request:", paymentRequest)

      // Send payment request to API
      await payInstallments(paymentRequest).unwrap()

      toast({
        title: "Payment Successful",
        description: `Flexible payment of ${formatCurrency(values.payment_amount)} has been distributed across ${installmentPayments.length} installments.`,
      })

      onSuccessfulSubmit()
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "There was an error processing your flexible payment. Please try again.",
      })
    }
  }

  // Group installments by fee type for better organization
  const groupedInstallments = installmentAllocations.reduce(
    (groups, allocation, index) => {
      const feeTypeName = getFeeTypeName(feesPlanDetail.find(
        (fee_plan) => fee_plan.id === allocation.installment.fee_plan_details_id)?.fees_type_id || 0)
      if (!groups[feeTypeName]) {
        groups[feeTypeName] = []
      }
      groups[feeTypeName].push({ ...allocation, index })
      return groups
    },
    {} as Record<string, (InstallmentAllocation & { index: number })[]>,
  )

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingPaymentValues, setPendingPaymentValues] = useState<z.infer<typeof flexiblePaymentSchema> | null>(null)
  const confirmInputRef = useRef<HTMLInputElement>(null)
  const [confirmAmount, setConfirmAmount] = useState("")
  const [confirmError, setConfirmError] = useState("")
  const [paymentStep, setPaymentStep] = useState<"confirm" | "success">("confirm")

  // Intercept submit to show confirmation dialog
  const handleFormSubmit = (values: z.infer<typeof flexiblePaymentSchema>) => {
    const validationErrors = validatePaymentAllocation()
    if (validationErrors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validationErrors.join(", "),
      })
      return
    }
    setPendingPaymentValues(values)
    setShowConfirmDialog(true)
    setConfirmAmount("")
    setConfirmError("")
    setTimeout(() => confirmInputRef.current?.focus(), 100)
  }

  // Actual payment logic, called after confirmation
  const handleConfirmedPayment = async () => {
    if (!pendingPaymentValues) return
    if (Number(confirmAmount) !== Number(paymentAmount)) {
      setConfirmError("Entered amount does not match the payment amount.")
      return
    }
    setConfirmError("")
    try {
      // Create payment requests for selected installments
      const installmentPayments: FeePaymentRequest[] = installmentAllocations
        .filter((allocation) => allocation.isSelected && allocation.allocatedAmount > 0)
        .map((allocation) => {
          const installment = allocation.installment
          const originalAmount = Number(installment.installment_amount || 0)
          const preAppliedDiscount = Number(installment.discounted_amount || 0)
          const carryForwardAmount = Number(installment.carry_forward_amount || 0)
          const totalAllocated = allocation.allocatedAmount

          let amountPaidAsCarryForward = 0
          let regularPaidAmount = totalAllocated

          if (includeCarryForward && carryForwardAmount > 0) {
            amountPaidAsCarryForward = Math.min(totalAllocated, carryForwardAmount)
            regularPaidAmount = Math.max(0, totalAllocated - amountPaidAsCarryForward)
          }

          const remainingAmount = allocation.remainingAmount

          let appliedConcessions = null
          if (installment.applied_concession && installment.applied_concession.length > 0) {
            appliedConcessions = [...installment.applied_concession]
          }

          return {
            fee_plan_details_id: installment.fee_plan_details_id!,
            installment_id: installment.id,
            paid_amount: regularPaidAmount,
            discounted_amount: preAppliedDiscount,
            paid_as_refund: false,
            refunded_amount: 0,
            payment_mode: pendingPaymentValues.payment_mode,
            transaction_reference: pendingPaymentValues.transaction_reference || "",
            payment_date: pendingPaymentValues.payment_date,
            remarks:
              pendingPaymentValues.remarks ||
              `Flexible payment - Regular: ${formatCurrency(regularPaidAmount)}${amountPaidAsCarryForward > 0 ? `, Carry Forward: ${formatCurrency(amountPaidAsCarryForward)}` : ""}`,
            remaining_amount: remainingAmount,
            amount_paid_as_carry_forward: amountPaidAsCarryForward,
            applied_concessions: appliedConcessions,
            repaid_installment: installment.is_paid ? true : false,
          }
    })

      const paymentRequest = {
        student_id: studentId,
        installments: installmentPayments,
        academic_session_id: enrolled_academic_session_id ?? CurrentAcademicSessionForSchool!.id,
      }

      await payInstallments(paymentRequest).unwrap()

      toast({
        title: "Payment Successful",
        description: `Flexible payment of ${formatCurrency(paymentAmount)} has been distributed across ${installmentPayments.length} installments.`,
      })

      setPaymentStep("success")
      setShowConfirmDialog(false)
      setPendingPaymentValues(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "There was an error processing your flexible payment. Please try again.",
      })
    }
  }

  // Render payment success step
  const renderSuccessStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl text-green-600 flex items-center">
          <CheckCircle2 className="mr-2 h-5 w-5" />
          {t("payment_successful")}
        </DialogTitle>
      </DialogHeader>
      <div className="mt-4 space-y-4 text-center">
        <div className="py-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium">{t("payment_processed_successfully")}</h3>
          <p className="text-gray-500 mt-1">{t("flexible_payment_has_been_recorded_successfully")}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-gray-500">{t("student")}</p>
                {/* Add student name if available */}
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("amount_paid")}</p>
                <p className="font-medium text-green-600">{formatCurrency(paymentAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("payment_date")}</p>
                <p className="font-medium">{pendingPaymentValues?.payment_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("payment_mode")}</p>
                <p className="font-medium">{pendingPaymentValues?.payment_mode}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <DialogFooter className="mt-6">
        <Button
          onClick={() => {
            onSuccessfulSubmit()
            onClose()
            setPaymentStep("confirm")
          }}
          className="w-full"
        >
          {t("close")}
        </Button>
      </DialogFooter>
    </>
  )

  // Confirmation Dialog UI
  const renderConfirmationDialog = () => (
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
            {t("please_re_enter_the_amount_to_confirm_your_payment")}
          </p>
          <div className="flex items-center justify-between bg-blue-50 rounded px-3 py-2">
            <span className="text-sm">{t("final_payment_amount")}:</span>
            <span className="font-bold text-blue-700">{formatCurrency(paymentAmount)}</span>
          </div>
          <Input
            ref={confirmInputRef}
            type="number"
            placeholder={t("enter_amount_to_confirm")}
            value={confirmAmount}
            onChange={e => setConfirmAmount(e.target.value)}
            className="mt-2"
            min={0}
            step="any"
          />
          {confirmError && (
            <p className="text-xs text-red-600 mt-1">{confirmError}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirmedPayment}
            disabled={isPaymentProcessing || !confirmAmount}
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
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-y-auto">
        {paymentStep === "success" ? (
          renderSuccessStep()
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <Calculator className="mr-2 h-5 w-5" />
                {t("flexible_payment_distribution")}
              </DialogTitle>
            </DialogHeader>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">{t("flexible_payment_system")}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Pay any amount across {availableInstallments.length} available installments
                  </p>
                  {totalCarryForwardAmount > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Total carry forward available: {formatCurrency(totalCarryForwardAmount)}
                    </p>
                  )}
                </div>
                {/* <DollarSign className="h-8 w-8 text-blue-600" /> */}
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                {/* Payment Amount Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payment_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("payment_amount")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter any payment amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter any amount - the system will distribute it optimally across installments
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            <SelectItem value="UPI">UPI</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

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

                {/* Auto Distribution Toggle */}
                <div className="rounded-md border p-4">
                  <FormField
                    control={form.control}
                    name="auto_distribute"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                        <div className="space-y-0.5">
                          <FormLabel>{t("auto_distribute_payment")}</FormLabel>
                          <FormDescription>
                            {t("automatically_distribute_payment_across_installments_by_due_date_priority")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Enhanced Carry Forward Toggle */}
                {totalCarryForwardAmount > 0 && (
                  <div className="rounded-md border p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                    <FormField
                      control={form.control}
                      name="include_carry_forward"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                          <div className="space-y-0.5">
                            <FormLabel className="text-amber-700 font-medium">
                              {t("include_carry_forward_amounts")}
                            </FormLabel>
                            <FormDescription className="text-amber-600">
                              <div className="space-y-1">
                                <p>Total carry forward available: {formatCurrency(totalCarryForwardAmount)}</p>
                                <p className="text-xs">
                                  When enabled, payments will prioritize clearing carry forward amounts first
                                </p>
                              </div>
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Enhanced Carry Forward Summary */}
                    <div className="mt-3 p-3 bg-amber-100 rounded-md">
                      <h4 className="text-sm font-medium text-amber-800 mb-2">Carry Forward by Fee Type:</h4>
                      <div className="space-y-2">
                        {Object.entries(carryForwardByFeeType).map(([feeTypeName, amount]) => (
                          <div key={feeTypeName} className="flex justify-between items-center p-2 bg-amber-50 rounded">
                            <span className="text-xs font-medium text-amber-700">{feeTypeName}</span>
                            <span className="text-xs font-bold text-amber-800">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                        <div className="border-t border-amber-200 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-amber-800">Total Carry Forward:</span>
                            <span className="text-sm font-bold text-amber-900">
                              {formatCurrency(totalCarryForwardAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Payment Summary */}
                {paymentAmount > 0 && (
                  <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Calculator className="mr-2 h-4 w-4" />
                        {t("payment_distribution_summary")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t("payment_amount")}</p>
                          <p className="font-semibold text-lg">{formatCurrency(paymentAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("allocated_amount")}</p>
                          <p className="font-semibold text-green-600 text-lg">{formatCurrency(totalAllocated)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("remaining_to_allocate")}</p>
                          <p
                            className={`font-semibold text-lg ${remainingToAllocate === 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(remainingToAllocate)}
                          </p>
                        </div>
                      </div>

                      {/* Additional Summary Information */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span>Selected Installments: </span>
                            <span className="font-medium">{installmentAllocations.filter((a) => a.isSelected).length}</span>
                          </div>
                          <div>
                            <span>Carry Forward Included: </span>
                            <span className="font-medium">
                              {includeCarryForward ? formatCurrency(totalCarryForwardAmount) : "₹0.00"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {remainingToAllocate !== 0 && (
                        <Alert className="mt-3" variant={remainingToAllocate > 0 ? "default" : "destructive"}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>
                            {remainingToAllocate > 0 ? t("incomplete_allocation") : t("over_allocation")}
                          </AlertTitle>
                          <AlertDescription>
                            {remainingToAllocate > 0
                              ? "You have unallocated amount. The system can auto-distribute it or you can manually allocate."
                              : "Total allocation exceeds payment amount. Please adjust the distribution."}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Installment Distribution */}
                {paymentAmount > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("installment_distribution")}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {t("select_and_allocate_payment_amount_across_installments")}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(groupedInstallments).map(([feeTypeName, allocations]) => (
                        <div key={feeTypeName} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                              {feeTypeName}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {allocations.length} installment{allocations.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {allocations.map(({ index, ...allocation }) => (
                              <div
                                key={allocation.installment.id}
                                className={`grid grid-cols-12 gap-2 items-center p-3 rounded-md border ${allocation.isSelected ? "bg-blue-50 border-blue-200" : "bg-white"
                                  }`}
                              >
                                <div className="col-span-1">
                                  <Checkbox
                                    checked={allocation.isSelected}
                                    onCheckedChange={() => toggleInstallmentSelection(index)}
                                  />
                                </div>

                                <div className="col-span-3">
                                  <p className="text-sm font-medium">
                                    {getFeeTypeName(feesPlanDetail.find(
                                      (fee_plan) => fee_plan.id === allocation.installment.fee_plan_details_id)?.fees_type_id || 0)} - {allocation.installment.installment_no}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Due: {new Date(allocation.installment.due_date || "").toLocaleDateString()}
                                  </p>
                                  {Number(allocation.installment.carry_forward_amount || 0) > 0 && (
                                    <p className="text-xs text-blue-600">
                                      Carry Forward: {formatCurrency(allocation.installment.carry_forward_amount)}
                                    </p>
                                  )}
                                </div>

                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">Payable Amount</p>
                                  <p className="text-sm font-medium">{formatCurrency(allocation.basePayableAmount)}</p>
                                  {allocation.carryForwardAmount > 0 && (
                                    <div className="text-xs">
                                      <span className="text-blue-600">
                                        + CF: {formatCurrency(allocation.carryForwardAmount)}
                                      </span>
                                      {includeCarryForward && <span className="text-green-600 ml-1">✓ Included</span>}
                                      {!includeCarryForward && <span className="text-gray-500 ml-1">✗ Excluded</span>}
                                    </div>
                                  )}
                                </div>

                                <div className="col-span-3">
                                  <Input
                                    type="number"
                                    placeholder="Allocation"
                                    value={allocation.allocatedAmount || ""}
                                    onChange={(e) => updateInstallmentAllocation(index, e.target.value)}
                                    disabled={autoDistribute}
                                    min="0"
                                    max={allocation.maxPayableAmount}
                                    step="0.01"
                                    className="text-sm"
                                  />
                                </div>

                                <div className="col-span-3">
                                  <p className="text-xs text-muted-foreground">Remaining</p>
                                  <p className="text-sm font-medium text-amber-600">
                                    {formatCurrency(allocation.remainingAmount)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isPaymentProcessing}>
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isPaymentProcessing ||
                      paymentAmount <= 0 ||
                      totalAllocated !== paymentAmount ||
                      installmentAllocations.filter((a) => a.isSelected).length === 0
                    }
                  >
                    {isPaymentProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("processing")}...
                      </>
                    ) : (
                      `${t("process_payment")} (${formatCurrency(paymentAmount)})`
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>

            {renderConfirmationDialog()}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default FlexiblePaymentDialog
