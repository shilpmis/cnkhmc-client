"use client"

import type React from "react"
import { useRef } from "react"
import { useState, useCallback, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { type StaffFormData, staffSchema } from "@/utils/staff.validation"
import { useLazyGetSchoolStaffRoleQuery } from "@/services/StaffService"
import type { StaffRole, StaffType } from "@/types/staff"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { NumberInput } from "../ui/NumberInput"
import { selectAuthState } from "@/redux/slices/authSlice"
import { selectSchoolStaffRoles } from "@/redux/slices/staffSlice"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { Loader2 } from "lucide-react"

import { RoleSelectionSection } from "./form-sections/RoleSelectionSection"
import { PersonalDetailsSection } from "./form-sections/PersonalDetailsSection"
import { ProfessionalDetailsSection } from "./form-sections/ProfessionalDetailsSection"
import { AcademicDetailsSection } from "./form-sections/AcademicDetailsSection"
import { OtherDetailsSection } from "./form-sections/OtherDetailsSection"
import { AddressDetailsSection } from "./form-sections/AddressDetailsSection"
import { BankDetailsSection } from "./form-sections/BankDetailsSection"
import { EmploymentDetailsSection } from "./form-sections/EmploymentDetailsSection"
import { useStaffFormReset } from "@/hooks/useStaffFormReset"

interface StaffFormProps {
  initial_data?: StaffType | null
  onSubmit: (data: StaffFormData) => void
  onClose: () => void
  formType: "create" | "update" | "view"
  isApiInProgress: boolean
  onSuccess?: () => void
}

const formatData = (value: any): string => {
  return value ? new Date(value).toISOString().split("T")[0] : ""
}

const StaffForm: React.FC<StaffFormProps> = ({
  onSubmit,
  initial_data,
  isApiInProgress,
  onClose,
  formType,
  onSuccess,
}) => {
  const [getStaffRoles, { data: schoolStaff }] = useLazyGetSchoolStaffRoleQuery()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(formType === "update" ? "personal" : "role")
  const [teachingRoles, setTeachingRoles] = useState<StaffRole[] | null>(null)
  const [nonTeachingRoles, setNonTeachingRoles] = useState<StaffRole[] | null>(null)

  const authState = useAppSelector(selectAuthState)
  const StaffRolesForSchool = useAppSelector(selectSchoolStaffRoles)

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      is_teaching_role: true,
      staff_role_id: undefined,
      first_name: "",
      middle_name: null,
      last_name: "",
      first_name_in_guj: null,
      middle_name_in_guj: null,
      last_name_in_guj: null,
      gender: undefined,
      birth_date: null,
      aadhar_no: null,
      mobile_number: undefined,
      email: null,
      qualification: null,
      subject_specialization: null,
      religion: null,
      religion_in_guj: null,
      caste: null,
      caste_in_guj: null,
      category: null,
      address: null,
      permanent_address: null,
      district: null,
      city: null,
      state: null,
      postal_code: null,
      bank_name: null,
      account_no: null,
      IFSC_code: null,
      joining_date: null,
      employment_status: undefined,
      marital_status: null,
      pan_card_no: null,
      ayush_id_no: null,
      teacher_code: null,
      state_council_reg_no: null,
      ayush_registration_no: null,
      date_of_registration: null,
      university_appointment_letter_no: null,
      university_appointment_date: null,
      university_approval_letter_no: null,
      university_approval_date: null,
      ug_degree: null,
      ug_passing_university: null,
      ug_passing_year: null,
      pg_degree: null,
      pg_passing_university: null,
      pg_passing_year: null,
      diploma_degree: null,
      diploma_council: null,
      diploma_passing_year: null,
      other_degree: null,
      other_passing_university: null,
      other_passing_year: null,
      area_of_expertise: null,
      bank_branch_name: null,
      pay_scale: null,
      retirement_age: null,
      staff_type: null,
      staff_category: null,
      designation: null,
      department_id: undefined,
      nch_registration_no: null,
      nch_registration_date: null,
      leave_policy_ids: [],
      letters: [],
    },
  })

  const tabMapping: { [key: string]: string } = {
    letters: "professional",
    is_teaching_role: "role",
    staff_role_id: "role",
    staff_type: "role",
    employment_status: "role",
    staff_category: "role",
    designation: "role",
    first_name: "personal",
    middle_name: "personal",
    last_name: "personal",
    first_name_in_guj: "personal",
    middle_name_in_guj: "personal",
    last_name_in_guj: "personal",
    gender: "personal",
    birth_date: "personal",
    aadhar_no: "personal",
    mobile_number: "personal",
    email: "personal",
    qualification: "academic",
    subject_specialization: "academic",
    religion: "other",
    religion_in_guj: "other",
    caste: "other",
    caste_in_guj: "other",
    category: "other",
    address: "address",
    permanent_address: "address",
    district: "address",
    city: "address",
    state: "address",
    postal_code: "address",
    bank_name: "bank",
    account_no: "bank",
    IFSC_code: "bank",
    joining_date: "employment",
    marital_status: "personal",
    pan_card_no: "personal",
    ayush_id_no: "professional",
    teacher_code: "professional",
    state_council_reg_no: "professional",
    ayush_registration_no: "professional",
    nch_registration_no: "professional",
    nch_registration_date: "professional",
    date_of_registration: "professional",
    university_appointment_letter_no: "professional",
    university_appointment_date: "professional",
    university_approval_letter_no: "professional",
    university_approval_date: "professional",
    area_of_expertise: "professional",
    ug_degree: "academic",
    ug_passing_university: "academic",
    ug_passing_year: "academic",
    pg_degree: "academic",
    pg_passing_university: "academic",
    pg_passing_year: "academic",
    diploma_degree: "academic",
    diploma_council: "academic",
    diploma_passing_year: "academic",
    other_degree: "academic",
    other_passing_university: "academic",
    other_passing_year: "academic",
    bank_branch_name: "bank",
    pay_scale: "employment",
    retirement_age: "employment",
    department_id: "employment",
  }

  useStaffFormReset(form, formType, initial_data)

  const handleSubmit: SubmitHandler<StaffFormData> = (data) => {
    // Ensure letters and university approval fields are in sync
    const approvalLetter = data.letters?.find((l) =>
      l.letter_type?.toLowerCase().includes("approval")
    )
    if (approvalLetter) {
      if (!data.university_approval_letter_no && approvalLetter.letter_no) {
        data.university_approval_letter_no = approvalLetter.letter_no
      }
      if (!data.university_approval_date && approvalLetter.letter_date) {
        data.university_approval_date = approvalLetter.letter_date
      }
    } else if (data.university_approval_letter_no || data.university_approval_date) {
      data.letters = [
        ...(data.letters || []),
        {
          letter_type: "University Approval Letter",
          letter_no: data.university_approval_letter_no || "",
          letter_date: data.university_approval_date || "",
          remarks: "",
        },
      ]
    }
    onSubmit(data)
  }

  const handleNextTab = useCallback(() => {
    const tabs = ["role", "personal", "professional", "academic", "other", "address", "bank", "employment"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }, [activeTab])

  const handlePreviousTab = useCallback(() => {
    const tabs = ["role", "personal", "professional", "academic", "other", "address", "bank", "employment"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }, [activeTab])

  const handleInvalid = (errors: any) => {
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      const firstErrorField = errorKeys[0]
      const tabToActivate = tabMapping[firstErrorField]
      if (tabToActivate) {
        setActiveTab(tabToActivate)
      }
    }
  }

  useEffect(() => {
    if (!teachingRoles || !nonTeachingRoles) {
      getStaffRoles(authState.user!.school_id)
    }
  }, [])

  useEffect(() => {
    if (schoolStaff) {
      setTeachingRoles(schoolStaff.filter((role: StaffRole) => role?.is_teaching_role))
      setNonTeachingRoles(schoolStaff?.filter((role: StaffRole) => !role?.is_teaching_role))
    }
  }, [schoolStaff])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 sticky top-0 z-10 bg-background pt-1 pb-2 shadow-xs">
            <TabsTrigger value="role">{t("role")}</TabsTrigger>
            <TabsTrigger value="personal">{t("personal")}</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="other">{t("other")}</TabsTrigger>
            <TabsTrigger value="address">{t("address")}</TabsTrigger>
            <TabsTrigger value="bank">{t("bank")}</TabsTrigger>
            <TabsTrigger value="employment">{t("employee")}</TabsTrigger>
          </TabsList>

          <TabsContent value="role">
            <RoleSelectionSection
              form={form}
              teachingRoles={teachingRoles}
              nonTeachingRoles={nonTeachingRoles}
              onNext={handleNextTab}
              isEdit={formType === "update"}
            />
          </TabsContent>

          <TabsContent value="personal">
            <PersonalDetailsSection form={form} onNext={handleNextTab} onPrevious={handlePreviousTab} />
          </TabsContent>

          <TabsContent value="professional">
            <ProfessionalDetailsSection form={form} onNext={handleNextTab} onPrevious={handlePreviousTab} />
          </TabsContent>

          <TabsContent value="academic">
            <AcademicDetailsSection
              form={form}
              onNext={handleNextTab}
              onPrevious={handlePreviousTab}
              isTeachingRole={form.watch("is_teaching_role")}
            />
          </TabsContent>

          <TabsContent value="other">
            <OtherDetailsSection form={form} onNext={handleNextTab} onPrevious={handlePreviousTab} />
          </TabsContent>

          <TabsContent value="address">
            <AddressDetailsSection form={form} onNext={handleNextTab} onPrevious={handlePreviousTab} />
          </TabsContent>

          <TabsContent value="bank">
            <BankDetailsSection form={form} onNext={handleNextTab} onPrevious={handlePreviousTab} />
          </TabsContent>

          <TabsContent value="employment">
            <EmploymentDetailsSection
              form={form}
              onPrevious={handlePreviousTab}
              isApiInProgress={isApiInProgress}
              formType={formType}
            />
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  )
}

export default StaffForm
