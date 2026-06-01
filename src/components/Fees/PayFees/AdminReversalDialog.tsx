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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { useReverseTransactionMutation } from "@/services/feesService"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface AdminReversalDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    payment: any
    studentName: string
    isExtraFee: boolean

}

export default function AdminReversalDialog({
    isOpen,
    onClose,
    onSuccess,
    payment,
    studentName,
    isExtraFee
}: AdminReversalDialogProps) {
    const { t } = useTranslation()
    const [remarks, setRemarks] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [reverseTransaction] = useReverseTransactionMutation()

    const handleSubmit = async () => {
        if (!remarks.trim()) {
            toast({
                variant: "destructive",
                title: t("validation_error"),
                description: t("remarks_are_required_for_transaction_reversal"),
            })
            return
        }

        setIsSubmitting(true)
        try {
            await reverseTransaction({
                student_fees_master_id: payment.student_fees_master_id,
                transaction_id: payment.id,
                payload: {
                    remarks: remarks.trim(),
                },
                is_extra_fees: isExtraFee,
            }).unwrap()

            toast({
                title: t("transaction_reversed"),
                description: t("the_transaction_has_been_successfully_reversed"),
            })

            onSuccess()
            onClose()
            setRemarks("")
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t("reversal_failed"),
                description: error?.data?.message || t("failed_to_reverse_transaction_please_try_again"),
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (!isSubmitting) {
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

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-red-600">
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        {t("reverse_transaction")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("you_are_about_to_reverse_a_payment_transaction_this_action_cannot_be_undone")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
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
                                <p>
                                    <strong>{t("current_status")}:</strong> {payment?.status || "Unknown"}
                                </p>
                            </div>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label htmlFor="remarks" className="text-sm font-medium">
                            {t("reason_for_reversal")} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="remarks"
                            placeholder={t("please_provide_a_detailed_reason_for_reversing_this_transaction")}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={4}
                            className="resize-none"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t("this_reason_will_be_recorded_in_the_transaction_history")}
                        </p>
                    </div>

                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            <strong>{t("warning")}:</strong>{" "}
                            {t("reversing_this_transaction_will_update_the_student_fee_balance_and_cannot_be_undone")}
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        {t("cancel")}
                    </Button>
                    <Button variant="destructive" className="text-white" onClick={handleSubmit} disabled={isSubmitting || !remarks.trim()}>
                        {isSubmitting ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                {t("reversing")}...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {t("confirm_reversal")}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
