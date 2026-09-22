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
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
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
    },
  })

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
