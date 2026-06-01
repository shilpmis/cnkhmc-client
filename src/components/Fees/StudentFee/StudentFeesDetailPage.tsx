// "use client"

// import type React from "react"
// import { useState, useEffect } from "react"
// import { useParams, useNavigate } from "react-router-dom"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Button } from "@/components/ui/button"
// import { ArrowLeft, Receipt, FileText } from "lucide-react"
// import { useLazyGetStudentFeesDetailsQuery } from "@/services/feesService"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { selectActiveAccademicSessionsForSchool, selectCurrentSchool } from "@/redux/slices/authSlice"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import { toast } from "@/hooks/use-toast"
// import StudentFeesDetailView from "./StudentFeesDetailView"
// import ExtraFeesSection from "./ExtraFeesSection"
// import type { StudentFeeDetails } from "@/types/fees"

// interface StudentFeesDetailPageProps {
//   studentId?: number
//   onClose?: () => void
//   showBackButton?: boolean
// }

// const StudentFeesDetailPage: React.FC<StudentFeesDetailPageProps> = ({
//   studentId: propStudentId,
//   onClose,
//   showBackButton = true,
// }) => {
//   const { t } = useTranslation()
//   const navigate = useNavigate()
//   const params = useParams<{ student_id: string }>()
//   const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
//   const schoolDetails = useAppSelector(selectCurrentSchool)

//   const [activeTab, setActiveTab] = useState("regular-fees")

//   // Determine student ID from props or URL params
//   const effectiveStudentId = propStudentId || (params.student_id ? Number.parseInt(params.student_id) : null)

//   const [getStudentFeesDetails, { data: studentFeeDetails, isLoading, isError }] =
//     useLazyGetStudentFeesDetailsQuery()

//   // Fetch student fees details
//   useEffect(() => {
//     if (effectiveStudentId && currentAcademicSession) {
//       getStudentFeesDetails({
//         student_id: effectiveStudentId,
//         academic_session_id: currentAcademicSession.id,
//       })
//     }
//   }, [effectiveStudentId, currentAcademicSession, getStudentFeesDetails])

//   // Handle back button click
//   const handleBackToList = () => {
//     if (onClose) {
//       onClose()
//     } else {
//       navigate(-1)
//     }
//   }

//   // Handle refresh data
//   const handleRefreshData = () => {
//     if (effectiveStudentId && currentAcademicSession) {
//       getStudentFeesDetails({
//         student_id: effectiveStudentId,
//         academic_session_id: currentAcademicSession.id,
//       })
//         .then(() => {
//           toast({
//             title: t("data_refreshed"),
//             description: t("student_fee_details_have_been_refreshed"),
//           })
//         })
//         .catch(() => {
//           toast({
//             variant: "destructive",
//             title: t("error"),
//             description: t("failed_to_refresh_data"),
//           })
//         })
//     }
//   }

//   if (!effectiveStudentId) {
//     return (
//       <div className="p-6">
//         <div className="text-center">
//           <p className="text-red-500">{t("no_student_id_provided")}</p>
//           <Button onClick={handleBackToList} className="mt-4">
//             {t("go_back")}
//           </Button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="p-6 space-y-6">
//       {showBackButton && (
//         <Button variant="outline" onClick={handleBackToList} className="flex items-center">
//           <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
//         </Button>
//       )}

//       <Tabs value={activeTab} onValueChange={setActiveTab}>
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="regular-fees" className="flex items-center">
//             <Receipt className="mr-2 h-4 w-4" /> {t("regular_fees")}
//           </TabsTrigger>
//           <TabsTrigger value="extra-fees" className="flex items-center">
//             <FileText className="mr-2 h-4 w-4" /> {t("extra_fees")}
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="regular-fees" className="mt-6">
//           <StudentFeesDetailView
//             studentId={effectiveStudentId}
//             studentFeeDetails={studentFeeDetails as StudentFeeDetails}
//             isLoading={isLoading}
//             onClose={handleBackToList}
//             academicSession={currentAcademicSession!}
//             schoolInfo={{
//               name: schoolDetails?.name || "School Management System",
//               address: schoolDetails?.address || "",
//             }}
//             showBackButton={false}
//           />
//         </TabsContent>

//         <TabsContent value="extra-fees" className="mt-6">
//           {studentFeeDetails ? (
//             <ExtraFeesSection
//               studentId={effectiveStudentId}
//               feesPlanId={studentFeeDetails.detail?.fees_plan?.id || 0}
//               extraFees={studentFeeDetails.detail?.extra_fees || []}
//               onRefresh={handleRefreshData}
//             />
//           ) : isLoading ? (
//             <div className="text-center p-6">
//               <p>{t("loading_extra_fees_data")}...</p>
//             </div>
//           ) : isError ? (
//             <div className="text-center p-6">
//               <p className="text-red-500">{t("failed_to_load_extra_fees_data")}</p>
//               <Button onClick={handleRefreshData} className="mt-4">
//                 {t("retry")}
//               </Button>
//             </div>
//           ) : (
//             <div className="text-center p-6">
//               <p>{t("no_data_available")}</p>
//             </div>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }

// export default StudentFeesDetailPage


"use client"

import type React from "react"
import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  ArrowRight,
  User,
  CreditCard,
  Receipt,
  Tag,
  AlertTriangle,
  Eye,
  FileText,
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import { useLazyGetStudentFeesDetailsQuery } from "@/services/feesService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentSchool } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface StudentFeesDetailPageProps {
  studentId?: number
  onClose?: () => void
  showBackButton?: boolean
}

const StudentFeesDetailPage: React.FC<StudentFeesDetailPageProps> = ({
  studentId: propStudentId,
  onClose,
  showBackButton = true,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams<{ student_id: string }>()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const schoolDetails = useAppSelector(selectCurrentSchool)

  // Determine student ID from props or URL params
  const effectiveStudentId = propStudentId || (params.student_id ? Number.parseInt(params.student_id) : null)

  const [getStudentFeesDetails, { data: studentFeeDetails, isLoading, isError }] = useLazyGetStudentFeesDetailsQuery()

  // Fetch student fees details
  useEffect(() => {
    if (effectiveStudentId && currentAcademicSession) {
      getStudentFeesDetails({
        student_id: effectiveStudentId,
        academic_session_id: currentAcademicSession.id,
      })
    }
  }, [effectiveStudentId, currentAcademicSession, getStudentFeesDetails])

  // Handle back button click
  const handleBackToList = () => {
    if (onClose) {
      onClose()
    } else {
      navigate(-1)
    }
  }

  // Navigate to full detailed view
  const handleViewFullDetails = () => {
    if (effectiveStudentId) {
      navigate(`student/${effectiveStudentId}`)
    }
  }

  // Format currency
  const formatCurrency = (amount: string | number | undefined | null) => {
    if (amount === undefined || amount === null) return "₹0.00"
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return `₹${Number(numAmount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (status) {
      case "Paid":
        return "default"
      case "Partially Paid":
        return "outline"
      case "Overdue":
        return "destructive"
      default:
        return "secondary"
    }
  }

  // Calculate payment progress
  const calculatePaymentProgress = () => {
    if (!studentFeeDetails?.student?.fees_status) return 0
    const totalAmount = Number(studentFeeDetails.student.fees_status.total_amount || 0)
    if (totalAmount === 0) return 0
    const paidAmount = Number(studentFeeDetails.student.fees_status.paid_amount || 0)
    const discountedAmount = Number(studentFeeDetails.student.fees_status.discounted_amount || 0)
    return Math.min(Math.round(((paidAmount + discountedAmount) / totalAmount) * 100), 100)
  }

  if (!effectiveStudentId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-500 text-lg font-medium">{t("no_student_id_provided")}</p>
          <Button onClick={handleBackToList} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("go_back")}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {showBackButton && (
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        )}
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading_student_fee_summary")}</p>
        </div>
      </div>
    )
  }

  if (isError || !studentFeeDetails) {
    return (
      <div className="p-6 space-y-6">
        {showBackButton && (
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        )}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">{t("error_loading_student_fees")}</h3>
            <p className="text-red-600 mb-4">{t("unable_to_load_student_fee_information")}</p>
            <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const student = studentFeeDetails.student
  const feesStatus = student.fees_status
  const installments = studentFeeDetails.installments || []
  const extraFees = studentFeeDetails.extra_fees || []
  const extraFeesInstallments = studentFeeDetails.extra_fees_installments || []
  const paymentProgress = calculatePaymentProgress()

  // Get current class and division
  const currentClass = student.academic_class[0]?.class
  const className = currentClass?.class?.class || "N/A"
  const division = currentClass?.division || "N/A"

  // Calculate summary statistics
  const totalDueInstallments = installments.reduce(
    (acc, feeType) => acc + feeType.installments_breakdown.filter((b) => !b.is_paid).length,
    0,
  )
  const totalExtraFeesDue = extraFeesInstallments.reduce(
    (acc, extraFeeType) => acc + Number(extraFeeType.due_amount || 0),
    0,
  )
  const totalPayments = feesStatus?.paid_fees?.length || 0
  const hasOverduePayments = studentFeeDetails.detail.paid_fees.some((feeType) =>
      feeType.status === "Paid Late")
  

  return (
    <div className="p-6 space-y-6">
      {showBackButton && (
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
        </Button>
      )}

      {/* Header Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-800">
                  {student.first_name} {student.middle_name} {student.last_name}
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {t("fees_overview")} • {className}-{division} • GR: {student.gr_no}
                </CardDescription>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(feesStatus?.status || "")} className="text-sm px-3 py-1">
              {feesStatus?.status || t("unknown")}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t("total_fees")}</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(feesStatus?.total_amount)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">{t("paid_amount")}</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(feesStatus?.paid_amount)}</p>
              </div>
              <Receipt className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">{t("concession")}</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(feesStatus?.discounted_amount)}</p>
              </div>
              <Tag className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">{t("due_amount")}</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(feesStatus?.due_amount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">{t("payment_progress")}</h3>
            </div>
            <span className="text-2xl font-bold text-blue-600">{paymentProgress}%</span>
          </div>
          <Progress value={paymentProgress} className="h-3 mb-2" />
          <p className="text-sm text-muted-foreground">
            {formatCurrency(feesStatus?.paid_amount)} {t("of")} {formatCurrency(feesStatus?.total_amount)} {t("paid")}
          </p>
        </CardContent>
      </Card>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t("pending_installments")}</p>
                <p className="text-xl font-bold">{totalDueInstallments}</p>
                {hasOverduePayments && (
                  <Badge variant="destructive" className="text-xs mt-1">
                    {t("overdue")}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t("extra_fees_due")}</p>
                <p className="text-xl font-bold">{formatCurrency(totalExtraFeesDue)}</p>
                {extraFees.length > 0 && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {extraFees.length} {t("types")}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Receipt className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t("total_payments")}</p>
                <p className="text-xl font-bold">{totalPayments}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {t("transactions")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {hasOverduePayments && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {t("this_student_has_overdue_payments_that_require_immediate_attention")}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button onClick={handleViewFullDetails} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="lg">
          <Eye className="mr-2 h-5 w-5" />
          {t("view_complete_details")}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <Button variant="outline" onClick={() => window.print()} className="flex-1" size="lg">
          <FileText className="mr-2 h-5 w-5" />
          {t("print_summary")}
        </Button>
      </div>

      {/* Footer Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t("fee_plan")}: {studentFeeDetails.detail?.fees_plan?.name || t("not_assigned")}
            </span>
            <span>
              {t("academic_year")}: {currentAcademicSession?.session_name}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentFeesDetailPage
