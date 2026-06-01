import { useState } from "react"
import {
  User,
  GraduationCap,
  CreditCard,
  FileText,
  MapPin,
  Calendar,
  Phone,
  Award,
  School,
  Clock,
  ArrowLeft,
  Download,
  Printer,
  Users,
  Percent,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useNavigate } from "react-router-dom"
import type { StudentEnrollment } from "@/types/student"
import { PDFDownloadLink } from "@react-pdf/renderer"
import dynamic from "next/dynamic"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { useAppSelector } from "@/redux/hooks/useAppSelector"

interface StudentProfileViewProps {
  student: StudentEnrollment
  onBack?: () => void
  showToolBar: boolean
}

export function StudentProfileView({ student, onBack, showToolBar }: StudentProfileViewProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("overview")
  // Add a state to force re-render PDFDownloadLink
  const [pdfKey, setPdfKey] = useState(Date.now())

  const AcademicClasses = useAppSelector(selectAcademicClasses)
  
  const getClass = (class_id : number)=>{
    if(!AcademicClasses) return 'Loading...'
    return AcademicClasses.find((cls)=>cls.id === class_id)?.class
  }

  // Calculate fees payment percentage
  const feesPaymentPercentage = student.fees_status
    ? Math.round(
      (Number.parseFloat(String(student.fees_status.paid_amount)) / Number.parseFloat(String(student.fees_status.total_amount))) *
      100,
    )
    : 0

  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pursuing":
        return "bg-green-500 hover:bg-green-600"
      case "failed":
        return "bg-red-500 hover:bg-red-600"
      case "permoted":
        return "bg-blue-500 hover:bg-blue-600"
      case "drop":
        return "bg-yellow-500 hover:bg-yellow-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Get fees status badge color
  const getFeesStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-500 hover:bg-green-600"
      case "Partially Paid":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "Unpaid":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const StudentDetailsPDF = dynamic(() => import("./StudentPdf"), {
    ssr: false,
    loading: () => <p>Loading PDF generator...</p>,
  })

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      {/* Back button and actions */}
      {showToolBar && (<div className="flex justify-between items-center">
        <Button variant="ghost" className="flex items-center gap-1" onClick={onBack || (() => navigate(-1))}>
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Button>
        <div className="flex gap-2">
          {typeof window !== "undefined" && (
            <PDFDownloadLink
              key={pdfKey}
              document={<StudentDetailsPDF student={student} currentUser={null} />}
              fileName={`${student.student.first_name}_${student.student.last_name}_details.pdf`}
            >
              {({ blob, url, loading, error }: { blob: Blob | null; url: string | null; loading: boolean; error: Error | null }) => (
                <Button
                  variant="outline"
                  size="icon"
                  disabled={loading}
                  aria-label="Download PDF"
                  className="flex items-center gap-1"
                  onClick={() => setTimeout(() => setPdfKey(Date.now()), 500)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </PDFDownloadLink>
          )}
          {/* <Button className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {t("edit_profile")}
          </Button> */}
        </div>
      </div>)}

      {/* Profile header */}
      <Card className="border-t-4 border-t-primary shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src="/placeholder.svg?height=128&width=128" alt={student.student.first_name} />
                <AvatarFallback className="text-4xl bg-primary/10">
                  {student.student.first_name?.[0]}
                  {student.student.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Badge className={`absolute -top-2 -right-2 ${getStatusBadgeColor(student.status)}`}>
                {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
              </Badge>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="text-3xl font-bold">
                  {student.student.first_name} {student.student.middle_name} {student.student.last_name}
                </h1>
                <Badge variant="outline" className="w-fit">
                  {t("enrollment_code")}: {student.student.enrollment_code}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>
                    {t("class")}: {student.class?.class.class}-{student.class?.division}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>
                    {t("roll_number")}: {student.student.roll_number}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t("DoB")}: {student.student?.birth_date ? formatDate(student.student?.birth_date) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{student.student.primary_mobile}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {student.student.gender}
                </Badge>
                {student.student.student_meta?.blood_group && (
                  <Badge variant="destructive" className="flex items-center gap-1 text-white">
                    {student.student.student_meta.blood_group}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  GR: {student.student.gr_no}
                </Badge>
                {student.student.student_meta?.category && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {student.student.student_meta.category}
                  </Badge>
                )}
                {student.quota && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                    <Award className="h-3 w-3" />
                    {student.quota.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-2">
              <Card className="border-l-4 border-l-primary w-full md:w-64">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">{t("fees_status")}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">{t("payment_progress")}</span>
                      <span className="font-medium">{feesPaymentPercentage}%</span>
                    </div>
                    <Progress value={feesPaymentPercentage} className="h-2" />
                    <div className="flex justify-between items-center pt-1">
                      <Badge className={getFeesStatusBadgeColor(student.fees_status?.status || "")}>
                        {student.fees_status?.status || "N/A"}
                      </Badge>
                      <span className="text-sm font-medium">
                        ₹{String(student.fees_status?.paid_amount || "0")} / ₹
                        {student.fees_status?.total_amount || "0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="academic">{t("academic")}</TabsTrigger>
          {/* <TabsTrigger value="fees">{t("fees")}</TabsTrigger> */}
          <TabsTrigger value="personal">{t("personal_details")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {t("quick_info")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("admission_date")}</p>
                    <p className="font-medium">{student.student.student_meta?.admission_date && formatDate(student.student.student_meta?.admission_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("admission_class")}</p>
                    <p className="font-medium">{
                      student.student.student_meta?.admission_class_id ? `Class ${getClass(student.student.student_meta?.admission_class_id)}` : "N/A"
                    }</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("admission_type")}</p>
                    <p className="font-medium">{student.is_new_admission ? t("new") : t("continuing")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("aadhar_no")}</p>
                    <p className="font-medium">{student.student.aadhar_no || "N/A"}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">{t("previous_school")}</p>
                  <p className="font-medium">{student.student.student_meta?.privious_school || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Family Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {t("family_info")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("father_name")}</p>
                  <p className="font-medium">{student.student.father_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{student.student.father_name_in_guj}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">{t("mother_name")}</p>
                  <p className="font-medium">{student.student.mother_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{student.student.mother_name_in_guj}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">{t("contact_details")}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{student.student.primary_mobile}</p>
                  </div>
                  {student.student.student_meta?.secondary_mobile && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{student.student.student_meta.secondary_mobile}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t("address_info")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("current_address")}</p>
                  <p className="font-medium">{student.student.student_meta?.address || "N/A"}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("city")}</p>
                    <p className="font-medium">{student.student.student_meta?.city || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("district")}</p>
                    <p className="font-medium">{student.student.student_meta?.district || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("state")}</p>
                    <p className="font-medium">{student.student.student_meta?.state || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("postal_code")}</p>
                    <p className="font-medium">{student.student.student_meta?.postal_code || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Academic Summary Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                {t("academic_summary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">{t("class")}</th>
                      <th className="text-left py-3 px-4 font-medium">{t("division")}</th>
                      <th className="text-left py-3 px-4 font-medium">{t("status")}</th>
                      <th className="text-left py-3 px-4 font-medium">{t("type")}</th>
                      <th className="text-left py-3 px-4 font-medium">{t("remarks")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{student.class?.class.class}</td>
                      <td className="py-3 px-4">{student.class?.division}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadgeColor(student.status)}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{student.is_new_admission ? t("new") : t("continuing")}</td>
                      <td className="py-3 px-4">{student.remarks || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Academic Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <School className="h-5 w-5 text-primary" />
                  {t("current_academic_status")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("class")}</span>
                  <span className="font-medium">
                    {student.class?.class.class}-{student.class?.division}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("status")}</span>
                  <Badge className={getStatusBadgeColor(student.status)}>
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("roll_number")}</span>
                  <span className="font-medium">{student.student.roll_number}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("admission_type")}</span>
                  <span className="font-medium">{student.is_new_admission ? t("new") : t("continuing")}</span>
                </div>
                {student.quota && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t("quota")}</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {student.quota.name}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Admission Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t("admission_details")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("admission_date")}</span>
                  <span className="font-medium">{student.student.student_meta?.admission_date && formatDate(student.student.student_meta?.admission_date)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("admission_class")}</span>
                  <span className="font-medium">{
                    student.student.student_meta?.admission_class_id ? `Class ${getClass(student.student.student_meta?.admission_class_id)}` : "N/A"
                  } </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("is_new_admission")}</span>
                  <Badge variant={student.is_new_admission ? "default" : "secondary"}>
                    {student.is_new_admission ? t("yes") : t("no")}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <span className="text-muted-foreground">{t("previous_school")}</span>
                  <p className="font-medium mt-1">{student.student.student_meta?.privious_school || "N/A"}</p>
                  {student.student.student_meta?.privious_school_in_guj && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {student.student.student_meta.privious_school_in_guj}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Remarks */}
          {student.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t("remarks")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{student.remarks}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-6 mt-6">
          {/* Fees Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t("fees_overview")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.fees_status ? (
                <div className="space-y-6">
                  {/* Fees Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-primary/5 border-none">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t("total_fees")}</p>
                        <p className="text-2xl font-bold">
                          ₹{Number.parseFloat(student.fees_status.total_amount).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-500/5 border-none">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t("paid_amount")}</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{Number.parseFloat(String(student.fees_status.paid_amount)).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-500/5 border-none">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t("due_amount")}</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{Number.parseFloat(student.fees_status.due_amount).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/5 border-none">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t("discount")}</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          ₹{Number.parseFloat(String(student.fees_status.discounted_amount)).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Payment Progress */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("payment_progress")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("payment_status")}</span>
                          <Badge className={getFeesStatusBadgeColor(student.fees_status.status)}>
                            {student.fees_status.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{t("progress")}</span>
                            <span>{feesPaymentPercentage}%</span>
                          </div>
                          <Progress value={feesPaymentPercentage} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment History */}
                  {student.fees_status.paid_fees && student.fees_status.paid_fees.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{t("payment_history")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium">{t("installment")}</th>
                                <th className="text-left py-3 px-4 font-medium">{t("amount")}</th>
                                <th className="text-left py-3 px-4 font-medium">{t("payment_date")}</th>
                                <th className="text-left py-3 px-4 font-medium">{t("payment_mode")}</th>
                                <th className="text-left py-3 px-4 font-medium">{t("status")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {student.fees_status.paid_fees.map((payment, index) => (
                                <tr key={index} className="border-b hover:bg-muted/50">
                                  <td className="py-3 px-4">#{payment.installment_id}</td>
                                  <td className="py-3 px-4">
                                    ₹{Number.parseFloat(String(payment.paid_amount)).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4">{formatDate(payment.payment_date)}</td>
                                  <td className="py-3 px-4">{payment.payment_mode}</td>
                                  <td className="py-3 px-4">
                                    <Badge
                                      variant={payment.status === "Paid" ? "default" : "secondary"}
                                      className={
                                        payment.status === "Overdue" ? "bg-red-500 hover:bg-red-600" : undefined
                                      }
                                    >
                                      {payment.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button variant="outline" className="flex items-center gap-1">
                      <Printer className="h-4 w-4" />
                      {t("print_receipt")}
                    </Button>
                    <Button variant="outline" className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {t("view_payment_history")}
                    </Button>
                    <Button className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      {t("collect_fees")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <p>{t("no_fees_information_available")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Concessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {t("concessions_and_scholarships")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.provided_concession && student.provided_concession.length > 0 ? (
                <div className="space-y-4">
                  {student.provided_concession.map((concession, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {concession.concession_id && `Concession #${concession.concession_id}`}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{concession.fees_plan?.name || ""}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          {concession.deduction_type === "percentage" ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              {concession.percentage}%
                            </Badge>
                          ) : (
                            <Badge variant="outline">₹{concession.amount}</Badge>
                          )}
                          <Badge className="mt-1" variant={concession.status === "Active" ? "default" : "secondary"}>
                            {concession.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <p>{t("no_concessions_applied")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Details Tab */}
        <TabsContent value="personal" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {t("basic_information")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("full_name")}</p>
                    <p className="font-medium">
                      {student.student.first_name} {student.student.middle_name} {student.student.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {student.student.first_name_in_guj} {student.student.middle_name_in_guj}{" "}
                      {student.student.last_name_in_guj}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("gender")}</p>
                    <p className="font-medium">{student.student.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("date_of_birth")}</p>
                    <p className="font-medium">{student.student?.birth_date ? formatDate(student.student?.birth_date) : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("birth_place")}</p>
                    <p className="font-medium">{student.student.student_meta?.birth_place || "N/A"}</p>
                    {student.student.student_meta?.birth_place_in_guj && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {student.student.student_meta.birth_place_in_guj}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("religion")}</p>
                    <p className="font-medium">{student.student.student_meta?.religion || "N/A"}</p>
                    {student.student.student_meta?.religion_in_guj && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {student.student.student_meta.religion_in_guj}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("caste")}</p>
                    <p className="font-medium">{student.student.student_meta?.caste || "N/A"}</p>
                    {student.student.student_meta?.caste_in_guj && (
                      <p className="text-sm text-muted-foreground mt-1">{student.student.student_meta.caste_in_guj}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("category")}</p>
                    <p className="font-medium">{student.student.student_meta?.category || "N/A"}</p>
                  </div>
                  {/* <div>
                    <p className="text-sm text-muted-foreground">{t("blood_group")}</p>
                    <p className="font-medium">{student.student.student_meta?.blood_group || "N/A"}</p>
                  </div> */}
                </div>
              </CardContent>
            </Card>

            {/* Identification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t("identification")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("enrollment_code")}</p>
                    <p className="font-medium">{student.student.enrollment_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("gr_number")}</p>
                    <p className="font-medium">{student.student.gr_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("aadhar_number")}</p>
                    <p className="font-medium">{student.student.aadhar_no || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("aadhar_dise_number")}</p>
                    <p className="font-medium">{student.student.student_meta?.aadhar_dise_no || "N/A"}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">{t("identification_mark")}</p>
                  <p className="font-medium">{student.student.student_meta?.identification_mark || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                {t("contact_information")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">{t("phone_numbers")}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t("primary")}:</span>
                      <span className="font-medium">{student.student.primary_mobile}</span>
                    </div>
                    {student.student.student_meta?.secondary_mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t("secondary")}:</span>
                        <span className="font-medium">{student.student.student_meta.secondary_mobile}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">{t("address")}</h4>
                  <p>{student.student.student_meta?.address || "N/A"}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-sm text-muted-foreground">{t("city")}:</span>
                      <span className="ml-1">{student.student.student_meta?.city || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t("district")}:</span>
                      <span className="ml-1">{student.student.student_meta?.district || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t("state")}:</span>
                      <span className="ml-1">{student.student.student_meta?.state || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t("postal_code")}:</span>
                      <span className="ml-1">{student.student.student_meta?.postal_code || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t("bank_details")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.student.student_meta?.bank_name || student.student.student_meta?.account_no ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("bank_name")}</p>
                    <p className="font-medium">{student.student.student_meta?.bank_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("account_number")}</p>
                    <p className="font-medium">{student.student.student_meta?.account_no || "N/A"}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-16 text-muted-foreground">
                  <p>{t("no_bank_details_available")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StudentProfileView

