// "use client"

// import type React from "react"

// import { useEffect, useMemo, useCallback } from "react"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { z } from "zod"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { selectAcademicClasses } from "@/redux/slices/academicSlice"
// import { selectAuthState } from "@/redux/slices/authSlice"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import { useConvertQueryToStudentMutation } from "@/services/InquiryServices"
// import type { ReqBodyForOnBoardingStudent, Student } from "@/types/student"
// import { toast } from "@/hooks/use-toast"
// import { Loader2 } from "lucide-react"
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Calendar } from "@/components/ui/calendar"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { CalendarIcon } from "lucide-react"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"

// // Zod schema for onboarding (all required fields, no GR no)
// const onboardingSchema = z.object({
//   first_name: z
//     .string()
//     .min(3, "First name is required")
//     .regex(/^[A-Za-z\s]+$/, "First name should contain only alphabets and spaces"),
//   last_name: z
//     .string()
//     .min(3, "Last name is required")
//     .regex(/^[A-Za-z\s]+$/, "Last name should contain only alphabets and spaces"),
//   gender: z.enum(["Male", "Female"], { errorMap: () => ({ message: "Gender must be either Male or Female" }) }),
//   birth_date: z.date({
//     required_error: "Birth date is required",
//     invalid_type_error: "Birth date must be a valid date",
//   }),
//   class: z.string().min(1, "Class is required"),
//   division: z.string().min(1, "Division is required"),
//   primary_mobile: z
//     .string()
//     .min(10, "Mobile number must be 10 digits")
//     .max(10, "Mobile number must be 10 digits")
//     .regex(/^[6-9]\d{9}$/, "Mobile number must be 10 digits and start with 6-9"),
//   father_name: z
//     .string()
//     .min(2, "Father's name is required")
//     .regex(/^[A-Za-z\s]+$/, "Father's name should contain only alphabets and spaces")
//     .nullable(),
// })

// export type OnboardingFormData = z.infer<typeof onboardingSchema>

// interface OnboardingFormProps {
//   onClose: () => void
//   inquiry_id: number
//   academic_session_id : number
//   initial_data?: Partial<Student> | null
//   onSubmitSuccess?: (studentData: Student) => void
//   onSubmitError?: (error: any) => void
// }

// const OnboardingForm: React.FC<OnboardingFormProps> = ({
//   onClose,
//   inquiry_id,
//   academic_session_id,
//   initial_data,
//   onSubmitSuccess,
//   onSubmitError,
// }) => {
//   const AcademicClasses = useAppSelector(selectAcademicClasses)
//   const authState = useAppSelector(selectAuthState)
//   const { t } = useTranslation()
//   const [convertInquiryToStudent, { isLoading: isOnBoardingStudent }] = useConvertQueryToStudentMutation()

//   const form = useForm<OnboardingFormData>({
//     resolver: zodResolver(onboardingSchema),
//     defaultValues: {
//       first_name: initial_data?.first_name || "",
//       last_name: initial_data?.last_name || "",
//       gender: (initial_data?.gender as "Male" | "Female") || undefined,
//       birth_date: initial_data?.birth_date ? new Date(initial_data.birth_date) : undefined,
//       class: initial_data?.class_id ? initial_data.class_id.toString() : "",
//       division: undefined,
//       primary_mobile: initial_data?.primary_mobile ? initial_data.primary_mobile.toString() : "",
//       father_name: initial_data?.father_name || null,
//     },
//   })

//   const selectedClass = form.watch("class")

//   const availableDivisions = useMemo(() => {
//     if (AcademicClasses && selectedClass) {
//       return AcademicClasses.find((cls) => cls.id.toString() === selectedClass)
//     }
//     return null
//   }, [AcademicClasses, selectedClass])

//   const handleClassChange = useCallback(
//     (class_id: string) => {
//       form.setValue("class", class_id)
//       form.setValue("division", "")
//       form.trigger("division")
//     },
//     [form],
//   )

//   const onSubmit = async (values: OnboardingFormData) => {
//     try {
//       const payload: ReqBodyForOnBoardingStudent = {
//         class_id: Number(values.class),
//         first_name: values.first_name,
//         middle_name: null,
//         last_name: values.last_name,
//         gender: values.gender,
//         birth_date: format(values.birth_date, "yyyy-MM-dd"),
//         primary_mobile: Number(values.primary_mobile),
//         father_name: values.father_name,
//         division_id: Number(values.division),
//         academic_session_id : academic_session_id,
//       }

//       const result = await convertInquiryToStudent({ inquiry_id, payload }).unwrap()

//       toast({
//         title: t("success"),
//         description: t("student_onboarded_successfully"),
//       })

//       if (onSubmitSuccess) onSubmitSuccess(result)
//       onClose()
//     } catch (error) {
//       toast({
//         title: t("error"),
//         description: t("failed_to_onboard_student"),
//         variant: "destructive",
//       })

//       if (onSubmitError) onSubmitError(error)
//     }
//   }

//   useEffect(() => {
//     if (initial_data?.birth_date) {
//       form.setValue("birth_date", new Date(initial_data.birth_date))
//     }
//   }, [initial_data, form])

//   return (
//     <Card className="w-full">
//       {/* <CardHeader>
//         <CardTitle>{t("onboard_student")}</CardTitle>
//         <CardDescription>{t("convert_inquiry_to_student_by_filling_the_required_details")}</CardDescription>
//       </CardHeader> */}
//       <CardContent>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* First Name */}
//               <FormField
//                 control={form.control}
//                 name="first_name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("first_name")}</FormLabel>
//                     <FormControl>
//                       <Input placeholder={t("enter_first_name")} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Last Name */}
//               <FormField
//                 control={form.control}
//                 name="last_name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("last_name")}</FormLabel>
//                     <FormControl>
//                       <Input placeholder={t("enter_last_name")} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Gender */}
//               <FormField
//                 control={form.control}
//                 name="gender"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("gender")}</FormLabel>
//                     <Select onValueChange={field.onChange} defaultValue={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder={t("select_gender")} />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         <SelectItem value="Male">{t("male")}</SelectItem>
//                         <SelectItem value="Female">{t("female")}</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Birth Date */}
//               <FormField
//                 control={form.control}
//                 name="birth_date"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel>{t("birth_date")}</FormLabel>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <FormControl>
//                           <Button
//                             variant={"outline"}
//                             className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
//                           >
//                             {field.value ? format(field.value, "PPP") : <span>{t("select_date")}</span>}
//                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
//                           </Button>
//                         </FormControl>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0" align="start">
//                         <Calendar
//                           mode="single"
//                           selected={field.value}
//                           onSelect={field.onChange}
//                           disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Class */}
//               <FormField
//                 control={form.control}
//                 name="class"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("class")}</FormLabel>
//                     <Select disabled onValueChange={(value) => handleClassChange(value)} defaultValue={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder={t("select_class")} />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {AcademicClasses?.map((cls) => (
//                           <SelectItem key={cls.id} value={cls.id.toString()}>
//                             Class {cls.class}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Division */}
//               <FormField
//                 control={form.control}
//                 name="division"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("division")}</FormLabel>
//                     <Select
//                       onValueChange={field.onChange}
//                       defaultValue={field.value}
//                       disabled={!selectedClass || !availableDivisions?.divisions?.length}
//                     >
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder={t("select_division")} />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {availableDivisions?.divisions?.map((div) => (
//                           <SelectItem key={div.id} value={div.id.toString()}>
//                             {div.division} {div.aliases ? `- ${div.aliases}` : ""}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Primary Mobile */}
//               <FormField
//                 control={form.control}
//                 name="primary_mobile"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("primary_mobile")}</FormLabel>
//                     <FormControl>
//                       <Input type="tel" placeholder={t("enter_mobile_number")} {...field} maxLength={10} />
//                     </FormControl>
//                     <FormDescription>{t("mobile_number_must_be_10_digits_and_start_with_6_9")}</FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Father Name */}
//               <FormField
//                 control={form.control}
//                 name="father_name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("father_name")}</FormLabel>
//                     <FormControl>
//                       <Input placeholder={t("enter_father_name")} {...field} value={field.value || ""} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <CardFooter className="flex justify-between px-0 pt-4">
//               <Button type="button" variant="outline" onClick={onClose}>
//                 {t("cancel")}
//               </Button>
//               <Button type="submit" disabled={isOnBoardingStudent}>
//                 {isOnBoardingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                 {t("onboard_student")}
//               </Button>
//             </CardFooter>
//           </form>
//         </Form>
//       </CardContent>
//     </Card>
//   )
// }

// export default OnboardingForm


"use client"

import type React from "react"
import { useEffect, useMemo, useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { selectAuthState } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useConvertQueryToStudentMutation } from "@/services/InquiryServices"
import type { ReqBodyForOnBoardingStudent, Student } from "@/types/student"
import { toast } from "@/hooks/use-toast"
import { Loader2, Landmark, Award, ShieldCheck, Coins } from "lucide-react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import ApiService from "@/services/ApiService"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Zod schema for onboarding (all required fields, no GR no)
const onboardingSchema = z.object({
  first_name: z
    .string()
    .min(3, "First name is required")
    .regex(/^[A-Za-z\s]+$/, "First name should contain only alphabets and spaces"),
  middle_name: z
    .string()
    .optional()
    .refine((val) => !val || /^[A-Za-z\s]*$/.test(val), "Middle name should contain only alphabets and spaces"),
  last_name: z
    .string()
    .min(3, "Last name is required")
    .regex(/^[A-Za-z\s]+$/, "Last name should contain only alphabets and spaces"),
  gender: z.enum(["Male", "Female"], { errorMap: () => ({ message: "Gender must be either Male or Female" }) }),
  birth_date: z.date({
    required_error: "Birth date is required",
    invalid_type_error: "Birth date must be a valid date",
  }),
  class: z.string().min(1, "Class is required"),
  division: z.string().optional().nullable().or(z.literal("")),
  primary_mobile: z
    .string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^[6-9]\d{9}$/, "Mobile number must be 10 digits and start with 6-9"),
  father_name: z
    .string()
    .min(2, "Father's name is required")
    .regex(/^[A-Za-z\s]+$/, "Father's name should contain only alphabets and spaces")
    .nullable(),
  quota_id: z.coerce.number().optional().nullable(),
  fees_plan_id: z.coerce.number().optional().nullable(),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>

interface OnboardingFormProps {
  onClose: () => void
  inquiry_id: number
  academic_session_id: number
  initial_data?: Partial<Student> | null
  onSubmitSuccess?: (studentData: Student) => void
  onSubmitError?: (error: any) => void
}

const OnboardingForm: React.FC<OnboardingFormProps> = ({
  onClose,
  inquiry_id,
  academic_session_id,
  initial_data,
  onSubmitSuccess,
  onSubmitError,
}) => {
  const AcademicClasses = useAppSelector(selectAcademicClasses)
  const authState = useAppSelector(selectAuthState)
  const { t } = useTranslation()
  const [convertInquiryToStudent, { isLoading: isOnBoardingStudent }] = useConvertQueryToStudentMutation()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      first_name: initial_data?.first_name || "",
      middle_name: initial_data?.middle_name || "",
      last_name: initial_data?.last_name || "",
      gender: (initial_data?.gender as "Male" | "Female") || undefined,
      birth_date: initial_data?.birth_date ? new Date(initial_data.birth_date) : undefined,
      class: initial_data?.class_id ? initial_data.class_id.toString() : "",
      division: undefined,
      primary_mobile: initial_data?.primary_mobile ? initial_data.primary_mobile.toString() : "",
      father_name: initial_data?.father_name || null,
      quota_id: (initial_data as any)?.quota_type || (initial_data as any)?.quota_id || null,
      fees_plan_id: (initial_data as any)?.fees_plan_id || null,
    },
  })

  // ── Quotas & Fee Templates ────────────────────────────────────────────────
  const [quotas, setQuotas] = useState<any[]>([])
  const [feePlans, setFeePlans] = useState<any[]>([])

  useEffect(() => {
    const fetchQuotasAndPlans = async () => {
      try {
        const qRes = await ApiService.get("quota/all")
        if (Array.isArray(qRes?.data)) setQuotas(qRes.data)
        else if (Array.isArray(qRes?.data?.data)) setQuotas(qRes.data.data)
      } catch (e) {
        console.warn("Could not load quotas in onboarding:", e)
      }

      if (academic_session_id) {
        try {
          const fpRes = await ApiService.get(`feesplan?academic_session=${academic_session_id}&status=Active&limit=100`)
          if (Array.isArray(fpRes?.data?.data)) setFeePlans(fpRes.data.data)
          else if (Array.isArray(fpRes?.data)) setFeePlans(fpRes.data)
        } catch (e) {
          console.warn("Could not load fee plans in onboarding:", e)
        }
      }
    }
    fetchQuotasAndPlans()
  }, [academic_session_id])

  const selectedClass = form.watch("class")

  const availableDivisions = useMemo(() => {
    if (AcademicClasses && selectedClass) {
      return AcademicClasses.find((cls) => cls.id.toString() === selectedClass)
    }
    return null
  }, [AcademicClasses, selectedClass])

  const handleClassChange = useCallback(
    (class_id: string) => {
      form.setValue("class", class_id)
      form.setValue("division", "")
      form.trigger("division")
    },
    [form],
  )

  const handleFormSubmit = (values: OnboardingFormData) => {
    setShowConfirmDialog(true)
  }

  const confirmOnboarding = async () => {
    const values = form.getValues()
    try {
      const payload: ReqBodyForOnBoardingStudent = {
        class_id: Number(values.class),
        first_name: values.first_name,
        middle_name: values.middle_name || null,
        last_name: values.last_name,
        gender: values.gender,
        birth_date: format(values.birth_date, "yyyy-MM-dd"),
        primary_mobile: Number(values.primary_mobile),
        father_name: values.father_name,
        division_id: values.division ? Number(values.division) : (availableDivisions?.divisions?.[0]?.id ?? null) as any,
        academic_session_id: academic_session_id,
        quota_id: values.quota_id ? Number(values.quota_id) : null,
        fees_plan_id: values.fees_plan_id ? Number(values.fees_plan_id) : null,
      }

      const result = await convertInquiryToStudent({ inquiry_id, payload }).unwrap()

      toast({
        title: t("success"),
        description: t("student_onboarded_successfully"),
      })

      if (onSubmitSuccess) onSubmitSuccess(result)
      setShowConfirmDialog(false)
      onClose()
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failed_to_onboard_student"),
        variant: "destructive",
      })

      if (onSubmitError) onSubmitError(error)
      setShowConfirmDialog(false)
    }
  }

  useEffect(() => {
    if (initial_data?.birth_date) {
      form.setValue("birth_date", new Date(initial_data.birth_date))
    }
  }, [initial_data, form])

  return (
    <>
      <Card className="w-full">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("first_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("enter_first_name")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Middle Name */}
                <FormField
                  control={form.control}
                  name="middle_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("middle_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("enter_middle_name")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("last_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("enter_last_name")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("gender")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_gender")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">{t("male")}</SelectItem>
                          <SelectItem value="Female">{t("female")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Birth Date */}
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("birth_date")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>{t("select_date")}</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Class */}
                <FormField
                  control={form.control}
                  name="class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("class")}</FormLabel>
                      <Select disabled onValueChange={(value) => handleClassChange(value)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_class")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AcademicClasses?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Division */}
                <FormField
                  control={form.control}
                  name="division"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("division")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        disabled={!selectedClass || !availableDivisions?.divisions?.length}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_division")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDivisions?.divisions?.map((div) => (
                            <SelectItem key={div.id} value={div.id.toString()}>
                              {div.division} {div.aliases ? `- ${div.aliases}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Primary Mobile */}
                <FormField
                  control={form.control}
                  name="primary_mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("primary_mobile")}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder={t("enter_mobile_number")} {...field} maxLength={10} />
                      </FormControl>
                      <FormDescription>{t("mobile_number_must_be_10_digits_and_start_with_6_9")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Father Name */}
                <FormField
                  control={form.control}
                  name="father_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("father_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("enter_father_name")} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Admission Quota & Fee Structure Template ────────────── */}
              <div className="p-4 rounded-lg border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-emerald-600 text-white">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Admission Quota & Fee Template (Grandfathered Cohort)
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Assign quota and lock student cohort fee plan upon onboarding.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                    <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" />
                    Locked Cohort
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <FormField
                    control={form.control}
                    name="quota_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-blue-600" />
                          Admission Quota
                        </FormLabel>
                        <Select
                          value={field.value ? String(field.value) : "none"}
                          onValueChange={(val) => {
                            const qId = val === "none" ? null : Number(val)
                            field.onChange(qId)
                            if (qId) {
                              const match = feePlans.find((p) => Number(p.quota_id) === qId)
                              if (match) form.setValue("fees_plan_id", match.id)
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs bg-white">
                              <SelectValue placeholder="Select quota..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs">
                              General / Unassigned Quota
                            </SelectItem>
                            {quotas.map((q) => (
                              <SelectItem key={q.id} value={String(q.id)} className="text-xs">
                                {q.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fees_plan_id"
                    render={({ field }) => {
                      const currentQId = form.watch("quota_id")
                      const matchingPlans = currentQId
                        ? feePlans.filter((p) => Number(p.quota_id) === Number(currentQId))
                        : feePlans
                      const plansToDisplay = matchingPlans.length > 0 ? matchingPlans : feePlans

                      return (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Coins className="h-3.5 w-3.5 text-amber-600" />
                            Fee Template
                          </FormLabel>
                          <Select
                            value={field.value ? String(field.value) : "none"}
                            onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8 text-xs bg-white">
                                <SelectValue placeholder="Select fee template..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs">
                                Do not assign fee template yet
                              </SelectItem>
                              {plansToDisplay.map((plan) => (
                                <SelectItem key={plan.id} value={String(plan.id)} className="text-xs">
                                  {plan.name} — ₹{Number(plan.total_amount || 0).toLocaleString("en-IN")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                </div>
              </div>

              <CardFooter className="flex justify-between px-0 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isOnBoardingStudent}>
                  {isOnBoardingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("onboard_student")}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_student_onboarding")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "are_you_sure_you_want_to_onboard_this_student_this_action_will_convert_the_inquiry_to_an_enrolled_student",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOnboarding} disabled={isOnBoardingStudent}>
              {isOnBoardingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("confirm_onboarding")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default OnboardingForm
