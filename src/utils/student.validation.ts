import { Value } from "@radix-ui/react-select";
import { STUDENT_HEADERS } from "@/utils/studentColumns";

// Define the schema for student data
import { z } from "zod";

// Define the schema for student data
export const studentSchema = z.object({
  enrollment_code: z.string().nullable().optional().or(z.literal("")),
  profile_photo: z.string().nullable().optional(),
  // Personal Details
  first_name: z
    .string()
    .min(3, "First name is required")
    .regex(
      /^[A-Za-z\s]+$/,
      "First name should contain only alphabets and spaces"
    ),

  middle_name: z
    .string()
    .regex(
      /^[A-Za-z\s]+$/,
      "Middle name should contain only alphabets and spaces"
    )
    .nullable()
    .optional()
    .or(z.literal("")),

  last_name: z
    .string()
    .min(3, "Last name is required")
    .regex(
      /^[A-Za-z\s]+$/,
      "Last name should contain only alphabets and spaces"
    ),

  first_name_in_guj: z.string().nullable().optional().or(z.literal("")),
  middle_name_in_guj: z.string().nullable().optional().or(z.literal("")),
  last_name_in_guj: z.string().nullable().optional().or(z.literal("")),

  gender: z.enum(["Male", "Female"], {
    errorMap: () => ({ message: "Gender must be either Male or Female" }),
  }),

  birth_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .refine(
      (date) => {
        const parsedDate = new Date(date);
        const today = new Date();
        return parsedDate <= today;
      },
      {
        message: "Birth date cannot be in the future",
      }
    )
    .refine(
      (date) => {
        const parsedDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - parsedDate.getFullYear();
        const monthDiff = today.getMonth() - parsedDate.getMonth();
        const dayDiff = today.getDate() - parsedDate.getDate();
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          return age - 1 >= 3; // Minimum age is 3 years
        }
        return age >= 3;
      },
      {
        message: "Student must be at least 3 years old",
      }
    ),

  birth_place: z.string().nullable().optional().or(z.literal("")),
  birth_place_in_guj: z.string().nullable().optional().or(z.literal("")),

  aadhar_no: z
    .number()
    .int("Aadhar number must be an integer")
    .positive("Aadhar number must be positive")
    .refine(
      (val) => {
        const strVal = val.toString();
        return strVal.length === 12;
      },
      {
        message: "Aadhar number must be exactly 12 digits",
      }
    )
    .nullable(),

  aadhar_dise_no: z
    .number()
    .int("Aadhar DISE number must be an integer")
    .positive("Aadhar DISE number must be positive")
    .nullable(),

  // Family Details
  father_name: z.string().nullable().optional().or(z.literal("")),
  father_name_in_guj: z.string().nullable().optional().or(z.literal("")),
  mother_name: z.string().nullable().optional().or(z.literal("")),
  mother_name_in_guj: z.string().nullable().optional().or(z.literal("")),

  primary_mobile: z
    .number()
    .int("Mobile number must be an integer")
    .positive("Mobile number must be positive")
    .refine(
      (val) => {
        const strVal = val.toString();
        return strVal.length === 10 && /^[6-9]/.test(strVal);
      },
      {
        message: "Mobile number must be 10 digits and start with 6-9",
      }
    ),

  secondary_mobile: z
    .number()
    .int("Secondary mobile number must be an integer")
    .positive("Secondary mobile number must be positive")
    .refine(
      (val) => {
        const strVal = val.toString();
        return strVal.length === 10 && /^[6-9]/.test(strVal);
      },
      {
        message: "Secondary mobile number must be 10 digits and start with 6-9",
      }
    )
    .nullable(),

  // Academic Details
  gr_no: z
    .number()
    .int("GR number must be an integer")
    .positive("GR number must be positive")
    .nullable()
    .optional(),

  roll_number: z
    .number()
    .int("Roll number must be an integer")
    .positive("Roll number must be positive")
    .nullable(),

  admission_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .refine(
      (date) => {
        const parsedDate = new Date(date);
        const today = new Date();
        return parsedDate <= today;
      },
      {
        message: "Admission date cannot be in the future",
      }
    )
    .nullable(),

  class: z.string().min(1, "Class is required"),
  division: z.string().nullable().optional().or(z.literal("")),
  admission_class: z.string().min(1, "Admission Class is required").nullable(),
  admission_division: z.string().nullable().optional().or(z.literal("")),
  // .min(1, "Admission Division is required")
  quota_id: z.coerce.number().nullable().optional(),
  fees_plan_id: z.coerce.number().nullable().optional(),

  privious_school: z.string().nullable().optional().or(z.literal("")),
  privious_school_in_guj: z.string().nullable().optional().or(z.literal("")),
  religion: z.string().nullable().optional().or(z.literal("")),
  religion_in_guj: z.string().nullable().optional().or(z.literal("")),
  caste: z.string().nullable().optional().or(z.literal("")),
  caste_in_guj: z.string().nullable().optional().or(z.literal("")),

  category: z.string().nullable().optional().or(z.literal("")),

  // Address Details
  address: z.string().nullable().optional().or(z.literal("")),
  district: z.string().nullable().optional().or(z.literal("")),
  city: z.string().nullable().optional().or(z.literal("")),
  state: z.string().nullable().optional().or(z.literal("")),

    postal_code: z.coerce
    .string()
    .regex(/^\d{6}$/, "Postal code must be exactly 6 digits")
    .nullable()
    .optional(),  

  // Bank Details
  bank_name: z.string().nullable().optional().or(z.literal("")),
  account_no: z.coerce.number().nullable().optional(),
  IFSC_code: z.string().nullable().optional().or(z.literal("")),

  // Extra college fields
  current_area: z.string().nullable().optional(),
  current_country: z.string().nullable().optional(),
  permanent_address: z.string().nullable().optional(),
  permanent_area: z.string().nullable().optional(),
  permanent_city: z.string().nullable().optional(),
  permanent_state: z.string().nullable().optional(),
  permanent_pincode: z.string().nullable().optional(),
  permanent_country: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  student_code: z.string().nullable().optional(),
  admission_standard: z.string().nullable().optional(),
  subject_group: z.string().nullable().optional(),
  birth_taluka: z.string().nullable().optional(),
  birth_district: z.string().nullable().optional(),
  student_leaving_reason: z.string().nullable().optional(),
  student_lc_date: z.string().nullable().optional(),
  student_lc_no: z.string().nullable().optional(),
  pen: z.string().nullable().optional(),
  abha_card_no: z.string().nullable().optional(),
  school_udise_no: z.string().nullable().optional(),
  email_id: z.string().nullable().optional().or(z.literal("")),
  website: z.string().nullable().optional(),
  mother_tongue: z.string().nullable().optional(),
  father_qualification: z.string().nullable().optional(),
  father_occupation: z.string().nullable().optional(),
  father_email: z.string().nullable().optional().or(z.literal("")),
  father_organisation: z.string().nullable().optional(),
  father_office_address: z.string().nullable().optional(),
  father_office_phone: z.string().nullable().optional(),
  father_mobile: z.string().nullable().optional(),
  mother_qualification: z.string().nullable().optional(),
  mother_occupation: z.string().nullable().optional(),
  mother_email: z.string().nullable().optional().or(z.literal("")),
  mother_organisation: z.string().nullable().optional(),
  mother_office_address: z.string().nullable().optional(),
  mother_office_phone: z.string().nullable().optional(),
  mother_mobile: z.string().nullable().optional(),
  guardian_name: z.string().nullable().optional(),
  guardian_qualification: z.string().nullable().optional(),
  guardian_occupation: z.string().nullable().optional(),
  guardian_email: z.string().nullable().optional().or(z.literal("")),
  guardian_organisation: z.string().nullable().optional(),
  guardian_office_address: z.string().nullable().optional(),
  guardian_office_phone: z.string().nullable().optional(),
  guardian_mobile: z.string().nullable().optional(),
  guardian_relation: z.string().nullable().optional(),
  ssc_passing_year: z.string().nullable().optional(),
  hsc_passing_year: z.string().nullable().optional(),
  hsc_attempts: z.coerce.number().nullable().optional(),
  hsc_obtained_marks: z.coerce.number().nullable().optional(),
  hsc_pcb_marks_with_practical: z.coerce.number().nullable().optional(),
  entrance_exam_name: z.string().nullable().optional(),
  neet_score: z.coerce.number().nullable().optional(),
  neet_roll_no: z.string().nullable().optional(),
  neet_application_number: z.string().nullable().optional(),
  neet_all_india_rank: z.coerce.number().nullable().optional(),
  neet_percentile: z.string().nullable().optional(),
  general_merit: z.coerce.number().nullable().optional(),
  category_merit: z.coerce.number().nullable().optional(),
  internship_provisional_number: z.string().nullable().optional(),
  internship_provisional_date: z.string().nullable().optional(),
  internship_starting_date: z.string().nullable().optional(),
  internship_completion_date: z.string().nullable().optional(),
  first_year_attempt: z.coerce.number().nullable().optional(),
  second_year_attempt: z.coerce.number().nullable().optional(),
  third_year_attempt: z.coerce.number().nullable().optional(),
  fourth_year_attempt: z.coerce.number().nullable().optional(),
  final_bhms_passing_date: z.string().nullable().optional(),
  ayush_id: z.string().nullable().optional(),
  abc_id: z.string().nullable().optional(),
  admission_cancel: z.boolean().nullable().optional(),
  admission_cancel_year: z.string().nullable().optional(),
  admission_cancel_date: z.string().nullable().optional(),
  admission_transfer: z.boolean().nullable().optional(),
  admission_transfer_date: z.string().nullable().optional(),
  admission_transfer_to_college: z.string().nullable().optional(),
  admission_transfer_from_college: z.string().nullable().optional(),
  admission_year: z.string().nullable().optional(),
  sub_caste: z.string().nullable().optional(),
  quota_fees: z.string().nullable().optional(),
  activity_house: z.string().nullable().optional(),
  bank_branch_name: z.string().nullable().optional(),
  // heads of the final student sheet
  admission_number: z.string().nullable().optional(),
  name_as_per_aadhar: z.string().nullable().optional(),
  admission_quota: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  blood_group: z.string().nullable().optional(),
  university_spid_no: z.string().nullable().optional(),
  admission_category: z.string().nullable().optional(),
  tuition_fees: z.string().nullable().optional(),
  roll_no_internship: z.string().nullable().optional(),
  bank_branch_pincode: z.string().nullable().optional(),
  first_year_roll_number: z.number().int().positive().nullable().optional(),
  second_year_roll_number: z.number().int().positive().nullable().optional(),
  third_year_roll_number: z.number().int().positive().nullable().optional(),
  fourth_year_roll_number: z.number().int().positive().nullable().optional(),
  practical_batch: z.string().nullable().optional(),
});

// Upload validation for the final student sheet: every head is optional text; only formats are checked.
const genderCell = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return null;
    if (typeof val === "string") {
      const str = val.trim().toLowerCase();
      if (["male", "m"].includes(str)) return "Male";
      if (["female", "f"].includes(str)) return "Female";
      if (["other", "o"].includes(str)) return "Other";
    }
    return val;
  },
  z
    .enum(["Male", "Female", "Other"], {
      errorMap: () => ({ message: "Gender must be Male, Female, or Other" }),
    })
    .nullable()
    .optional()
    .or(z.literal(""))
);

export const StudentSchemaForUploadData = z.object(
  Object.fromEntries(
    STUDENT_HEADERS.map((head) => [
      head,
      head === "GENDER" ? genderCell : z.coerce.string().nullable().optional().or(z.literal("")),
    ])
  ) as Record<string, z.ZodTypeAny>
);

export const CollegeStudentSchemaForUploadData = StudentSchemaForUploadData;

export const addressSchema = z.object({
  address: z.string().min(5, "Address is required"),
  district: z.string().min(2, "District is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postal_code: z
    .number()
    .int()
    .positive()
    .refine((val) => val.toString().length === 6, {
      message: "Postal code must be exactly 6 digits",
    }),
});

export type StudentFormData = z.infer<typeof studentSchema>;
export type StudentUploadData = z.infer<typeof StudentSchemaForUploadData>;

export const personalDetailsSchema = z.any();
export const bankDetailsSchema = z.any();
export const admissionDetailsSchema = z.any();
