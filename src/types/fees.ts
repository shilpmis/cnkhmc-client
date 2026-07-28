import { S } from "framer-motion/dist/types.d-DDSxwf0n";
import { AcademicClasses } from "./academic";
import { Student } from "./student";

export interface FeesType {
  id: number;
  school_id: number;
  academic_session_id: number;
  name: string;
  description: string;
  applicable_to: "plan" | "student";
  status: "Active" | "Inactive";
  // is_concession_applicable: boolean,
}

export interface Concession {
  id: number;
  school_id: number;
  academic_session_id: number;
  name: string;
  description: string;
  applicable_to: "plan" | "students";
  concessions_to: "fees_type" | "plan";
  status: "Active" | "Inactive";
  category: "family" | "sports" | "staff" | "education" | "financial" | "other";
  created_at: string;
  // updated_at: string;
}

export interface ReqBodyForApplyConsessionToPlan {
  concession_id: number;
  fees_plan_id: number;
  fees_type_ids: number[] | null;
  deduction_type: "percentage" | "fixed_amount";
  amount: number | null;
  percentage: number | null;
}
export interface ReqBodyForApplyConsessionToStudent {
  concession_id: number;
  student_id: number;
  fees_plan_id: number;
  fees_type_ids: number[] | null;
  deduction_type: "percentage" | "fixed_amount";
  amount: number | null;
  percentage: number | null;
}

export interface ConcessionDetailForPlan {
  concession_id: number;
  academic_session_id: number;
  fees_plan_id: number;
  fees_type_id: number;
  deduction_type: "percentage" | "fixed_amount";
  amount: number | null;
  percentage: number | null;
  status: "Active" | "Inactive";
  concession: Concession;
  fees_plan: FeesPlan;
}

export interface FeesPlan {
  id: number;
  name: string;
  class_id: number;
  academic_session_id: number;
  description: string;
  total_amount: number;
  status: "Active" | "Inactive";
  concession: ConcessionDetailForPlan[];
  fees_detail: FeePlanDetail[];
}

export interface FeesPlanDetail {
  id: number;
  academic_session_id: number;
  fees_plan_id: number;
  fees_type_id: number;
  total_installment: number;
  installment_type:
  | "Admission"
  | "Monthly"
  | "Quarterly"
  | "Half Yearly"
  | "Yearly";
  total_amount: number;
  status: "Active" | "Inactive";
}

export interface InstallmentBreakdowns {
  id: number;
  fee_plan_details_id: number;
  installment_no: number;
  installment_amount: string;
  due_date: string;
  status: "Active" | "Inactive";
}

export interface DetailFeesPlan { }

export interface ReqObjectForCreateFeesPlan {
  fees_plan: Pick<FeesPlan, "class_id" | "name" | "description">;
  plan_details: {
    fees_type_id: number;
    installment_type: string;
    total_installment: number;
    total_amount: string;
    installment_breakDowns: Pick<
      InstallmentBreakdowns,
      "installment_no" | "due_date" | "installment_amount"
    >[];
  }[];
}

export interface ReqObjectForUpdateFeesPlan {
  general_detail_for_plan?: Partial<Pick<FeesPlan, "name" | "description" | "status">>;
  new_fees_type?: {
    fees_type_id: number;
    installment_type: string;
    total_installment: number;
    total_amount: string;
    installment_breakDowns: Pick<
      InstallmentBreakdowns,
      "installment_no" | "due_date" | "installment_amount"
    >[];
  }[],
  existing_fees_type?: {
    fees_plan_detail_id: number; // consider this as id filed 
    fees_type_id: number;
    installment_type: string;
    total_installment: number;
    total_amount: string;
    installment_breakDowns: Pick<
      InstallmentBreakdowns,
      "id" | "installment_no" | "due_date" | "installment_amount"
    >[];
  }[];
  deleted_fees_type?: number[] // Array of fees_plan_detail_id to be deleted
}

export interface DetailedFeesPlan {
  fees_plan: FeesPlan;
  fees_types: {
    fees_type: FeesPlanDetail;
    installment_breakDowns: InstallmentBreakdowns[];
  }[];
  consession: ConcessionDetailForPlan[];
  is_editable: boolean;
}

// Types for fees module

export interface FeeStatus {
  student_id: number;
  academic_session_id: number;
  fees_plan_id: number;
  discounted_amount: number;
  paid_amount: number;
  total_amount: string;
  due_amount: string;
  status: "Pending" | "Partially Paid" | "Paid" | "Overdue";
  paid_fees: StudentFeesInstallment[];
  reversed_fees: StudentFeesInstallment[];
  repaid_installment: boolean;
  applied_concessions:
  | {
    concession_id: number;
    applied_amount: number;
  }[]
  | null;
}

export interface StudentWithFeeStatus {
  id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  gr_no: number;
  first_year_roll_number: number | null;
  second_year_roll_number: number | null;
  third_year_roll_number: number | null;
  fourth_year_roll_number: number | null;
  fees_status: FeeStatus;
}

export interface InstallmentBreakdown {
  id: number;
  fee_plan_details_id: number;
  installment_no: number;
  installment_amount: string;
  due_date: string;
  status: "Paid" | "Unpaid" | "Partially Paid" | "Overdue" | "Failed";
}

export interface StudentFeesInstallment {
  id: number;
  student_fees_master_id: number;
  installment_id: number;
  paid_amount: number;
  remaining_amount: number;
  amount_paid_as_carry_forward: number;
  discounted_amount: number;
  paid_as_refund: boolean;
  refunded_amount: number;
  payment_mode: "Cash" | "Online" | "Bank Transfer";
  transaction_reference: string | null;
  payment_date: string;
  remarks: "Done";
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Paid Late' | 'Failed' | 'Reversal Requested' | 'Reversed';
  payment_status: 'Success' | 'In Progress' | 'Failed' | 'Disputed' | 'Cancelled';
}

export interface FeePlanDetail {
  id: number;
  academic_session_id: number;
  fees_plan_id: number;
  fees_type_id: number;
  installment_type: "Admission" | "Monthly" | "Half Yearly" | "Yearly";
  total_installment: number;
  total_amount: string;
  status: "Active" | "Inactive";
  installments_breakdown: InstallmentBreakdown[];
}

export interface FeePlan {
  id: number;
  name: string;
  academic_session_id: number;
  description: string;
  class_id: number;
  total_amount: string;
  status: "Active" | "Inactive";
  concession_for_plan: AppliedConcessioinToStudent[];
}

export interface InstallmentBreakdownForExtraFees {
  id: number,
  student_fees_type_masters_id: number,
  installment_no: number,
  installment_amount: number,
  due_date: string,
  status: "Active" | "Inactive",
}


export interface PaidInstallmentsForExtraFees {
  student_fees_master_id: number,
  student_fees_type_masters_id: number,
  installment_id: number,
  paid_amount: number,
  remaining_amount: number,
  amount_paid_as_carry_forward: number,
  paid_as_refund: boolean,
  refunded_amount: number,
  payment_mode: 'Cash' | 'Online' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'Full Discount'
  transaction_reference: string | null,
  payment_date: string,
  remarks: string,
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Paid Late' | 'Failed' | 'Reversal Requested' | 'Reversed';
  payment_status: 'Success' | 'In Progress' | 'Failed' | 'Disputed' | 'Cancelled';
}

export interface RequestForApplyExtraFees {
  student_id: number,
  academic_session_id: number,
  fees_plan_id: number,
  fees_type_id: number,
  installment_type: "Admission" | "Monthly" | "Half Yearly" | "Yearly";
  total_installment: number,
  total_amount: number,
  installment_breakDowns: Pick<InstallmentBreakdownForExtraFees, 'installment_amount' | 'due_date' | 'installment_no'>[]
}

export interface ExtraFeesAppliedToStudent {
  id: number,
  student_enrollments_id: number,
  fees_plan_id: number,
  fees_type_id: number,
  total_amount: number,
  paid_amount: number,
  status: "Active" | "Inactive",
  paid_installment?: PaidInstallmentsForExtraFees[]
  installment_breakdown: InstallmentBreakdownForExtraFees[]
}

export interface StudentFeeDetails {
  student: {
    id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    gr_no: number;
    first_year_roll_number: number | null;
    second_year_roll_number: number | null;
    third_year_roll_number: number | null;
    fourth_year_roll_number: number | null;
    class_id: number;
    fees_status: FeeStatus & { id: number };
    provided_concession: AppliedConcessioinToStudent[];
    academic_class: {
      id: number;
      academic_session_id: number;
      division_id: number;
      student_id: number;
      quota_id: number | null;
      status: string;
      remarks: number | null;
      is_new_admission: boolean;
      promoted_by: null;
      class: {
        id: number;
        academic_session_id: number;
        class_id: number;
        division: string;
        aliases: string | null;
        class: {
          id: number;
          class: string;
        };
      };
    }[];
  };
  detail: {
    fees_details: FeePlanDetail[];
    fees_plan: FeePlan;
    paid_fees: StudentFeesInstallment[];
    // extra_fees: ExtraFeesAppliedToStudent[];
    wallet: {
      total_concession_for_student: number;
      total_concession_for_plan: number;
    };
  };
  installments: {
    id: number;
    fees_plan_id: number;
    fees_type_id: number;
    installment_type: string;
    total_installment: number;
    total_amount: string;
    paid_amount: string;
    discounted_amount: string;
    due_amount: string;
    concession_amount: null;
    installments_breakdown: {
      id: number;
      installment_no: number;
      installment_amount: string;
      due_date: string;
      payment_status: "Unpaid" | "Paid";
      is_paid: boolean;
      payment_date: string;
      remaining_amount: string;
      transaction_reference: string;
      discounted_amount: string;
      paid_amount: string;
      carry_forward_amount: string;
      amount_paid_as_carry_forward: string;
      repaid_installment: boolean;
      applied_concession: {
        concession_id: number;
        applied_amount: number;
      }[];
    }[];
  }[];
  extra_fees: {
    id: number,
    student_enrollments_id: number,
    fees_plan_id: number,
    fees_type_id: number,
    total_amount: number,
    paid_amount: number,
    status: "Active" | "Inactive",
    paid_installment: {
      id: number,
      student_fees_master_id: number,
      student_fees_type_masters_id: number,
      installment_id: number,
      paid_amount: number,
      discounted_amount: number,
      remaining_amount: number,
      transaction_reference: string | null,
      payment_date: string,
      remarks: string |  null,
      paid_as_refund: boolean,
      refunded_amount: number,
      payment_mode: "Cash" | "Online" | "Bank Transfer" | "Cheque" | "UPI" | "Full Discount",
      status: "Paid" | "Pending" | "Partially Paid" | "Overdue" | "Paid Late" | "Failed" | "Reversal Requested" | "Reversed",
      amount_paid_as_carry_forward: number,
      payment_status: 'Success' | 'In Progress' | 'Failed' | 'Disputed' | 'Cancelled';
    }[],
    installment_breakdown:
    {
      id: number,
      student_fees_type_masters_id: number,
      installment_no: number,
      installment_amount: number,
      due_date: string,
      status: "Active" | "Inactive",
    }[],
  }[],
  extra_fees_installments: {
    id: number,
    fees_type_id: number,
    total_amount: number,
    paid_amount: number,
    due_amount: number,
    installments_breakdown: {
      id: number,
      installment_no: number,
      installment_amount: number,
      paid_amount: number,
      due_date: string,
      payment_status: "Unpaid" | "Paid";
      is_paid: boolean,
      payment_date: string,
      remaining_amount: number,
      transaction_reference: string | null,
      discounted_amount: number,
      carry_forward_amount: number,
      amount_paid_as_carry_forward: number,
      applied_concession: null
    }[]
  }[]
}

// export interface StudentFeeDetails {
//   student: {
//     id: number
//     first_name: string
//     middle_name: string
//     last_name: string
//     gr_no: number
//     roll_number: number
//     provided_concession?: Array<{
//       id: number
//       concession: {
//         name: string
//         description: string
//       }
//       deduction_type: string
//       amount: string
//       applied_discount: string
//     }>
//     fees_status?: {
//       total_amount: string
//       discounted_amount: string
//       paid_amount: string
//       due_amount: string
//       status: string
//       paid_fees?: Array<{
//         id: number
//         installment_id: number
//         paid_amount: string
//         remaining_amount: string
//         payment_mode: string
//         payment_date: string
//         status: string
//         discounted_amount: string
//         amount_paid_as_carry_forward: string
//         applied_concessions: Array<any>
//       }>
//     }
//     academic_class: Array<{
//       class: {
//         class: {
//           class: string
//         }
//         division: string
//         aliases: string
//       }
//     }>
//   }
//   detail?: {
//     fees_details?: Array<{
//       id: number
//       fees_type_id: number
//       installment_type: string
//       total_installment: number
//       total_amount: string
//       installments_breakdown: Array<{
//         id: number
//         installment_no: number
//         installment_amount: string
//         due_date: string
//       }>
//     }>
//     fees_plan?: {
//       name: string
//       description: string
//       total_amount: string
//     }
//     wallet?: {
//       total_concession_for_student: number
//       total_concession_for_plan: number
//     }
//   }
//   installments?: Array<{
//     id: number
//     fees_type_id: number
//     installment_type: string
//     total_installment: number
//     total_amount: string
//     paid_amount: string
//     discounted_amount: string
//     due_amount: string
//     installments_breakdown: Array<{
//       id: number
//       installment_no: number
//       installment_amount: string
//       paid_amount: string
//       discounted_amount: string
//       remaining_amount: string
//       due_date: string
//       payment_status: string
//       is_paid: boolean
//       payment_date: string | null
//       amount_paid_as_carry_forward: string
//     }>
//   }>
// }

// export interface StudentFeeDetails {
//   student: {
//     id: number;
//     first_name: string;
//     middle_name: string;
//     last_name: string;
//     gr_no: number;
//     roll_number: number;
//     provided_concession?: Array<{
//       id: number;
//       concession: {
//         name: string;
//         description: string;
//       };
//       deduction_type: string;
//       amount: string;
//       applied_discount: string;
//     }>;
//     fees_status?: {
//       total_amount: string;
//       discounted_amount: string;
//       paid_amount: string;
//       due_amount: string;
//       status: string;
//       paid_fees?: Array<{
//         id: number;
//         installment_id: number;
//         paid_amount: string;
//         remaining_amount: string;
//         payment_mode: string;
//         payment_date: string;
//         status: string;
//         discounted_amount: string;
//         amount_paid_as_carry_forward: string;
//         applied_concessions: Array<any>;
//       }>;
//     };
//     academic_class: Array<{
//       class: {
//         class: {
//           class: string;
//         };
//         division: string;
//         aliases: string;
//       };
//     }>;
//   };
//   detail?: {
//     fees_details?: Array<{
//       id: number;
//       fees_type_id: number;
//       installment_type: string;
//       total_installment: number;
//       total_amount: string;
//       installments_breakdown: Array<{
//         id: number;
//         installment_no: number;
//         installment_amount: string;
//         due_date: string;
//       }>;
//     }>;
//     fees_plan?: {
//       id : number;
//       academic_session_id : number;
//       name: string;
//       description: string;
//       total_amount: string;
//     };
//     wallet?: {
//       total_concession_for_student: number;
//       total_concession_for_plan: number;
//     };
//   };
//   installments?: Array<{
//     id: number;
//     fees_type_id: number;
//     installment_type: string;
//     total_installment: number;
//     total_amount: string;
//     paid_amount: string;
//     discounted_amount: string;
//     due_amount: string;
//     installments_breakdown: Array<{
//       id: number;
//       installment_no: number;
//       installment_amount: string;
//       paid_amount: string;
//       discounted_amount: string;
//       remaining_amount: string;
//       due_date: string;
//       payment_status: string;
//       is_paid: boolean;
//       payment_date: string | null;
//       amount_paid_as_carry_forward: string;
//     }>;
//   }>;
// }

export interface FeePaymentRequest {
  fee_plan_details_id: number;
  installment_id: number;
  paid_amount: number;
  discounted_amount: number;
  paid_as_refund: boolean;
  refunded_amount: number;
  payment_mode: string;
  transaction_reference: string;
  payment_date: string;
  remarks: string;
  remaining_amount: number;
  amount_paid_as_carry_forward: number;
  applied_concessions:
  | {
    concession_id: number;
    applied_amount: number;
  }[]
  | null;
  repaid_installment: boolean;
}

export interface ExtraFeePaymentRequest {
  // fee_plan_details_id: number;
  student_fees_type_masters_id: number;
  installment_id: number;
  paid_amount: number;
  discounted_amount: number;
  paid_as_refund: boolean;
  refunded_amount: number;
  payment_mode: string;
  transaction_reference: string;
  payment_date: string;
  remarks: string;
  remaining_amount: number;
  amount_paid_as_carry_forward: number;
  applied_concessions:
  | {
    concession_id: number;
    applied_amount: number;
  }[]
  | null;
  repaid_installment: boolean;
}

export interface FeePaymentReqForExtraFees {
  student_id: number,
  student_fees_master_id: number,
  // student_fees_type_masters_id : number,
  installments: ExtraFeePaymentRequest[]
}

export interface FeePaymentFormData {
  installment_ids: number[];
  payment_mode: "Cash" | "Online" | "Cheque" | "Bank Transfer";
  transaction_reference: string;
  payment_date: string;
  remarks: string;
}

export interface ConcessionFormData {
  amount: number;
  reason: string;
}

export interface AppliedConcessioinToPlan {
  id: number;
  concession_id: number;
  fees_plan_id: number;
  fees_type_id: number | null;
  deduction_type: "percentage" | "amount";
  amount: string | null;
  percentage: string | null;
  status: "Active" | "Inactive";
  fees_plan?: FeesPlan;
  fees_type?: FeesType;
  student?: Partial<Student>;
}

export interface ApplyConcessionRequest {
  concession_id: number;
  fees_plan_id: number;
  fees_type_id: number | null;
  deduction_type: "percentage" | "amount";
  amount: number | null;
  percentage: number | null;
}

export interface AppliedConcessioinToStudent {
  id: number;
  academic_session_id: number;
  concession_id: number;
  student_id: number;
  fees_plan_id: number;
  fees_type_id: number | null;
  deduction_type: "percentage" | "fixed_amount";
  amount: number | null;
  percentage: number | null;
  status: "Active" | "Inactive";
  fees_plan?: FeesPlan;
  fees_type?: FeesPlanDetail;
  student?: Partial<Student>;
  concession: Concession;
}

export interface ConcessionDetails {
  concession: Concession;
  concession_holder_plans: AppliedConcessioinToPlan[] | null;
  concession_holder_students?: AppliedConcessioinToStudent[] | null;
}

export interface ConcessionStudenMaster extends Partial<Student> {
  id: number;
  student_id: number;
  academic_session_id: number;
  concession_id: number;
  fees_plan_id: number;
  fees_type_id: number | null;
  deduction_type: "percentage" | "fixed_amount";
  amount: number | null;
  percentage: number | null;
  status: "Active" | "Inactive";
  concession?: Concession;
  fees_plan?: FeesPlan;
  fees_plan_name?: string;
  fees_type?: FeesPlanDetail;
  fees_type_name?: string;
  class_id ?: number;
  division_id ?: number;
}

export interface TypeOfInstallmentWiseReportForClass {
  id: number,
  enrollment_code: string,
  first_name: string,
  middle_name: string,
  last_name: string,
  gr_no: number,
  installment_id: string,
  total_paid_amount: number,
  total_discounted_amount: number,
  total_remaining_amount: number,
  first_payment_date: string,
  last_payment_date: string,
  payment_count: number
}

export interface TypeOfFeesTypeWiseFeesReport {
  id: number,
  enrollment_code: string,
  first_name: string,
  middle_name: string,
  last_name: string,
  gr_no: number,
  student_fees_master_id: number,
  fees_plan_details_id: number,
  total_amount: number,
  discounted_amount: number,
  paid_amount: number,
  due_amount: number,
  status: string
}