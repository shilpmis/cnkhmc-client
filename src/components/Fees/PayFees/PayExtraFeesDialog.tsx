"use client"
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
import { Separator } from "@/components/ui/separator"
import { Loader2, Receipt, Info, CheckCircle2, AlertCircle, Tag } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { usePayMultipleInstallmentsForExtraFeesMutation, useGetAllFeesTypeQuery } from "@/services/feesService"
import type { FeePaymentReqForExtraFees, ExtraFeePaymentRequest } from "@/types/fees"
import type { ExtraFeesAppliedToStudent } from "@/types/fees"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"

// Payment form schema
const extraFeePaymentSchema = z.object({
  payment_mode: z.enum(["Cash", "Online", "Bank Transfer", "Cheque", "UPI"], {
    required_error: "Payment mode is required",
  }),
  transaction_reference: z.string().optional(),
  payment_date: z.string().min(1, "Payment date is required"),
  remarks: z.string().optional(),
  is_partial_payment: z.boolean().default(false),
  payment_amount: z.number().min(1, "Payment amount must be greater than 0"),
})

interface PayExtraFeesDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccessfulSubmit: () => void
  studentId: number
  studentName: string
  enrolled_academic_session_id: number
  student_fees_master_id: number
  selectedInstallments: {
    key: string
    extraFee: ExtraFeesAppliedToStudent
    installment: any
    student_fees_type_masters_id: number
  }[]
}

const PayExtraFeesDialog: React.FC<PayExtraFeesDialogProps> = ({
  isOpen,
  onClose,
  onSuccessfulSubmit,
  studentId,
  studentName,
  student_fees_master_id,
  enrolled_academic_session_id,
  selectedInstallments = [],
}) => {
  const { t } = useTranslation()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"confirm" | "success">("confirm")
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [paymentAmount, setPaymentAmount] = useState<string>("0")
  const [partialPaymentAmounts, setPartialPaymentAmounts] = useState<Record<string, number>>({})

  const [payExtraFees, { isLoading: isPaymentLoading, isError: isPaymentError, error: paymentError }] =
    usePayMultipleInstallmentsForExtraFeesMutation()

  // Get fee types for name mapping
  const { data: feeTypes } = useGetAllFeesTypeQuery(
    { academic_session_id: currentAcademicSession?.id || 0, applicable_to: "All" },
    { skip: !currentAcademicSession?.id },
  )

  const form = useForm<z.infer<typeof extraFeePaymentSchema>>({
    resolver: zodResolver(extraFeePaymentSchema),
    defaultValues: {
      payment_mode: "Cash",
      transaction_reference: "",
      payment_date: new Date().toISOString().split("T")[0],
      remarks: "",
      is_partial_payment: false,
      payment_amount: 0,
    },
  })

  // Watch for form field changes
  const isPartialPayment = form.watch("is_partial_payment")

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "₹0.00"
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (e) {
      return "Invalid Date"
    }
  }

  // Get fee type name
  const getFeeTypeName = (feeTypeId: number): string => {
    if (!feeTypeId) return t("unknown_fee_type")
    const feeType = feeTypes?.find((type) => type.id === feeTypeId)
    return feeType ? feeType.name : `${t("fee_type")} ${feeTypeId}`
  }

  // Group installments by fee type
  const groupedInstallments = selectedInstallments.reduce(
    (groups, item) => {
      const feeTypeId = item.extraFee.fees_type_id
      if (!groups[feeTypeId]) {
        groups[feeTypeId] = {
          feeTypeId,
          feeTypeName: getFeeTypeName(feeTypeId),
          installments: [],
          totalAmount: 0,
        }
      }
      groups[feeTypeId].installments.push(item)
      groups[feeTypeId].totalAmount += Number(item.installment.installment_amount || 0)
      return groups
    },
    {} as Record<
      number,
      { feeTypeId: number; feeTypeName: string; installments: typeof selectedInstallments; totalAmount: number }
    >,
  )

  // Calculate total amount from selected installments
  useEffect(() => {
    const total = selectedInstallments.reduce((sum, item) => sum + Number(item.installment.installment_amount || 0), 0)
    setTotalAmount(total)
    setPaymentAmount(total.toString())
    form.setValue("payment_amount", total)

    // Initialize partial payment amounts
    const initialPartialAmounts: Record<string, number> = {}
    selectedInstallments.forEach((item) => {
      initialPartialAmounts[item.key] = Number(item.installment.installment_amount || 0)
    })
    setPartialPaymentAmounts(initialPartialAmounts)
  }, [selectedInstallments, form])

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        payment_mode: "Cash",
        transaction_reference: "",
        payment_date: new Date().toISOString().split("T")[0],
        remarks: "",
        is_partial_payment: false,
        payment_amount: totalAmount,
      })
      setPaymentStep("confirm")
    }
  }, [isOpen, totalAmount, form])

  // Update payment amount
  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPaymentAmount(value)
    form.setValue("payment_amount", Number(value))
  }

  // Update partial payment amount for specific installment
  const updatePartialPaymentAmount = (key: string, amount: string) => {
    const numAmount = Number(amount) || 0
    const item = selectedInstallments.find((item) => item.key === key)

    if (item) {
      const maxAmount = Number(item.installment.installment_amount || 0)
      const validAmount = Math.min(numAmount, maxAmount)

      setPartialPaymentAmounts((prev) => ({
        ...prev,
        [key]: validAmount,
      }))
    }
  }

  // Calculate final payment amount
  const calculateFinalPaymentAmount = () => {
    if (isPartialPayment) {
      return Object.values(partialPaymentAmounts).reduce((sum, amount) => sum + amount, 0)
    }
    return totalAmount
  }

  // Validate payment amount
  const validatePaymentAmount = () => {
    const finalAmount = calculateFinalPaymentAmount()

    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast({
        variant: "destructive",
        title: t("invalid_amount"),
        description: t("please_enter_a_valid_payment_amount"),
      })
      return false
    }

    if (finalAmount > totalAmount) {
      toast({
        variant: "destructive",
        title: t("amount_exceeds_total"),
        description: t("payment_amount_cannot_exceed_the_total_due_amount"),
      })
      return false
    }

    return true
  }

  // Prepare the API payload
  const preparePayload = (values: z.infer<typeof extraFeePaymentSchema>): FeePaymentReqForExtraFees => {
    const finalAmount = calculateFinalPaymentAmount()

    // Create installments array based on selected installments
    const installments: ExtraFeePaymentRequest[] = selectedInstallments.map((item) => {
      let installmentPaidAmount = Number(item.installment.installment_amount)

      if (isPartialPayment) {
        installmentPaidAmount = partialPaymentAmounts[item.key] || 0
      }

      return {
        student_fees_type_masters_id: item.student_fees_type_masters_id, // This is the key change
        installment_id: item.installment.id,
        paid_amount: installmentPaidAmount,
        discounted_amount: 0, // No discount for extra fees
        paid_as_refund: false,
        refunded_amount: 0,
        payment_mode: values.payment_mode,
        transaction_reference: values.transaction_reference || "",
        payment_date: values.payment_date,
        remarks: values.remarks || "",
        remaining_amount: Number(item.installment.installment_amount) - installmentPaidAmount,
        amount_paid_as_carry_forward: 0, // No carry forward for extra fees
        applied_concessions: null,
        repaid_installment: false,
      }
    })

    return {
      student_id: studentId,
      student_fees_master_id: student_fees_master_id,
      installments: installments,
    }
  }

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof extraFeePaymentSchema>) => {
    if (!validatePaymentAmount()) {
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare the payload for the API
      const payload = preparePayload(values)

      // Call the API
      const response = await payExtraFees({ payload, academic_session_id: enrolled_academic_session_id }).unwrap()

      // Handle success
      toast({
        title: t("payment_successful"),
        description: `${t("payment_of")} ${formatCurrency(calculateFinalPaymentAmount())} ${t("has_been_recorded")}`,
      })

      setPaymentStep("success")
    } catch (error) {
      console.error("Payment error:", error)

      // Extract error message from API response if available
      let errorMessage = t("there_was_an_error_processing_your_payment._please_try_again.")
      if (paymentError && "data" in paymentError) {
        errorMessage = (paymentError.data as any)?.message || errorMessage
      }

      toast({
        variant: "destructive",
        title: t("payment_failed"),
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingPaymentValues, setPendingPaymentValues] = useState<z.infer<typeof extraFeePaymentSchema> | null>(null)
  const confirmInputRef = useRef<HTMLInputElement>(null)
  const [confirmAmount, setConfirmAmount] = useState("")
  const [confirmError, setConfirmError] = useState("")

  // Intercept submit to show confirmation dialog
  const handleFormSubmit = (values: z.infer<typeof extraFeePaymentSchema>) => {
    if (!validatePaymentAmount()) return
    setPendingPaymentValues(values)
    setShowConfirmDialog(true)
    setConfirmAmount("")
    setConfirmError("")
    setTimeout(() => confirmInputRef.current?.focus(), 100)
  }

  // Actual payment logic, called after confirmation
  const handleConfirmedPayment = async () => {
    const finalAmount = calculateFinalPaymentAmount()
    if (Number(confirmAmount) !== Number(finalAmount)) {
      setConfirmError(t("entered_amount_does_not_match_the_payment_amount"))
      return
    }
    setConfirmError("")
    if (!pendingPaymentValues) return
    try {
      setIsSubmitting(true)
      const payload = preparePayload(pendingPaymentValues)
      await payExtraFees({ payload, academic_session_id: enrolled_academic_session_id }).unwrap()
      toast({
        title: t("payment_successful"),
        description: `${t("payment_of")} ${formatCurrency(finalAmount)} ${t("has_been_recorded")}`,
      })
      setPaymentStep("success")
      setShowConfirmDialog(false)
      setPendingPaymentValues(null)
    } catch (error) {
      let errorMessage = t("there_was_an_error_processing_your_payment._please_try_again.")
      if (paymentError && "data" in paymentError) {
        errorMessage = (paymentError.data as any)?.message || errorMessage
      }
      toast({
        variant: "destructive",
        title: t("payment_failed"),
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render payment confirmation step
  const renderConfirmStep = () => {
    const finalAmount = calculateFinalPaymentAmount()

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-xl">{t("confirm_extra_fees_payment")}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t("payment_confirmation")}</AlertTitle>
            <AlertDescription>{t("please_review_the_payment_details_before_confirming")}</AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Receipt className="mr-2 h-5 w-5" />
                {t("payment_summary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-500">{t("student")}</p>
                  <p className="font-medium">{studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("payment_type")}</p>
                  <p className="font-medium">{t("extra_fees")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("payment_date")}</p>
                  <p className="font-medium">{formatDate(form.getValues("payment_date"))}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("payment_mode")}</p>
                  <p className="font-medium">{form.getValues("payment_mode")}</p>
                </div>
                {form.getValues("transaction_reference") && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">{t("reference")}</p>
                    <p className="font-medium">{form.getValues("transaction_reference")}</p>
                  </div>
                )}
                {form.getValues("remarks") && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">{t("remarks")}</p>
                    <p className="font-medium">{form.getValues("remarks")}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Fee Type Sections */}
              <div>
                <h4 className="font-medium mb-3">{t("selected_extra_fees")}</h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {Object.values(groupedInstallments).map((group) => (
                    <div key={group.feeTypeId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{group.feeTypeName}</span>
                          <Badge variant="outline">
                            {group.installments.length} installment{group.installments.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <span className="font-medium text-blue-600">{formatCurrency(group.totalAmount)}</span>
                      </div>

                      <div className="space-y-2">
                        {group.installments.map((item) => (
                          <div key={item.key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm">
                                {t("installment")} {item.installment.installment_no}
                              </span>
                              {item.installment.due_date && (
                                <span className="text-xs text-gray-500 ml-2">
                                  Due: {formatDate(item.installment.due_date)}
                                </span>
                              )}
                            </div>
                            <span className="font-medium">
                              {isPartialPayment
                                ? formatCurrency(partialPaymentAmounts[item.key] || 0)
                                : formatCurrency(item.installment.installment_amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center font-medium">
                <span>{t("total_amount")}</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-lg font-bold">
                <span>{t("payment_amount")}</span>
                <span className="text-green-600">{formatCurrency(finalAmount)}</span>
              </div>

              {isPartialPayment && finalAmount < totalAmount && (
                <div className="flex justify-between items-center text-sm">
                  <span>{t("remaining_amount")}</span>
                  <span className="text-red-500">{formatCurrency(totalAmount - finalAmount)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="space-y-4 rounded-md border p-4">
                {/* <FormField
                  control={form.control}
                  name="is_partial_payment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>{t("partial_payment")}</FormLabel>
                        <FormDescription>{t("pay_a_partial_amount_of_the_selected_fees")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                /> */}

                {isPartialPayment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("partial_payment_details")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>{t("partial_payment")}</AlertTitle>
                        <AlertDescription>
                          {t("enter_the_amount_you_want_to_pay_for_each_installment")}
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        {Object.values(groupedInstallments).map((group) => (
                          <div key={group.feeTypeId} className="border rounded-lg p-3">
                            <h5 className="font-medium mb-3 flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              {group.feeTypeName}
                            </h5>

                            <div className="space-y-3">
                              {group.installments.map((item) => (
                                <div key={item.key} className="grid grid-cols-2 gap-4 items-center">
                                  <div>
                                    <p className="font-medium text-sm">
                                      {t("installment")} {item.installment.installment_no}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {t("max_amount")}: {formatCurrency(item.installment.installment_amount)}
                                    </p>
                                  </div>
                                  <div>
                                    <Input
                                      type="number"
                                      placeholder="Amount to pay"
                                      value={partialPaymentAmounts[item.key] || ""}
                                      onChange={(e) => updatePartialPaymentAmount(item.key, e.target.value)}
                                      className="w-full"
                                      min="0"
                                      max={Number(item.installment.installment_amount)}
                                      step="0.01"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                  name="payment_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("payment_mode")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_payment_mode")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cash">{t("cash")}</SelectItem>
                          <SelectItem value="Online">{t("online")}</SelectItem>
                          <SelectItem value="Bank Transfer">{t("bank_transfer")}</SelectItem>
                          <SelectItem value="Cheque">{t("cheque")}</SelectItem>
                          <SelectItem value="UPI">{t("upi")}</SelectItem>
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
                      <FormLabel>
                        {t("transaction_reference")} ({t("optional")})
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("enter_reference_number")} />
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
                      <FormLabel>
                        {t("remarks")} ({t("optional")})
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("add_any_additional_notes")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting || isPaymentLoading}>
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isPaymentLoading}
                >
                  {(isSubmitting || isPaymentLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("confirm_payment")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>

      </>
    )
  }

  // Render payment success step
  const renderSuccessStep = () => {
    const finalAmount = calculateFinalPaymentAmount()

    return (
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
            <p className="text-gray-500 mt-1">{t("extra_fee_payment_has_been_recorded_successfully")}</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-500">{t("student")}</p>
                  <p className="font-medium">{studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("amount_paid")}</p>
                  <p className="font-medium text-green-600">{formatCurrency(finalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("payment_date")}</p>
                  <p className="font-medium">{formatDate(form.getValues("payment_date"))}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("payment_mode")}</p>
                  <p className="font-medium">{form.getValues("payment_mode")}</p>
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
            }}
            className="w-full"
          >
            {t("close")}
          </Button>
        </DialogFooter>
      </>
    )
  }

  // Confirmation Dialog UI
  const renderConfirmationDialog = () => {
    const finalAmount = calculateFinalPaymentAmount()
    return (
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
              <span className="font-bold text-blue-700">{formatCurrency(finalAmount)}</span>
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
              disabled={isSubmitting || !confirmAmount}
            >
              {isSubmitting ? (
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
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {isPaymentError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {paymentError && "data" in paymentError
                ? (paymentError.data as any)?.message
                : t("there_was_an_error_processing_your_payment._please_try_again.")}
            </AlertDescription>
          </Alert>
        )}

        {paymentStep === "confirm" && renderConfirmStep()}
        {paymentStep === "success" && renderSuccessStep()}
        {renderConfirmationDialog()}
      </DialogContent>
    </Dialog>
  )
}

export default PayExtraFeesDialog
