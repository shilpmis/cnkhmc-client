"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Save } from "lucide-react"
import { useUpdateStatusForTransactionMutation } from "@/services/feesService"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface TransactionStatusDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  payment: any
  studentName: string
  isLastTransaction: boolean
}

export default function TransactionStatusDialog({
  isOpen,
  onClose,
  onSuccess,
  payment,
  studentName,
  isLastTransaction,
}: TransactionStatusDialogProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState(payment?.status || "No Action")
  const [paymentStatus, setPaymentStatus] = useState(payment?.payment_status || "Success")
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [updateStatus] = useUpdateStatusForTransactionMutation()

  const handleSubmit = async () => {
    if (status === "Reversal Requested" && !remarks.trim()) {
      toast({
        variant: "destructive",
        title: t("validation_error"),
        description: t("remarks_are_required_when_requesting_reversal"),
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        payment_status: paymentStatus,
      }

      if (status === "Reversal Requested") {
        payload.status = "Reversal Requested"
        payload.remarks = remarks.trim()
      }

      if (remarks.trim()) {
        payload.remarks = remarks.trim()
      }

      await updateStatus({
        student_fees_master_id: payment.student_fees_master_id,
        transaction_id: payment.id,
        payload,
      }).unwrap()

      toast({
        title: t("status_updated"),
        description: t("transaction_status_has_been_updated_successfully"),
      })

      onSuccess()
      onClose()
      setRemarks("")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("update_failed"),
        description: error?.data?.message || t("failed_to_update_status_please_try_again"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setStatus(payment?.status || "No Action")
      setPaymentStatus(payment?.payment_status || "Success")
      setRemarks("")
      onClose()
    }
  }

  const formatCurrency = (amount: string | number) => {
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default"
      case "Reversal Requested":
        return "destructive"
      case "Reversed":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Success":
        return "default"
      case "In Progress":
        return "outline"
      case "Failed":
        return "destructive"
      case "Disputed":
        return "destructive"
      case "Cancelled":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5 text-blue-600" />
            {t("update_transaction_status")}
          </DialogTitle>
          <DialogDescription>{t("update_the_status_and_payment_information_for_this_transaction")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <p>
                  <strong>{t("student")}:</strong> {studentName}
                </p>
                <p>
                  <strong>{t("payment_id")}:</strong> #{payment?.id}
                </p>
                <p>
                  <strong>{t("amount")}:</strong> {formatCurrency(payment?.paid_amount || 0)}
                </p>
                <p>
                  <strong>{t("payment_date")}:</strong>{" "}
                  {payment?.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "N/A"}
                </p>
                <div className="flex items-center gap-2">
                  <span>
                    <strong>{t("current_status")}:</strong>
                  </span>
                  <Badge variant={getStatusBadgeVariant(payment?.status || "No Action")}>
                    {payment?.status || "No Action"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    <strong>{t("payment_status")}:</strong>
                  </span>
                  <Badge variant={getPaymentStatusBadgeVariant(payment?.payment_status || "Success")}>
                    {payment?.payment_status || "Success"}
                  </Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-status" className="text-sm font-medium">
                {t("payment_status")}
              </Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_payment_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Success">{t("success")}</SelectItem>
                  <SelectItem value="In Progress">{t("in_progress")}</SelectItem>
                  <SelectItem value="Failed">{t("failed")}</SelectItem>
                  <SelectItem value="Disputed">{t("disputed")}</SelectItem>
                  <SelectItem value="Cancelled">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLastTransaction && (
              <div className="space-y-2">
                <Label htmlFor="reversal-status" className="text-sm font-medium">
                  {t("reversal_request")}
                </Label>
                <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_action")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No Action">{t("no_action")}</SelectItem>
                    <SelectItem value="Reversal Requested">{t("request_reversal")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium">
              {t("remarks")} {status === "Reversal Requested" && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="remarks"
              placeholder={
                status === "Reversal Requested"
                  ? t("please_provide_reason_for_reversal_request")
                  : t("optional_remarks_about_this_status_update")
              }
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>

          {!isLastTransaction && (
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {t("only_the_most_recent_transaction_can_be_requested_for_reversal")}
              </AlertDescription>
            </Alert>
          )}

          {status === "Reversal Requested" && (
            <Alert className="border-red-200 bg-red-50">
              <Info className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {t("requesting_reversal_will_prevent_further_payments_until_the_request_is_processed")}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (status === "Reversal Requested" && !remarks.trim())}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("updating")}...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("update_status")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
