import { StaffType } from "@/types/staff";
import exp from "constants";
export interface SalaryComponent {
  id: number;
  component_name: string;
  component_code: string | null;
  component_type: "earning" | "deduction" | "benefits";
  description: string | null;
  calculation_method: "amount" | "percentage";
  amount: number | null;
  percentage: number | null;
  is_based_on_annual_ctc: boolean;
  name_in_payslip: string | null;
  is_taxable: boolean;
  pro_rata_calculation: boolean;
  consider_for_epf: boolean;
  consider_for_esi: boolean;
  consider_for_esic: boolean;
  is_mandatory: boolean;
  is_mandatory_for_all_templates: boolean;
  is_active: boolean;
  deduction_frequency: "once" | "recurring" | null;
  deduction_type:
    | "ends_on_selected_month"
    | "ends_never"
    | "recovering_specific_amount"
    | null;
  benefit_frequency: "once" | "recurring" | null;
  benefit_type:
    | "ends_on_selected_month"
    | "ends_never"
    | "recovering_specific_amount"
    | null;
  school_id: number;
  academic_session_id: number;
  created_at: string;
  updated_at: string;
}

export interface SalaryTemplateComponent {
  salary_components_id: number;
  amount: number | null;
  percentage: number | null;
  is_based_on_annual_ctc: boolean;
  is_mandatory: boolean;
  end_month: string | null;
  recovery_amount: number | null;
}

export interface SalaryTemplate {
  id: number;
  template_name: string;
  template_code: string;
  description: string | null;
  annual_ctc: number;
  is_mandatory: boolean;
  is_active: boolean;
  template_components: SalaryTemplateComponent[];
  created_at: string;
  updated_at: string;
}

export interface SalaryTemplateComponentForStaff {
  id: number;
  staff_salary_templates_id: number;
  salary_components_id: number;
  amount: string | null;
  percentage: string | null;
  is_mandatory: boolean;
  recovering_end_month: string | null;
  total_recovering_amount: string | null;
  total_recovered_amount: string | null;
}

export interface StaffSalaryTemplate {
  id: number;
  base_template_id: number;
  staff_enrollments_id: number;
  template_name: string;
  template_code: string;
  description: string;
  annual_ctc: string;
  template_components: SalaryTemplateComponentForStaff[];
  base_template: SalaryTemplate;
}

export interface TypeForCreateSalaryTemplateForrStaff {
  base_template_id: number | null;
  staff_id: number;
  template_name: string;
  template_code: string;
  description: string;
  annual_ctc: string;
  template_components: Omit<
    SalaryTemplateComponentForStaff,
    "id" | "base_template" | "component" | "staff_salary_templates_id"
  >[];
}

export interface SalaryTemplateUpdatePayload {
  template_name: string;
  template_code: string;
  description: string | null;
  annual_ctc: number;
  is_mandatory: boolean;
  is_active: boolean;
  new_salary_components: SalaryTemplateComponent[] | null;
  existing_salary_components:
    | {
        salary_components_id: number;
        amount?: number | null;
        percentage?: number | null;
        end_month?: string | null;
        recovery_amount?: number | null;
      }[]
    | null;
  remove_salary_components:
    | {
        salary_components_id: number;
      }[]
    | null;
}

export interface StaffEnrollmentForPayroll {
  id: number;
  academic_session_id: number;
  staff_id: number;
  status: string;
  remarks: string | null;
  school_id: number;
  staff_salary_templates: StaffSalaryTemplate | null;
  pay_runs: Omit<StaffPayRun, "payroll_components">[];
  staff: Partial<StaffType>;
}

export interface StaffPayRun {
  id: number;
  base_template_id: number;
  staff_enrollments_id: number;
  payroll_month: string;
  payroll_year: string;
  template_name: string;
  template_code: string;
  based_anual_ctc: number;
  total_payroll: number;
  notes: string;
  status:
    | "draft"
    | "pending"
    | "processing"
    | "partially_paid"
    | "paid"
    | "failed"
    | "cancelled"
    | "on_hold";
  payroll_components: {
    salary_components_id: number;
    payslip_name: string;
    amount: number | null;
    percentage: number;
    is_based_on_annual_ctc: boolean;
    is_based_on_basic_pay: boolean;
    is_modofied: boolean;
  }[];
}

export interface TypeForUpdateStaffPayRun {
  template_name: string;
  notes: string | null;
  status:
    | "draft"
    | "pending"
    | "processing"
    | "partially_paid"
    | "paid"
    | "failed"
    | "cancelled"
    | "on_hold";
}
