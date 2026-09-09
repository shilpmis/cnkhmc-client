// import type React from "react"
// import { useState, useEffect, useMemo } from "react"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import type * as z from "zod"
// import { Button } from "@/components/ui/button"
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Input } from "@/components/ui/input"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
// import { Loader2, Search, UserPlus, AlertCircle, Info } from "lucide-react"
// import {
//   useLazyGetAllFeesTypeQuery,
//   useApplyConcessionsToPlanMutation,
//   useLazyGetFilteredFeesPlanQuery,
//   useLazyGetFilterdStudentFeesDetailsForClassQuery,
//   useLazyGetFilterFeesTypeQuery,
// } from "@/services/feesService"
// import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
// import { selectAcademicClasses } from "@/redux/slices/academicSlice"
// import { toast } from "@/hooks/use-toast"
// import { Skeleton } from "@/components/ui/skeleton"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import type { AcademicClasses, Division } from "@/types/academic"
// import type { Concession } from "@/types/fees"
// import { SaralPagination } from "@/components/ui/common/SaralPagination"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import {
//   type ApplyConcessionToPlanData,
//   applyConcessionToPlanSchema,
//   type ApplyConcessionToStudentData,
//   applyConcessionToStudentSchema,
// } from "@/utils/fees.validation"
// import { useNavigate } from "react-router-dom"
// import { useTranslation } from "@/redux/hooks/useTranslation"

// interface ApplyConcessionFormProps {
//   concession: Concession
//   isApplyingConcesson: boolean
//   onSubmit: (data: ApplyConcessionToPlanData | ApplyConcessionToStudentData) => void
//   onCancel: () => void
// }

// export const ApplyConcessionForm: React.FC<ApplyConcessionFormProps> = ({
//   concession,
//   isApplyingConcesson,
//   onSubmit,
//   onCancel,
// }) => {
//   const { t } = useTranslation()
//   const authState = useAppSelector(selectAuthState)
//   const academicClasses = useAppSelector(selectAcademicClasses)
//   const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
//   const navigate = useNavigate()

//   if (!CurrentAcademicSessionForSchool) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="bg-white p-6 rounded-lg shadow-lg text-center">
//           <h2 className="text-xl font-semibold mb-4">{t("no_active_academic_session")}</h2>
//           <p className="text-gray-600 mb-6">{t("please_set_an_active_academic_session_to_proceed.")}</p>
//           <button
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//             onClick={() => navigate("/academic-sessions")}
//           >
//             {t("go_to_academic_sessions")}
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // Queries and mutations
//   const [getFilterFeePlans, { data: feePlans, isLoading: isLoadingFeePlans }] = useLazyGetFilteredFeesPlanQuery()
//   const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
//   const [
//     getFilterClassFeesStatus,
//     {
//       data: studentFeesStatuForClass,
//       isLoading: isLoadingStudentFeesStatuForClass,
//       isError: isErroWhileFetchingStudentFeesStatuForClass,
//       error: ErrorWhileFetchingStudentFeesStatuForClass,
//     },
//   ] = useLazyGetFilterdStudentFeesDetailsForClassQuery()

//   const [applyConcessionToPlan, { isLoading: isApplyingToPlan }] = useApplyConcessionsToPlanMutation()
//   const [applyConcessionToStudent, { isLoading: isApplyingToStudent }] = useApplyConcessionsToPlanMutation()
//   const [getAllFeesType, { data: feeTypes, isLoading: isLoadingFeeTypes }] = useLazyGetAllFeesTypeQuery()
//   const [getFilterFeesType, { data: FilteredFeesType, isLoading: isLoadingFilterFeeTypes }] =
//     useLazyGetFilterFeesTypeQuery()
//   // Local state for plan concessions
//   const [searchTermPlan, setSearchTermPlan] = useState("")
//   const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
//   const [selectedFeeTypes, setSelectedFeeTypes] = useState<number[]>([])

//   // Local state for student concessions
//   const [selectedClass, setSelectedClass] = useState<string>("")
//   const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
//   const [searchTermStudent, setSearchTermStudent] = useState("")
//   const [currentPage, setCurrentPage] = useState(1)
//   const [studentsPerPage] = useState(10)
//   const [studentDialogOpen, setStudentDialogOpen] = useState(false)
//   const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
//   const [selectedStudentFeeTypes, setSelectedStudentFeeTypes] = useState<number[]>([])

//   // Initialize forms based on concession type
//   const planForm = useForm<z.infer<typeof applyConcessionToPlanSchema>>({
//     resolver: zodResolver(applyConcessionToPlanSchema),
//     defaultValues: {
//       concession_id: concession.id,
//       fees_plan_id: undefined,
//       fees_type_ids: null,
//       deduction_type: "percentage",
//       fixed_amount: null,
//       percentage: null,
//     },
//   })

//   const studentForm = useForm<z.infer<typeof applyConcessionToStudentSchema>>({
//     resolver: zodResolver(applyConcessionToStudentSchema),
//     defaultValues: {
//       concession_id: concession.id,
//       student_id: undefined,
//       fees_plan_id: undefined,
//       fees_type_ids: null,
//       deduction_type: "percentage",
//       fixed_amount: null,
//       percentage: null,
//       reason: "",
//     },
//   })

//   // Watch for deduction type changes
//   const planDeductionType = planForm.watch("deduction_type")
//   const studentDeductionType = studentForm.watch("deduction_type")

//   // Filter fee plans based on search term
//   const filteredFeePlans =
//     feePlans?.data.filter((plan) => plan.name.toLowerCase().includes(searchTermPlan.toLowerCase())) || []

//   // Filter students based on search term
//   const filteredStudents = studentFeesStatuForClass
//     ? studentFeesStatuForClass.data.filter((student) => {
//         const fullName = `${student.first_name} ${student.middle_name} ${student.last_name}`.toLowerCase()
//         const grNumber = student.gr_no != null ? student.gr_no.toString() : ""
//         return fullName.includes(searchTermStudent.toLowerCase()) || grNumber.includes(searchTermStudent.toLowerCase())
//       })
//     : []

//   // Pagination for students
//   const indexOfLastStudent = currentPage * studentsPerPage
//   const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
//   const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent)
//   const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)

//   // Get available divisions for selected class
//   const availableDivisions = useMemo<AcademicClasses | null>(() => {
//     if (academicClasses && selectedClass) {
//       return academicClasses.filter((cls) => cls.class.toString() === selectedClass)[0]
//     }
//     return null
//   }, [academicClasses, selectedClass])

//   // Handle form submission for plan concessions
//   const handleSubmitForApplyConcessionToPlan = async (values: z.infer<typeof applyConcessionToPlanSchema>) => {
//     try {
//       // Prepare the submission data
//       const submissionData = {
//         concession_id: values.concession_id,
//         fees_plan_id: values.fees_plan_id,
//         fees_type_ids:
//           concession.concessions_to === "fees_type" ? (selectedFeeTypes.length > 0 ? selectedFeeTypes : null) : null,
//         deduction_type: values.deduction_type,
//         fixed_amount: values.deduction_type === "fixed_amount" ? values.fixed_amount : null,
//         percentage: values.deduction_type === "percentage" ? values.percentage : null,
//       }

//       // Call the onSubmit function with the prepared data
//       onSubmit(submissionData)

//       toast({
//         title: "Success",
//         description: "Concession applied to fee plan successfully",
//       })
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to apply concession to fee plan",
//         variant: "destructive",
//       })
//     }
//   }

//   // Handle form submission for student concessions
//   const handleSubmitForApplyConcessionToStudents = async (values: z.infer<typeof applyConcessionToStudentSchema>) => {
//     try {
//       // Prepare the submission data
//       const submissionData = {
//         concession_id: values.concession_id,
//         student_id: values.student_id,
//         fees_plan_id: values.fees_plan_id,
//         fees_type_ids:
//           concession.concessions_to === "fees_type"
//             ? selectedStudentFeeTypes.length > 0
//               ? selectedStudentFeeTypes
//               : null
//             : null,
//         deduction_type: values.deduction_type,
//         amount: values.deduction_type === "fixed_amount" ? values.fixed_amount : null,
//         percentage: values.deduction_type === "percentage" ? values.percentage : null,
//         fixed_amount: values.deduction_type === "fixed_amount" ? values.fixed_amount : null,
//       }

//       // Call the onSubmit function with the prepared data
//       onSubmit(submissionData)

//       // setStudentDialogOpen(false)

//       // Refresh student data
//       if (selectedClass && selectedDivision) {
//         getFilterClassFeesStatus({
//           class_id: selectedDivision.id,
//           academic_session: CurrentAcademicSessionForSchool!.id,
//           filter_by: "eligible_for_concession",
//           value: concession.id,
//         })
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to apply concession to student",
//         variant: "destructive",
//       })
//     }
//   }

//   // Handle fee plan selection
//   const handlePlanSelect = (planId: number) => {
//     setSelectedPlan(planId)
//     planForm.setValue("fees_plan_id", planId)
//   }

//   // Handle fee type selection for plans
//   const handleFeeTypeSelect = (feeTypeId: number) => {
//     setSelectedFeeTypes((prev) => {
//       if (prev.includes(feeTypeId)) {
//         return prev.filter((id) => id !== feeTypeId)
//       } else {
//         return [...prev, feeTypeId]
//       }
//     })
//   }

//   // Handle fee type selection for students
//   const handleStudentFeeTypeSelect = (feeTypeId: number) => {
//     setSelectedStudentFeeTypes((prev) => {
//       if (prev.includes(feeTypeId)) {
//         return prev.filter((id) => id !== feeTypeId)
//       } else {
//         return [...prev, feeTypeId]
//       }
//     })
//   }

//   // Handle class selection change
//   const handleClassChange = (value: string) => {
//     setSelectedClass(value)
//     setSelectedDivision(null)
//   }

//   // Handle division selection change
//   const handleDivisionChange = async (value: string) => {
//     if (academicClasses) {
//       const selectedDiv = academicClasses
//         .filter((cls) => cls.class.toString() === selectedClass)[0]
//         .divisions.filter((div) => div.id.toString() === value)

//       setSelectedDivision(selectedDiv[0])

//       try {
//         await getFilterClassFeesStatus({
//           class_id: selectedDiv[0].id,
//           academic_session: CurrentAcademicSessionForSchool!.id,
//           filter_by: "eligible_for_concession",
//           value: concession.id,
//         }).unwrap()

//         await getFilterFeesType({
//           academic_session_id: CurrentAcademicSessionForSchool!.id,
//           filter: "division",
//           value: selectedDiv[0].class_id,
//         })
//       } catch (error) {
//         console.log("Error while fetching fees data", error)
//         toast({
//           variant: "destructive",
//           title: "Failed to fetch fees data",
//           description: "Please try again later",
//         })
//       }
//     }
//   }

//   // Handle opening student concession dialog
//   const handleOpenStudentDialog = (student: any) => {
//     setSelectedStudent(student)
//     setSelectedStudentFeeTypes([])
//     studentForm.setValue("student_id", student.id)
//     studentForm.setValue("fees_plan_id", student.fees_status.fees_plan_id)
//     setStudentDialogOpen(true)
//   }

//   // Format currency
//   const formatCurrency = (amount: string | number) => {
//     return `₹${Number(amount).toLocaleString("en-IN", {
//       maximumFractionDigits: 2,
//       minimumFractionDigits: 2,
//     })}`
//   }

//   // Pagination controls
//   const paginate = (pageNumber: number) => {
//     setCurrentPage(pageNumber)
//     if (selectedDivision) {
//       getFilterClassFeesStatus({
//         class_id: selectedDivision.id,
//         page: pageNumber,
//         academic_session: CurrentAcademicSessionForSchool!.id,
//         filter_by: "eligible_for_concession",
//         value: concession.id,
//       })
//     }
//   }

//   // Fetch initial data
//   useEffect(() => {
//     if (concession.applicable_to === "plan") {
//       getFilterFeePlans({
//         page: 1,
//         academic_session: CurrentAcademicSessionForSchool!.id,
//         filter_by: "eligible_for_concession",
//         value: concession.id,
//       })
//     } else if (concession.applicable_to === "students" && !academicClasses) {
//       getAcademicClasses(authState.user!.school_id)
//     }

//     // Always fetch fee types for both concession types
//     getAllFeesType({ 
//       academic_session_id: CurrentAcademicSessionForSchool!.id,
//       applicable_to : "plan",      
//      })
//   }, [])

//   // Auto-select first class and division when academicClasses are loaded
//   useEffect(() => {
//     if (academicClasses && academicClasses.length > 0 && !selectedClass) {
//       // Find first class with divisions
//       const firstClassWithDivisions = academicClasses.find((cls) => cls.divisions.length > 0)

//       if (firstClassWithDivisions) {
//         // Set the first class
//         setSelectedClass(firstClassWithDivisions.class.toString())

//         // Set the first division of that class
//         if (firstClassWithDivisions.divisions.length > 0) {
//           const firstDivision = firstClassWithDivisions.divisions[0]
//           setSelectedDivision(firstDivision)

//           // Fetch fees data for this class and division
//           getFilterClassFeesStatus({
//             class_id: firstDivision.id,
//             academic_session: CurrentAcademicSessionForSchool!.id,
//             filter_by: "eligible_for_concession",
//             value: concession.id,
//           })

//           // Also fetch filtered fee types for the initially selected division
//           getFilterFeesType({
//             academic_session_id: CurrentAcademicSessionForSchool!.id,
//             filter: "division",
//             value: firstDivision.id,
//           })
//         }
//       }
//     }
//   }, [academicClasses])

//   // For plan form: clear values and errors on deduction_type change
//   useEffect(() => {
//     if (planDeductionType === "percentage") {
//       planForm.setValue("fixed_amount", null)
//       planForm.clearErrors("fixed_amount")
//     } else if (planDeductionType === "fixed_amount") {
//       planForm.setValue("percentage", null)
//       planForm.clearErrors("percentage")
//     }
//   }, [planDeductionType])

//   // For student form: clear values and errors on deduction_type change
//   useEffect(() => {
//     if (studentDeductionType === "percentage") {
//       studentForm.setValue("fixed_amount", null)
//       studentForm.clearErrors("fixed_amount")
//     } else if (studentDeductionType === "fixed_amount") {
//       studentForm.setValue("percentage", null)
//       studentForm.clearErrors("percentage")
//     }
//   }, [studentDeductionType])

//   // Reset student dialog form and fee types when dialog closes
//   useEffect(() => {
//     if (!studentDialogOpen) {
//       studentForm.reset({
//         concession_id: concession.id,
//         student_id: undefined,
//         fees_plan_id: undefined,
//         fees_type_ids: null,
//         deduction_type: "percentage",
//         fixed_amount: null,
//         percentage: null,
//         reason: "",
//       })
//       setSelectedStudent(null)
//       setSelectedStudentFeeTypes([])
//     }
//   }, [studentDialogOpen])

//   return (
//     <div className="space-y-6">
//       <div className="bg-muted p-4 rounded-md mb-6">
//         <h3 className="font-medium text-lg mb-2">
//           {t("applying_concession")}: {concession.name}
//         </h3>
//         <p className="text-sm text-muted-foreground mb-1">
//           {t("category")}: {concession.category}
//         </p>
//         <p className="text-sm text-muted-foreground mb-1">
//           {t("applicable_to")}: <span className="capitalize">{concession.applicable_to}</span>
//         </p>
//         <p className="text-sm text-muted-foreground mb-1">
//           {t("concession_applies_to")}:{" "}
//           <span className="capitalize">{concession.concessions_to === "fees_type" ? "Fee Type" : "Plan"}</span>
//         </p>
//         <p className="text-sm text-muted-foreground">{concession.description}</p>
//       </div>

//       {/* Warning about deduction type */}
//       <Alert variant="destructive" className="bg-amber-50 border-amber-200">
//         <Info className="h-4 w-4 text-amber-600" />
//         <AlertTitle className="text-amber-800">{t("important_information")}</AlertTitle>
//         <AlertDescription className="text-amber-700">
//           {concession.concessions_to === "fees_type"
//             ? t(
//                 "this_concession_will_be_applied_to_specific_fee_types._the_deduction_amount_or_percentage_will_be_applied_to_each_selected_fee_type_individually.",
//               )
//             : t(
//                 "this_concession_will_be_applied_to_the_entire_fee_plan._the_deduction_amount_or_percentage_will_be_applied_to_the_total_plan_amount.",
//               )}
//         </AlertDescription>
//       </Alert>

//       {concession.applicable_to === "plan" ? (
//         // Plan Concession Form
//         <Form {...planForm}>
//           <form onSubmit={planForm.handleSubmit(handleSubmitForApplyConcessionToPlan)} className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <FormField
//                 control={planForm.control}
//                 name="deduction_type"
//                 render={({ field }) => (
//                   <FormItem className="space-y-3">
//                     <FormLabel>{t("deduction_type")}</FormLabel>
//                     <FormControl>
//                       <RadioGroup
//                         onValueChange={field.onChange}
//                         defaultValue={field.value}
//                         className="flex flex-col space-y-1"
//                       >
//                         <FormItem className="flex items-center space-x-3 space-y-0">
//                           <FormControl>
//                             <RadioGroupItem value="percentage" />
//                           </FormControl>
//                           <FormLabel className="font-normal">{t("percentage")} (%)</FormLabel>
//                         </FormItem>
//                         <FormItem className="flex items-center space-x-3 space-y-0">
//                           <FormControl>
//                             <RadioGroupItem value="fixed_amount" />
//                           </FormControl>
//                           <FormLabel className="font-normal">{t("fixed_amount")} (₹)</FormLabel>
//                         </FormItem>
//                       </RadioGroup>
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {planDeductionType === "percentage" ? (
//                 <FormField
//                   control={planForm.control}
//                   name="percentage"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>{t("percentage")}</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="number"
//                           placeholder={t("enter_percentage_value")}
//                           {...field}
//                           value={field.value ?? ""}
//                           onChange={(e) => {
//                             field.onChange(e.target.value ? Number(e.target.value) : null)
//                             planForm.trigger("percentage") // trigger validation on change
//                           }}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                       <FormDescription>{t("enter_a_value_between_1_and_100")}</FormDescription>
//                     </FormItem>
//                   )}
//                 />
//               ) : (
//                 <FormField
//                   control={planForm.control}
//                   name="fixed_amount"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>{t("amount")}</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="number"
//                           placeholder={t("enter_amount_in_rupees")}
//                           {...field}
//                           value={field.value ?? ""}
//                           onChange={(e) => {
//                             field.onChange(e.target.value ? Number(e.target.value) : null)
//                             planForm.trigger("fixed_amount") // trigger validation on change
//                           }}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                       <FormDescription>{t("enter_the_fixed_amount_to_deduct")}</FormDescription>
//                     </FormItem>
//                   )}
//                 />
//               )}
//             </div>

//             <Card>
//               <CardHeader>
//                 <CardTitle>{t("select_fee_plan")}</CardTitle>
//                 <CardDescription>{t("choose_the_fee_plan_to_which_this_concession_will_be_applied")}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="mb-4">
//                   <div className="relative">
//                     <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
//                     <Input
//                       placeholder={t("search_fee_plans...")}
//                       className="pl-8"
//                       value={searchTermPlan}
//                       onChange={(e) => setSearchTermPlan(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 <div className="rounded-md border">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead className="w-[50px]">{t("select")}</TableHead>
//                         <TableHead>{t("plan_name")}</TableHead>
//                         <TableHead>{t("class")}</TableHead>
//                         <TableHead>{t("total_amount")}</TableHead>
//                         <TableHead>{t("status")}</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {isLoadingFeePlans ? (
//                         Array(3)
//                           .fill(0)
//                           .map((_, index) => (
//                             <TableRow key={`loading-${index}`}>
//                               <TableCell colSpan={5}>
//                                 <Skeleton className="h-10 w-full" />
//                               </TableCell>
//                             </TableRow>
//                           ))
//                       ) : filteredFeePlans.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
//                             {searchTermPlan ? "No fee plans match your search" : "No fee plans found"}
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         filteredFeePlans.map((plan) => (
//                           <TableRow key={plan.id} className={selectedPlan === plan.id ? "bg-muted" : ""}>
//                             <TableCell>
//                               <Checkbox
//                                 checked={selectedPlan === plan.id}
//                                 onCheckedChange={() => handlePlanSelect(plan.id)}
//                               />
//                             </TableCell>
//                             <TableCell className="font-medium">{plan.name}</TableCell>
//                             <TableCell>{plan.description}</TableCell>
//                             <TableCell>{formatCurrency(plan.total_amount)}</TableCell>
//                             <TableCell>
//                               <Badge variant={plan.status === "Active" ? "default" : "destructive"}>
//                                 {plan.status}
//                               </Badge>
//                             </TableCell>
//                           </TableRow>
//                         ))
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>
//               </CardContent>
//             </Card>

//             {concession.concessions_to === "fees_type" && selectedPlan && (
//               <Card>
//                 <CardHeader>
//                   <CardTitle>{t("select_fee_types")}</CardTitle>
//                   <CardDescription>
//                     {t("choose_the_specific_fee_types_to_which_this_c_ncession_will_be_applied")}
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   {isLoadingFeeTypes ? (
//                     <div className="space-y-2">
//                       {Array(4)
//                         .fill(0)
//                         .map((_, index) => (
//                           <Skeleton key={`loading-${index}`} className="h-8 w-full" />
//                         ))}
//                     </div>
//                   ) : feeTypes && feeTypes.length > 0 ? (
//                     <div className="grid grid-cols-2 gap-4">
//                       {feeTypes.map((feeType) => (
//                         <div key={feeType.id} className="flex items-center space-x-2">
//                           <Checkbox
//                             id={`fee-type-${feeType.id}`}
//                             checked={selectedFeeTypes.includes(feeType.id)}
//                             onCheckedChange={() => handleFeeTypeSelect(feeType.id)}
//                           />
//                           <label
//                             htmlFor={`fee-type-${feeType.id}`}
//                             className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                           >
//                             {feeType.name}
//                           </label>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-muted-foreground">{t("no_fee_types_available")}</p>
//                   )}
//                 </CardContent>
//               </Card>
//             )}

//             <div className="flex justify-end space-x-2">
//               <Button type="button" variant="outline" onClick={onCancel} disabled={isApplyingConcesson}>
//                 {t("cancel")}
//               </Button>
//               <Button
//                 type="submit"
//                 disabled={
//                   isApplyingConcesson ||
//                   !selectedPlan ||
//                   (concession.concessions_to === "fees_type" && selectedFeeTypes.length === 0)
//                 }
//               >
//                 {isApplyingConcesson ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Applying...
//                   </>
//                 ) : (
//                   "Apply Concession"
//                 )}
//               </Button>
//             </div>
//           </form>
//         </Form>
//       ) : (
//         // Student Concession Form
//         <>
//           <div className="space-y-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>{t("student_selection")}</CardTitle>
//                 <CardDescription>{t("select_a_class_and_division_to_view_students")}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                   <div>
//                     <label htmlFor="class-select" className="text-sm font-medium text-gray-700 mb-1 block">
//                       {t("class")}
//                     </label>
//                     <Select value={selectedClass} onValueChange={handleClassChange}>
//                       <SelectTrigger id="class-select">
//                         <SelectValue placeholder={t("select_class")} />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {academicClasses?.map((cls, index) =>
//                           cls.divisions.length > 0 ? (
//                             <SelectItem key={index} value={cls.class.toString()}>
//                               Class {cls.class}
//                             </SelectItem>
//                           ) : null,
//                         )}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div>
//                     <label htmlFor="division-select" className="text-sm font-medium text-gray-700 mb-1 block">
//                       {t("division")}
//                     </label>
//                     <Select
//                       value={selectedDivision ? selectedDivision.id.toString() : ""}
//                       onValueChange={handleDivisionChange}
//                       disabled={!selectedClass}
//                     >
//                       <SelectTrigger className="w-[180px]">
//                         <SelectValue placeholder={t("select_division")} />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {availableDivisions?.divisions.map((division, index) => (
//                           <SelectItem key={index} value={division.id.toString()}>
//                             {`${division.division} ${division.aliases ? "- " + division.aliases : ""}`}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div>
//                     <label htmlFor="student-search" className="text-sm font-medium text-gray-700 mb-1 block">
//                       {t("search")}
//                     </label>
//                     <div className="relative">
//                       <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
//                       <Input
//                         id="student-search"
//                         placeholder="Search by name or GR number"
//                         className="pl-8"
//                         value={searchTermStudent}
//                         onChange={(e) => setSearchTermStudent(e.target.value)}
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {!selectedClass || !selectedDivision ? (
//                   <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md">
//                     <div className="flex">
//                       <div className="flex-shrink-0">
//                         <AlertCircle className="h-5 w-5 text-blue-500" />
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-sm">{t("please_select_a_class_and_division_to_view_students.")}</p>
//                       </div>
//                     </div>
//                   </div>
//                 ) : isLoadingStudentFeesStatuForClass ? (
//                   <div className="space-y-4">
//                     {Array(5)
//                       .fill(0)
//                       .map((_, index) => (
//                         <Skeleton key={`loading-${index}`} className="h-16 w-full" />
//                       ))}
//                   </div>
//                 ) : filteredStudents.length === 0 && !isErroWhileFetchingStudentFeesStatuForClass ? (
//                   <div className="text-center py-8 text-muted-foreground">
//                     {searchTermStudent
//                       ? "No students match your search"
//                       : t("no_students_found_in_this_class/division")}
//                   </div>
//                 ) : isErroWhileFetchingStudentFeesStatuForClass ? (
//                   <div className="text-center py-8 text-red-500">{t("this_class_has_no_fees_plan_for_now.")}</div>
//                 ) : (
//                   <ScrollArea className="h-[400px] rounded-md">
//                     <div className="rounded-md border">
//                       <Table>
//                         <TableHeader>
//                           <TableRow>
//                             <TableHead>{t("student")}</TableHead>
//                             <TableHead>{t("gr_number")}</TableHead>
//                             <TableHead>{t("roll_number")}</TableHead>
//                             <TableHead>{t("status")}</TableHead>
//                             <TableHead>{t("due_amount")}</TableHead>
//                             <TableHead className="text-right">{t("action")}</TableHead>
//                           </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                           {currentStudents.map((student) => (
//                             <TableRow key={student.id}>
//                               <TableCell>
//                                 <div className="flex items-center space-x-3">
//                                   <Avatar className="h-9 w-9">
//                                     <AvatarImage
//                                       src={`/generic-placeholder-icon.png?height=36&width=36`}
//                                       alt={student.first_name}
//                                     />
//                                     <AvatarFallback>
//                                       {student.first_name.charAt(0)}
//                                       {student.last_name.charAt(0)}
//                                     </AvatarFallback>
//                                   </Avatar>
//                                   <div>
//                                     <div className="font-medium">
//                                       {student.first_name} {student.middle_name} {student.last_name}
//                                     </div>
//                                   </div>
//                                 </div>
//                               </TableCell>
//                               <TableCell>{student.gr_no}</TableCell>
//                               <TableCell>{student.roll_number}</TableCell>
//                               <TableCell>
//                                 <Badge
//                                   variant={
//                                     student.fees_status.status === "Paid"
//                                       ? "default"
//                                       : student.fees_status.status === "Partially Paid"
//                                         ? "outline"
//                                         : "destructive"
//                                   }
//                                 >
//                                   {student.fees_status.status}
//                                 </Badge>
//                               </TableCell>
//                               <TableCell>{formatCurrency(student.fees_status.due_amount)}</TableCell>
//                               <TableCell className="text-right">
//                                 <Button variant="outline" size="sm" onClick={() => handleOpenStudentDialog(student)}>
//                                   <UserPlus className="h-4 w-4 mr-2" />
//                                   {t("apply_concession")}
//                                 </Button>
//                               </TableCell>
//                             </TableRow>
//                           ))}
//                         </TableBody>
//                       </Table>
//                     </div>
//                     {studentFeesStatuForClass && (
//                       <SaralPagination
//                         totalPages={studentFeesStatuForClass.meta.last_page}
//                         currentPage={studentFeesStatuForClass.meta.current_page}
//                         onPageChange={(page) =>
//                           getFilterClassFeesStatus({
//                             class_id: selectedDivision!.id,
//                             page: page,
//                             academic_session: CurrentAcademicSessionForSchool!.id,
//                             filter_by: "eligible_for_concession",
//                             value: concession.id,
//                           })
//                         }
//                       />
//                     )}
//                   </ScrollArea>
//                 )}
//               </CardContent>
//             </Card>

//             <div className="flex justify-end space-x-2">
//               <Button type="button" variant="outline" onClick={onCancel}>
//                 {t("cancel")}
//               </Button>
//             </div>

//             {/* Student Concession Dialog */}
//             <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
//               <DialogContent className="sm:max-w-[500px]">
//                 <DialogHeader>
//                   <DialogTitle>{t("apply_concession_to_student")}</DialogTitle>
//                   <DialogDescription>
//                     {selectedStudent && (
//                       <>
//                         Student: {selectedStudent.first_name} {selectedStudent.last_name} (GR: {selectedStudent.gr_no})
//                       </>
//                     )}
//                   </DialogDescription>
//                 </DialogHeader>

//                 <Form {...studentForm}>
//                   <form
//                     onSubmit={studentForm.handleSubmit(handleSubmitForApplyConcessionToStudents)}
//                     className="space-y-4"
//                   >
//                     <FormField
//                       control={studentForm.control}
//                       name="deduction_type"
//                       render={({ field }) => (
//                         <FormItem className="space-y-3">
//                           <FormLabel>{t("deduction_type")}</FormLabel>
//                           <FormControl>
//                             <RadioGroup
//                               onValueChange={field.onChange}
//                               defaultValue={field.value}
//                               className="flex flex-col space-y-1"
//                             >
//                               <FormItem className="flex items-center space-x-3 space-y-0">
//                                 <FormControl>
//                                   <RadioGroupItem value="percentage" />
//                                 </FormControl>
//                                 <FormLabel className="font-normal">{t("percentage")} (%)</FormLabel>
//                               </FormItem>
//                               <FormItem className="flex items-center space-x-3 space-y-0">
//                                 <FormControl>
//                                   <RadioGroupItem value="fixed_amount" />
//                                 </FormControl>
//                                 <FormLabel className="font-normal">{t("fixed_amount")} (₹)</FormLabel>
//                               </FormItem>
//                             </RadioGroup>
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     {studentDeductionType === "percentage" ? (
//                       <FormField
//                         control={studentForm.control}
//                         name="percentage"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>{t("percentage")}</FormLabel>
//                             <FormControl>
//                               <Input
//                                 type="number"
//                                 placeholder={t("enter_percentage_value")}
//                                 {...field}
//                                 value={field.value ?? ""}
//                                 onChange={(e) => {
//                                   field.onChange(e.target.value ? Number(e.target.value) : null)
//                                   studentForm.trigger("percentage") // trigger validation on change
//                                 }}
//                               />
//                             </FormControl>
//                             <FormDescription>{t("enter_a_value_between_1_and_100")}</FormDescription>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     ) : (
//                       <FormField
//                         control={studentForm.control}
//                         name="fixed_amount"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel>{t("amount")}</FormLabel>
//                             <FormControl>
//                               <Input
//                                 type="number"
//                                 placeholder={t("enter_amount_in_rupees")}
//                                 {...field}
//                                 value={field.value ?? ""}
//                                 onChange={(e) => {
//                                   field.onChange(e.target.value ? Number(e.target.value) : null)
//                                   studentForm.trigger("fixed_amount") // trigger validation on change
//                                 }}
//                               />
//                             </FormControl>
//                             <FormDescription>{t("enter_the_fixed_amount_to_deduct")}</FormDescription>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     )}

//                     {/* Fee Types selection for student concessions */}
//                     {concession.concessions_to === "fees_type" && (
//                       <div className="space-y-3">
//                         <FormLabel>{t("select_fee_types")}</FormLabel>
//                         <FormDescription>
//                           {t("choose_the_specific_fee_types_to_which_this_concession_will_be_applied")}
//                         </FormDescription>

//                         {isLoadingFilterFeeTypes ? (
//                           <div className="space-y-2">
//                             {Array(4)
//                               .fill(0)
//                               .map((_, index) => (
//                                 <Skeleton key={`loading-${index}`} className="h-8 w-full" />
//                               ))}
//                           </div>
//                         ) : FilteredFeesType && FilteredFeesType.length > 0 ? (
//                           <div className="grid grid-cols-1 gap-2 border rounded-md p-3">
//                             {FilteredFeesType.map((feeType) => (
//                               <div key={feeType.id} className="flex items-center space-x-2">
//                                 <Checkbox
//                                   id={`student-fee-type-${feeType.id}`}
//                                   checked={selectedStudentFeeTypes.includes(feeType.id)}
//                                   onCheckedChange={() => handleStudentFeeTypeSelect(feeType.id)}
//                                 />
//                                 <label
//                                   htmlFor={`student-fee-type-${feeType.id}`}
//                                   className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                                 >
//                                   {feeType.name}
//                                 </label>
//                               </div>
//                             ))}
//                           </div>
//                         ) : (
//                           <p className="text-muted-foreground">{t("no_fee_types_available")}</p>
//                         )}

//                         {concession.concessions_to === "fees_type" && selectedStudentFeeTypes.length === 0 && (
//                           <p className="text-sm text-red-500">{t("please_select_at_least_one_fee_type")}</p>
//                         )}
//                       </div>
//                     )}

//                     <FormField
//                       control={studentForm.control}
//                       name="reason"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>{t("reason")}</FormLabel>
//                           <FormControl>
//                             <Input placeholder={t("enter_reason_for_concession")} {...field} />
//                           </FormControl>
//                           <FormDescription>{t("briefly_explain_why_this_concession_is_being_applied")}</FormDescription>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <DialogFooter>
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => setStudentDialogOpen(false)}
//                         disabled={isApplyingConcesson}
//                       >
//                         {t("cancel")}
//                       </Button>
//                       <Button
//                         type="submit"
//                         disabled={
//                           isApplyingConcesson ||
//                           (concession.concessions_to === "fees_type" && selectedStudentFeeTypes.length === 0)
//                         }
//                       >
//                         {isApplyingConcesson ? (
//                           <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Applying...
//                           </>
//                         ) : (
//                           "Apply Concession"
//                         )}
//                       </Button>
//                     </DialogFooter>
//                   </form>
//                 </Form>
//               </DialogContent>
//             </Dialog>
//           </div>
//         </>
//       )}
//     </div>
//   )
// }



"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Search, UserPlus, AlertCircle, Info, Tag, Users, FileText } from "lucide-react"
import {
  useLazyGetAllFeesTypeQuery,
  useApplyConcessionsToPlanMutation,
  useLazyGetFilteredFeesPlanQuery,
  useLazyGetFilterdStudentFeesDetailsForClassQuery,
  useLazyGetFilterFeesTypeQuery,
} from "@/services/feesService"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { toast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { AcademicClasses, Division } from "@/types/academic"
import type { Concession } from "@/types/fees"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  type ApplyConcessionToPlanData,
  applyConcessionToPlanSchema,
  type ApplyConcessionToStudentData,
  applyConcessionToStudentSchema,
} from "@/utils/fees.validation"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface ApplyConcessionFormProps {
  concession: Concession
  isApplyingConcesson: boolean
  onSubmit: (data: ApplyConcessionToPlanData | ApplyConcessionToStudentData) => void
  onCancel: () => void
}

export const ApplyConcessionForm: React.FC<ApplyConcessionFormProps> = ({
  concession,
  isApplyingConcesson,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation()
  const authState = useAppSelector(selectAuthState)
  const academicClasses = useAppSelector(selectAcademicClasses)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
  const navigate = useNavigate()

  // Queries and mutations
  const [getFilterFeePlans, { data: feePlans, isLoading: isLoadingFeePlans }] = useLazyGetFilteredFeesPlanQuery()
  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
  const [
    getFilterClassFeesStatus,
    {
      data: studentFeesStatuForClass,
      isLoading: isLoadingStudentFeesStatuForClass,
      isError: isErroWhileFetchingStudentFeesStatuForClass,
      error: ErrorWhileFetchingStudentFeesStatuForClass,
    },
  ] = useLazyGetFilterdStudentFeesDetailsForClassQuery()

  const [applyConcessionToPlan, { isLoading: isApplyingToPlan }] = useApplyConcessionsToPlanMutation()
  const [applyConcessionToStudent, { isLoading: isApplyingToStudent }] = useApplyConcessionsToPlanMutation()
  const [getAllFeesType, { data: feeTypes, isLoading: isLoadingFeeTypes }] = useLazyGetAllFeesTypeQuery()
  const [getFilterFeesType, { data: FilteredFeesType, isLoading: isLoadingFilterFeeTypes }] =
    useLazyGetFilterFeesTypeQuery()

  // Local state for plan concessions
  const [searchTermPlan, setSearchTermPlan] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [selectedFeeTypes, setSelectedFeeTypes] = useState<number[]>([])

  // Local state for student concessions
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [searchTermStudent, setSearchTermStudent] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [studentsPerPage] = useState(10)
  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [selectedStudentFeeTypes, setSelectedStudentFeeTypes] = useState<number[]>([])

  // Initialize forms based on concession type
  const planForm = useForm<z.infer<typeof applyConcessionToPlanSchema>>({
    resolver: zodResolver(applyConcessionToPlanSchema),
    defaultValues: {
      concession_id: concession.id,
      fees_plan_id: undefined,
      fees_type_ids: null,
      deduction_type: "percentage",
      fixed_amount: null,
      percentage: null,
    },
  })

  const studentForm = useForm<z.infer<typeof applyConcessionToStudentSchema>>({
    resolver: zodResolver(applyConcessionToStudentSchema),
    defaultValues: {
      concession_id: concession.id,
      student_id: undefined,
      fees_plan_id: undefined,
      fees_type_ids: null,
      deduction_type: "percentage",
      fixed_amount: null,
      percentage: null,
      reason: "",
    },
  })

  // Watch for deduction type changes
  const planDeductionType = planForm.watch("deduction_type")
  const studentDeductionType = studentForm.watch("deduction_type")

  // Filter fee plans based on search term
  const filteredFeePlans =
    feePlans?.data.filter((plan) => plan.name.toLowerCase().includes(searchTermPlan.toLowerCase())) || []

  // Filter students based on search term
  const filteredStudents = studentFeesStatuForClass
    ? studentFeesStatuForClass.data.filter((student) => {
        const fullName = `${student.first_name} ${student.middle_name} ${student.last_name}`.toLowerCase()
        const grNumber = student.gr_no != null ? student.gr_no.toString() : ""
        return fullName.includes(searchTermStudent.toLowerCase()) || grNumber.includes(searchTermStudent.toLowerCase())
      })
    : []

  // Pagination for students
  const indexOfLastStudent = currentPage * studentsPerPage
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent)
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)

  // Get available divisions for selected class
  const availableDivisions = useMemo<AcademicClasses | null>(() => {
    if (academicClasses && selectedClass) {
      return academicClasses.filter((cls) => cls.class.toString() === selectedClass)[0]
    }
    return null
  }, [academicClasses, selectedClass])

  // Enhanced chip component for displaying concession information
  const InfoChip: React.FC<{
    label: string
    value: string
    tooltip: string
    icon: React.ReactNode
    variant?: "default" | "secondary" | "outline"
  }> = ({ label, value, tooltip, icon, variant = "outline" }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="flex items-center gap-2 px-3 py-2 cursor-help">
            {icon}
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="font-medium capitalize">{value}</span>
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  // Handle form submission for plan concessions
  const handleSubmitForApplyConcessionToPlan = async (values: z.infer<typeof applyConcessionToPlanSchema>) => {
    try {
      const submissionData = {
        concession_id: values.concession_id,
        fees_plan_id: values.fees_plan_id,
        fees_type_ids:
          concession.concessions_to === "fees_type" ? (selectedFeeTypes.length > 0 ? selectedFeeTypes : null) : null,
        deduction_type: values.deduction_type,
        fixed_amount: values.deduction_type === "fixed_amount" ? values.fixed_amount : null,
        percentage: values.deduction_type === "percentage" ? values.percentage : null,
      }

      onSubmit(submissionData)

      toast({
        title: "Success",
        description: "Concession applied to fee plan successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply concession to fee plan",
        variant: "destructive",
      })
    }
  }

  // Handle form submission for student concessions
  const handleSubmitForApplyConcessionToStudents = async (values: z.infer<typeof applyConcessionToStudentSchema>) => {
    try {
      const submissionData = {
        concession_id: values.concession_id,
        student_id: values.student_id,
        fees_plan_id: values.fees_plan_id,
        fees_type_ids:
          concession.concessions_to === "fees_type"
            ? selectedStudentFeeTypes.length > 0
              ? selectedStudentFeeTypes
              : null
            : null,
        deduction_type: values.deduction_type,
        amount: values.deduction_type === "fixed_amount" ? values.fixed_amount : null,
        percentage: values.deduction_type === "percentage" ? values.percentage : null,
        fixed_amount: values.deduction_type === "fixed_amount" ? values.fixed_amount : null,
      }

      onSubmit(submissionData)

      if (selectedClass && selectedDivision) {
        getFilterClassFeesStatus({
          class_id: selectedDivision.id,
          academic_session: CurrentAcademicSessionForSchool!.id,
          filter_by: "eligible_for_concession",
          value: concession.id,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply concession to student",
        variant: "destructive",
      })
    }
  }

  // Handle fee plan selection
  const handlePlanSelect = (planId: number) => {
    setSelectedPlan(planId)
    planForm.setValue("fees_plan_id", planId)
  }

  // Handle fee type selection for plans
  const handleFeeTypeSelect = (feeTypeId: number) => {
    setSelectedFeeTypes((prev) => {
      if (prev.includes(feeTypeId)) {
        return prev.filter((id) => id !== feeTypeId)
      } else {
        return [...prev, feeTypeId]
      }
    })
  }

  // Handle fee type selection for students
  const handleStudentFeeTypeSelect = (feeTypeId: number) => {
    setSelectedStudentFeeTypes((prev) => {
      if (prev.includes(feeTypeId)) {
        return prev.filter((id) => id !== feeTypeId)
      } else {
        return [...prev, feeTypeId]
      }
    })
  }

  // Handle class selection change
  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedDivision(null)
  }

  // Handle division selection change
  const handleDivisionChange = async (value: string) => {
    if (academicClasses) {
      const selectedDiv = academicClasses
        .filter((cls) => cls.class.toString() === selectedClass)[0]
        .divisions.filter((div) => div.id.toString() === value)

      setSelectedDivision(selectedDiv[0])

      try {
        await getFilterClassFeesStatus({
          class_id: selectedDiv[0].id,
          academic_session: CurrentAcademicSessionForSchool!.id,
          filter_by: "eligible_for_concession",
          value: concession.id,
        }).unwrap()

        await getFilterFeesType({
          academic_session_id: CurrentAcademicSessionForSchool!.id,
          filter: "division",
          value: selectedDiv[0].class_id,
        })
      } catch (error) {
        console.log("Error while fetching fees data", error)
        toast({
          variant: "destructive",
          title: "Failed to fetch fees data",
          description: "Please try again later",
        })
      }
    }
  }

  // Handle opening student concession dialog
  const handleOpenStudentDialog = (student: any) => {
    setSelectedStudent(student)
    setSelectedStudentFeeTypes([])
    studentForm.setValue("student_id", student.id)
    studentForm.setValue("fees_plan_id", student.fees_status.fees_plan_id)
    setStudentDialogOpen(true)
  }

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Pagination controls
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    if (selectedDivision) {
      getFilterClassFeesStatus({
        class_id: selectedDivision.id,
        page: pageNumber,
        academic_session: CurrentAcademicSessionForSchool!.id,
        filter_by: "eligible_for_concession",
        value: concession.id,
      })
    }
  }

  // Fetch initial data
  useEffect(() => {
    if (concession.applicable_to === "plan") {
      getFilterFeePlans({
        page: 1,
        academic_session: CurrentAcademicSessionForSchool!.id,
        filter_by: "eligible_for_concession",
        value: concession.id,
      })
    } else if (concession.applicable_to === "students" && !academicClasses) {
      getAcademicClasses(authState.user!.school_id)
    }

    getAllFeesType({
      academic_session_id: CurrentAcademicSessionForSchool!.id,
      applicable_to: "plan",
    })
  }, [])

  // Auto-select first class and division when academicClasses are loaded
  useEffect(() => {
    if (academicClasses && academicClasses.length > 0 && !selectedClass) {
      const firstClassWithDivisions = academicClasses.find((cls) => cls.divisions.length > 0)

      if (firstClassWithDivisions) {
        setSelectedClass(firstClassWithDivisions.class.toString())

        if (firstClassWithDivisions.divisions.length > 0) {
          const firstDivision = firstClassWithDivisions.divisions[0]
          setSelectedDivision(firstDivision)

          getFilterClassFeesStatus({
            class_id: firstDivision.id,
            academic_session: CurrentAcademicSessionForSchool!.id,
            filter_by: "eligible_for_concession",
            value: concession.id,
          })

          getFilterFeesType({
            academic_session_id: CurrentAcademicSessionForSchool!.id,
            filter: "division",
            value: firstDivision.id,
          })
        }
      }
    }
  }, [academicClasses])

  // For plan form: clear values and errors on deduction_type change
  useEffect(() => {
    if (planDeductionType === "percentage") {
      planForm.setValue("fixed_amount", null)
      planForm.clearErrors("fixed_amount")
    } else if (planDeductionType === "fixed_amount") {
      planForm.setValue("percentage", null)
      planForm.clearErrors("percentage")
    }
  }, [planDeductionType])

  // For student form: clear values and errors on deduction_type change
  useEffect(() => {
    if (studentDeductionType === "percentage") {
      studentForm.setValue("fixed_amount", null)
      studentForm.clearErrors("fixed_amount")
    } else if (studentDeductionType === "fixed_amount") {
      studentForm.setValue("percentage", null)
      studentForm.clearErrors("percentage")
    }
  }, [studentDeductionType])

  // Reset student dialog form and fee types when dialog closes
  useEffect(() => {
    if (!studentDialogOpen) {
      studentForm.reset({
        concession_id: concession.id,
        student_id: undefined,
        fees_plan_id: undefined,
        fees_type_ids: null,
        deduction_type: "percentage",
        fixed_amount: null,
        percentage: null,
        reason: "",
      })
      setSelectedStudent(null)
      setSelectedStudentFeeTypes([])
    }
  }, [studentDialogOpen])

  if (!CurrentAcademicSessionForSchool) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-4">{t("no_active_academic_session")}</h2>
          <p className="text-gray-600 mb-6">{t("please_set_an_active_academic_session_to_proceed.")}</p>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => navigate("/academic-sessions")}
          >
            {t("go_to_academic_sessions")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Concession Information Header with Chips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-900">
            {t("applying_concession")}: {concession.name}
          </CardTitle>
          <CardDescription className="text-blue-700">{concession.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <InfoChip
              label={t("category")}
              value={concession.category}
              tooltip={t("the_category_this_concession_belongs_to")}
              icon={<Tag className="h-4 w-4" />}
              variant="secondary"
            />
            <InfoChip
              label={t("applicable_to")}
              value={concession.applicable_to}
              tooltip={
                concession.applicable_to === "plan"
                  ? t("this_concession_can_be_applied_to_entire_fee_plans")
                  : t("this_concession_can_be_applied_to_individual_students")
              }
              icon={
                concession.applicable_to === "plan" ? <FileText className="h-4 w-4" /> : <Users className="h-4 w-4" />
              }
              variant="default"
            />
            <InfoChip
              label={t("concession_applies_to")}
              value={concession.concessions_to === "fees_type" ? "Fee Types" : "Entire Plan"}
              tooltip={
                concession.concessions_to === "fees_type"
                  ? t("this_concession_will_be_applied_to_specific_fee_types_within_plans")
                  : t("this_concession_will_be_applied_to_the_entire_fee_plan_amount")
              }
              icon={<Info className="h-4 w-4" />}
              variant="outline"
            />
          </div>
        </CardContent>
      </Card>

      {/* Warning about deduction type */}
      <Alert className="bg-amber-50 border-amber-200">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">{t("important_information")}</AlertTitle>
        <AlertDescription className="text-amber-700">
          {concession.concessions_to === "fees_type"
            ? t(
                "this_concession_will_be_applied_to_specific_fee_types._the_deduction_amount_or_percentage_will_be_applied_to_each_selected_fee_type_individually.",
              )
            : t(
                "this_concession_will_be_applied_to_the_entire_fee_plan._the_deduction_amount_or_percentage_will_be_applied_to_the_total_plan_amount.",
              )}
        </AlertDescription>
      </Alert>

      {concession.applicable_to === "plan" ? (
        // Plan Concession Form
        <Form {...planForm}>
          <form onSubmit={planForm.handleSubmit(handleSubmitForApplyConcessionToPlan)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={planForm.control}
                name="deduction_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t("deduction_type")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="percentage" />
                          </FormControl>
                          <FormLabel className="font-normal">{t("percentage")} (%)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="fixed_amount" />
                          </FormControl>
                          <FormLabel className="font-normal">{t("fixed_amount")} (₹)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {planDeductionType === "percentage" ? (
                <FormField
                  control={planForm.control}
                  name="percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("percentage")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("enter_percentage_value")}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                            planForm.trigger("percentage")
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>{t("enter_a_value_between_1_and_100")}</FormDescription>
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={planForm.control}
                  name="fixed_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("amount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("enter_amount_in_rupees")}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                            planForm.trigger("fixed_amount")
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>{t("enter_the_fixed_amount_to_deduct")}</FormDescription>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("select_fee_plan")}</CardTitle>
                <CardDescription>{t("choose_the_fee_plan_to_which_this_concession_will_be_applied")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder={t("search_fee_plans...")}
                      className="pl-8"
                      value={searchTermPlan}
                      onChange={(e) => setSearchTermPlan(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">{t("select")}</TableHead>
                        <TableHead>{t("plan_name")}</TableHead>
                        <TableHead>{t("class")}</TableHead>
                        <TableHead>{t("total_amount")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingFeePlans ? (
                        Array(3)
                          .fill(0)
                          .map((_, index) => (
                            <TableRow key={`loading-${index}`}>
                              <TableCell colSpan={5}>
                                <Skeleton className="h-10 w-full" />
                              </TableCell>
                            </TableRow>
                          ))
                      ) : filteredFeePlans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            {searchTermPlan ? "No fee plans match your search" : "No fee plans found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFeePlans.map((plan) => (
                          <TableRow key={plan.id} className={selectedPlan === plan.id ? "bg-muted" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={selectedPlan === plan.id}
                                onCheckedChange={() => handlePlanSelect(plan.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{plan.name}</TableCell>
                            <TableCell>{plan.description}</TableCell>
                            <TableCell>{formatCurrency(plan.total_amount)}</TableCell>
                            <TableCell>
                              <Badge variant={plan.status === "Active" ? "default" : "destructive"}>
                                {plan.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {concession.concessions_to === "fees_type" && selectedPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("select_fee_types")}</CardTitle>
                  <CardDescription>
                    {t("choose_the_specific_fee_types_to_which_this_concession_will_be_applied")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFeeTypes ? (
                    <div className="space-y-2">
                      {Array(4)
                        .fill(0)
                        .map((_, index) => (
                          <Skeleton key={`loading-${index}`} className="h-8 w-full" />
                        ))}
                    </div>
                  ) : feeTypes && feeTypes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {feeTypes.map((feeType) => (
                        <div key={feeType.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`fee-type-${feeType.id}`}
                            checked={selectedFeeTypes.includes(feeType.id)}
                            onCheckedChange={() => handleFeeTypeSelect(feeType.id)}
                          />
                          <label
                            htmlFor={`fee-type-${feeType.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {feeType.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t("no_fee_types_available")}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isApplyingConcesson}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  isApplyingConcesson ||
                  !selectedPlan ||
                  (concession.concessions_to === "fees_type" && selectedFeeTypes.length === 0)
                }
              >
                {isApplyingConcesson ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply Concession"
                )}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        // Student Concession Form
        <>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("student_selection")}</CardTitle>
                <CardDescription>{t("select_a_class_and_division_to_view_students")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label htmlFor="class-select" className="text-sm font-medium text-gray-700 mb-1 block">
                      {t("class")}
                    </label>
                    <Select value={selectedClass} onValueChange={handleClassChange}>
                      <SelectTrigger id="class-select">
                        <SelectValue placeholder={t("select_class")} />
                      </SelectTrigger>
                      <SelectContent>
                        {academicClasses?.map((cls, index) =>
                          cls.divisions.length > 0 ? (
                            <SelectItem key={index} value={cls.class.toString()}>
                              {cls.class}
                            </SelectItem>
                          ) : null,
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="division-select" className="text-sm font-medium text-gray-700 mb-1 block">
                      {t("division")}
                    </label>
                    <Select
                      value={selectedDivision ? selectedDivision.id.toString() : ""}
                      onValueChange={handleDivisionChange}
                      disabled={!selectedClass}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("select_division")} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDivisions?.divisions.map((division, index) => (
                          <SelectItem key={index} value={division.id.toString()}>
                            {`${division.division} ${division.aliases ? "- " + division.aliases : ""}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="student-search" className="text-sm font-medium text-gray-700 mb-1 block">
                      {t("search")}
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="student-search"
                        placeholder="Search by name or GR number"
                        className="pl-8"
                        value={searchTermStudent}
                        onChange={(e) => setSearchTermStudent(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {!selectedClass || !selectedDivision ? (
                  <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm">{t("please_select_a_class_and_division_to_view_students.")}</p>
                      </div>
                    </div>
                  </div>
                ) : isLoadingStudentFeesStatuForClass ? (
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <Skeleton key={`loading-${index}`} className="h-16 w-full" />
                      ))}
                  </div>
                ) : filteredStudents.length === 0 && !isErroWhileFetchingStudentFeesStatuForClass ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTermStudent
                      ? "No students match your search"
                      : t("no_students_found_in_this_class/division")}
                  </div>
                ) : isErroWhileFetchingStudentFeesStatuForClass ? (
                  <div className="text-center py-8 text-red-500">{t("this_class_has_no_fees_plan_for_now.")}</div>
                ) : (
                  <ScrollArea className="h-[400px] rounded-md">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("student")}</TableHead>
                            <TableHead>{t("gr_number")}</TableHead>
                            <TableHead>{t("roll_number")}</TableHead>
                            <TableHead>{t("status")}</TableHead>
                            <TableHead>{t("due_amount")}</TableHead>
                            <TableHead className="text-right">{t("action")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentStudents.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={`/placeholder.svg?height=36&width=36`} alt={student.first_name} />
                                    <AvatarFallback>
                                      {student.first_name.charAt(0)}
                                      {student.last_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {student.first_name} {student.middle_name} {student.last_name}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{student.gr_no}</TableCell>
                              <TableCell>{(student as any).roll_number}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    student.fees_status.status === "Paid"
                                      ? "default"
                                      : student.fees_status.status === "Partially Paid"
                                        ? "outline"
                                        : "destructive"
                                  }
                                >
                                  {student.fees_status.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(student.fees_status.due_amount)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleOpenStudentDialog(student)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  {t("apply_concession")}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {studentFeesStatuForClass && (
                      <SaralPagination
                        totalPages={studentFeesStatuForClass.meta.last_page}
                        currentPage={studentFeesStatuForClass.meta.current_page}
                        onPageChange={(page) =>
                          getFilterClassFeesStatus({
                            class_id: selectedDivision!.id,
                            page: page,
                            academic_session: CurrentAcademicSessionForSchool!.id,
                            filter_by: "eligible_for_concession",
                            value: concession.id,
                          })
                        }
                      />
                    )}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("cancel")}
              </Button>
            </div>

            {/* Student Concession Dialog */}
            <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t("apply_concession_to_student")}</DialogTitle>
                  <DialogDescription>
                    {selectedStudent && (
                      <>
                        Student: {selectedStudent.first_name} {selectedStudent.last_name} (GR: {selectedStudent.gr_no})
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <Form {...studentForm}>
                  <form
                    onSubmit={studentForm.handleSubmit(handleSubmitForApplyConcessionToStudents)}
                    className="space-y-4"
                  >
                    <FormField
                      control={studentForm.control}
                      name="deduction_type"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>{t("deduction_type")}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="percentage" />
                                </FormControl>
                                <FormLabel className="font-normal">{t("percentage")} (%)</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="fixed_amount" />
                                </FormControl>
                                <FormLabel className="font-normal">{t("fixed_amount")} (₹)</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {studentDeductionType === "percentage" ? (
                      <FormField
                        control={studentForm.control}
                        name="percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("percentage")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t("enter_percentage_value")}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value ? Number(e.target.value) : null)
                                  studentForm.trigger("percentage")
                                }}
                              />
                            </FormControl>
                            <FormDescription>{t("enter_a_value_between_1_and_100")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={studentForm.control}
                        name="fixed_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("amount")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t("enter_amount_in_rupees")}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value ? Number(e.target.value) : null)
                                  studentForm.trigger("fixed_amount")
                                }}
                              />
                            </FormControl>
                            <FormDescription>{t("enter_the_fixed_amount_to_deduct")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Fee Types selection for student concessions */}
                    {concession.concessions_to === "fees_type" && (
                      <div className="space-y-3">
                        <FormLabel>{t("select_fee_types")}</FormLabel>
                        <FormDescription>
                          {t("choose_the_specific_fee_types_to_which_this_concession_will_be_applied")}
                        </FormDescription>

                        {isLoadingFilterFeeTypes ? (
                          <div className="space-y-2">
                            {Array(4)
                              .fill(0)
                              .map((_, index) => (
                                <Skeleton key={`loading-${index}`} className="h-8 w-full" />
                              ))}
                          </div>
                        ) : FilteredFeesType && FilteredFeesType.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2 border rounded-md p-3">
                            {FilteredFeesType.map((feeType) => (
                              <div key={feeType.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`student-fee-type-${feeType.id}`}
                                  checked={selectedStudentFeeTypes.includes(feeType.id)}
                                  onCheckedChange={() => handleStudentFeeTypeSelect(feeType.id)}
                                />
                                <label
                                  htmlFor={`student-fee-type-${feeType.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {feeType.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">{t("no_fee_types_available")}</p>
                        )}

                        {concession.concessions_to === "fees_type" && selectedStudentFeeTypes.length === 0 && (
                          <p className="text-sm text-red-500">{t("please_select_at_least_one_fee_type")}</p>
                        )}
                      </div>
                    )}

                    <FormField
                      control={studentForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("reason")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("enter_reason_for_concession")} {...field} />
                          </FormControl>
                          <FormDescription>{t("briefly_explain_why_this_concession_is_being_applied")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStudentDialogOpen(false)}
                        disabled={isApplyingConcesson}
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          isApplyingConcesson ||
                          (concession.concessions_to === "fees_type" && selectedStudentFeeTypes.length === 0)
                        }
                      >
                        {isApplyingConcesson ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Applying...
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
          </div>
        </>
      )}
    </div>
  )
}
