"use client"

import type React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"

const paymentSchema = z.object({
  amount: z.number().min(1, { message: "Amount must be greater than 0" }),
  paymentMode: z.enum(["Cash", "Cheque", "Online", "Bank Transfer"]),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
})

interface StudentFee {
  id: string
  studentName: string
  class: string
  division: string
  rollNumber: string
  totalFees: number
  paidAmount: number
  pendingAmount: number
  dueDate: string
  status: "Paid" | "Partially Paid" | "Pending" | "Overdue"
}

interface PayFeeFormProps {
  student: StudentFee
  onSubmit: () => void
}

export const PayFeeForm: React.FC<PayFeeFormProps> = ({ student, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslation()

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: student.pendingAmount,
      paymentMode: "Cash",
      referenceNumber: "",
      remarks: "",
    },
  })

  const handleSubmit = (values: z.infer<typeof paymentSchema>) => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Payment Successful",
        description: `Payment of ₹${values.amount.toLocaleString()} received for ${student.studentName}.`,
      })
      onSubmit()
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("student_information")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("name")}:</div>
                <div>{student.studentName}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("class")}:</div>
                <div>
                  {student.class}-{student.division}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("roll_number")}:</div>
                <div>{student.rollNumber}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("fee_information")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("total_fees")}:</div>
                <div>₹{student.totalFees.toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("paid_amount")}:</div>
                <div>₹{student.paidAmount.toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("pending_amount")}:</div>
                <div className="font-bold text-red-600">₹{student.pendingAmount.toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("due_date")}:</div>
                <div>{new Date(student.dueDate).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("payment_amount")} (₹)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                </FormControl>
                <FormDescription>Maximum amount: ₹{student.pendingAmount.toLocaleString()}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMode"
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
                    <SelectItem value="Cheque">{t("cheque")}</SelectItem>
                    <SelectItem value="Online">{t("online")}</SelectItem>
                    <SelectItem value="Bank Transfer">{t("bank_transfer")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referenceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reference_number")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>{t("required_for_cheque,_online,_and_bank_transfer_payments")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("remarks")}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onSubmit}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : t("submit_payment")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

