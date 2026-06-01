import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar, CreditCard, Info, AlertCircle, CheckCircle2, Receipt, Tag } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface InstallmentDetailViewProps {
  isOpen: boolean
  onClose: () => void
  installment: any
  feeTypeDetails: any
  studentDetails: any
  formatCurrency: (amount: string | number | null | undefined) => string
  formatDate: (dateString: string | null | undefined) => string
  getStatusBadgeVariant: (status: string) => "default" | "outline" | "secondary" | "destructive"
  getFeeTypeName: (feeTypeId: number, studentFeeDetails: any) => string
}

const InstallmentDetailView: React.FC<InstallmentDetailViewProps> = ({
  isOpen,
  onClose,
  installment,
  feeTypeDetails,
  studentDetails,
  formatCurrency,
  formatDate,
  getStatusBadgeVariant,
  getFeeTypeName,
}) => {
  const { t } = useTranslation()

  if (!installment || !feeTypeDetails || !studentDetails) return null

  const hasDiscount = Number(installment.discounted_amount) > 0
  const hasCarryForward = Number(installment.carry_forward_amount) > 0
  const hasRemaining = Number(installment.remaining_amount) > 0
  const isPaid = installment.is_paid
  const isPartiallyPaid = installment.payment_status === "Partially Paid"
  const isOverdue = installment.payment_status === "Overdue"

  // Find payment history for this installment
  const paymentHistory =
    studentDetails.student.fees_status.paid_fees?.filter((payment: any) => payment.installment_id === installment.id) ||
    []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            {t("installment_details")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Installment Header */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                {getFeeTypeName(feeTypeDetails.fees_type_id, studentDetails)} - {feeTypeDetails.installment_type}{" "}
                {installment.installment_no}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">{t("due_date")}:</span>
                    <p className="font-medium">{formatDate(installment.due_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t("status")}:</span>
                    <div>
                      <Badge variant={getStatusBadgeVariant(installment.payment_status || "Unpaid")}>
                        {installment.payment_status || "Unpaid"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">{t("installment_type")}:</span>
                    <p className="font-medium">{feeTypeDetails.installment_type}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t("fee_type")}:</span>
                    <p className="font-medium">{getFeeTypeName(feeTypeDetails.fees_type_id, studentDetails)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                {t("amount_breakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">{t("original_amount")}:</span>
                    <p className={`font-medium text-lg ${hasDiscount ? "line-through text-gray-500" : ""}`}>
                      {formatCurrency(installment.installment_amount)}
                    </p>
                  </div>
                  {hasDiscount && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">{t("discount")}:</span>
                      <p className="font-medium text-lg text-green-600">
                        {formatCurrency(installment.discounted_amount)}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">{t("payable_amount")}:</span>
                    <p className="font-medium text-lg">
                      {formatCurrency(
                        Number(installment.installment_amount) - Number(installment.discounted_amount || 0),
                      )}
                    </p>
                  </div>
                  {isPaid && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">{t("paid_amount")}:</span>
                      <p className="font-medium text-lg text-green-600">{formatCurrency(installment.paid_amount)}</p>
                    </div>
                  )}
                </div>

                {(hasCarryForward || hasRemaining) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {hasCarryForward && (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">{t("carry_forward")}:</span>
                          <p className="font-medium text-lg text-blue-600">
                            {formatCurrency(installment.carry_forward_amount)}
                          </p>
                        </div>
                      )}
                      {hasRemaining && (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">{t("remaining_amount")}:</span>
                          <p className="font-medium text-lg text-amber-600">
                            {formatCurrency(installment.remaining_amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Status Alerts */}
              <div className="mt-4 space-y-3">
                {isOverdue && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("overdue_payment")}</AlertTitle>
                    <AlertDescription>
                      {t("this_installment_is_overdue_please_make_the_payment_as_soon_as_possible")}
                    </AlertDescription>
                  </Alert>
                )}

                {isPartiallyPaid && (
                  <Alert variant="default">
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t("partially_paid")}</AlertTitle>
                    <AlertDescription>
                      {t("this_installment_has_been_partially_paid_remaining_amount")}:{" "}
                      {formatCurrency(installment.remaining_amount)}
                    </AlertDescription>
                  </Alert>
                )}

                {hasCarryForward && (
                  <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">{t("carry_forward_amount")}</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      {t("this_installment_has_a_carry_forward_amount_of")}{" "}
                      {formatCurrency(installment.carry_forward_amount)}{" "}
                      {t("which_will_be_applied_to_the_next_installment")}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Applied Concessions */}
          {installment.applied_concession && installment.applied_concession.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Tag className="mr-2 h-5 w-5" />
                  {t("applied_concessions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {installment.applied_concession.map((concession: any, idx: number) => (
                    <div key={idx} className="flex items-start p-2 bg-green-50 rounded-md">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {t("concession_id")}: {concession.concession_id}
                        </p>
                        <p className="text-sm text-green-700">
                          {t("applied_amount")}: {formatCurrency(concession.applied_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Receipt className="mr-2 h-5 w-5" />
                  {t("payment_history")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentHistory.map((payment: any) => (
                    <div key={payment.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {t("payment_id")}: #{payment.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("date")}: {formatDate(payment.payment_date)}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(payment.status)}>{payment.status}</Badge>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t("amount_paid")}:</span>
                          <span className="ml-1 font-medium">{formatCurrency(payment.paid_amount)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("payment_mode")}:</span>
                          <span className="ml-1">{payment.payment_mode}</span>
                        </div>
                        {payment.transaction_reference && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">{t("reference")}:</span>
                            <span className="ml-1">{payment.transaction_reference}</span>
                          </div>
                        )}
                        {Number(payment.discounted_amount) > 0 && (
                          <div>
                            <span className="text-muted-foreground">{t("discount_applied")}:</span>
                            <span className="ml-1 text-green-600">{formatCurrency(payment.discounted_amount)}</span>
                          </div>
                        )}
                        {Number(payment.amount_paid_as_carry_forward) > 0 && (
                          <div>
                            <span className="text-muted-foreground">{t("carry_forward")}:</span>
                            <span className="ml-1 text-blue-600">
                              {formatCurrency(payment.amount_paid_as_carry_forward)}
                            </span>
                          </div>
                        )}
                        {Number(payment.remaining_amount) > 0 && (
                          <div>
                            <span className="text-muted-foreground">{t("remaining")}:</span>
                            <span className="ml-1 text-amber-600">{formatCurrency(payment.remaining_amount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InstallmentDetailView
