"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Tag } from "lucide-react"
import { concessionSchema, type ConcessionFormData } from "@/utils/fees.validation"
// import { useApplyFeeConcessionMutation } from "@/services/FeesService"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface ConcessionDialogProps {
  isOpen: boolean
  onClose: () => void
  studentId: number
  maxAmount: number
}

const ConcessionDialog: React.FC<ConcessionDialogProps> = ({ isOpen, onClose, studentId, maxAmount }) => {
//   const [applyFeeConcession, { isLoading }] = useApplyFeeConcessionMutation().

  const {t} = useTranslation()

  const form = useForm<ConcessionFormData>({
    resolver: zodResolver(concessionSchema),
    defaultValues: {
      amount: 0,
      reason: "",
    },
  })

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Handle form submission
  const handleSubmit = async (values: ConcessionFormData) => {
    if (values.amount > maxAmount) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: `Concession amount cannot exceed the due amount of ${formatCurrency(maxAmount)}.`,
      })
      return
    }

    try {
    //   await applyFeeConcession({
    //     student_id: studentId,
    //     amount: values.amount,
    //     reason: values.reason,
    //   })

      toast({
        title: "Concession Applied",
        description: `A concession of ${formatCurrency(values.amount)} has been applied.`,
      })

      onClose()
    } catch (error) {
      console.error("Concession error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Apply Concession",
        description: "There was an error applying the concession. Please try again.",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Tag className="mr-2 h-5 w-5" />
            {t("apply_fee_concession")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("concession_amount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      min={1}
                      max={maxAmount}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Maximum allowed: {formatCurrency(maxAmount)}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reason_for_concession")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("explain_the_reason_for_this_concession")}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={false}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={false}>
                {true ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("processing..")}
                  </>
                ) : (
                  "Apply Concession"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ConcessionDialog

