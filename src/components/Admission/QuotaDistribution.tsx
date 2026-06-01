"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAddInquiryMutation } from "@/services/InquiryServices"
import { toast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { useTranslation } from "@/redux/hooks/useTranslation"

const formSchema = z.object({
  student_name: z.string().min(2, { message: "Student name is required" }),
  parent_name: z.string().min(2, { message: "Parent name is required" }),
  contact_number: z.string().min(10, { message: "Valid contact number is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  inquiry_for_class: z.string().min(1, { message: "Grade is required" }),
})

interface QuickInquiryFormProps {
  isOpen: boolean
  onClose: () => void
}

export const QuickInquiryForm: React.FC<QuickInquiryFormProps> = ({ isOpen, onClose }) => {
  const [addInquiries, { isLoading: isAddingInquiry }] = useAddInquiryMutation()
  const currentAcademicSession = useAppSelector((state :any) => state.auth.currentActiveAcademicSession);
  const {t} = useTranslation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_name: "",
      parent_name: "",
      contact_number: "",
      email: "",
      inquiry_for_class: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission
    const payload = {
      academic_session_id: currentAcademicSession?.id || 1,
      parent_contact: values.contact_number,
      email: values.email,
      inquiry_for_class: Number(values.inquiry_for_class),
      parent_name: values.parent_name,
      student_name: values.student_name,
      first_name: values.student_name.split(" ")[0] || values.student_name, // Assuming first name is the first word
      last_name: values.student_name.split(" ")[1] || "", // Assuming last name is the second word
      father_name: values.parent_name, // Assuming parent_name is the father's name
      primary_mobile: values.contact_number, // Assuming contact_number is the primary mobile
    }
    // const res = await addInquiries(payload)

    // if (res.data) {
    //   form.reset()
    //   toast({
    //     variant: "default",
    //     title: "Inquiry added successfully",
    //     description: "Inquiry added successfully",
    //   })
    //   onClose()
    // }

    // if (res.error) {
    //   console.log("Check this error", res.error)
    //   toast({
    //     variant: "destructive",
    //     title: "Error adding inquiry",
    //     description: "There was an error adding the inquiry. Please try again.",
    //   })
    // }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("quick_inquiry_form")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="student_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("student_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("enter_student_name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("parent_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("enter_parent_name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contact_number")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("enter_contact_number")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t("enter_email")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inquiry_for_class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("grade_applying_for")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_grade")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((grade) => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Std {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isAddingInquiry}>
                {isAddingInquiry ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

