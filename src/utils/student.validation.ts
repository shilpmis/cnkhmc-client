import { Value } from "@radix-ui/react-select";

// Define the schema for student data
import { z } from "zod";

// Define the schema for student data
export const studentSchema = z.object({
  enrollment_code: z.string().nullable().optional().or(z.literal("")),
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
    .positive("GR number must be positive"),

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
  practical_batch: z.string().nullable().optional(),
});

// Define Zod schema for student data validation
export const StudentSchemaForUploadData = z.object({
  "First Name": z.string().min(1, "First Name is required"),
  "Last Name": z.string().min(1, "Last Name is required"),
  "Mobile No": z
    .string()
    .regex(/^\d{10}$/, "Mobile No must be exactly 10 digits"),
  Gender: z.preprocess(
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
    z.enum(["Male", "Female", "Other"], {
      errorMap: () => ({ message: "Gender must be Male, Female, or Other" }),
    }).nullable().optional().or(z.literal(""))
  ),
  "GR No": z.string().nullable().or(z.literal("")),

  // Optional fields with validation if provided
  "Middle Name": z
    .string()
    .min(1, "Middle Name must have at least 1 character")
    .nullable()
    .or(z.literal("")),
  "First Name Gujarati": z
    .string()
    .min(2, "First name in Gujarati is required")
    .nullable(),
  "Middle Name Gujarati": z
    .string()
    .min(2, "Middle name in Gujarati is required")
    .nullable(),
  "Last Name Gujarati": z
    .string()
    .min(2, "Last name in Gujarati is required")
    .nullable(),
  "Date of Birth": z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .refine((date) => new Date(date) <= new Date(), {
      message: "Birth date cannot be in the future",
    })
    .nullable(),
  "Birth Place": z.string().min(2, "Birth place is required").nullable(),
  "Birth Place In Gujarati": z
    .string()
    .min(2, "Birth place in Gujarati is required")
    .nullable(),
  "Aadhar No": z
    .string()
    .regex(/^\d{12}$/, "Aadhar Number must be exactly 12 digits")
    .nullable(),
  "DISE Number": z
    .string()
    .regex(/^\d{18}$/, "DISE Number must be exactly 18 digits")
    .nullable(),
  "Father Name": z
    .string()
    .min(2, "Father's name is required")
    .regex(
      /^[A-Za-z\s]+$/,
      "Father's name should contain only alphabets and spaces"
    )
    .nullable(),
  "Father Name in Gujarati": z
    .string()
    .min(2, "Father's name in Gujarati is required")
    .nullable(),
  "Mother Name": z
    .string()
    .min(2, "Mother's name is required")
    .regex(
      /^[A-Za-z\s]+$/,
      "Mother's name should contain only alphabets and spaces"
    )
    .nullable(),
  "Mother Name in Gujarati": z
    .string()
    .min(2, "Mother's name in Gujarati is required")
    .nullable(),
  "Other Mobile No": z
    .string()
    .regex(/^\d{10}$/, "Other Mobile No must be exactly 10 digits")
    .nullable(),
  "Roll Number": z
    .number()
    .int("Roll number must be an integer")
    .positive("Roll number must be positive")
    .nullable(),
  "Admission Date": z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .refine((date) => new Date(date) <= new Date(), {
      message: "Admission date cannot be in the future",
    })
    .nullable(),
  "Previous School": z.string().nullable().optional().or(z.literal("")),
  "Previous School In Gujarati": z.string().nullable().optional().or(z.literal("")),

  Religion: z.string().nullable().optional().or(z.literal("")),
  "Religion In Gujarati": z.string().nullable().optional().or(z.literal("")),
  Caste: z.string().nullable().optional().or(z.literal("")),
  "Caste In Gujarati": z.string().nullable().optional().or(z.literal("")),
  Category: z.string().nullable().optional().or(z.literal("")),
  Address: z.string().nullable().optional().or(z.literal("")),
  District: z.string().nullable().optional().or(z.literal("")),
  City: z.string().nullable().optional().or(z.literal("")),
  State: z.string().nullable().optional().or(z.literal("")),
  "Postal Code": z
    .string()
    .regex(/^\d{6}$/, "Postal Code must be exactly 6 digits")
    .nullable()
    .optional()
    .or(z.literal("")),
  "Bank Name": z.string().nullable().optional().or(z.literal("")),
  "Account Number": z
    .string()
    .refine((val) => val.length >= 9 && val.length <= 18, {
      message: "Account number must be between 9 and 18 digits",
    })
    .nullable(),
  "IFSC Code": z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "IFSC code must be in format ABCD0123456")
    .nullable(),
});

export const CollegeStudentSchemaForUploadData = z.object({
  "AdmissionID": z.string().nullable().or(z.literal("")),
  "GR No.": z.string().nullable().or(z.literal("")),
  "FIRST_NAME": z.string().min(1, "First Name is required"),
  "MIDDLE_NAME": z.string().nullable().or(z.literal("")),
  "LAST_NAME": z.string().min(1, "Last Name is required"),
  "GENDER": z.preprocess(
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
    z.enum(["Male", "Female", "Other"], {
      errorMap: () => ({ message: "Gender must be Male, Female, or Other" }),
    }).nullable().optional().or(z.literal(""))
  ),
  "DATE_OF_BIRTH": z.string().nullable().or(z.literal("")),
  "STANDARD": z.string().nullable().or(z.literal("")),
  "DIVISION": z.string().nullable().or(z.literal("")),
  "MOBILE_NO1": z.string().min(1, "Mobile No is required"),
  "CURRENT ADDRESS": z.string().nullable().or(z.literal("")),
  "Current Area": z.string().nullable().or(z.literal("")),
  "Current CITY": z.string().nullable().or(z.literal("")),
  "Current STATE": z.string().nullable().or(z.literal("")),
  "Currrent PIN_CODE": z.string().nullable().or(z.literal("")),
  "Current COUNTRY": z.string().nullable().or(z.literal("")),
  "PERMANENT ADDRESS": z.string().nullable().or(z.literal("")),
  "Permanent Area": z.string().nullable().or(z.literal("")),
  "Permanent City": z.string().nullable().or(z.literal("")),
  "Permanent STATE": z.string().nullable().or(z.literal("")),
  "Permanent PIN_CODE": z.string().nullable().or(z.literal("")),
  "Permanent COUNTRY": z.string().nullable().or(z.literal("")),
  "COUNTRY_CODE": z.string().nullable().or(z.literal("")),
  "NATIONALITY": z.string().nullable().or(z.literal("")),
  "STUDENT_CODE": z.string().nullable().or(z.literal("")),
  "S.LANGUAGE_FIRST_NAME": z.string().nullable().or(z.literal("")),
  "S.LANGUAGE_MIDDLE_NAME": z.string().nullable().or(z.literal("")),
  "S.LANGUAGE_LAST_NAME": z.string().nullable().or(z.literal("")),
  "ADMISSION_DATE": z.string().nullable().or(z.literal("")),
  "ADMISSION_STANDARD": z.string().nullable().or(z.literal("")),
  "ROLL_NO": z.coerce.number().nullable().or(z.literal("")),
  "SUBJECT_GROUP": z.string().nullable().or(z.literal("")),
  "MOBILE_NO2": z.string().nullable().or(z.literal("")),
  "RELIGION": z.string().nullable().or(z.literal("")),
  "CASTE": z.string().nullable().or(z.literal("")),
  "CATEGORY": z.string().nullable().or(z.literal("")),
  "BLOOD_GROUP": z.string().nullable().or(z.literal("")),
  "BIRTH PLACE": z.string().nullable().or(z.literal("")),
  "Birth Taluka": z.string().nullable().or(z.literal("")),
  "Birth District": z.string().nullable().or(z.literal("")),
  "ACTIVE": z.string().nullable().or(z.literal("")),
  "STUDENT_LEAVING_REASON": z.string().nullable().or(z.literal("")),
  "STUDENT_LC_DATE": z.string().nullable().or(z.literal("")),
  "STUDENT_LC_NO": z.string().nullable().or(z.literal("")),
  "PREVIOUS_SCHOOL_NAME": z.string().nullable().or(z.literal("")),
  "STUDENT_AADHAAR_CARDNO": z.string().nullable().or(z.literal("")),
  "STUDENT_U_DIESNO": z.string().nullable().or(z.literal("")),
  "PEN": z.string().nullable().or(z.literal("")),
  "AbhaCardNo": z.string().nullable().or(z.literal("")),
  "Bank_Name": z.string().nullable().or(z.literal("")),
  "Bank_Branch_Name": z.string().nullable().or(z.literal("")),
  "Bank_Account_Number": z.string().nullable().or(z.literal("")),
  "IFSC_Code": z.string().nullable().or(z.literal("")),
  "ACTIVITY_HOUSE": z.string().nullable().or(z.literal("")),
  "EMAIL_ID": z.string().nullable().or(z.literal("")),
  "WEBSITE": z.string().nullable().or(z.literal("")),
  "MOTHER_TOUNG": z.string().nullable().or(z.literal("")),
  "FATHER_NAME": z.string().nullable().or(z.literal("")),
  "S.LANGUAGE_Father Name": z.string().nullable().or(z.literal("")),
  "FATHER_QUALIFICATION": z.string().nullable().or(z.literal("")),
  "FATHER_OCCUPATION": z.string().nullable().or(z.literal("")),
  "FATHER_EMAIL": z.string().nullable().or(z.literal("")),
  "FATHER_ORGANISATION": z.string().nullable().or(z.literal("")),
  "FATHER_OFFICE_ADDRESS1": z.string().nullable().or(z.literal("")),
  "FATHER_OFFICE_PHONENO": z.string().nullable().or(z.literal("")),
  "FATHER_MOBILENO": z.string().nullable().or(z.literal("")),
  "MOTHER_NAME": z.string().nullable().or(z.literal("")),
  "S.LANGUAGE_Mother Name": z.string().nullable().or(z.literal("")),
  "MOTHER_QUALIFICATION": z.string().nullable().or(z.literal("")),
  "MOTHER_OCCUPATION": z.string().nullable().or(z.literal("")),
  "MOTHER_EMAIL": z.string().nullable().or(z.literal("")),
  "MOTHER_ORGANISATION": z.string().nullable().or(z.literal("")),
  "MOTHER_OFFICE_ADDRESS1": z.string().nullable().or(z.literal("")),
  "MOTHER_OFFICE_PHONENO": z.string().nullable().or(z.literal("")),
  "MOTHER_MOBILENO": z.string().nullable().or(z.literal("")),
  "GARDIAN_NAME": z.string().nullable().or(z.literal("")),
  "S.LANGUAGE_GARDIAN_Name": z.string().nullable().or(z.literal("")),
  "GARDIAN_QUALIFICATION": z.string().nullable().or(z.literal("")),
  "GARDIAN_OCCUPATION": z.string().nullable().or(z.literal("")),
  "GARDIAN_EMAIL": z.string().nullable().or(z.literal("")),
  "GARDIAN_ORGANISATION": z.string().nullable().or(z.literal("")),
  "GARDIAN_OFFICE_ADDRESS1": z.string().nullable().or(z.literal("")),
  "GARDIAN_OFFICE_PHONENO": z.string().nullable().or(z.literal("")),
  "GARDIAN_MOBILENO": z.string().nullable().or(z.literal("")),
  "Relation with Local Guardian": z.string().nullable().or(z.literal("")),
  "S.S.C. Passing Year": z.string().nullable().or(z.literal("")),
  "H.S.C. Passing Year": z.string().nullable().or(z.literal("")),
  "How Many Attempt?": z.string().nullable().or(z.literal("")),
  "H.S.C. Obtained Marks": z.string().nullable().or(z.literal("")),
  "H.S.C. PCB Marks with Practical": z.string().nullable().or(z.literal("")),
  "Sub Caste": z.string().nullable().or(z.literal("")),
  "Quota Fees": z.string().nullable().or(z.literal("")),
  "Name of Entrance Exam": z.string().nullable().or(z.literal("")),
  "NEET score": z.string().nullable().or(z.literal("")),
  "NEET Roll No.": z.string().nullable().or(z.literal("")),
  "NEET Application Number": z.string().nullable().or(z.literal("")),
  "NEET All India Rank": z.string().nullable().or(z.literal("")),
  "NEET Percentile (%)": z.string().nullable().or(z.literal("")),
  "General Merit": z.string().nullable().or(z.literal("")),
  "Category Merit": z.string().nullable().or(z.literal("")),
  "Internship Provisional Number": z.string().nullable().or(z.literal("")),
  "Internship Provisional Date": z.string().nullable().or(z.literal("")),
  "Internship Starting Date": z.string().nullable().or(z.literal("")),
  "Internship Completion Date": z.string().nullable().or(z.literal("")),
  "1st year Attempt": z.string().nullable().or(z.literal("")),
  "2nd Year Attempt": z.string().nullable().or(z.literal("")),
  "3rd Year Attempt": z.string().nullable().or(z.literal("")),
  "4th year Attempt": z.string().nullable().or(z.literal("")),
  "Final BHMS Date of Passing": z.string().nullable().or(z.literal("")),
  "Admission Year": z.string().nullable().or(z.literal("")),
  "Ayush ID": z.string().nullable().or(z.literal("")),
  "ABC ID": z.string().nullable().or(z.literal("")),
  "Admission Cancel": z.string().nullable().or(z.literal("")),
  "Admission Cancel Year": z.string().nullable().or(z.literal("")),
  "Admission Cancel Date": z.string().nullable().or(z.literal("")),
  "Admission Transfer": z.string().nullable().or(z.literal("")),
  "Admission Transfer Date": z.string().nullable().or(z.literal("")),
  "Admission transfer to College": z.string().nullable().or(z.literal("")),
  "Admission Transfer From College": z.string().nullable().or(z.literal("")),
  "School UDISE No": z.string().nullable().or(z.literal("")),
});

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
