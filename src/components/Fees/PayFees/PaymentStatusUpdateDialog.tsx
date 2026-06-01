"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Settings } from "lucide-react"
import { useUpdateStatusForTransactionMutation } from "@/services/feesService"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface PaymentStatusUpdateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  payment: any
  studentFeesDetails: any
  isExtraFee: boolean
}

const PaymentStatusUpdateDialog: React.FC<PaymentStatusUpdateDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  payment,
  studentFeesDetails,
  isExtraFee,
}) => {
  const { t } = useTranslation()
  const [paymentStatus, setPaymentStatus] = useState<string>(payment?.payment_status || "")
  const [remarks, setRemarks] = useState("")
  const [updateStatusForTransaction, { isLoading }] = useUpdateStatusForTransactionMutation()

  const paymentStatusOptions = [
    { value: "Success", label: "Success", color: "text-green-600" },
    { value: "In Progress", label: "In Progress", color: "text-blue-600" },
    { value: "Failed", label: "Failed", color: "text-red-600" },
    { value: "Disputed", label: "Disputed", color: "text-amber-600" },
    { value: "Cancelled", label: "Cancelled", color: "text-gray-600" },
  ]

  const handleSubmit = async () => {
    if (!paymentStatus) {
      toast({
        variant: "destructive",
        title: "Payment Status Required",
        description: "Please select a payment status",
      })
      return
    }

    try {
      await updateStatusForTransaction({
        student_fees_master_id: studentFeesDetails.student.fees_status.id,
        transaction_id: payment.id,
        payload: {
          payment_status: paymentStatus as any,
          remarks: remarks.trim() || undefined,
        },
        is_extra_fees: isExtraFee
      }).unwrap()

      toast({
        title: "Payment Status Updated",
        description: `Payment status has been updated to ${paymentStatus}`,
      })

      onSuccess()
      onClose()
      setRemarks("")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Update Status",
        description: error?.data?.message || "There was an error updating the payment status",
      })
    }
  }

  const handleClose = () => {
    setPaymentStatus(payment?.payment_status || "")
    setRemarks("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Update Payment Status
          </DialogTitle>
          <DialogDescription>Update the payment status for transaction #{payment?.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-status">Payment Status *</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                {paymentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={option.color}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Add any additional notes about this status update..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium mb-2">Payment Details</h4>
            <div className="text-sm space-y-1 text-gray-600">
              <p>
                <strong>Payment ID:</strong> #{payment?.id}
              </p>
              <p>
                <strong>Amount:</strong> ₹{payment?.paid_amount}
              </p>
              <p>
                <strong>Date:</strong> {new Date(payment?.payment_date).toLocaleDateString()}
              </p>
              <p>
                <strong>Current Status:</strong> {payment?.payment_status}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !paymentStatus}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentStatusUpdateDialog
