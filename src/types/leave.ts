import { StaffType, StaffRole } from "./staff";

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  type: "sick" | "vacation" | "personal";
  leaveType: "sick" | "vacation" | "personal";
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestFormData {
  startDate: string;
  endDate: string;
  reason: string;
  leaveTypes: ("sick" | "vacation" | "personal")[];
}

export interface LeaveType {
  id: number;
  school_id: number;
  academic_session_id: number;
  leave_type_name: string;
  is_paid: boolean;
  affects_payroll: boolean;
  requires_proof: boolean;
  is_active: boolean;
}

export interface LeavePolicy {
  id: number;
  academic_session_id?: number;
  academic_year?: number;
  staff_role_id?: number | null;
  leave_type_id: number;
  annual_quota: number;
  can_carry_forward: boolean;
  max_carry_forward_days: number;
  max_consecutive_days: number;
  requires_approval: number | boolean;
  approval_hierarchy?: Object;
  deduction_rules?: Object;
  applicable_staff_type?: string | null;
  staff_role?: StaffRole;
  leave_type: LeaveType;
}

export interface LeaveApplication {
   uuid: string,
   leave_type_id: number,
   approved_by: number |null,
   from_date: string,
   to_date: string,
   number_of_days: string,
   remarks: string |null,
   is_half_day: boolean,
   half_day_type: "first_half" | "second_half" | "none";
   is_hourly_leave: boolean;
   total_hour: string | null;
   reason: string,
   status: "pending" | "approved" | "rejected" | "cancelled";
   id: number,
   academic_session_id: number,
   school_id: number,
   role: string,
   is_teaching_role: boolean,
   permissions: string,
   working_hours: number,
   created_at: string,
   updated_at: string,
   leave_type_name: string,
   staff_id: number,
   first_name: string,
   middle_name: string | null,
   last_name: string,
   email: string
}

export interface CompOffRequest {
  id: number;
  uuid: string;
  staff_id: number;
  school_id: number;
  academic_year: number;
  worked_date: string;
  day_type: "full_day" | "half_day";
  credited_days: number;
  reason: string;
  description?: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by?: number | null;
  approved_at?: string | null;
  admin_remarks?: string | null;
  created_at: string;
  updated_at: string;
  staff?: StaffType;
  approved_by_user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface CreateCompOffPayload {
  worked_date: string;
  day_type: "full_day" | "half_day";
  reason: string;
  description?: string;
  academic_year?: number;
  staff_id?: number;
}

export interface ProcessCompOffPayload {
  uuid: string;
  status: "approved" | "rejected";
  admin_remarks?: string;
}

export interface LeaveReportSummaryItem {
  staff_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  employee_id: string;
  role: string;
  staff_type: string;
  staff_category: string;
  designation: string;
  department: string;
  total_leaves_taken: number;
  total_leaves_available: number;
  leave_breakdown: Record<string, { used: number; total: number; available: number }>;
}

export interface LeaveReportSummaryResponse {
  leave_types: { id: number; name: string }[];
  data: LeaveReportSummaryItem[];
}

export interface IndividualTeacherLeaveReportResponse {
  staff: {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    full_name: string;
    employee_id: string;
    department: string;
  };
  balances: any[];
  applications: any[];
  comp_off_requests: any[];
}
