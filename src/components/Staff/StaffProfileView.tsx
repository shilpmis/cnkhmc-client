"use client"

import { useState } from "react"
import {
  User,
  GraduationCap,
  FileText,
  MapPin,
  Calendar,
  Phone,
  School,
  ArrowLeft,
  Download,
  Printer,
  Briefcase,
  Mail,
  CreditCard,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useNavigate } from "react-router-dom"
import type { StaffType } from "@/types/staff"

interface StaffProfileViewProps {
  staff: StaffType
  onBack?: () => void
  showToolBar: boolean
}

export function StaffProfileView({ staff, onBack, showToolBar }: StaffProfileViewProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("overview")

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

  // Boolean check for teaching staff
  const isTeachingStaff = staff.is_teching_staff

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      {/* Back button and actions */}
      {showToolBar && (
        <div className="flex justify-between items-center">
          <Button variant="ghost" className="flex items-center gap-1" onClick={onBack || (() => navigate(-1))}>
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Button>
          <div className="flex gap-2">
            {/* <Button variant="outline" className="flex items-center gap-1">
              <Printer className="h-4 w-4" />
              {t("print_profile")}
            </Button> */}
            {/* <Button variant="outline" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {t("export_data")}
            </Button> */}
          </div>
        </div>
      )}

      {/* Profile header */}
      <Card className="border-t-4 border-t-primary shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage
                  src={staff.profile_photo || "/placeholder.svg?height=128&width=128"}
                  alt={staff.first_name}
                />
                <AvatarFallback className="text-4xl bg-primary/10">
                  {staff.first_name?.[0]}
                  {staff.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Badge className={`absolute -top-2 -right-2 ${staff.is_active ? "bg-green-500" : "bg-red-500"}`}>
                {staff.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="text-3xl font-bold">
                  {staff.first_name} {staff.middle_name} {staff.last_name}
                </h1>
                <Badge variant="outline" className="w-fit">
                  {t("employee_code")}: {staff.employee_code}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>
                    {/* {t("role")}: {staff.role_type?.role || "N/A"} */}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {/* {t("joining_date")}: {formatDate(staff.joining_date)} */}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{staff.mobile_number}</span>
                </div>
                {staff.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{staff.email}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {staff.gender}
                </Badge>
                {staff.blood_group && (
                  <Badge variant="destructive" className="flex items-center gap-1 text-white">
                    {staff.blood_group}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {staff.employment_status}
                </Badge>
                {isTeachingStaff ? (
                  <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                    <GraduationCap className="h-3 w-3" />
                    Teaching Staff
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200">
                    <Briefcase className="h-3 w-3" />
                    Non-Teaching Staff
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="professional">{t("professional")}</TabsTrigger>
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
                    <p className="text-sm text-muted-foreground">{t("joining_date")}</p>
                    {/* <p className="font-medium">{formatDate(staff.joining_date)}</p> */}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("employment_status")}</p>
                    <p className="font-medium">{staff.employment_status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("aadhar_no")}</p>
                    <p className="font-medium">{staff.aadhar_no || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("birth_date")}</p>
                    {/* <p className="font-medium">{formatDate(staff.birth_date)}</p> */}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  {t("contact_info")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("mobile_number")}</p>
                  <p className="font-medium">{staff.mobile_number}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">{t("email")}</p>
                  <p className="font-medium">{staff.email || "N/A"}</p>
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
                  <p className="font-medium">{staff.address || "N/A"}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("city")}</p>
                    <p className="font-medium">{staff.city || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("district")}</p>
                    <p className="font-medium">{staff.district || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("state")}</p>
                    <p className="font-medium">{staff.state || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("postal_code")}</p>
                    <p className="font-medium">{staff.postal_code || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Professional Tab */}
        <TabsContent value="professional" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  {t("role_information")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("role")}</span>
                  {/* <span className="font-medium">{staff.role_type?.role || "N/A"}</span> */}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("employment_status")}</span>
                  <Badge variant="outline">{staff.employment_status}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("staff_type")}</span>
                  <span className="font-medium">{isTeachingStaff ? "Teaching" : "Non-Teaching"}</span>
                </div>
                {isTeachingStaff && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t("subject_specialization")}</span>
                      <span className="font-medium">{staff.subject_specialization || "N/A"}</span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("working_hours")}</span>
                  {/* <span className="font-medium">{staff.role_type?.working_hours || "N/A"} hours</span> */}
                </div>
              </CardContent>
            </Card>

            {/* Qualification Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <School className="h-5 w-5 text-primary" />
                  {t("qualification_details")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("qualification")}</span>
                  <span className="font-medium">{staff.qualification || "N/A"}</span>
                </div>
                {isTeachingStaff && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t("subject_specialization")}</span>
                      <span className="font-medium">{staff.subject_specialization || "N/A"}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t("bank_details")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("bank_name")}</p>
                  <p className="font-medium">{staff.bank_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("account_number")}</p>
                  <p className="font-medium">{staff.account_no || "N/A"}</p>
                </div>
              </div>
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
                      {staff.first_name} {staff.middle_name} {staff.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {staff.first_name_in_guj} {staff.middle_name_in_guj} {staff.last_name_in_guj}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("gender")}</p>
                    <p className="font-medium">{staff.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("date_of_birth")}</p>
                    {/* <p className="font-medium">{formatDate(staff.birth_date)}</p> */}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("blood_group")}</p>
                    <p className="font-medium">{staff.blood_group || "N/A"}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("religion")}</p>
                    <p className="font-medium">{staff.religion || "N/A"}</p>
                    {staff.religion_in_guj && (
                      <p className="text-sm text-muted-foreground mt-1">{staff.religion_in_guj}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("caste")}</p>
                    <p className="font-medium">{staff.caste || "N/A"}</p>
                    {staff.caste_in_guj && <p className="text-sm text-muted-foreground mt-1">{staff.caste_in_guj}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("category")}</p>
                    <p className="font-medium">{staff.category || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("nationality")}</p>
                    <p className="font-medium">{staff.nationality || "N/A"}</p>
                  </div>
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
                    <p className="text-sm text-muted-foreground">{t("employee_code")}</p>
                    <p className="font-medium">{staff.employee_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("aadhar_number")}</p>
                    <p className="font-medium">{staff.aadhar_no || "N/A"}</p>
                  </div>
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
                      <span className="text-sm text-muted-foreground">{t("mobile")}:</span>
                      <span className="font-medium">{staff.mobile_number}</span>
                    </div>
                    {staff.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t("email")}:</span>
                        <span className="font-medium">{staff.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">{t("address")}</h4>
                  <p>{staff.address || "N/A"}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-sm text-muted-foreground">{t("city")}:</span>
                      <span className="ml-1">{staff.city || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t("district")}:</span>
                      <span className="ml-1">{staff.district || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t("state")}:</span>
                      <span className="ml-1">{staff.state || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t("postal_code")}:</span>
                      <span className="ml-1">{staff.postal_code || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StaffProfileView
