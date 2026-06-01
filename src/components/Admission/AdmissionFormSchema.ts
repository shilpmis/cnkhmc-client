import * as z from "zod"

// Name validation regex: only letters, spaces, hyphens, and apostrophes
const nameRegex = /^[A-Za-z\s'-]+$/

// Mobile number validation regex: exactly 10 digits
const mobileRegex = /^[0-9]{10}$/

// Email validation regex: standard email format
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Address validation regex: allows letters, numbers, spaces, and common punctuation
const addressRegex = /^[A-Za-z0-9\s,.#'-/()]+$/

// Class validation regex: 1-12 or Roman numerals I-XII
const classRegex = /^([1-9]|1[0-2]|I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/

export const formSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: "First name must be at least 2 characters." })
    .max(30, { message: "First name must be no more than 30 characters." })
    .regex(nameRegex, { message: "First name should only contain letters, spaces, hyphens, or apostrophes." }),

  middle_name: z
    .string()
    .max(30, { message: "Middle name must be no more than 30 characters." })
    .regex(nameRegex, { message: "Middle name should only contain letters, spaces, hyphens, or apostrophes." })
    .optional()
    .or(z.literal("")),

  last_name: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters." })
    .max(30, { message: "Last name must be no more than 30 characters." })
    .regex(nameRegex, { message: "Last name should only contain letters, spaces, hyphens, or apostrophes." }),

  birth_date: z
    .date({
      required_error: "A date of birth is required.",
    })
    .refine(
      (date) => {
        if (!date) return false
        return date <= new Date()
      },
      { message: "Birth date cannot be a future date." },
    ),

  gender: z.enum(["male", "female"], {
    required_error: "Gender is required",
  }),

  inquiry_for_class: z.coerce
    .number({
      required_error: "Class is required",
      invalid_type_error: "Class must be a number",
    })
  ,

  father_name: z
    .string()
    .min(2, { message: "Father's name must be at least 2 characters." })
    .max(30, { message: "Father's name must be no more than 30 characters." })
    .regex(nameRegex, { message: "Father's name should only contain letters, spaces, hyphens, or apostrophes." }),

  primary_mobile: z.string().regex(mobileRegex, { message: "Mobile number must be exactly 10 digits." }),

  parent_email: z.string().regex(emailRegex, { message: "Please enter a valid email address." }).optional().nullable(),

  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters." })
    .max(350, { message: "Address must be no more than 100 characters." })
    .regex(addressRegex, { message: "Address contains invalid characters." }),

  previous_school: z
    .string()
    .max(100, { message: "Previous school must be no more than 100 characters." })
    .regex(/^[A-Za-z0-9\s,.'-]+$/, { message: "School name contains invalid characters." })
    .optional()
    .or(z.literal("")),

  previous_class: z
    .string()
    .regex(classRegex, { message: "Please enter a valid class (1-12 or I-XII)." })
    .optional()
    .or(z.literal("")),

  previous_percentage: z.coerce
    .number()
    .min(0, { message: "Percentage cannot be negative." })
    .max(100, { message: "Percentage cannot exceed 100." })
    .optional(),

  previous_year: z
    .date()
    .refine(
      (date) => {
        if (!date) return true // Optional field
        return date <= new Date()
      },
      { message: "Previous year cannot be a future date." },
    )
    .optional(),

  special_achievements: z
    .string()
    .max(500, { message: "Special achievements must be no more than 500 characters." })
    .optional()
    .or(z.literal("")),

  applying_for_quota: z.boolean().default(false),

  quota_type: z.number().nullable().optional(),

  academic_session_id: z.number({
    required_error: "Academic session is required",
  }),
})

export type FormValues = z.infer<typeof formSchema>
