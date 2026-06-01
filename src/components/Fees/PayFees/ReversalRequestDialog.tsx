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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useUpdateStatusForTransactionMutation } from "@/services/feesService"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface ReversalRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  payment: any
  studentFeesDetails: any
  isExtraFee: boolean
}

const ReversalRequestDialog: React.FC<ReversalRequestDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  payment,
  studentFeesDetails,
  isExtraFee
}) => {
  const { t } = useTranslation()
  const [remarks, setRemarks] = useState("")
  const [updateStatusForTransaction, { isLoading }] = useUpdateStatusForTransactionMutation()

  const handleSubmit = async () => {
    if (!remarks.trim()) {
      toast({
        variant: "destructive",
        title: "Remarks Required",
        description: "Please provide a reason for the reversal request",
      })
      return
    }

    try {
      await updateStatusForTransaction({        
        student_fees_master_id: studentFeesDetails.student.fees_status.id,
        transaction_id: payment.id,
        payload: {
          status: "Reversal Requested",
          remarks: remarks.trim(),
        },
        is_extra_fees: isExtraFee,
      }).unwrap()

      toast({
        title: "Reversal Request Submitted",
        description: "The reversal request has been submitted successfully. Admin will review it.",
      })

      onSuccess()
      onClose()
      setRemarks("")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Submit Request",
        description: error?.data?.message || "There was an error submitting the reversal request",
      })
    }
  }

  const handleClose = () => {
    setRemarks("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Request Transaction Reversal
          </DialogTitle>
          <DialogDescription>
            You are requesting to reverse payment #{payment?.id}. This action requires admin approval.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <strong>Important:</strong> Only the last transaction can be reversed. Once a reversal request is submitted,
            you will not be able to make new payments until the request is processed.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="remarks">Reason for Reversal *</Label>
            <Textarea
              id="remarks"
              placeholder="Please provide a detailed reason for requesting this reversal..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
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
                <strong>Mode:</strong> {payment?.payment_mode}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !remarks.trim()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Reversal Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReversalRequestDialog


// "use client"

// import type React from "react"
// import { useState } from "react"
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog"
// import { Input } from "@/components/ui/input"
// import { useUpdateStatusForTransactionMutation } from "@/services/feesService"
// import { toast } from "@/hooks/use-toast"

// interface ReversalRequestDialogProps {
//   isOpen: boolean
//   onClose: () => void
//   onSuccess: () => void
//   payment: any
//   studentFeesDetails: any
//   isExtraFee?: boolean
// }

// const ReversalRequestDialog: React.FC<ReversalRequestDialogProps> = ({
//   isOpen,
//   onClose,
//   onSuccess,
//   payment,
//   studentFeesDetails,
//   isExtraFee = false,
// }) => {
//   const [remarks, setRemarks] = useState("")
//   const [updateStatusForTransaction, { isLoading }] = useUpdateStatusForTransactionMutation()

//   const handleSubmit = async () => {
//     if (!remarks.trim()) {
//       toast({
//         variant: "destructive",
//         title: "Remarks Required",
//         description: "Please provide a reason for the reversal request",
//       })
//       return
//     }

//     try {
//       await updateStatusForTransaction({
//         student_fees_master_id: studentFeesDetails.student.fees_status.id,
//         transaction_id: payment.id,
//         payload: {
//           status: "Reversal Requested",
//           remarks: remarks.trim(),
//         },
//         is_extra_fees: isExtraFee,
//       }).unwrap()

//       toast({
//         title: "Reversal Request Submitted",
//         description: `The ${isExtraFee ? "extra fee " : ""}reversal request has been submitted successfully. Admin will review it.`,
//       })

//       onSuccess()
//       onClose()
//       setRemarks("")
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Failed to Submit Request",
//         description: error?.data?.message || "There was an error submitting the reversal request",
//       })
//     }
//   }

//   return (
//     <AlertDialog open={isOpen} onOpenChange={onClose}>
//       <AlertDialogContent>
//         <AlertDialogHeader>
//           <AlertDialogTitle>Request Reversal</AlertDialogTitle>
//           <AlertDialogDescription>
//             Are you sure you want to request a reversal for this transaction?
//           </AlertDialogDescription>
//         </AlertDialogHeader>
//         <div className="grid gap-4 py-4">
//           <div className="grid grid-cols-4 items-center gap-4">
//             <label htmlFor="remarks" className="text-right">
//               Remarks
//             </label>
//             <Input
//               type="text"
//               id="remarks"
//               value={remarks}
//               onChange={(e) => setRemarks(e.target.value)}
//               className="col-span-3"
//             />
//           </div>
//         </div>
//         <AlertDialogFooter>
//           <AlertDialogCancel>Cancel</AlertDialogCancel>
//           <AlertDialogAction onClick={handleSubmit}>Submit Request</AlertDialogAction>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   )
// }

// export default ReversalRequestDialog
