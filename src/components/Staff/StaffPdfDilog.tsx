"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Download,
  X,
  User,
  Phone,
  MapPin,
  Building,
  CreditCard,
  GraduationCap,
  Award,
  FileCheck,
  Briefcase,
  History,
  FileText,
} from "lucide-react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import type { ComponentType } from "react"
import type { StaffType } from "@/types/staff"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectCurrentUser } from "@/redux/slices/authSlice"
import { selectSchool } from "@/redux/slices/schoolSlice"
import { useGetStaffByIdQuery } from "@/services/StaffService"

interface StaffDetailsDialogProps {
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  selectedStaff: StaffType
  StaffDetailsPDF: ComponentType<any>
}

const StaffDetailsDialog: React.FC<StaffDetailsDialogProps> = ({
  dialogOpen,
  setDialogOpen,
  selectedStaff,
  StaffDetailsPDF,
}) => {
  const { t } = useTranslation()
  const currentUser = useAppSelector(selectCurrentUser)
  const schoolCredential = useAppSelector(selectSchool)
  const school = schoolCredential || currentUser?.school
  const [pdfKey, setPdfKey] = useState(Date.now())

  // Fetch full details including experiences, letters, qualifications, and department
  const { data: fullStaff, isLoading: isFullStaffLoading } = useGetStaffByIdQuery(
    selectedStaff?.id,
    { skip: !selectedStaff?.id || !dialogOpen }
  )

  const staff = fullStaff || selectedStaff

  const formatData = useCallback((value: any): string => {
    if (!value) return "N/A"
    if (value instanceof Date || typeof value === "string") {
      try {
        return new Date(value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      } catch {
        return value.toString()
      }
    }
    return value.toString()
  }, [])

  const getDisplayValue = useCallback((value: any): string => {
    if (value === null || value === undefined || value === "") return "N/A"
    return value.toString()
  }, [])

  const handlePDFDownload = useCallback(() => {
    // Force re-render of PDFDownloadLink by updating key
    setTimeout(() => setPdfKey(Date.now()), 100)
  }, [])

  if (!staff) return null

  const experiences: any[] = staff.experiences || staff.staff_experiences || []
  const letters: any[] = staff.letters || []

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-5xl max-h-[92vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900">
            {t("staff_details")}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    {typeof window !== "undefined" && (
                      <PDFDownloadLink
                        key={pdfKey}
                        document={<StaffDetailsPDF staff={staff} school={school} />}
                        fileName={`${staff.first_name}_${staff.last_name}_details.pdf`}
                      >
                        {({ loading }) => (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={loading || isFullStaffLoading}
                            onClick={handlePDFDownload}
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white"
                          >
                            <Download className="h-4 w-4" />
                            {loading || isFullStaffLoading ? t("generating") : t("download_pdf")}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("download_staff_details_pdf")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(92vh-75px)] p-6 space-y-6">
          {/* Profile Header */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                  <AvatarImage
                    src={
                      staff.gender?.toLowerCase() === "male"
                        ? "https://img.freepik.com/premium-vector/man-professional-business-casual-young-avatar-icon-illustration_1277826-623.jpg"
                        : "https://img.freepik.com/free-vector/woman-with-long-brown-hair-pink-shirt_90220-2940.jpg"
                    }
                    alt={`${staff.first_name} ${staff.last_name}`}
                  />
                  <AvatarFallback className="text-xl bg-primary/10">
                    {staff.first_name?.[0]}
                    {staff.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {getDisplayValue(staff.first_name)} {getDisplayValue(staff.middle_name)}{" "}
                      {getDisplayValue(staff.last_name)}
                    </h2>
                    {(staff.first_name_in_guj || staff.last_name_in_guj) && (
                      <p className="text-base text-gray-600">
                        {getDisplayValue(staff.first_name_in_guj)}{" "}
                        {getDisplayValue(staff.middle_name_in_guj)}{" "}
                        {getDisplayValue(staff.last_name_in_guj)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">ID: {staff.id}</Badge>
                    {staff.employee_code && (
                      <Badge variant="outline">Code: {staff.employee_code}</Badge>
                    )}
                    <Badge variant="secondary">Staff: {getDisplayValue(staff.staff_type)}</Badge>
                    <Badge variant="outline">Type: {getDisplayValue(staff.employment_status)}</Badge>
                    {staff.staff_category && (
                      <Badge variant="secondary">Category: {staff.staff_category}</Badge>
                    )}
                    {Boolean(staff.designation || staff.role) && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                        {staff.designation || staff.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid of details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Personal Information */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  {t("personal_information")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("gender")}</p>
                    <p className="font-medium">{getDisplayValue(staff.gender)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("date_of_birth")}</p>
                    <p className="font-medium">{formatData(staff.birth_date)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Marital Status</p>
                    <p className="font-medium">{getDisplayValue(staff.marital_status)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Blood Group</p>
                    <p className="font-medium">{getDisplayValue(staff.blood_group)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("aadhar_number")}</p>
                    <p className="font-medium">{getDisplayValue(staff.aadhar_no)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">PAN Card No</p>
                    <p className="font-medium">{getDisplayValue(staff.pan_card_no)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("religion")}</p>
                    <p className="font-medium">{getDisplayValue(staff.religion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("caste")}</p>
                    <p className="font-medium">{getDisplayValue(staff.caste)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("category")}</p>
                    <p className="font-medium">{getDisplayValue(staff.category)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Contact & Address Details */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact & Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("mobile_number")}</p>
                    <p className="font-medium">{getDisplayValue(staff.mobile_number)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("email_address")}</p>
                    <p className="font-medium">{getDisplayValue(staff.email)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">
                    {staff.emergency_contact_name
                      ? `${staff.emergency_contact_name} (${getDisplayValue(staff.emergency_contact_number)})`
                      : "N/A"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Current Address</p>
                  <p className="font-medium">
                    {[staff.address, staff.city, staff.district, staff.state, staff.postal_code]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Permanent Address</p>
                  <p className="font-medium">{getDisplayValue(staff.permanent_address || staff.address)}</p>
                </div>
              </CardContent>
            </Card>

            {/* 3. Academic Details */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Academic Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("qualification")}</p>
                    <p className="font-medium">{getDisplayValue(staff.qualification)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("subject_specialization")}</p>
                    <p className="font-medium">{getDisplayValue(staff.subject_specialization)}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  {staff.ug_degree && (
                    <div className="p-2 bg-slate-50 rounded border text-xs">
                      <span className="font-semibold text-slate-700">UG: </span>
                      {staff.ug_degree} — {staff.ug_passing_university || "N/A"} ({staff.ug_passing_year || "N/A"})
                    </div>
                  )}
                  {staff.pg_degree && (
                    <div className="p-2 bg-slate-50 rounded border text-xs">
                      <span className="font-semibold text-slate-700">PG: </span>
                      {staff.pg_degree} — {staff.pg_passing_university || "N/A"} ({staff.pg_passing_year || "N/A"})
                    </div>
                  )}
                  {staff.diploma_degree && (
                    <div className="p-2 bg-slate-50 rounded border text-xs">
                      <span className="font-semibold text-slate-700">Diploma: </span>
                      {staff.diploma_degree} — {staff.diploma_council || "N/A"} ({staff.diploma_passing_year || "N/A"})
                    </div>
                  )}
                  {staff.other_degree && (
                    <div className="p-2 bg-slate-50 rounded border text-xs">
                      <span className="font-semibold text-slate-700">Other: </span>
                      {staff.other_degree} — {staff.other_passing_university || "N/A"} ({staff.other_passing_year || "N/A"})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 4. Professional & Council Registration */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Award className="h-4 w-4 text-primary" />
                  Professional & Council Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">AYUSH Teacher Code</p>
                    <p className="font-medium">{getDisplayValue(staff.teacher_code)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AYUSH Reg / ID No</p>
                    <p className="font-medium">{getDisplayValue(staff.ayush_registration_no || staff.ayush_id_no)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">State Council Reg No</p>
                    <p className="font-medium">{getDisplayValue(staff.state_council_reg_no)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">NCH Reg No & Date</p>
                    <p className="font-medium">
                      {getDisplayValue(staff.nch_registration_no)}{" "}
                      {staff.nch_registration_date ? `(${formatData(staff.nch_registration_date)})` : ""}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Area of Expertise</p>
                  <p className="font-medium">{getDisplayValue(staff.area_of_expertise)}</p>
                </div>
              </CardContent>
            </Card>

            {/* 5. Employment & Service Details */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Building className="h-4 w-4 text-primary" />
                  Employment & Service Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("joining_date")}</p>
                    <p className="font-medium">{formatData(staff.joining_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("employment_status")}</p>
                    <p className="font-medium">{getDisplayValue(staff.employment_status)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{getDisplayValue(staff.department || staff.department_details?.name)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pay Scale</p>
                    <p className="font-medium">{getDisplayValue(staff.pay_scale)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Retirement Age</p>
                    <p className="font-medium">{staff.retirement_age ? `${staff.retirement_age} Yrs` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Retirement Date</p>
                    <p className="font-medium">{formatData(staff.retirement_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resignation / Last Date</p>
                    <p className="font-medium">{formatData(staff.resignation_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. Bank & Statutory Details */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Bank & Statutory Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("bank_name")}</p>
                    <p className="font-medium">{getDisplayValue(staff.bank_name)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="font-medium">{getDisplayValue(staff.bank_branch_name)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("account_number")}</p>
                    <p className="font-medium">{getDisplayValue(staff.account_no)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("ifsc_code")}</p>
                    <p className="font-medium">{getDisplayValue(staff.IFSC_code)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">EPF Number</p>
                    <p className="font-medium">{getDisplayValue(staff.epf_no)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EPF UAN Number</p>
                    <p className="font-medium">{getDisplayValue(staff.epf_uan_no)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 7. Previous Experiences Table */}
          {experiences.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <History className="h-4 w-4 text-primary" />
                  Previous Professional Experiences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="p-2 font-semibold">Institute</th>
                      <th className="p-2 font-semibold">Designation</th>
                      <th className="p-2 font-semibold">Department</th>
                      <th className="p-2 font-semibold">Regulation</th>
                      <th className="p-2 font-semibold text-right">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experiences.map((exp: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="p-2 font-medium">{exp.institute_name || "-"}</td>
                        <td className="p-2">{exp.post_name || "-"}</td>
                        <td className="p-2">{exp.department || "-"}</td>
                        <td className="p-2">{exp.appointment_regulation || "-"}</td>
                        <td className="p-2 text-right">
                          {formatData(exp.from_date)} - {formatData(exp.to_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* 8. University Letters & Orders */}
          {letters.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FileText className="h-4 w-4 text-primary" />
                  University Letters & Orders Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="p-2 font-semibold">Letter Type</th>
                      <th className="p-2 font-semibold">Letter No</th>
                      <th className="p-2 font-semibold">Letter Date</th>
                      <th className="p-2 font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {letters.map((l: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="p-2 font-medium">{l.letter_type || "-"}</td>
                        <td className="p-2">{l.letter_no || "-"}</td>
                        <td className="p-2">{formatData(l.letter_date)}</td>
                        <td className="p-2">{l.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StaffDetailsDialog
