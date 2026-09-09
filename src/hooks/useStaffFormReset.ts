import { useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import type { StaffType } from "@/types/staff"

const formatData = (value: any): string => {
  if (!value) return ""
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return ""
    return date.toISOString().split("T")[0]
  } catch (e) {
    return ""
  }
}

const normalizeGender = (val: any): "Male" | "Female" | undefined => {
  if (!val) return undefined
  const str = String(val).trim().toLowerCase()
  if (["male", "m"].includes(str)) return "Male"
  if (["female", "f"].includes(str)) return "Female"
  if (val === "Male" || val === "Female") return val
  return undefined
}

const normalizeMaritalStatus = (val: any): "Single" | "Married" | "Divorced" | "Widowed" | null => {
  if (!val) return null
  const str = String(val).trim().toLowerCase()
  if (["single", "unmarried"].includes(str)) return "Single"
  if (["married"].includes(str)) return "Married"
  if (["divorced"].includes(str)) return "Divorced"
  if (["widowed"].includes(str)) return "Widowed"
  const capitalized = str.charAt(0).toUpperCase() + str.slice(1)
  if (["Single", "Married", "Divorced", "Widowed"].includes(capitalized)) {
    return capitalized as any
  }
  return null
}

const normalizeCategory = (val: any): "ST" | "SC" | "OBC" | "OPEN" | null => {
  if (!val) return null
  const str = String(val).trim().toUpperCase()
  if (["OPEN", "GENERAL", "GEN"].includes(str) || str.includes("EWS")) return "OPEN"
  if (["ST", "S.T.", "SCHEDULED TRIBE"].includes(str)) return "ST"
  if (["SC", "S.C.", "SCHEDULED CASTE"].includes(str)) return "SC"
  if (["OBC", "O.B.C.", "SEBC", "S.E.B.C."].includes(str)) return "OBC"
  return null
}

const normalizeEmploymentStatus = (val: any): "Permanent" | "Trial_Period" | "Resigned" | "Contract_Based" | "Notice_Period" | undefined => {
  if (!val) return undefined
  const str = String(val).trim().toLowerCase()
  if (str.includes("permanent")) return "Permanent"
  if (str.includes("trial")) return "Trial_Period"
  if (str.includes("resign")) return "Resigned"
  if (str.includes("contract")) return "Contract_Based"
  if (str.includes("notice")) return "Notice_Period"
  if (["Permanent", "Trial_Period", "Resigned", "Contract_Based", "Notice_Period"].includes(val)) return val
  return undefined
}

export const useStaffFormReset = (
  form: UseFormReturn<StaffFormData>,
  formType: "create" | "update" | "view",
  initialData?: StaffType | null
) => {
  useEffect(() => {
    if (formType !== "create" && initialData) {
      form.reset({
        is_teaching_role: Boolean(initialData.is_teching_staff || initialData.is_teaching_role),
        staff_role_id: initialData.staff_role_id,
        first_name: initialData.first_name || "",
        middle_name: initialData.middle_name || null,
        last_name: initialData.last_name || "",
        first_name_in_guj: initialData.first_name_in_guj || null,
        last_name_in_guj: initialData.last_name_in_guj || null,
        middle_name_in_guj: initialData.middle_name_in_guj || null,
        gender: normalizeGender(initialData.gender),
        birth_date: initialData.birth_date ? formatData(initialData.birth_date) : null,
        aadhar_no: initialData.aadhar_no || null,
        mobile_number: initialData.mobile_number ? Number(initialData.mobile_number) || undefined : undefined,
        email: initialData.email || null,
        religion: initialData.religion || null,
        religion_in_guj: initialData.religion_in_guj || null,
        caste: initialData.caste || null,
        caste_in_guj: initialData.caste_in_guj || null,
        category: normalizeCategory(initialData.category),
        address: initialData.address || null,
        district: initialData.district || null,
        city: initialData.city || null,
        postal_code: initialData.postal_code ? initialData.postal_code.toString() : null,
        bank_name: initialData.bank_name || null,
        account_no: initialData.account_no || null,
        IFSC_code: initialData.IFSC_code || null,
        joining_date: initialData.joining_date ? formatData(initialData.joining_date) : null,
        employment_status: normalizeEmploymentStatus(initialData.employment_status),
        state: initialData.state || null,
        qualification: initialData.qualification || null,
        subject_specialization: initialData.subject_specialization || null,
        marital_status: normalizeMaritalStatus(initialData.marital_status),
        pan_card_no: initialData.pan_card_no ? initialData.pan_card_no.toString() : null,
        ayush_id_no: initialData.ayush_id_no || null,
        teacher_code: initialData.teacher_code || null,
        state_council_reg_no: initialData.state_council_reg_no || null,
        ayush_registration_no: initialData.ayush_registration_no || null,
        date_of_registration: initialData.date_of_registration ? formatData(initialData.date_of_registration) : null,
        university_appointment_letter_no: initialData.university_appointment_letter_no || null,
        university_appointment_date: initialData.university_appointment_date ? formatData(initialData.university_appointment_date) : null,
        university_approval_letter_no: initialData.university_approval_letter_no || null,
        university_approval_date: initialData.university_approval_date ? formatData(initialData.university_approval_date) : null,
        ug_degree: initialData.ug_degree || null,
        ug_passing_university: initialData.ug_passing_university || null,
        ug_passing_year: initialData.ug_passing_year || null,
        pg_degree: initialData.pg_degree || null,
        pg_passing_university: initialData.pg_passing_university || null,
        pg_passing_year: initialData.pg_passing_year || null,
        other_degree: initialData.other_degree || null,
        other_passing_university: initialData.other_passing_university || null,
        other_passing_year: initialData.other_passing_year || null,
        area_of_expertise: initialData.area_of_expertise || null,
        bank_branch_name: initialData.bank_branch_name || null,
        pay_scale: initialData.pay_scale || null,
        retirement_age: initialData.retirement_age ?? null,
        staff_type: initialData.staff_type || null,
        staff_category: initialData.staff_category || null,
        designation: initialData.designation || null,
      })
    }
  }, [formType, initialData, form])
}
