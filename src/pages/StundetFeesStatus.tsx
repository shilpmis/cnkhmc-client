// import { useState, useEffect } from "react"
// import { useParams, useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Progress } from "@/components/ui/progress"
// import { Separator } from "@/components/ui/separator"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import {
//   ArrowLeft,
//   Calendar,
//   CreditCard,
//   Printer,
//   Receipt,
//   Tag,
//   User,
//   Eye,
//   Settings,
//   RotateCcw,
//   AlertTriangle,
//   CheckCircle2,
//   Info,
//   Download,
//   FileText,
// } from "lucide-react"
// import {
//   useLazyGetStudentFeesDetailsQuery,
//   useGetAllFeesTypeQuery,
//   useGetAllConcessionsQuery,
// } from "@/services/feesService"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import TransactionStatusDialog from "@/components/Fees/PayFees/TransactionStatusDialog"
// import AdminReversalDialog from "@/components/Fees/PayFees/AdminReversalDialog" 

// interface StudentFeesDetailPageProps {
//   studentId?: number
//   onClose?: () => void
// }

// export default function StudentFeesStatus({ studentId: propStudentId, onClose }: StudentFeesDetailPageProps) {
//   const { t } = useTranslation()
//   const navigate = useNavigate()
//   const params = useParams<{ student_id: string }>()
//   const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

//   // Determine student ID from props or URL params
//   const studentId = propStudentId || (params.student_id ? Number.parseInt(params.student_id) : null)

//   const [getStudentFeesDetails, { data: studentFeesStatus, isLoading, error }] = useLazyGetStudentFeesDetailsQuery()

//   const [activeTab, setActiveTab] = useState("installments")
//   const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
//   const [isReversalDialogOpen, setIsReversalDialogOpen] = useState(false)
//   const [selectedPayment, setSelectedPayment] = useState<any>(null)

//   // Get current academic session for API calls
//   const academicSessionId = studentFeesStatus?.detail?.fees_plan?.academic_session_id || currentAcademicSession?.id

//   // Fetch fee types and concessions for proper naming
//   const { data: feeTypes } = useGetAllFeesTypeQuery(
//     { academic_session_id: academicSessionId || 0, applicable_to: "All" },
//     { skip: !academicSessionId },
//   )

//   const { data: concessionTypes } = useGetAllConcessionsQuery(
//     { academic_session_id: academicSessionId || 0 },
//     { skip: !academicSessionId },
//   )

//   useEffect(() => {
//     if (studentId && currentAcademicSession) {
//       getStudentFeesDetails({
//         student_id: studentId,
//         academic_session_id: currentAcademicSession.id,
//       })
//     }
//   }, [studentId, currentAcademicSession, getStudentFeesDetails])

//   const formatCurrency = (amount: string | number | undefined | null) => {
//     if (amount === undefined || amount === null) return "₹0.00"
//     const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
//     return `₹${Number(numAmount).toLocaleString("en-IN", {
//       maximumFractionDigits: 2,
//       minimumFractionDigits: 2,
//     })}`
//   }

//   const formatDate = (dateString: string | null | undefined) => {
//     if (!dateString) return "N/A"
//     try {
//       return new Date(dateString).toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       })
//     } catch (e) {
//       return "Invalid Date"
//     }
//   }

//   const getStatusBadgeVariant = (status: string): "default" | "outline" | "secondary" | "destructive" => {
//     switch (status) {
//       case "Paid":
//         return "default"
//       case "Partially Paid":
//         return "outline"
//       case "Overdue":
//         return "destructive"
//       case "Reversal Requested":
//         return "destructive"
//       case "Reversed":
//         return "secondary"
//       default:
//         return "secondary"
//     }
//   }

//   const getPaymentStatusBadgeVariant = (status: string): "default" | "outline" | "secondary" | "destructive" => {
//     switch (status) {
//       case "Success":
//         return "default"
//       case "In Progress":
//         return "outline"
//       case "Failed":
//         return "destructive"
//       case "Disputed":
//         return "destructive"
//       case "Cancelled":
//         return "secondary"
//       default:
//         return "outline"
//     }
//   }

//   // Get fee type name from ID using the API data
//   const getFeeTypeName = (feeTypeId: number): string => {
//     if (!feeTypeId) return t("unknown_fee_type")

//     if (feeTypes && feeTypes.length > 0) {
//       const feeType = feeTypes.find((type) => type.id === feeTypeId)
//       if (feeType) {
//         return feeType.name
//       }
//     }

//     return `${t("fee_type")} ${feeTypeId}`
//   }

//   // Get concession name from ID using the API data
//   const getConcessionNameFromId = (concessionId: number): string => {
//     if (!concessionId) return t("unknown_concession")

//     if (concessionTypes && concessionTypes.length > 0) {
//       const concession = concessionTypes.find((type) => type.id === concessionId)
//       if (concession) {
//         return concession.name
//       }
//     }

//     return `${t("concession")} ${concessionId}`
//   }

//   const calculatePaymentProgress = () => {
//     if (!studentFeesStatus?.student?.fees_status) return 0
//     const totalAmount = Number(studentFeesStatus.student.fees_status.total_amount || 0)
//     if (totalAmount === 0) return 0
//     const paidAmount = Number(studentFeesStatus.student.fees_status.paid_amount || 0)
//     const discountedAmount = Number(studentFeesStatus.student.fees_status.discounted_amount || 0)
//     return Math.min(Math.round(((paidAmount + discountedAmount) / totalAmount) * 100), 100)
//   }

//   // Calculate available concession balance
//   const calculateAvailableConcessionBalance = () => {
//     if (!studentFeesStatus?.detail?.wallet) return { student_concession: 0, plan_concession: 0 }

//     const wallet = studentFeesStatus.detail.wallet || {
//       total_concession_for_student: 0,
//       total_concession_for_plan: 0,
//     }

//     return {
//       student_concession: Number(wallet.total_concession_for_student || 0),
//       plan_concession: Number(wallet.total_concession_for_plan || 0),
//     }
//   }

//   const handleBack = () => {
//     if (onClose) {
//       onClose()
//     } else {
//       navigate(-1)
//     }
//   }

//   const handleUpdateStatus = (payment: any, isExtraFee = false) => {
//     const isLastTransaction = getLastTransactionId() === payment.id
//     setSelectedPayment({ ...payment, isLastTransaction, isExtraFee })
//     setIsStatusDialogOpen(true)
//   }

//   const handleReverseTransaction = (payment: any, isExtraFee = false) => {
//     setSelectedPayment({ ...payment, isExtraFee })
//     setIsReversalDialogOpen(true)
//   }

//   const getLastTransactionId = () => {
//     if (!studentFeesStatus?.student?.fees_status?.paid_fees) return null
//     const sortedPayments = [...studentFeesStatus.student.fees_status.paid_fees].sort(
//       (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
//     )
//     return sortedPayments[0]?.id || null
//   }

//   const hasReversalRequest = () => {
//     if (!studentFeesStatus?.student?.fees_status?.paid_fees) return false
//     return studentFeesStatus.student.fees_status.paid_fees.some((payment) => payment.status === "Reversal Requested")
//   }

//   const handleRefresh = () => {
//     if (studentId && currentAcademicSession) {
//       getStudentFeesDetails({
//         student_id: studentId,
//         academic_session_id: currentAcademicSession.id,
//       })
//     }
//   }

//   const handleDownloadReceipt = (paymentId: number) => {
//     console.log(`Downloading receipt for payment ID: ${paymentId}`)
//     alert(`Receipt download functionality will be implemented for payment ID: ${paymentId}`)
//   }

//   if (isLoading) {
//     return <FeesStatusSkeleton onBack={handleBack} />
//   }

//   if (error || !studentFeesStatus) {
//     return (
//       <div className="p-6 space-y-6">
//         <div className="flex items-center">
//           <Button variant="outline" onClick={handleBack}>
//             <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
//           </Button>
//         </div>
//         <Card className="border-red-200 bg-red-50">
//           <CardContent className="p-6 text-center">
//             <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
//             <h3 className="text-lg font-medium text-red-800 mb-2">{t("error_loading_student_fees")}</h3>
//             <p className="text-red-600 mb-4">
//               {(error as any)?.data?.message || t("unable_to_load_student_fee_information_please_try_again")}
//             </p>
//             <Button onClick={handleRefresh}>{t("retry")}</Button>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   const student = studentFeesStatus.student
//   const feesStatus = student.fees_status
//   const installments = studentFeesStatus.installments || []
//   const extraFees = studentFeesStatus.extra_fees || []
//   const extraFeesInstallments = studentFeesStatus.extra_fees_installments || []
//   const paymentProgress = calculatePaymentProgress()
//   const concessionBalance = calculateAvailableConcessionBalance()
//   const totalConcessionBalance = concessionBalance.student_concession + concessionBalance.plan_concession

//   // Get current class and division
//   const currentClass = student.academic_class[0]?.class
//   const className = currentClass?.class?.class || "N/A"
//   const division = currentClass?.division || "N/A"

//   const hasFeesStatus = !!feesStatus
//   const hasFeesDetails = !!studentFeesStatus.detail?.fees_details && studentFeesStatus.detail.fees_details.length > 0
//   const hasFeesPlans = !!studentFeesStatus.detail?.fees_plan
//   const hasPaidFees = !!feesStatus?.paid_fees && feesStatus.paid_fees.length > 0
//   const hasInstallments = installments.length > 0
//   const hasConcessions = !!student.provided_concession && student.provided_concession.length > 0
//   const hasExtraFees = extraFees.length > 0
//   const hasExtraFeesInstallments = extraFeesInstallments.length > 0

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <Button variant="outline" onClick={handleBack} className="flex items-center">
//           <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
//         </Button>

//         <div className="flex gap-2">
//           <Button variant="outline" size="sm" onClick={() => window.print()}>
//             <Printer className="mr-2 h-4 w-4" /> {t("print_details")}
//           </Button>
//         </div>
//       </div>

//       {/* Student Header */}
//       <Card className="shadow-sm border-gray-200">
//         <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
//           <CardTitle className="flex items-center text-2xl text-gray-800">
//             <User className="mr-2 h-5 w-5 text-primary" />
//             {student.first_name} {student.middle_name} {student.last_name}
//           </CardTitle>
//           <CardDescription className="text-gray-600">
//             {t("comprehensive_fee_management_and_transaction_history")} - {t("academic_year")}{" "}
//             {currentAcademicSession?.session_name || studentFeesStatus.detail?.fees_plan?.academic_session_id}
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="pt-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             <div className="space-y-1">
//               <p className="text-sm text-muted-foreground">{t("gr_number")}</p>
//               <p className="text-lg font-semibold">{student.gr_no}</p>
//             </div>
//             <div className="space-y-1">
//               <p className="text-sm text-muted-foreground">{t("roll_number")}</p>
//               <p className="text-lg font-semibold">{student.roll_number || "N/A"}</p>
//             </div>
//             <div className="space-y-1">
//               <p className="text-sm text-muted-foreground">{t("class")}</p>
//               <p className="text-lg font-semibold">
//                 {className}-{division}
//               </p>
//             </div>
//             <div className="space-y-1">
//               <p className="text-sm text-muted-foreground">{t("payment_status")}</p>
//               <Badge variant={getStatusBadgeVariant(feesStatus?.status || "")} className="text-sm">
//                 {feesStatus?.status || t("unknown")}
//               </Badge>
//             </div>
//           </div>

//           <Separator className="my-6" />

//           {!hasFeesStatus && (
//             <Alert variant="destructive" className="mb-4 bg-amber-50 border-amber-200">
//               <AlertTriangle className="h-5 w-5 text-amber-600" />
//               <AlertTitle className="text-amber-800">{t("no_fees_plan_assigned")}</AlertTitle>
//               <AlertDescription className="text-amber-700">
//                 {t("this_student_doesnt_have_any_fees_plan_assigned_yet_please_assign_a_fees_plan_to_proceed")}
//               </AlertDescription>
//             </Alert>
//           )}

//           {/* Fee Summary Cards */}
//           {hasFeesStatus && (
//             <>
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//                 <Card className="bg-blue-50 border-blue-200">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-blue-700 text-lg flex items-center">
//                       <CreditCard className="mr-2 h-5 w-5" />
//                       {t("total_fees")}
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-2xl font-bold text-blue-700">{formatCurrency(feesStatus.total_amount)}</p>
//                   </CardContent>
//                 </Card>

//                 <Card className="bg-green-50 border-green-200">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-green-700 text-lg flex items-center">
//                       <Receipt className="mr-2 h-5 w-5" />
//                       {t("paid_amount")}
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-2xl font-bold text-green-700">{formatCurrency(feesStatus.paid_amount)}</p>
//                   </CardContent>
//                 </Card>

//                 <Card className="bg-amber-50 border-amber-200">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-amber-700 text-lg flex items-center">
//                       <Tag className="mr-2 h-5 w-5" />
//                       {t("concession")}
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalConcessionBalance) }</p>
//                     {totalConcessionBalance > 0 && (
//                       <p className="text-xs text-amber-600 mt-1">
//                         {t("used_concession")}: {formatCurrency(feesStatus.discounted_amount)}
//                       </p>
//                     )}
//                   </CardContent>
//                 </Card>

//                 <Card className="bg-red-50 border-red-200">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-red-700 text-lg flex items-center">
//                       <Tag className="mr-2 h-5 w-5" />
//                       {t("due_amount")}
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-2xl font-bold text-red-700">{formatCurrency(feesStatus.due_amount)}</p>
//                   </CardContent>
//                 </Card>
//               </div>

//               <div className="mt-6">
//                 <div className="flex justify-between mb-2">
//                   <span className="text-sm font-medium">{t("payment_progress")}</span>
//                   <span className="text-sm font-medium">{paymentProgress}%</span>
//                 </div>
//                 <Progress value={paymentProgress} className="h-2" />
//               </div>
//             </>
//           )}
//         </CardContent>
//       </Card>

//       {/* Concessions Section - Only show if concessions exist */}
//       {hasConcessions && (
//         <Card className="mb-6 border shadow-md">
//           <CardHeader>
//             <CardTitle className="text-lg flex items-center">
//               <FileText className="h-5 w-5 mr-2 text-purple-600" />
//               {t("applied_concessions")}
//             </CardTitle>
//             <CardDescription>{t("concessions_and_discounts_applied_to_this_student")}</CardDescription>
//           </CardHeader>
//           <CardContent className="p-0">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>{t("concession_name")}</TableHead>
//                   <TableHead>{t("description")}</TableHead>
//                   <TableHead>{t("type")}</TableHead>
//                   <TableHead>{t("applied_to")}</TableHead>
//                   <TableHead className="text-right">{t("amount")}</TableHead>
//                   <TableHead className="text-right">{t("applied_discount")}</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {student.provided_concession?.map((concession) => (
//                   <TableRow key={concession.id}>
//                     <TableCell className="font-medium">
//                       {concession.concession?.name || getConcessionNameFromId(concession.id)}
//                     </TableCell>
//                     <TableCell>{concession.concession?.description || t("no_description_available")}</TableCell>
//                     <TableCell className="capitalize">{concession.deduction_type}</TableCell>
//                     <TableCell>
//                       {concession.fees_type_id ? getFeeTypeName(concession.fees_type_id) : t("all_fees")}
//                     </TableCell>
//                     <TableCell className="text-right">{formatCurrency(concession.amount ?? 0)}</TableCell>
//                     <TableCell className="text-right text-purple-600 font-medium">
//                       {/* {formatCurrency(concession.applied_discount || concession.amount || 0)} */}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>
//       )}

//       {/* Reversal Request Alert */}
//       {hasReversalRequest() && (
//         <Alert className="border-red-200 bg-red-50">
//           <AlertTriangle className="h-4 w-4 text-red-600" />
//           <AlertTitle className="text-red-800">{t("reversal_request_pending")}</AlertTitle>
//           <AlertDescription className="text-red-700">
//             {t("this_student_has_a_pending_transaction_reversal_request_no_new_payments_can_be_processed")}
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Tabs */}
//       {hasFeesStatus && (
//         <Tabs value={activeTab} onValueChange={setActiveTab}>
//           <TabsList className="grid w-full grid-cols-4">
//             <TabsTrigger value="installments" className="flex items-center">
//               <Calendar className="mr-2 h-4 w-4" /> {t("due_fees")}
//             </TabsTrigger>
//             <TabsTrigger value="extra-fees" className="flex items-center">
//               <Tag className="mr-2 h-4 w-4" /> {t("extra_fees")}
//               {hasExtraFees && (
//                 <Badge variant="secondary" className="ml-2">
//                   {extraFees.length}
//                 </Badge>
//               )}
//             </TabsTrigger>
//             <TabsTrigger value="payments" className="flex items-center">
//               <Receipt className="mr-2 h-4 w-4" /> {t("payment_history")}
//             </TabsTrigger>
//             <TabsTrigger value="reversed" className="flex items-center">
//               <RotateCcw className="mr-2 h-4 w-4" /> {t("reversed_fees")}
//               {studentFeesStatus?.student.fees_status.reversed_fees && studentFeesStatus?.student.fees_status.reversed_fees.length > 0 && (
//                 <Badge variant="destructive" className="ml-2">
//                   {studentFeesStatus?.student.fees_status.reversed_fees.length}
//                 </Badge>
//               )}
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="installments">
//             <Card className="shadow-sm border-gray-200">
//               <CardHeader className="bg-gray-50 border-b">
//                 <CardTitle>{t("due_installments")}</CardTitle>
//                 <CardDescription>{t("installments_pending_payment")}</CardDescription>
//               </CardHeader>
//               <CardContent className="p-0">
//                 {!hasInstallments ? (
//                   <div className="p-6 text-center">
//                     <p className="text-muted-foreground">{t("no_due_installments_found")}</p>
//                   </div>
//                 ) : (
//                   <>
//                     {totalConcessionBalance > 0 && (
//                       <Alert className="m-4 bg-amber-50 border-amber-200">
//                         <Info className="h-4 w-4 text-amber-600" />
//                         <AlertTitle className="text-amber-700">{t("available_concession_balance")}</AlertTitle>
//                         <AlertDescription className="text-amber-600">
//                           <div className="flex flex-col gap-1">
//                             <span>
//                               {t("total_available")}: {formatCurrency(totalConcessionBalance)}
//                             </span>
//                             {concessionBalance.student_concession > 0 && (
//                               <span>
//                                 {t("student_concession")}: {formatCurrency(concessionBalance.student_concession)}
//                               </span>
//                             )}
//                             {concessionBalance.plan_concession > 0 && (
//                               <span>
//                                 {t("plan_concession")}: {formatCurrency(concessionBalance.plan_concession)}
//                               </span>
//                             )}
//                           </div>
//                         </AlertDescription>
//                       </Alert>
//                     )}

//                     {installments.map((feeType) => (
//                       <div key={feeType.id} className="mb-6">
//                         <div className="bg-gray-50 p-3 border-b">
//                           <h3 className="font-medium flex items-center">
//                             <Tag className="h-4 w-4 mr-2" />
//                             {getFeeTypeName(feeType.fees_type_id)} - {feeType.installment_type}
//                             <Badge variant="outline" className="ml-2">
//                               {feeType.total_installment} {t("installments")}
//                             </Badge>
//                           </h3>
//                           <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
//                             <div>
//                               <span>
//                                 {t("total")}: {formatCurrency(feeType.total_amount)}
//                               </span>
//                             </div>
//                             <div>
//                               <span>
//                                 {t("paid")}: {formatCurrency(feeType.paid_amount)}
//                               </span>
//                             </div>
//                             <div>
//                               <span>
//                                 {t("discounted")}: {formatCurrency(feeType.discounted_amount)}
//                               </span>
//                             </div>
//                             <div>
//                               <span>
//                                 {t("due")}: {formatCurrency(feeType.due_amount)}
//                               </span>
//                             </div>
//                           </div>
//                         </div>

//                         <Table>
//                           <TableHeader>
//                             <TableRow>
//                               <TableHead>{t("installment")}</TableHead>
//                               <TableHead>{t("due_date")}</TableHead>
//                               <TableHead>{t("amount")}</TableHead>
//                               <TableHead>{t("discount")}</TableHead>
//                               <TableHead>{t("payable")}</TableHead>
//                               <TableHead>{t("status")}</TableHead>
//                               <TableHead>{t("actions")}</TableHead>
//                             </TableRow>
//                           </TableHeader>
//                           <TableBody>
//                             {feeType.installments_breakdown.map((breakdown) => {
//                               const originalAmount = Number(breakdown.installment_amount || 0)
//                               const discountAmount = Number(breakdown.discounted_amount || 0)
//                               const payableAmount = originalAmount - discountAmount
//                               const hasDiscount = discountAmount > 0

//                               return (
//                                 <TableRow
//                                   key={breakdown.id}
//                                   className={`hover:bg-gray-50 ${hasDiscount ? "bg-green-50" : ""}`}
//                                 >
//                                   <TableCell>
//                                     {feeType.installment_type} - {breakdown.installment_no}
//                                   </TableCell>
//                                   <TableCell>{formatDate(breakdown.due_date)}</TableCell>
//                                   <TableCell className={hasDiscount ? "line-through text-gray-500" : ""}>
//                                     {formatCurrency(breakdown.installment_amount)}
//                                   </TableCell>
//                                   <TableCell className="text-green-600">
//                                     {hasDiscount ? formatCurrency(discountAmount) : "-"}
//                                     {breakdown.applied_concession && breakdown.applied_concession.length > 0 && (
//                                       <div className="text-xs mt-1">
//                                         {breakdown.applied_concession.map((concession, idx) => (
//                                           <div key={idx} className="flex items-center">
//                                             <CheckCircle2 className="h-3 w-3 mr-1" />
//                                             <span>
//                                               {getConcessionNameFromId(concession.concession_id)} (
//                                               {formatCurrency(concession.applied_amount)})
//                                             </span>
//                                           </div>
//                                         ))}
//                                       </div>
//                                     )}
//                                   </TableCell>
//                                   <TableCell className="font-medium">{formatCurrency(payableAmount)}</TableCell>
//                                   <TableCell>
//                                     <Badge variant={getStatusBadgeVariant(breakdown.payment_status || "Unpaid")}>
//                                       {breakdown.payment_status || t("unpaid")}
//                                     </Badge>
//                                   </TableCell>
//                                   <TableCell>
//                                     <Button variant="outline" size="sm">
//                                       <Eye className="mr-1 h-3 w-3" /> {t("view")}
//                                     </Button>
//                                   </TableCell>
//                                 </TableRow>
//                               )
//                             })}
//                           </TableBody>
//                         </Table>
//                       </div>
//                     ))}
//                   </>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="extra-fees">
//             <Card className="shadow-sm border-gray-200">
//               <CardHeader className="bg-gray-50 border-b">
//                 <CardTitle>{t("extra_fees")}</CardTitle>
//                 <CardDescription>{t("additional_fees_applied_to_this_student")}</CardDescription>
//               </CardHeader>
//               <CardContent className="p-0">
//                 {!hasExtraFeesInstallments ? (
//                   <div className="p-6 text-center">
//                     <p className="text-muted-foreground">{t("no_extra_fees_applied")}</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-6">
//                     {extraFeesInstallments.map((extraFeeType) => {
//                       const progress = Math.round(
//                         (Number(extraFeeType.paid_amount || 0) / Number(extraFeeType.total_amount || 1)) * 100,
//                       )
//                       const remainingAmount =
//                         Number(extraFeeType.total_amount || 0) - Number(extraFeeType.paid_amount || 0)

//                       // Find corresponding extra fee details
//                       const extraFeeDetails = extraFees.find((ef) => ef.fees_type_id === extraFeeType.fees_type_id)

//                       return (
//                         <div key={extraFeeType.id} className="border-b pb-6 last:border-0 last:pb-0">
//                           <div className="bg-gray-50 p-3 mb-3">
//                             <h3 className="font-medium flex items-center">
//                               <Tag className="h-4 w-4 mr-2" />
//                               {getFeeTypeName(extraFeeType.fees_type_id)}
//                               <Badge
//                                 variant={getStatusBadgeVariant(extraFeeDetails?.status || "Active")}
//                                 className="ml-2"
//                               >
//                                 {extraFeeDetails?.status || "Active"}
//                               </Badge>
//                             </h3>
//                             <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
//                               <div>
//                                 <span>
//                                   {t("total")}: {formatCurrency(extraFeeType.total_amount)}
//                                 </span>
//                               </div>
//                               <div>
//                                 <span>
//                                   {t("paid")}: {formatCurrency(extraFeeType.paid_amount)}
//                                 </span>
//                               </div>
//                               <div>
//                                 <span>
//                                   {t("due")}: {formatCurrency(remainingAmount)}
//                                 </span>
//                               </div>
//                             </div>

//                             <div className="mt-2">
//                               <div className="flex justify-between mb-1">
//                                 <span className="text-xs text-muted-foreground">{t("payment_progress")}</span>
//                                 <span className="text-xs text-muted-foreground">{progress}%</span>
//                               </div>
//                               <Progress value={progress} className="h-1" />
//                             </div>
//                           </div>

//                           {/* Unpaid Installments */}
//                           {extraFeeType.installments_breakdown.filter((breakdown) => !breakdown.is_paid).length > 0 && (
//                             <div className="mb-4">
//                               <h4 className="font-medium text-sm mb-2 text-red-700">{t("unpaid_installments")}</h4>
//                               <Table>
//                                 <TableHeader>
//                                   <TableRow>
//                                     <TableHead>{t("installment")}</TableHead>
//                                     <TableHead>{t("due_date")}</TableHead>
//                                     <TableHead>{t("amount")}</TableHead>
//                                     <TableHead>{t("status")}</TableHead>
//                                     <TableHead>{t("actions")}</TableHead>
//                                   </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                   {extraFeeType.installments_breakdown
//                                     .filter((breakdown) => !breakdown.is_paid)
//                                     .map((breakdown) => (
//                                       <TableRow key={breakdown.id} className="bg-red-50">
//                                         <TableCell>
//                                           {t("installment")} - {breakdown.installment_no}
//                                         </TableCell>
//                                         <TableCell>{formatDate(breakdown.due_date)}</TableCell>
//                                         <TableCell>{formatCurrency(breakdown.installment_amount)}</TableCell>
//                                         <TableCell>
//                                           <Badge variant="destructive">{breakdown.payment_status || t("unpaid")}</Badge>
//                                         </TableCell>
//                                         <TableCell>
//                                           <Button variant="outline" size="sm">
//                                             <Eye className="mr-1 h-3 w-3" /> {t("view")}
//                                           </Button>
//                                         </TableCell>
//                                       </TableRow>
//                                     ))}
//                                 </TableBody>
//                               </Table>
//                             </div>
//                           )}

//                           {/* Paid Installments */}
//                           {extraFeeType.installments_breakdown.filter((breakdown) => breakdown.is_paid).length > 0 && (
//                             <div>
//                               <h4 className="font-medium text-sm mb-2 text-green-700">{t("payment_history")}</h4>
//                               <Table>
//                                 <TableHeader>
//                                   <TableRow>
//                                     <TableHead>{t("installment")}</TableHead>
//                                     <TableHead>{t("payment_date")}</TableHead>
//                                     <TableHead>{t("paid_amount")}</TableHead>
//                                     <TableHead>{t("carry_forward")}</TableHead>
//                                     <TableHead>{t("status")}</TableHead>
//                                     <TableHead>{t("admin_actions")}</TableHead>
//                                   </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                   {extraFeeType.installments_breakdown
//                                     .filter((breakdown) => breakdown.is_paid)
//                                     .map((breakdown) => {
//                                       const hasCarryForward = Number(breakdown.amount_paid_as_carry_forward || 0) > 0

//                                       // Find corresponding payment in extra fees
//                                       const paymentInfo = extraFeeDetails?.paid_installment?.find(
//                                         (payment) => payment.installment_id === breakdown.id,
//                                       )

//                                       return (
//                                         <TableRow key={breakdown.id} className="bg-green-50">
//                                           <TableCell>
//                                             {t("installment")} - {breakdown.installment_no}
//                                           </TableCell>
//                                           <TableCell>{formatDate(breakdown.payment_date)}</TableCell>
//                                           <TableCell className="font-medium text-green-600">
//                                             {formatCurrency(breakdown.paid_amount)}
//                                           </TableCell>
//                                           <TableCell>
//                                             {hasCarryForward ? (
//                                               <span className="text-blue-600">
//                                                 {formatCurrency(breakdown.amount_paid_as_carry_forward)}
//                                               </span>
//                                             ) : (
//                                               <span className="text-gray-400">-</span>
//                                             )}
//                                           </TableCell>
//                                           <TableCell>
//                                             <Badge variant={getStatusBadgeVariant(paymentInfo?.status || "Paid")}>
//                                               {paymentInfo?.status || "Paid"}
//                                             </Badge>
//                                           </TableCell>
//                                           <TableCell>
//                                             <div className="flex space-x-2">
//                                               <Button
//                                                 variant="outline"
//                                                 size="sm"
//                                                 className="h-8 w-8 p-0"
//                                                 onClick={() => handleDownloadReceipt(breakdown.id)}
//                                               >
//                                                 <Download className="h-4 w-4" />
//                                                 <span className="sr-only">{t("download_receipt")}</span>
//                                               </Button>
//                                               {paymentInfo && paymentInfo.status === "Reversal Requested" && (
//                                                 <Button
//                                                   variant="destructive"
//                                                   size="sm"
//                                                   onClick={() => handleReverseTransaction(paymentInfo, true)}
//                                                 >
//                                                   <RotateCcw className="mr-1 h-3 w-3" />
//                                                   {t("reverse")}
//                                                 </Button>
//                                               )}
//                                               {paymentInfo &&
//                                                 paymentInfo.status !== "Reversal Requested" &&
//                                                 paymentInfo.status !== "Reversed" && (
//                                                   <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     onClick={() => handleUpdateStatus(paymentInfo, true)}
//                                                   >
//                                                     <Settings className="mr-1 h-3 w-3" />
//                                                     {t("update")}
//                                                   </Button>
//                                                 )}
//                                             </div>
//                                           </TableCell>
//                                         </TableRow>
//                                       )
//                                     })}
//                                 </TableBody>
//                               </Table>
//                             </div>
//                           )}
//                         </div>
//                       )
//                     })}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="payments">
//             <Card className="shadow-sm border-gray-200">
//               <CardHeader className="bg-gray-50 border-b">
//                 <CardTitle>{t("payment_history")}</CardTitle>
//                 <CardDescription>{t("complete_transaction_history_with_admin_controls")}</CardDescription>
//               </CardHeader>
//               <CardContent className="p-0">
//                 {!hasPaidFees ? (
//                   <div className="p-6 text-center">
//                     <p className="text-muted-foreground">{t("no_payment_history_found")}</p>
//                   </div>
//                 ) : (
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>{t("payment_id")}</TableHead>
//                         <TableHead>{t("installment")}</TableHead>
//                         <TableHead>{t("payment_date")}</TableHead>
//                         <TableHead>{t("paid_amount")}</TableHead>
//                         <TableHead>{t("discounted")}</TableHead>
//                         <TableHead>{t("carry_forward")}</TableHead>
//                         <TableHead>{t("payment_mode")}</TableHead>
//                         <TableHead>{t("status")}</TableHead>
//                         <TableHead>{t("payment_status")}</TableHead>
//                         <TableHead>{t("admin_actions")}</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {feesStatus.paid_fees
//                         .slice()
//                         .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
//                         .map((payment, index) => {
//                           const isLastTransaction = index === 0
//                           const canReverse = payment.status === "Reversal Requested"
//                           const hasDiscount = Number(payment.discounted_amount || 0) > 0
//                           const hasCarryForward = Number(payment.amount_paid_as_carry_forward || 0) > 0

//                           // Find the corresponding installment details
//                           let installmentDetails = { type: "Unknown", number: "-", feeType: "Unknown" }
//                           let isExtraFee = false

//                           // Search in regular installments
//                           installments.forEach((feeType) => {
//                             feeType.installments_breakdown.forEach((breakdown) => {
//                               if (breakdown.id === payment.installment_id) {
//                                 installmentDetails = {
//                                   type: feeType.installment_type,
//                                   number: breakdown.installment_no.toString(),
//                                   feeType: getFeeTypeName(feeType.fees_type_id),
//                                 }
//                               }
//                             })
//                           })

//                           // Search in extra fees installments
//                           extraFeesInstallments.forEach((extraFeeType) => {
//                             extraFeeType.installments_breakdown.forEach((breakdown) => {
//                               if (breakdown.id === payment.installment_id) {
//                                 installmentDetails = {
//                                   type: "Installment",
//                                   number: breakdown.installment_no.toString(),
//                                   feeType: getFeeTypeName(extraFeeType.fees_type_id),
//                                 }
//                                 isExtraFee = true
//                               }
//                             })
//                           })

//                           return (
//                             <TableRow
//                               key={payment.id}
//                               className={`hover:bg-gray-50 ${hasDiscount ? "bg-green-50" : ""} ${
//                                 hasCarryForward ? "bg-blue-50" : ""
//                               }`}
//                             >
//                               <TableCell className="font-medium">#{payment.id}</TableCell>
//                               <TableCell>
//                                 <div className="text-sm">
//                                   {installmentDetails.type} - {installmentDetails.number}
//                                 </div>
//                                 <div className="text-xs text-muted-foreground flex items-center">
//                                   {installmentDetails.feeType}
//                                   {isExtraFee && (
//                                     <Badge variant="outline" className="ml-2 text-xs">
//                                       {t("extra")}
//                                     </Badge>
//                                   )}
//                                 </div>
//                               </TableCell>
//                               <TableCell>{formatDate(payment.payment_date)}</TableCell>
//                               <TableCell className="font-medium">{formatCurrency(payment.paid_amount)}</TableCell>
//                               <TableCell>{formatCurrency(payment.discounted_amount)}</TableCell>
//                               <TableCell>
//                                 {hasCarryForward ? (
//                                   <span className="text-blue-600">
//                                     {formatCurrency(payment.amount_paid_as_carry_forward)}
//                                   </span>
//                                 ) : (
//                                   <span className="text-gray-400">-</span>
//                                 )}
//                               </TableCell>
//                               <TableCell>{payment.payment_mode}</TableCell>
//                               <TableCell>
//                                 <Badge variant={getStatusBadgeVariant(payment.status)}>
//                                   {payment.status || t("paid")}
//                                 </Badge>
//                               </TableCell>
//                               <TableCell>
//                                 <Badge variant={getPaymentStatusBadgeVariant(payment.payment_status || "Success")}>
//                                   {payment.payment_status || "Success"}
//                                 </Badge>
//                               </TableCell>
//                               <TableCell>
//                                 <div className="flex space-x-2">
//                                   <Button
//                                     variant="outline"
//                                     size="sm"
//                                     className="h-8 w-8 p-0"
//                                     onClick={() => handleDownloadReceipt(payment.id)}
//                                   >
//                                     <Download className="h-4 w-4" />
//                                     <span className="sr-only">{t("download_receipt")}</span>
//                                   </Button>
//                                   {canReverse && (
//                                     <Button
//                                       variant="destructive"
//                                       size="sm"
//                                       onClick={() => handleReverseTransaction(payment, isExtraFee)}
//                                     >
//                                       <RotateCcw className="mr-1 h-3 w-3" />
//                                       {t("reverse")}
//                                     </Button>
//                                   )}
//                                   {!canReverse && payment.status !== "Reversed" && (
//                                     <Button
//                                       variant="outline"
//                                       size="sm"
//                                       onClick={() => handleUpdateStatus(payment, isExtraFee)}
//                                     >
//                                       <Settings className="mr-1 h-3 w-3" />
//                                       {t("update")}
//                                     </Button>
//                                   )}
//                                 </div>
//                               </TableCell>
//                             </TableRow>
//                           )
//                         })}
//                     </TableBody>
//                   </Table>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="reversed">
//             <Card className="shadow-sm border-gray-200">
//               <CardHeader className="bg-gray-50 border-b">
//                 <CardTitle className="flex items-center">
//                   <RotateCcw className="mr-2 h-5 w-5 text-red-600" />
//                   {t("reversed_transactions")}
//                 </CardTitle>
//                 <CardDescription>{t("complete_history_of_reversed_transactions_with_audit_details")}</CardDescription>
//               </CardHeader>
//               <CardContent className="p-0">
//                 {!studentFeesStatus?.student.fees_status.reversed_fees || studentFeesStatus?.student.fees_status.reversed_fees.length === 0 ? (
//                   <div className="p-6">
//                     <Alert variant="default" className="bg-blue-50 border-blue-200">
//                       <AlertTriangle className="h-4 w-4 text-blue-600" />
//                       <AlertTitle className="text-blue-800">{t("no_reversed_transactions")}</AlertTitle>
//                       <AlertDescription className="text-blue-700">
//                         {t("this_student_does_not_have_any_reversed_transactions_in_their_payment_history")}
//                       </AlertDescription>
//                     </Alert>
//                   </div>
//                 ) : (
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>{t("transaction_id")}</TableHead>
//                         <TableHead>{t("reversal_date")}</TableHead>
//                         <TableHead>{t("original_date")}</TableHead>
//                         <TableHead>{t("amount")}</TableHead>
//                         <TableHead>{t("payment_mode")}</TableHead>
//                         <TableHead>{t("reversal_reason")}</TableHead>
//                         <TableHead>{t("approved_by")}</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {studentFeesStatus?.student.fees_status.reversed_fees
//                         .slice()
//                         .sort(
//                           (a, b) =>
//                             new Date(b.payment_date || "").getTime() - new Date(a.payment_date || "").getTime(),
//                         )
//                         .map((reversedFee) => (
//                           <TableRow key={reversedFee.id} className="bg-red-50 hover:bg-red-100">
//                             <TableCell className="font-medium">#{reversedFee.id}</TableCell>
//                             <TableCell>{formatDate(reversedFee.payment_date)}</TableCell>
//                             <TableCell>{formatDate(reversedFee.payment_date)}</TableCell>
//                             <TableCell className="font-medium text-red-600">
//                               {formatCurrency(reversedFee.paid_amount)}
//                             </TableCell>
//                             <TableCell>{reversedFee.payment_mode}</TableCell>
//                             <TableCell>
//                               <div className="max-w-xs">
//                                 <p className="text-sm text-gray-700 truncate">
//                                   {reversedFee.remarks || t("not_specified")}
//                                 </p>
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               <Badge variant="outline" className="bg-gray-100">
//                                 {t("admin")}
//                               </Badge>
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                     </TableBody>
//                   </Table>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       )}

//       {/* Fee Plan Details - Only show if fees plan exists */}
//       {hasFeesPlans && (
//         <Card className="mb-6 border shadow-md">
//           <CardHeader>
//             <CardTitle className="text-lg flex items-center">
//               <FileText className="h-5 w-5 mr-2 text-slate-600" />
//               {t("fee_plan_details")}
//             </CardTitle>
//             <CardDescription>
//               {studentFeesStatus.detail?.fees_plan?.name} - {studentFeesStatus.detail?.fees_plan?.description}
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="p-0">
//             {hasFeesDetails ? (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>{t("fee_type")}</TableHead>
//                     <TableHead>{t("installment_type")}</TableHead>
//                     <TableHead className="text-right">{t("installments")}</TableHead>
//                     <TableHead className="text-right">{t("total_amount")}</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {studentFeesStatus.detail?.fees_details?.map((fee) => (
//                     <TableRow key={fee.id}>
//                       <TableCell className="font-medium">{getFeeTypeName(fee.fees_type_id)}</TableCell>
//                       <TableCell>{fee.installment_type}</TableCell>
//                       <TableCell className="text-right">{fee.total_installment}</TableCell>
//                       <TableCell className="text-right">{formatCurrency(fee.total_amount)}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             ) : (
//               <div className="flex flex-col items-center justify-center py-4">
//                 <p className="text-gray-500 text-center">{t("no_fee_details_available_for_this_plan")}</p>
//               </div>
//             )}
//           </CardContent>
//           {hasFeesPlans && (
//             <CardFooter className="bg-slate-50 border-t">
//               <div className="flex justify-between w-full">
//                 <span className="font-medium text-slate-700">{t("total_plan_amount")}:</span>
//                 <span className="font-bold text-slate-800">
//                   {formatCurrency(studentFeesStatus.detail?.fees_plan?.total_amount)}
//                 </span>
//               </div>
//             </CardFooter>
//           )} 
//         </Card>
//       )}

//       {/* Status Update Dialog */}
//       <TransactionStatusDialog
//         isOpen={isStatusDialogOpen}
//         onClose={() => setIsStatusDialogOpen(false)}
//         onSuccess={handleRefresh}
//         payment={selectedPayment}
//         studentName={`${student.first_name} ${student.middle_name || ""} ${student.last_name}`}
//         isLastTransaction={selectedPayment?.isLastTransaction || false}
//         // isExtraFee={selectedPayment?.isExtraFee || false}
//       />

//       {/* Admin Reversal Dialog */}
//       <AdminReversalDialog
//         isOpen={isReversalDialogOpen}
//         onClose={() => setIsReversalDialogOpen(false)}
//         onSuccess={handleRefresh}
//         payment={selectedPayment}
//         studentName={`${student.first_name} ${student.middle_name || ""} ${student.last_name}`}
//         isExtraFee={selectedPayment?.isExtraFee || false}
//       />
//     </div>
//   )
// }

// function FeesStatusSkeleton({ onBack }: { onBack: () => void }) {
//   const { t } = useTranslation()

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex items-center">
//         <Button variant="outline" onClick={onBack}>
//           <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
//         </Button>
//       </div>
//       <div className="text-center py-8">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
//         <p className="mt-4 text-muted-foreground">{t("loading_student_fee_details")}</p>
//       </div>
//     </div>
//   )
// }



"use client"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Printer,
  Receipt,
  Tag,
  User,
  Eye,
  Settings,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  useLazyGetStudentFeesDetailsQuery,
  useGetAllFeesTypeQuery,
  useGetAllConcessionsQuery,
} from "@/services/feesService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import TransactionStatusDialog from "@/components/Fees/PayFees/TransactionStatusDialog"
import AdminReversalDialog from "@/components/Fees/PayFees/AdminReversalDialog"

interface StudentFeesStatusProps {
  studentId?: number
  onClose?: () => void
  mode?: "dialog" | "fullscreen"
}

export default function StudentFeesStatus({
  studentId: propStudentId,
  onClose,
  mode = "fullscreen",
}: StudentFeesStatusProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams<{ student_id: string }>()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  // Determine student ID from props or URL params
  const studentId = propStudentId || (params.student_id ? Number.parseInt(params.student_id) : null)

  const [getStudentFeesDetails, { data: studentFeesStatus, isLoading, error }] = useLazyGetStudentFeesDetailsQuery()

  const [activeTab, setActiveTab] = useState("installments")
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isReversalDialogOpen, setIsReversalDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [expandedFeeTypes, setExpandedFeeTypes] = useState<Set<number>>(new Set())

  // Get current academic session for API calls
  const academicSessionId = studentFeesStatus?.detail?.fees_plan?.academic_session_id || currentAcademicSession?.id

  // Fetch fee types and concessions for proper naming
  const { data: feeTypes } = useGetAllFeesTypeQuery(
    { academic_session_id: academicSessionId || 0, applicable_to: "All" },
    { skip: !academicSessionId },
  )

  const { data: concessionTypes } = useGetAllConcessionsQuery(
    { academic_session_id: academicSessionId || 0 },
    { skip: !academicSessionId },
  )

  useEffect(() => {
    if (studentId && currentAcademicSession) {
      getStudentFeesDetails({
        student_id: studentId,
        academic_session_id: currentAcademicSession.id,
      })
    }
  }, [studentId, currentAcademicSession, getStudentFeesDetails])

  const formatCurrency = (amount: string | number | undefined | null) => {
    if (amount === undefined || amount === null) return "₹0.00"
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return `₹${Number(numAmount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch (e) {
      return "Invalid Date"
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (status) {
      case "Paid":
        return "default"
      case "Partially Paid":
        return "outline"
      case "Overdue":
        return "destructive"
      case "Reversal Requested":
        return "destructive"
      case "Reversed":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getPaymentStatusBadgeVariant = (status: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (status) {
      case "Success":
        return "default"
      case "In Progress":
        return "outline"
      case "Failed":
        return "destructive"
      case "Disputed":
        return "destructive"
      case "Cancelled":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Get fee type name from ID using the API data
  const getFeeTypeName = (feeTypeId: number): string => {
    if (!feeTypeId) return t("unknown_fee_type")

    if (feeTypes && feeTypes.length > 0) {
      const feeType = feeTypes.find((type) => type.id === feeTypeId)
      if (feeType) {
        return feeType.name
      }
    }

    return `${t("fee_type")} ${feeTypeId}`
  }

  // Get concession name from ID using the API data
  const getConcessionNameFromId = (concessionId: number): string => {
    if (!concessionId) return t("unknown_concession")

    if (concessionTypes && concessionTypes.length > 0) {
      const concession = concessionTypes.find((type) => type.id === concessionId)
      if (concession) {
        return concession.name
      }
    }

    return `${t("concession")} ${concessionId}`
  }

  const calculatePaymentProgress = () => {
    if (!studentFeesStatus?.student?.fees_status) return 0
    const totalAmount = Number(studentFeesStatus.student.fees_status.total_amount || 0)
    if (totalAmount === 0) return 0
    const paidAmount = Number(studentFeesStatus.student.fees_status.paid_amount || 0)
    const discountedAmount = Number(studentFeesStatus.student.fees_status.discounted_amount || 0)
    return Math.min(Math.round(((paidAmount + discountedAmount) / totalAmount) * 100), 100)
  }

  // Calculate available concession balance
  const calculateAvailableConcessionBalance = () => {
    if (!studentFeesStatus?.detail?.wallet) return 0

    const wallet = studentFeesStatus.detail.wallet || {
      total_concession_for_student: 0,
      total_concession_for_plan: 0,
    }

    return Number(wallet.total_concession_for_student || 0) + Number(wallet.total_concession_for_plan || 0)
  }

  const handleBack = () => {
    if (onClose) {
      onClose()
    } else {
      navigate(-1)
    }
  }

  const handleUpdateStatus = (payment: any, isExtraFee = false) => {
    const isLastTransaction = getLastTransactionId() === payment.id
    setSelectedPayment({ ...payment, isLastTransaction, isExtraFee })
    setIsStatusDialogOpen(true)
  }

  const handleReverseTransaction = (payment: any, isExtraFee = false) => {
    setSelectedPayment({ ...payment, isExtraFee })
    setIsReversalDialogOpen(true)
  }

  const getLastTransactionId = () => {
    if (!studentFeesStatus?.student?.fees_status?.paid_fees) return null
    const sortedPayments = [...studentFeesStatus.student.fees_status.paid_fees].sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
    )
    return sortedPayments[0]?.id || null
  }

  const hasReversalRequest = () => {
    if (!studentFeesStatus?.student?.fees_status?.paid_fees) return false
    return studentFeesStatus.student.fees_status.paid_fees.some((payment) => payment.status === "Reversal Requested")
  }

  const handleRefresh = () => {
    if (studentId && currentAcademicSession) {
      getStudentFeesDetails({
        student_id: studentId,
        academic_session_id: currentAcademicSession.id,
      })
    }
  }

  const handleDownloadReceipt = (paymentId: number) => {
    // Implement actual download functionality
    console.log(`Downloading receipt for payment ID: ${paymentId}`)
    // This should call an API endpoint to generate and download the receipt
    // For now, showing a placeholder
    alert(`Receipt download for payment ${paymentId} - Implementation needed`)
  }

  const handleViewInstallment = (installmentId: number) => {
    // Implement view installment details
    console.log(`Viewing installment details for ID: ${installmentId}`)
    // This could open a modal with detailed installment information
    alert(`View installment ${installmentId} - Implementation needed`)
  }

  const toggleFeeTypeExpansion = (feeTypeId: number) => {
    const newExpanded = new Set(expandedFeeTypes)
    if (newExpanded.has(feeTypeId)) {
      newExpanded.delete(feeTypeId)
    } else {
      newExpanded.add(feeTypeId)
    }
    setExpandedFeeTypes(newExpanded)
  }

  if (isLoading) {
    return <FeesStatusSkeleton onBack={handleBack} mode={mode} />
  }

  if (error || !studentFeesStatus) {
    return (
      <div className={`${mode === "dialog" ? "p-4" : "p-6"} space-y-6`}>
        {mode === "fullscreen" && (
          <div className="flex items-center">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
            </Button>
          </div>
        )}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">{t("error_loading_student_fees")}</h3>
            <p className="text-red-600 mb-4">
              {(error as any)?.data?.message || t("unable_to_load_student_fee_information_please_try_again")}
            </p>
            <Button onClick={handleRefresh}>{t("retry")}</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const student = studentFeesStatus.student
  const feesStatus = student.fees_status
  const installments = studentFeesStatus.installments || []
  const extraFees = studentFeesStatus.extra_fees || []
  const extraFeesInstallments = studentFeesStatus.extra_fees_installments || []
  const paymentProgress = calculatePaymentProgress()
  const totalConcessionBalance = calculateAvailableConcessionBalance()

  // Get current class and division
  const currentClass = student.academic_class[0]?.class
  const className = currentClass?.class?.class || "N/A"
  const division = currentClass?.division || "N/A"

  const hasFeesStatus = !!feesStatus
  const hasFeesDetails = !!studentFeesStatus.detail?.fees_details && studentFeesStatus.detail.fees_details.length > 0
  const hasFeesPlans = !!studentFeesStatus.detail?.fees_plan
  const hasPaidFees = !!feesStatus?.paid_fees && feesStatus.paid_fees.length > 0
  const hasInstallments = installments.length > 0
  const hasConcessions = !!student.provided_concession && student.provided_concession.length > 0
  const hasExtraFees = extraFees.length > 0
  const hasExtraFeesInstallments = extraFeesInstallments.length > 0

  return (
    <div className={`${mode === "dialog" ? "p-4" : "p-6"} space-y-6`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {mode === "fullscreen" && (
          <Button variant="outline" onClick={handleBack} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        )}
        {/* {mode === "dialog" && onClose && (
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            ✕
          </Button>
        )} */}

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> {t("print_details")}
          </Button>
        </div>
      </div>

      {/* Student Header */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center text-2xl text-gray-800">
            <User className="mr-2 h-5 w-5 text-primary" />
            {student.first_name} {student.middle_name} {student.last_name}
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center gap-2">
            {t("comprehensive_fee_management_and_transaction_history")}
            <Badge variant="outline" className="bg-white">
              {t("academic_year")}{" "}
              {currentAcademicSession?.session_name || studentFeesStatus.detail?.fees_plan?.academic_session_id}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Rearranged student info: Class-Roll Number - GR Number – Payment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("class")}</p>
              <p className="text-lg font-semibold">
                {className}-{division}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("roll_number")}</p>
              <p className="text-lg font-semibold">{student.roll_number || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("gr_number")}</p>
              <p className="text-lg font-semibold">{student.gr_no}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("payment_status")}</p>
              <Badge variant={getStatusBadgeVariant(feesStatus?.status || "")} className="text-sm">
                {feesStatus?.status || t("unknown")}
              </Badge>
            </div>
          </div>

          <Separator className="my-6" />

          {!hasFeesStatus && (
            <Alert variant="destructive" className="mb-4 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800">{t("no_fees_plan_assigned")}</AlertTitle>
              <AlertDescription className="text-amber-700">
                {t("this_student_doesnt_have_any_fees_plan_assigned_yet_please_assign_a_fees_plan_to_proceed")}
              </AlertDescription>
            </Alert>
          )}

          {/* Rearranged Fee Summary Cards: Total Fees-Concession-Paid Amount-Due Amount */}
          {hasFeesStatus && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-700 text-lg flex items-center">
                      <CreditCard className="mr-2 h-5 w-5" />
                      {t("total_fees")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(feesStatus.total_amount)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-amber-700 text-lg flex items-center">
                      <Tag className="mr-2 h-5 w-5" />
                      {t("concession")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-700">{formatCurrency(feesStatus.discounted_amount)}</p>
                    {totalConcessionBalance > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {t("available")}: {formatCurrency(totalConcessionBalance)}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-green-700 text-lg flex items-center">
                      <Receipt className="mr-2 h-5 w-5" />
                      {t("paid_amount")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(feesStatus.paid_amount)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-red-700 text-lg flex items-center">
                      <Tag className="mr-2 h-5 w-5" />
                      {t("total_carry_forwarded_amount")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(feesStatus.due_amount)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{t("payment_progress")}</span>
                  <span className="text-sm font-medium">{paymentProgress}%</span>
                </div>
                <Progress value={paymentProgress} className="h-2" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reversal Request Alert */}
      {hasReversalRequest() && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">{t("reversal_request_pending")}</AlertTitle>
          <AlertDescription className="text-red-700">
            {t("this_student_has_a_pending_transaction_reversal_request_no_new_payments_can_be_processed")}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs - Updated order with Applied Concessions and Fee Plan Details moved */}
      {hasFeesStatus && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="installments" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" /> {t("due_fees")}
            </TabsTrigger>
            <TabsTrigger value="extra-fees" className="flex items-center">
              <Tag className="mr-2 h-4 w-4" /> {t("extra_fees")}
              {hasExtraFees && (
                <Badge variant="secondary" className="ml-2">
                  {extraFees.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="concessions" className="flex items-center">
              <Tag className="mr-2 h-4 w-4" /> {t("concessions")}
              {hasConcessions && (
                <Badge variant="secondary" className="ml-2">
                  {student.provided_concession?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center">
              <Receipt className="mr-2 h-4 w-4" /> {t("payment_history")}
            </TabsTrigger>
            <TabsTrigger value="reversed" className="flex items-center">
              <RotateCcw className="mr-2 h-4 w-4" /> {t("reversed_fees")}
              {studentFeesStatus?.student.fees_status.reversed_fees && studentFeesStatus.student.fees_status.reversed_fees.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {studentFeesStatus.student.fees_status.reversed_fees.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="fee-plan" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" /> {t("fee_plan")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="installments">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>{t("due_installments")}</CardTitle>
                <CardDescription>{t("installments_pending_payment")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!hasInstallments ? (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">{t("no_due_installments_found")}</p>
                  </div>
                ) : (
                  <>
                    {/* Only show Total Available concession balance */}
                    {totalConcessionBalance > 0 && (
                      <Alert className="m-4 bg-amber-50 border-amber-200">
                        <Info className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-700">{t("available_concession_balance")}</AlertTitle>
                        <AlertDescription className="text-amber-600">
                          <span>
                            {t("total_available")}: {formatCurrency(totalConcessionBalance)}
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}

                    {installments.map((feeType) => {
                      const totalInstallments = feeType.total_installment
                      const paidInstallments = feeType.installments_breakdown.filter((b) => b.is_paid).length
                      const avgMonthlyAmount =
                        totalInstallments > 0 ? Number(feeType.total_amount) / totalInstallments : 0
                      const isExpanded = expandedFeeTypes.has(feeType.id)

                      return (
                        <div key={feeType.id} className="mb-6">
                          <div className="bg-gray-50 p-4 border-b">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium flex items-center">
                                <Tag className="h-4 w-4 mr-2" />
                                {getFeeTypeName(feeType.fees_type_id)} - {feeType.installment_type}
                              </h3>
                              <Button variant="ghost" size="sm" onClick={() => toggleFeeTypeExpansion(feeType.id)}>
                                {isExpanded ? (
                                  <>
                                    {t("hide_details")} <ChevronUp className="ml-1 h-4 w-4" />
                                  </>
                                ) : (
                                  <>
                                    {t("view_details")} <ChevronDown className="ml-1 h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Fee Type Overview */}
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-3 text-sm">
                              <div className="text-center">
                                <p className="text-muted-foreground text-xs">{t("total_fees")}</p>
                                <p className="font-semibold">{formatCurrency(feeType.total_amount)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground text-xs">{t("total_installments")}</p>
                                <p className="font-semibold">{totalInstallments}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground text-xs">{t("avg_monthly_installment")}</p>
                                <p className="font-semibold">{formatCurrency(avgMonthlyAmount)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground text-xs">{t("paid_installments")}</p>
                                <p className="font-semibold text-green-600">{paidInstallments}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground text-xs">{t("total_paid")}</p>
                                <p className="font-semibold text-green-600">{formatCurrency(feeType.paid_amount)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground text-xs">{t("total_due")}</p>
                                <p className="font-semibold text-red-600">{formatCurrency(feeType.due_amount)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Expandable installment details */}
                          {isExpanded && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t("installment")}</TableHead>
                                  <TableHead>{t("due_date")}</TableHead>
                                  <TableHead>{t("amount")}</TableHead>
                                  <TableHead>{t("discount")}</TableHead>
                                  <TableHead>{t("payable")}</TableHead>
                                  <TableHead>{t("status")}</TableHead>
                                  <TableHead>{t("actions")}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {feeType.installments_breakdown.map((breakdown) => {
                                  const originalAmount = Number(breakdown.installment_amount || 0)
                                  const discountAmount = Number(breakdown.discounted_amount || 0)
                                  const payableAmount = originalAmount - discountAmount
                                  const hasDiscount = discountAmount > 0

                                  return (
                                    <TableRow
                                      key={breakdown.id}
                                      className={`hover:bg-gray-50 ${hasDiscount ? "bg-green-50" : ""}`}
                                    >
                                      <TableCell>
                                        {feeType.installment_type} - {breakdown.installment_no}
                                      </TableCell>
                                      <TableCell>{formatDate(breakdown.due_date)}</TableCell>
                                      <TableCell className={hasDiscount ? "line-through text-gray-500" : ""}>
                                        {formatCurrency(breakdown.installment_amount)}
                                      </TableCell>
                                      <TableCell className="text-green-600">
                                        {hasDiscount ? formatCurrency(discountAmount) : "-"}
                                        {breakdown.applied_concession && breakdown.applied_concession.length > 0 && (
                                          <div className="text-xs mt-1">
                                            {breakdown.applied_concession.map((concession, idx) => (
                                              <div key={idx} className="flex items-center">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                <span>
                                                  {getConcessionNameFromId(concession.concession_id)} (
                                                  {formatCurrency(concession.applied_amount)})
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="font-medium">{formatCurrency(payableAmount)}</TableCell>
                                      <TableCell>
                                        <Badge variant={getStatusBadgeVariant(breakdown.payment_status || "Unpaid")}>
                                          {breakdown.payment_status || t("unpaid")}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleViewInstallment(breakdown.id)}
                                        >
                                          <Eye className="mr-1 h-3 w-3" /> {t("view")}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extra-fees">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>{t("extra_fees")}</CardTitle>
                <CardDescription>{t("additional_fees_applied_to_this_student")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!hasExtraFeesInstallments ? (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">{t("no_extra_fees_applied")}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {extraFeesInstallments.map((extraFeeType) => {
                      const progress = Math.round(
                        (Number(extraFeeType.paid_amount || 0) / Number(extraFeeType.total_amount || 1)) * 100,
                      )
                      const remainingAmount =
                        Number(extraFeeType.total_amount || 0) - Number(extraFeeType.paid_amount || 0)

                      // Find corresponding extra fee details
                      const extraFeeDetails = extraFees.find((ef) => ef.fees_type_id === extraFeeType.fees_type_id)

                      return (
                        <div key={extraFeeType.id} className="border-b pb-6 last:border-0 last:pb-0">
                          <div className="bg-gray-50 p-3 mb-3">
                            <h3 className="font-medium flex items-center">
                              <Tag className="h-4 w-4 mr-2" />
                              {getFeeTypeName(extraFeeType.fees_type_id)}
                              <Badge
                                variant={getStatusBadgeVariant(extraFeeDetails?.status || "Active")}
                                className="ml-2"
                              >
                                {extraFeeDetails?.status || "Active"}
                              </Badge>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                              <div>
                                <span>
                                  {t("total")}: {formatCurrency(extraFeeType.total_amount)}
                                </span>
                              </div>
                              <div>
                                <span>
                                  {t("paid")}: {formatCurrency(extraFeeType.paid_amount)}
                                </span>
                              </div>
                              <div>
                                <span>
                                  {t("due")}: {formatCurrency(remainingAmount)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-muted-foreground">{t("payment_progress")}</span>
                                <span className="text-xs text-muted-foreground">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1" />
                            </div>
                          </div>

                          {/* Unpaid Installments */}
                          {extraFeeType.installments_breakdown.filter((breakdown) => !breakdown.is_paid).length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-medium text-sm mb-2 text-red-700">{t("unpaid_installments")}</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t("installment")}</TableHead>
                                    <TableHead>{t("due_date")}</TableHead>
                                    <TableHead>{t("amount")}</TableHead>
                                    <TableHead>{t("status")}</TableHead>
                                    <TableHead>{t("actions")}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {extraFeeType.installments_breakdown
                                    .filter((breakdown) => !breakdown.is_paid)
                                    .map((breakdown) => (
                                      <TableRow key={breakdown.id} className="bg-red-50">
                                        <TableCell>
                                          {t("installment")} - {breakdown.installment_no}
                                        </TableCell>
                                        <TableCell>{formatDate(breakdown.due_date)}</TableCell>
                                        <TableCell>{formatCurrency(breakdown.installment_amount)}</TableCell>
                                        <TableCell>
                                          <Badge variant="destructive">{breakdown.payment_status || t("unpaid")}</Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewInstallment(breakdown.id)}
                                          >
                                            <Eye className="mr-1 h-3 w-3" /> {t("view")}
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Paid Installments */}
                          {extraFeeType.installments_breakdown.filter((breakdown) => breakdown.is_paid).length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2 text-green-700">{t("payment_history")}</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t("installment")}</TableHead>
                                    <TableHead>{t("payment_date")}</TableHead>
                                    <TableHead>{t("paid_amount")}</TableHead>
                                    <TableHead>{t("carry_forward")}</TableHead>
                                    <TableHead>{t("status")}</TableHead>
                                    <TableHead>{t("admin_actions")}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {extraFeeType.installments_breakdown
                                    .filter((breakdown) => breakdown.is_paid)
                                    .map((breakdown) => {
                                      const hasCarryForward = Number(breakdown.amount_paid_as_carry_forward || 0) > 0

                                      // Find corresponding payment in extra fees
                                      const paymentInfo = extraFeeDetails?.paid_installment?.find(
                                        (payment) => payment.installment_id === breakdown.id,
                                      )

                                      return (
                                        <TableRow key={breakdown.id} className="bg-green-50">
                                          <TableCell>
                                            {t("installment")} - {breakdown.installment_no}
                                          </TableCell>
                                          <TableCell>{formatDate(breakdown.payment_date)}</TableCell>
                                          <TableCell className="font-medium text-green-600">
                                            {formatCurrency(breakdown.paid_amount)}
                                          </TableCell>
                                          <TableCell>
                                            {hasCarryForward ? (
                                              <span className="text-blue-600">
                                                {formatCurrency(breakdown.amount_paid_as_carry_forward)}
                                              </span>
                                            ) : (
                                              <span className="text-gray-400">-</span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={getStatusBadgeVariant(paymentInfo?.status || "Paid")}>
                                              {paymentInfo?.status || "Paid"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex space-x-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleDownloadReceipt(breakdown.id)}
                                              >
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">{t("download_receipt")}</span>
                                              </Button>
                                              {paymentInfo && paymentInfo.status === "Reversal Requested" && (
                                                <Button
                                                  variant="destructive"
                                                  size="sm"
                                                  onClick={() => handleReverseTransaction(paymentInfo, true)}
                                                >
                                                  <RotateCcw className="mr-1 h-3 w-3" />
                                                  {t("reverse")}
                                                </Button>
                                              )}
                                              {paymentInfo &&
                                                paymentInfo.status !== "Reversal Requested" &&
                                                paymentInfo.status !== "Reversed" && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleUpdateStatus(paymentInfo, true)}
                                                  >
                                                    <Settings className="mr-1 h-3 w-3" />
                                                    {t("update")}
                                                  </Button>
                                                )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applied Concessions Tab - Moved here */}
          <TabsContent value="concessions">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  {t("applied_concessions")}
                </CardTitle>
                <CardDescription>{t("concessions_and_discounts_applied_to_this_student")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!hasConcessions ? (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">{t("no_concessions_applied")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("concession_name")}</TableHead>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead>{t("type")}</TableHead>
                        <TableHead>{t("applied_to")}</TableHead>
                        <TableHead className="text-right">{t("amount")}</TableHead>
                        <TableHead className="text-right">{t("applied_discount")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.provided_concession?.map((concession) => (
                        <TableRow key={concession.id}>
                          <TableCell className="font-medium">
                            {concession.concession?.name || getConcessionNameFromId(concession.concession_id)}
                          </TableCell>
                          <TableCell>{concession.concession?.description || t("no_description_available")}</TableCell>
                          <TableCell className="capitalize">{concession.deduction_type.replace("_", " ")}</TableCell>
                          <TableCell>
                            {concession.fees_type_id ? getFeeTypeName(concession.fees_type_id) : t("all_fees")}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(concession.amount ?? 0)}</TableCell>
                          <TableCell className="text-right text-purple-600 font-medium">
                            {formatCurrency(concession.amount || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>{t("payment_history")}</CardTitle>
                <CardDescription>{t("complete_transaction_history_with_admin_controls")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!hasPaidFees ? (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">{t("no_payment_history_found")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {/* Removed Payment ID column */}
                        <TableHead>{t("installment")}</TableHead>
                        <TableHead>{t("payment_date")}</TableHead>
                        <TableHead>{t("paid_amount")}</TableHead>
                        <TableHead>{t("discounted")}</TableHead>
                        <TableHead>{t("carry_forward")}</TableHead>
                        <TableHead>{t("payment_mode")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead>{t("payment_status")}</TableHead>
                        <TableHead>{t("admin_actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feesStatus.paid_fees
                        .slice()
                        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                        .map((payment, index) => {
                          const isLastTransaction = index === 0
                          const canReverse = payment.status === "Reversal Requested"
                          const hasDiscount = Number(payment.discounted_amount || 0) > 0
                          const hasCarryForward = Number(payment.amount_paid_as_carry_forward || 0) > 0

                          // Find the corresponding installment details
                          let installmentDetails = { type: "Unknown", number: "-", feeType: "Unknown" }
                          let isExtraFee = false

                          // Search in regular installments
                          installments.forEach((feeType) => {
                            feeType.installments_breakdown.forEach((breakdown) => {
                              if (breakdown.id === payment.installment_id) {
                                installmentDetails = {
                                  type: feeType.installment_type,
                                  number: breakdown.installment_no.toString(),
                                  feeType: getFeeTypeName(feeType.fees_type_id),
                                }
                              }
                            })
                          })

                          // Search in extra fees installments
                          extraFeesInstallments.forEach((extraFeeType) => {
                            extraFeeType.installments_breakdown.forEach((breakdown) => {
                              if (breakdown.id === payment.installment_id) {
                                installmentDetails = {
                                  type: "Installment",
                                  number: breakdown.installment_no.toString(),
                                  feeType: getFeeTypeName(extraFeeType.fees_type_id),
                                }
                                isExtraFee = true
                              }
                            })
                          })

                          return (
                            <TableRow
                              key={payment.id}
                              className={`hover:bg-gray-50 ${hasDiscount ? "bg-green-50" : ""} ${
                                hasCarryForward ? "bg-blue-50" : ""
                              }`}
                            >
                              <TableCell>
                                <div className="text-sm">
                                  {installmentDetails.type} - {installmentDetails.number}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center">
                                  {installmentDetails.feeType}
                                  {isExtraFee && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {t("extra")}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(payment.payment_date)}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(payment.paid_amount)}</TableCell>
                              <TableCell>{formatCurrency(payment.discounted_amount)}</TableCell>
                              <TableCell>
                                {hasCarryForward ? (
                                  <span className="text-blue-600">
                                    {formatCurrency(payment.amount_paid_as_carry_forward)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>{payment.payment_mode}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(payment.status)}>
                                  {payment.status || t("paid")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getPaymentStatusBadgeVariant(payment.payment_status || "Success")}>
                                  {payment.payment_status || "Success"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDownloadReceipt(payment.id)}
                                  >
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only">{t("download_receipt")}</span>
                                  </Button>
                                  {canReverse && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleReverseTransaction(payment, isExtraFee)}
                                    >
                                      <RotateCcw className="mr-1 h-3 w-3" />
                                      {t("reverse")}
                                    </Button>
                                  )}
                                  {!canReverse && payment.status !== "Reversed" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(payment, isExtraFee)}
                                    >
                                      <Settings className="mr-1 h-3 w-3" />
                                      {t("update")}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reversed">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center">
                  <RotateCcw className="mr-2 h-5 w-5 text-red-600" />
                  {t("reversed_transactions")}
                </CardTitle>
                <CardDescription>{t("complete_history_of_reversed_transactions_with_audit_details")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!studentFeesStatus?.student.fees_status.reversed_fees || studentFeesStatus.student.fees_status.reversed_fees.length === 0 ? (
                  <div className="p-6">
                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">{t("no_reversed_transactions")}</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        {t("this_student_does_not_have_any_reversed_transactions_in_their_payment_history")}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("transaction_id")}</TableHead>
                        <TableHead>{t("reversal_date")}</TableHead>
                        <TableHead>{t("original_date")}</TableHead>
                        <TableHead>{t("amount")}</TableHead>
                        <TableHead>{t("payment_mode")}</TableHead>
                        <TableHead>{t("reversal_reason")}</TableHead>
                        <TableHead>{t("approved_by")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentFeesStatus.student.fees_status.reversed_fees
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.payment_date || "").getTime() - new Date(a.payment_date || "").getTime(),
                        )
                        .map((reversedFee) => (
                          <TableRow key={reversedFee.id} className="bg-red-50 hover:bg-red-100">
                            <TableCell className="font-medium">#{reversedFee.id}</TableCell>
                            <TableCell>{formatDate(reversedFee.payment_date)}</TableCell>
                            <TableCell>{formatDate(reversedFee.payment_date)}</TableCell>
                            <TableCell className="font-medium text-red-600">
                              {formatCurrency(reversedFee.paid_amount)}
                            </TableCell>
                            <TableCell>{reversedFee.payment_mode}</TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="text-sm text-gray-700 truncate">
                                  {reversedFee.remarks || t("not_specified")}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-gray-100">
                                {t("admin")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Plan Details Tab - Moved to last */}
          <TabsContent value="fee-plan">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-slate-600" />
                  {t("fee_plan_details")}
                </CardTitle>
                <CardDescription>
                  {studentFeesStatus.detail?.fees_plan?.name} - {studentFeesStatus.detail?.fees_plan?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!hasFeesPlans ? (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">{t("no_fee_plan_assigned")}</p>
                  </div>
                ) : hasFeesDetails ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("fee_type")}</TableHead>
                        <TableHead>{t("installment_type")}</TableHead>
                        <TableHead className="text-right">{t("installments")}</TableHead>
                        <TableHead className="text-right">{t("total_amount")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentFeesStatus.detail?.fees_details?.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{getFeeTypeName(fee.fees_type_id)}</TableCell>
                          <TableCell>{fee.installment_type}</TableCell>
                          <TableCell className="text-right">{fee.total_installment}</TableCell>
                          <TableCell className="text-right">{formatCurrency(fee.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-gray-500 text-center">{t("no_fee_details_available_for_this_plan")}</p>
                  </div>
                )}
                {hasFeesPlans && (
                  <div className="bg-slate-50 border-t p-4">
                    <div className="flex justify-between w-full">
                      <span className="font-medium text-slate-700">{t("total_plan_amount")}:</span>
                      <span className="font-bold text-slate-800">
                        {formatCurrency(studentFeesStatus.detail?.fees_plan?.total_amount)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Status Update Dialog */}
      <TransactionStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onSuccess={handleRefresh}
        payment={selectedPayment}
        studentName={`${student.first_name} ${student.middle_name || ""} ${student.last_name}`}
        isLastTransaction={selectedPayment?.isLastTransaction || false}
        // isExtraFee={selectedPayment?.isExtraFee || false}
      />

      {/* Admin Reversal Dialog */}
      <AdminReversalDialog
        isOpen={isReversalDialogOpen}
        onClose={() => setIsReversalDialogOpen(false)}
        onSuccess={handleRefresh}
        payment={selectedPayment}
        studentName={`${student.first_name} ${student.middle_name || ""} ${student.last_name}`}
        isExtraFee={selectedPayment?.isExtraFee || false}
      />
    </div>
  )
}

function FeesStatusSkeleton({ onBack, mode }: { onBack: () => void; mode: string }) {
  const { t } = useTranslation()

  return (
    <div className={`${mode === "dialog" ? "p-4" : "p-6"} space-y-6`}>
      {mode === "fullscreen" && (
        <div className="flex items-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        </div>
      )}
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">{t("loading_student_fee_details")}</p>
      </div>
    </div>
  )
}
