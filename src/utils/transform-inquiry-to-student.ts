import { StudentMeta } from "./../types/student";
import type { Inquiry } from "@/services/InquiryServices";
import { Student } from "@/types/student";
import type { StudentFormData } from "@/utils/student.validation";

/**
 * Transforms inquiry data into student form data for onboarding
 * @param inquiry The inquiry data to transform
 * @param schoolId The school ID to associate with the student
 * @returns StudentFormData object populated with inquiry data
 */
export function transformInquiryToStudent(
  inquiry: Inquiry,
  schoolId: number
): Partial<Student> {
  // Convert inquiry_for_class to a number if it's a string
  const classApplying =
    typeof inquiry.inquiry_for_class === "string"
      ? Number.parseInt(inquiry.inquiry_for_class, 10)
      : inquiry.inquiry_for_class;

  // Convert primary_mobile to a number if it's a string
  const primaryMobile =
    typeof inquiry.primary_mobile === "string"
      ? Number.parseInt(inquiry.primary_mobile, 10)
      : inquiry.primary_mobile;

  return {
    first_name: inquiry.first_name,
    middle_name: inquiry.middle_name || null,
    last_name: inquiry.last_name,
    first_name_in_guj: null,
    middle_name_in_guj: null,
    last_name_in_guj: null,
    birth_date: inquiry.birth_date,
    gender: inquiry.gender
      ? inquiry.gender === "male"
        ? "Male"
        : "Female"
      : undefined,
    roll_number: null,
    father_name: inquiry.father_name,
    father_name_in_guj: null,
    mother_name_in_guj: null,
    primary_mobile: primaryMobile,
    class_id: classApplying,
    student_meta: {
      aadhar_dise_no: null,
      birth_place: null,
      birth_place_in_guj: null,
      religion: null,
      religion_in_guj: null,
      caste: null,
      caste_in_guj: null,
      category: null,
      admission_date: new Date().toISOString().split("T")[0],
      admission_class_id: classApplying,
      secondary_mobile: null,
      privious_school: inquiry.previous_school || null,
      privious_school_in_guj: null,
      address: inquiry.address || null,
      district: null,
      city: null,
      state: null,
      postal_code: null,
      bank_name: null,
      account_no: null,
      IFSC_code: null,
    },
  };
}
