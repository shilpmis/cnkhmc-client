// "use client"

// import type React from "react"

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Separator } from "@/components/ui/separator"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import { User, Mail, Phone, Briefcase, CreditCard, FileText } from "lucide-react"

// interface EmployeeProps {
//   employee: any
// }

// const EmployeeOverview: React.FC<EmployeeProps> = ({ employee }) => {
//   const { t } = useTranslation()

//   // Format date
//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "N/A"
//     const date = new Date(dateString)
//     return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
//   }

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       {/* Personal Information */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <User className="h-5 w-5 text-primary" />
//             {t("personal_information")}
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-muted-foreground">{t("full_name")}</p>
//               <p className="font-medium">{employee.name}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("gender")}</p>
//               <p className="font-medium">{employee.gender || "N/A"}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("date_of_birth")}</p>
//               <p className="font-medium">{formatDate(employee.dateOfBirth)}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("blood_group")}</p>
//               <p className="font-medium">{employee.bloodGroup || "N/A"}</p>
//             </div>
//           </div>

//           <Separator />

//           <div>
//             <p className="text-sm text-muted-foreground">{t("address")}</p>
//             <p className="font-medium">{employee.address || "N/A"}</p>
//           </div>

//           <Separator />

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-muted-foreground">{t("email")}</p>
//               <div className="flex items-center gap-2 mt-1">
//                 <Mail className="h-4 w-4 text-muted-foreground" />
//                 <p className="font-medium">{employee.email}</p>
//               </div>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("contact_number")}</p>
//               <div className="flex items-center gap-2 mt-1">
//                 <Phone className="h-4 w-4 text-muted-foreground" />
//                 <p className="font-medium">{employee.contactNumber}</p>
//               </div>
//             </div>
//             {employee.emergencyContact && (
//               <div>
//                 <p className="text-sm text-muted-foreground">{t("emergency_contact")}</p>
//                 <div className="flex items-center gap-2 mt-1">
//                   <Phone className="h-4 w-4 text-muted-foreground" />
//                   <p className="font-medium">{employee.emergencyContact}</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Employment Information */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Briefcase className="h-5 w-5 text-primary" />
//             {t("employment_information")}
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-muted-foreground">{t("employee_code")}</p>
//               <p className="font-medium">{employee.code}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("joining_date")}</p>
//               <p className="font-medium">{formatDate(employee.joiningDate)}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("employment_type")}</p>
//               <p className="font-medium">{employee.employmentType}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("status")}</p>
//               <p className="font-medium">{employee.status}</p>
//             </div>
//           </div>

//           <Separator />

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-muted-foreground">{t("role")}</p>
//               <p className="font-medium">{employee.role}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("department")}</p>
//               <p className="font-medium">{employee.department}</p>
//             </div>
//           </div>

//           <Separator />

//           <div>
//             <p className="text-sm text-muted-foreground">{t("qualification")}</p>
//             <p className="font-medium">{employee.qualification || "N/A"}</p>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Bank Details */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <CreditCard className="h-5 w-5 text-primary" />
//             {t("bank_details")}
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {employee.bankDetails ? (
//             <>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-muted-foreground">{t("bank_name")}</p>
//                   <p className="font-medium">{employee.bankDetails.bankName}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">{t("account_number")}</p>
//                   <p className="font-medium">{employee.bankDetails.accountNumber}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">{t("ifsc_code")}</p>
//                   <p className="font-medium">{employee.bankDetails.ifscCode}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">{t("branch")}</p>
//                   <p className="font-medium">{employee.bankDetails.branch}</p>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <p className="text-muted-foreground">{t("no_bank_details_available")}</p>
//           )}
//         </CardContent>
//       </Card>

//       {/* Statutory Information */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <FileText className="h-5 w-5 text-primary" />
//             {t("statutory_information")}
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-muted-foreground">{t("epf_number")}</p>
//               <p className="font-medium">{employee.epfNo || "N/A"}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("uan_number")}</p>
//               <p className="font-medium">{employee.uanNo || "N/A"}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">{t("pf_account_number")}</p>
//               <p className="font-medium">{employee.pfAccountNo || "N/A"}</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// export default EmployeeOverview


"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Building,
  CreditCard,
  Edit,
  Save,
  X,
  AlertCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { StaffType } from "@/types/staff"
import { useUpdateStaffMutation } from "@/services/StaffService"

interface EmployeeOverviewProps {
  employee: StaffType
}

const EmployeeOverview = ({ employee }: EmployeeOverviewProps) => {
  const { t } = useTranslation()
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation()

  const [isEditingEpf, setIsEditingEpf] = useState(false)
  const [epfData, setEpfData] = useState({
    epf_no: employee.epf_no?.toString() || "",
    epf_uan_no: employee.epf_uan_no?.toString() || "",
  })

  const handleEpfSave = async () => {
    // try {
    //   const response = await updateStaff({
    //     payload: {
    //       epf_no: epfData.epf_no ? Number(epfData.epf_no) : null,
    //       epf_uan_no: epfData.epf_uan_no ? Number(epfData.epf_uan_no) : null,
    //     },
    //     staff_id: employee.id,
    //   })

    //   if (response.data) {
    //     toast({
    //       title: "Success",
    //       description: "EPF details updated successfully",
    //     })
    //     setIsEditingEpf(false)
    //   } else {
    //     toast({
    //       title: "Error",
    //       description: "Failed to update EPF details",
    //       variant: "destructive",
    //     })
    //   }
    // } catch (error) {
    //   console.error("Error updating EPF details:", error)
    //   toast({
    //     title: "Error",
    //     description: "An unexpected error occurred",
    //     variant: "destructive",
    //   })
    // }
  }

  // Format date
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const hasEpfDetails = employee.epf_no || employee.epf_uan_no

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" /> {t("personal_information")}
          </CardTitle>
          <CardDescription>{t("basic_personal_details_of_the_employee")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label className="text-muted-foreground">{t("full_name")}</Label>
              <p className="font-medium mt-1">
                {`${employee.first_name} ${employee.middle_name ? employee.middle_name + " " : ""}${employee.last_name}`}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("email")}</Label>
              <p className="font-medium mt-1 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {employee.email || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("phone_number")}</Label>
              <p className="font-medium mt-1 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                {employee.mobile_number || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("date_of_birth")}</Label>
              <p className="font-medium mt-1 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {formatDate(employee.birth_date)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("gender")}</Label>
              <p className="font-medium mt-1">{employee.gender || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("marital_status")}</Label>
              <p className="font-medium mt-1">{employee.marital_status || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("blood_group")}</Label>
              <p className="font-medium mt-1">{employee.blood_group || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("nationality")}</Label>
              <p className="font-medium mt-1">{employee.nationality || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("religion")}</Label>
              <p className="font-medium mt-1">{employee.religion || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" /> {t("contact_information")}
          </CardTitle>
          <CardDescription>{t("address_and_contact_details")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">{t("address")}</Label>
              <p className="font-medium mt-1">{employee.address || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("city")}</Label>
              <p className="font-medium mt-1">{employee.city || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("state")}</Label>
              <p className="font-medium mt-1">{employee.state || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("postal_code")}</Label>
              <p className="font-medium mt-1">{employee.postal_code || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("emergency_contact_name")}</Label>
              <p className="font-medium mt-1">{employee.emergency_contact_name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("emergency_contact_number")}</Label>
              <p className="font-medium mt-1">{employee.emergency_contact_number || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" /> {t("employment_information")}
          </CardTitle>
          <CardDescription>{t("job_related_details")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label className="text-muted-foreground">{t("employee_code")}</Label>
              <p className="font-medium mt-1">{employee.employee_code}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("role")}</Label>
              <p className="font-medium mt-1">{employee.role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("employment_type")}</Label>
              <p className="font-medium mt-1">{employee.is_teaching_role ? "Teaching" : "Non-Teaching"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("employment_status")}</Label>
              <p className="font-medium mt-1">{employee.employment_status?.replace("_", " ") || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("joining_date")}</Label>
              <p className="font-medium mt-1">{formatDate(employee.joining_date)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("experience")}</Label>
              <p className="font-medium mt-1">
                {employee.experience_years ? `${employee.experience_years} years` : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("qualification")}</Label>
              <p className="font-medium mt-1 flex items-center">
                <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                {employee.qualification || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("specialization")}</Label>
              <p className="font-medium mt-1">{employee.subject_specialization || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("working_hours")}</Label>
              <p className="font-medium mt-1">
                {employee.working_hours ? `${employee.working_hours} hours/week` : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EPF Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" /> {t("epf_information")}
            </CardTitle>
            <CardDescription>{t("employee_provident_fund_details")}</CardDescription>
          </div>
          {!isEditingEpf && (
            <Button variant="outline" size="sm" onClick={() => setIsEditingEpf(true)}>
              <Edit className="h-4 w-4 mr-2" /> {t("edit")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!hasEpfDetails && !isEditingEpf ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No EPF details available</AlertTitle>
              <AlertDescription>
                EPF details have not been added for this employee. Click the edit button to add them.
              </AlertDescription>
            </Alert>
          ) : isEditingEpf ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="epf_no">{t("epf_number")}</Label>
                  <Input
                    id="epf_no"
                    value={epfData.epf_no}
                    onChange={(e) => setEpfData({ ...epfData, epf_no: e.target.value })}
                    placeholder="Enter EPF number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epf_uan_no">{t("epf_uan_number")}</Label>
                  <Input
                    id="epf_uan_no"
                    value={epfData.epf_uan_no}
                    onChange={(e) => setEpfData({ ...epfData, epf_uan_no: e.target.value })}
                    placeholder="Enter EPF UAN number"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditingEpf(false)}>
                  <X className="h-4 w-4 mr-2" /> {t("cancel")}
                </Button>
                <Button onClick={handleEpfSave} disabled={isUpdating}>
                  <Save className="h-4 w-4 mr-2" /> {t("save")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-muted-foreground">{t("epf_number")}</Label>
                <p className="font-medium mt-1">{employee.epf_no || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("epf_uan_number")}</Label>
                <p className="font-medium mt-1">{employee.epf_uan_no || "N/A"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" /> {t("bank_information")}
          </CardTitle>
          <CardDescription>{t("bank_account_details")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label className="text-muted-foreground">{t("bank_name")}</Label>
              <p className="font-medium mt-1">{employee.bank_name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("account_number")}</Label>
              <p className="font-medium mt-1">{employee.account_no || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("ifsc_code")}</Label>
              <p className="font-medium mt-1">{employee.IFSC_code || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" /> {t("identity_information")}
          </CardTitle>
          <CardDescription>{t("government_id_details")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-muted-foreground">{t("aadhar_number")}</Label>
              <p className="font-medium mt-1">{employee.aadhar_no || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("pan_card_number")}</Label>
              <p className="font-medium mt-1">{employee.pan_card_no || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeeOverview
