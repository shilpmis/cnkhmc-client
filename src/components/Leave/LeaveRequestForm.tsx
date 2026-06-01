"use client"

import type React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "@/redux/hooks/useTranslation"

const leaveRequestSchema = z
  .object({
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string().min(10, "Reason must be at least 10 characters long"),
    leaveTypes: z.array(z.enum(["sick", "vacation", "personal"])).min(1, "Select at least one leave type"),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>

interface LeaveRequestFormProps {
  onClose: () => void
  onSubmit: (data: LeaveRequestFormData) => void
  leavesBalance: {
    sick: number
    vacation: number
    personal: number
  }
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onClose, onSubmit, leavesBalance }) => {
  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
      leaveTypes: [],
    },
  })

  const [duration, setDuration] = useState(0)
  const {t} = useTranslation()

  const calculateDuration = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }, [])

  const handleSubmit = (data: LeaveRequestFormData) => {
    onSubmit(data)
    onClose()
  }

  useEffect(() => {
    const startDate = form.watch("startDate")
    const endDate = form.watch("endDate")
    if (startDate && endDate) {
      setDuration(calculateDuration(startDate, endDate))
    }
  }, [form.watch("startDate"), form.watch("endDate"), calculateDuration, form.watch])

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("apply_for_leave")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("start_date")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("end_date")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {duration > 0 && <p className="text-sm text-gray-500">Duration: {duration} day(s)</p>}
            <FormField
              control={form.control}
              name="leaveTypes"
              render={() => (
                <FormItem>
                  <FormLabel>{t("leave_types")}</FormLabel>
                  <div className="space-y-2">
                    {Object.entries(leavesBalance).map(([leaveType, balance]) => (
                      <div key={leaveType} className="flex items-center space-x-2">
                        <Controller
                          name="leaveTypes"
                          control={form.control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value?.includes(leaveType as "sick" | "vacation" | "personal")}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...field.value, leaveType]
                                  : field.value?.filter((value) => value !== leaveType)
                                field.onChange(updatedValue)
                              }}
                            />
                          )}
                        />
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {leaveType.charAt(0).toUpperCase() + leaveType.slice(1)} (Balance: {balance})
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reason")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">{t("submit_leave_request")}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default LeaveRequestForm

