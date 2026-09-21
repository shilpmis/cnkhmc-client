import * as z from "zod";

// Define the schema for staff data
// export const staffSchema = z
//   .object({
//     // Role selection
//     is_teaching_role: z.boolean(),
//     staff_role_id: z
//       .number({
//         required_error: "Staff role is required",
//         invalid_type_error: "Staff role must be a number",
//       })
//       .int("Staff role ID must be an integer")
//       .positive("Staff role is required"),

//     // Personal details
//     first_name: z
//       .string()
//       .min(2, "First name is required")
//       .regex(
//         /^[A-Za-z\s]+$/,
//         "First name should contain only alphabets and spaces"
//       ),

//     // Make middle name optional
//     middle_name: z
//       .string()
//       .regex(
//         /^[A-Za-z\s]*$/,
//         "Middle name should contain only alphabets and spaces"
//       )
//       .nullable(),

//     last_name: z
//       .string()
//       .min(2, "Last name is required")
//       .regex(/^[A-Za-z\s]+$/, "Last name is required"),

//     first_name_in_guj: z
//       .string()
//       .min(2, "First name in Gujarati is required")
//       .nullable(),

//     // Make middle name in Gujarati optional
//     middle_name_in_guj: z.string().nullable(),

//     last_name_in_guj: z
//       .string()
//       .min(2, "Last name in Gujarati is required")
//       .nullable(),

//     gender: z.enum(["Male", "Female"], {
//       errorMap: () => ({ message: "Gender must be either Male or Female" }),
//     }),

//     birth_date: z
//       .string()
//       .min(1, "Birth date is required")
//       .refine((date) => !isNaN(Date.parse(date)), {
//         message: "Invalid date format",
//       })
//       .refine(
//         (date) => {
//           const parsedDate = new Date(date);
//           const today = new Date();
//           return parsedDate <= today;
//         },
//         {
//           message: "Birth date cannot be in the future",
//         }
//       )
//       .refine(
//         (date) => {
//           const parsedDate = new Date(date);
//           const today = new Date();

//           // Calculate age
//           let age = today.getFullYear() - parsedDate.getFullYear();
//           const monthDiff = today.getMonth() - parsedDate.getMonth();

//           if (
//             monthDiff < 0 ||
//             (monthDiff === 0 && today.getDate() < parsedDate.getDate())
//           ) {
//             age--;
//           }

//           return age >= 18 && age <= 70;
//         },
//         {
//           message: "Staff must be between 18 and 70 years old",
//         }
//       )
//       .nullable(),

//     // Aadhar validation
//     aadhar_no: z
//       .number()
//       .int("Aadhar number must be an integer")
//       .positive("Aadhar number must be positive")
//       .refine(
//         (val) => {
//           const strVal = val.toString();
//           return strVal.length === 12;
//         },
//         {
//           message: "Aadhar number must be exactly 12 digits",
//         }
//       )
//       .nullable(),

//     // Contact details - fixed to ensure exactly 10 digits
//     mobile_number: z
//       .number()
//       .int("Mobile number must be an integer")
//       .positive("Mobile number must be positive")
//       .refine(
//         (val) => {
//           const strVal = val.toString();
//           return strVal.length === 10 && /^[6-9]/.test(strVal);
//         },
//         {
//           message: "Mobile number must be 10 digits and start with 6-9",
//         }
//       ),

//     email: z
//       .string()
//       .min(1, "Email is required")
//       .email("Invalid email address")
//       .nullable(),

//     // Teacher-specific fields - conditionally required based on is_teaching_role
//     qualification: z.string().nullable(),
//     subject_specialization: z.string().nullable(),
//     // class_id: z.number().nullable(),

//     // Other details
//     religion: z
//       .string()
//       .min(2, "Religion is required")
//       .regex(
//         /^[A-Za-z\s]+$/,
//         "Religion should contain only alphabets and spaces"
//       )
//       .nullable(),

//     religion_in_guj: z
//       .string()
//       .min(2, "Religion in Gujarati is required")
//       .nullable(),

//     caste: z
//       .string()
//       .min(2, "Caste is required")
//       .regex(/^[A-Za-z\s]+$/, "Caste should contain only alphabets and spaces")
//       .nullable(),

//     caste_in_guj: z.string().min(2, "Caste in Gujarati is required").nullable(),

//     category: z
//       .enum(["ST", "SC", "OBC", "OPEN"], {
//         errorMap: () => ({ message: "Category must be ST, SC, OBC, or OPEN" }),
//       })
//       .nullable(),

//     // Address details
//     address: z.string().min(5, "Address is required").nullable(),

//     district: z
//       .string()
//       .min(2, "District is required")
//       .regex(
//         /^[A-Za-z\s]+$/,
//         "District should contain only alphabets and spaces"
//       )
//       .nullable(),

//     city: z
//       .string()
//       .min(2, "City is required")
//       .regex(/^[A-Za-z\s]+$/, "City should contain only alphabets and spaces")
//       .nullable(),

//     state: z
//       .string()
//       .min(2, "State is required")
//       .regex(/^[A-Za-z\s]+$/, "State should contain only alphabets and spaces")
//       .nullable(),

//     // postal_code: z
//     //   .number()
//     //   .int('Postal code must be an integer')
//     //   .positive('Postal code must be positive')
//     //   .refine(
//     //   val => {
//     //     const strVal = val.toString()
//     //     return strVal.length === 6
//     //   },
//     //   {
//     //     message: 'Postal code must be exactly 6 digits'
//     //   }
//     //   ),

//     postal_code: z.coerce
//       .string()
//       .regex(/^\d{6}$/, "Postal code must be exactly 6 digits")
//       .nullable()
//       .optional(),  
    
//     // Bank details
//     bank_name: z
//       .string()
//       .min(2, "Bank name is required")
//       .regex(
//         /^[A-Za-z\s]+$/,
//         "Bank name should contain only alphabets and spaces"
//       )
//       .nullable(),

//     // Fixed account number validation
//     account_no: z
//       .number()
//       .int("Account number must be an integer")
//       .positive("Account number must be positive")
//       .refine(
//         (val) => {
//           const strVal = val.toString();
//           return strVal.length >= 9 && strVal.length <= 18;
//         },
//         {
//           message: "Account number must be between 9 and 18 digits",
//         }
//       )
//       .nullable(),

//     IFSC_code: z
//       .string()
//       .regex(
//         /^[A-Z]{4}0[A-Z0-9]{6}$/,
//         "IFSC code must be in format ABCD0123456"
//       )
//       .nullable(),

//     employment_status: z.enum(
//       [
//         "Permanent",
//         "Trial_Period",
//         "Resigned",
//         "Contract_Based",
//         "Notice_Period",
//       ],
//       {
//         errorMap: () => ({ message: "Select Employment Status" }),
//       }
//     ),

//     // Employment details
//     joining_date: z
//       .string()
//       .min(1, "Joining date is required")
//       .refine((date) => !isNaN(Date.parse(date)), {
//         message: "Invalid date format",
//       })
//       .refine(
//         (date) => {
//           const parsedDate = new Date(date);
//           const today = new Date();
//           return parsedDate <= today;
//         },
//         {
//           message: "Joining date cannot be in the future",
//         }
//       )
//       .nullable(),
//   })
//   .superRefine((data, ctx) => {
//     // Conditional validation for teaching staff
//     if (data.is_teaching_role) {
//       // Validate qualification
//       if (!data.qualification || data.qualification.length < 2) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: "Qualification is required for teaching staff",
//           path: ["qualification"],
//         });
//       }

//       // Validate subject specialization
//       if (
//         !data.subject_specialization ||
//         data.subject_specialization.length < 2
//       ) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: "Subject specialization is required for teaching staff",
//           path: ["subject_specialization"],
//         });
//       }

//       // Validate class_id
//       // if (data.is_teaching_role) {
//       //   if (
//       //     !data.class_id ||
//       //     isNaN(Number(data.class_id)) ||
//       //     Number(data.class_id) <= 0
//       //   ) {
//       //     ctx.addIssue({
//       //       code: z.ZodIssueCode.custom,
//       //       message: 'Class assignment is required for teaching staff',
//       //       path: ['class_id']
//       //     })
//       //   }
//       // }
//     }
//   });

export const staffSchema = z
  .object({
    // Role selection
    is_teaching_role: z.boolean(),
    staff_role_id: z
      .number({
        required_error: "Staff role is required",
        invalid_type_error: "Staff role must be a number",
      })
      .int("Staff role ID must be an integer")
      .positive("Staff role is required"),

    // Personal details
    first_name: z
      .string()
      .min(2, "First name is required")
      .regex(/^[A-Za-z\s]+$/, "First name should contain only alphabets and spaces"),

    // Make middle name optional
    middle_name: z
      .string()
      .regex(/^[A-Za-z\s]*$/, "Middle name should contain only alphabets and spaces")
      .nullable(),

    last_name: z
      .string()
      .min(2, "Last name is required")
      .regex(/^[A-Za-z\s]+$/, "Last name is required"),

    first_name_in_guj: z.string().min(2, "First name in Gujarati is required").nullable(),

    // Make middle name in Gujarati optional
    middle_name_in_guj: z.string().nullable(),

    last_name_in_guj: z.string().min(2, "Last name in Gujarati is required").nullable(),

    gender: z.enum(["Male", "Female"], {
      required_error: "Gender is required",
      invalid_type_error: "Gender must be either Male or Female",
    }),

    birth_date: z
      .string()
      .min(1, "Birth date is required")
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
      })
      .refine(
        (date) => {
          const parsedDate = new Date(date)
          const today = new Date()
          return parsedDate <= today
        },
        {
          message: "Birth date cannot be in the future",
        },
      )
      .refine(
        (date) => {
          const parsedDate = new Date(date)
          const today = new Date()

          // Calculate age
          let age = today.getFullYear() - parsedDate.getFullYear()
          const monthDiff = today.getMonth() - parsedDate.getMonth()

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDate.getDate())) {
            age--
          }

          return age >= 18 && age <= 90
        },
        {
          message: "Staff must be between 18 and 90 years old",
        },
      )
      .nullable(),

    // Aadhar validation
    aadhar_no: z
      .number()
      .int("Aadhar number must be an integer")
      .positive("Aadhar number must be positive")
      .refine(
        (val) => {
          const strVal = val.toString()
          return strVal.length === 12
        },
        {
          message: "Aadhar number must be exactly 12 digits",
        },
      )
      .nullable(),

    // Contact details - Allow undefined during form editing but require for submission
    mobile_number: z
      .union([
        z
          .number()
          .int("Mobile number must be an integer")
          .positive("Mobile number must be positive")
          .refine(
            (val) => {
              const strVal = val.toString()
              return strVal.length === 10 && /^[6-9]/.test(strVal)
            },
            {
              message: "Mobile number must be 10 digits and start with 6-9",
            },
          ),
        z.undefined(),
      ])
      .refine((val) => val !== undefined, {
        message: "Mobile number is required",
      }),

    email: z.string().min(1, "Email is required").email("Invalid email address").nullable(),

    // Teacher-specific fields - conditionally required based on is_teaching_role
    qualification: z.string().nullable(),
    subject_specialization: z.string().nullable(),

    // Other details
    religion: z
      .string()
      .min(2, "Religion is required")
      .regex(/^[A-Za-z\s]+$/, "Religion should contain only alphabets and spaces")
      .nullable(),

    religion_in_guj: z.string().min(2, "Religion in Gujarati is required").nullable(),

    caste: z
      .string()
      .min(2, "Caste is required")
      .regex(/^[A-Za-z\s]+$/, "Caste should contain only alphabets and spaces")
      .nullable(),

    caste_in_guj: z.string().min(2, "Caste in Gujarati is required").nullable(),

    category: z
      .enum(["ST", "SC", "OBC", "OPEN"], {
        errorMap: () => ({ message: "Category must be ST, SC, OBC, or OPEN" }),
      })
      .nullable(),

    // Address details
    address: z.string().min(5, "Address is required").nullable(),
    permanent_address: z.string().optional().nullable(),

    district: z
      .string()
      .min(2, "District is required")
      .regex(/^[A-Za-z\s]+$/, "District should contain only alphabets and spaces")
      .nullable(),

    city: z
      .string()
      .min(2, "City is required")
      .regex(/^[A-Za-z\s]+$/, "City should contain only alphabets and spaces")
      .nullable(),

    state: z
      .string()
      .min(2, "State is required")
      .regex(/^[A-Za-z\s]+$/, "State should contain only alphabets and spaces")
      .nullable(),

    postal_code: z.coerce
      .string()
      .regex(/^\d{6}$/, "Postal code must be exactly 6 digits")
      .nullable()
      .optional(),

    // Bank details
    bank_name: z
      .string()
      .min(2, "Bank name is required")
      .regex(/^[A-Za-z\s]+$/, "Bank name should contain only alphabets and spaces")
      .nullable(),

    // Fixed account number validation
    account_no: z
      .number()
      .int("Account number must be an integer")
      .positive("Account number must be positive")
      .refine(
        (val) => {
          const strVal = val.toString()
          return strVal.length >= 9 && strVal.length <= 18
        },
        {
          message: "Account number must be between 9 and 18 digits",
        },
      )
      .nullable(),

    IFSC_code: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "IFSC code must be in format ABCD0123456")
      .nullable(),

    employment_status: z.string().min(1, "Select Employment Status"),

    // Employment details
    joining_date: z
      .string()
      .min(1, "Joining date is required")
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
      })
      .refine(
        (date) => {
          const parsedDate = new Date(date)
          const today = new Date()
          return parsedDate <= today
        },
        {
          message: "Joining date cannot be in the future",
        },
      )
      .nullable(),

    // New Fields
    nch_registration_no: z.string().optional().nullable(),
    nch_registration_date: z.string().optional().nullable(),
    marital_status: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional().nullable(),
    pan_card_no: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Card format").optional().nullable(),
    ayush_id_no: z.string().optional().nullable(),
    teacher_code: z.string().optional().nullable(),
    state_council_reg_no: z.string().optional().nullable(),
    ayush_registration_no: z.string().optional().nullable(),
    date_of_registration: z.string().optional().nullable(),
    university_appointment_letter_no: z.string().optional().nullable(),
    university_appointment_date: z.string().optional().nullable(),
    university_approval_letter_no: z.string().optional().nullable(),
    university_approval_date: z.string().optional().nullable(),
    ug_degree: z.string().optional().nullable(),
    ug_passing_university: z.string().optional().nullable(),
    ug_passing_year: z.number().int().optional().nullable(),
    pg_degree: z.string().optional().nullable(),
    pg_passing_university: z.string().optional().nullable(),
    pg_passing_year: z.number().int().optional().nullable(),
    diploma_degree: z.string().optional().nullable(),
    diploma_council: z.string().optional().nullable(),
    diploma_passing_year: z.number().int().optional().nullable(),
    other_degree: z.string().optional().nullable(),
    other_passing_university: z.string().optional().nullable(),
    other_passing_year: z.number().int().optional().nullable(),
    area_of_expertise: z.string().optional().nullable(),
    bank_branch_name: z.string().optional().nullable(),
    pay_scale: z.string().optional().nullable(),
    retirement_age: z.number().int().min(40).max(75).optional().nullable(),
    staff_type: z.string().optional().nullable(),
    staff_category: z.string().optional().nullable(),
    designation: z.string().optional().nullable(),
    department_id: z.number().nullable().optional(),
    leave_policy_ids: z.array(z.number()).optional(),
    letters: z
      .array(
        z.object({
          id: z.number().optional(),
          letter_type: z.string().min(1, "Letter type is required"),
          letter_type_id: z.number().nullable().optional(),
          letter_no: z.string().nullable().optional(),
          letter_date: z.string().nullable().optional(),
          remarks: z.string().nullable().optional(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Conditional validation for teaching staff
    if (data.is_teaching_role) {
      // Validate qualification
      if (!data.qualification || data.qualification.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Qualification is required for teaching staff",
          path: ["qualification"],
        })
      }
    }

    // Additional validation for DOJ vs DOB
    if (data.birth_date && data.joining_date) {
      const birthDate = new Date(data.birth_date)
      const joiningDate = new Date(data.joining_date)

      if (joiningDate <= birthDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Joining date must be after birth date",
          path: ["joining_date"],
        })
      }
    }
  })
export type StaffFormData = z.infer<typeof staffSchema>;

export const personalDetailsSchema = z.any();
export const bankDetailsSchema = z.any();
