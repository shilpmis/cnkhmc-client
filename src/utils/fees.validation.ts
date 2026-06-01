import * as z from "zod";

export const feeTypeSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Fee type name must be at least 2 characters" }),
    description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  status: z.enum(["Active", "Inactive"]),
  applicable_to: z.enum(["plan", "student"]),
  //   is_concession_applicable: z.boolean(),
  // academic_session_id: z.number(),
});

// Validation schema for fee payment form
export const feePaymentSchema = z.object({
  installment_ids: z
    .array(z.number())
    .min(1, "Select at least one installment"),
  payment_mode: z.enum(["Cash", "Online", "Cheque", "Bank Transfer"], {
    required_error: "Payment mode is required",
  }),
  transaction_reference: z.string().optional(),
  payment_date: z.string().min(1, "Payment date is required"),
  remarks: z.string().optional(),
});

// Updated validation schema for concession form
export const concessionSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Concession name must be at least 2 characters" }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  applicable_to: z.enum(["plan", "students"], {
    required_error: "Please select where this concession applies",
  }),
  concessions_to: z.enum(["plan", "fees_type"], {
    required_error: "Please select what this concession applies to",
  }),
  category: z.enum(
    ["family", "sports", "staff", "education", "financial", "other"],
    {
      required_error: "Category is required",
    }
  ),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required",
  }),
});

// Validation schema for applying concessions to plans
export const applyConcessionToPlanSchema = z
  .object({
    concession_id: z.number(),
    fees_plan_id: z.number(),
    fees_type_ids: z.array(z.number()).nullable(),
    deduction_type: z.enum(["percentage", "fixed_amount"]),
    fixed_amount: z.number().nullable(),
    percentage: z.number().nullable(),
  })
  .refine(
    (data) =>
      (data.deduction_type === "percentage" &&
        data.percentage !== null &&
        data.percentage !== undefined &&
        data.percentage > 0 &&
        data.percentage <= 100 &&
        data.fixed_amount === null) ||
      (data.deduction_type === "fixed_amount" &&
        data.fixed_amount !== null &&
        data.fixed_amount !== undefined &&
        data.fixed_amount > 0 &&
        data.percentage === null),
    {
      message:
        "You must provide a valid percentage between 1 and 100 or a valid fixed amount greater than 0, depending on the deduction type",
      path: ["deduction_type"],
    }
  );

// Validation schema for applying concessions to students
export const applyConcessionToStudentSchema = z
  .object({
    concession_id: z.number(),
    student_id: z.number(),
    fees_plan_id: z.number(),
    fees_type_ids: z.array(z.number()).nullable(),
    deduction_type: z.enum(["percentage", "fixed_amount"]),
    fixed_amount: z.number().nullable(),
    percentage: z.number().nullable(),
    reason: z.string().min(1, "Reason is required"),
  })
  .refine(
    (data) =>
      (data.deduction_type === "percentage" &&
        data.percentage !== null &&
        data.percentage !== undefined &&
        data.percentage > 0 &&
        data.percentage <= 100 &&
        data.fixed_amount === null) ||
      (data.deduction_type === "fixed_amount" &&
        data.fixed_amount !== null &&
        data.fixed_amount !== undefined &&
        data.fixed_amount > 0 &&
        data.percentage === null),
    {
      message:
        "You must provide a valid percentage between 1 and 100 or a valid fixed amount greater than 0, depending on the deduction type",
      path: ["deduction_type"],
    }
  );

export type FeeTypeFormData = z.infer<typeof feeTypeSchema>;
export type FeePaymentFormData = z.infer<typeof feePaymentSchema>;
export type ConcessionFormData = z.infer<typeof concessionSchema>;
export type ApplyConcessionToPlanData = z.infer<
  typeof applyConcessionToPlanSchema
>;
export type ApplyConcessionToStudentData = z.infer<
  typeof applyConcessionToStudentSchema
>;
