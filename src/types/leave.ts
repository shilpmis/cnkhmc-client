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
  academic_session_id: number;
  staff_role_id: number;
  leave_type_id: number;
  annual_quota: number;
  can_carry_forward: boolean;
  max_carry_forward_days: number;
  max_consecutive_days: number;
  requires_approval: number;
  approval_hierarchy: Object;
  deduction_rules: Object;
  staff_role: StaffRole;
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

// export interface LeaveApplication {
//   id: number;
//   academic_session_id: number;
//   staff_id: number;
//   leave_type_id: number;
//   from_date: string;
//   to_date: string;
//   reason: string;
//   is_half_day: boolean;
//   half_day_type: "first_half" | "second_half" | "none";
//   is_hourly_leave: boolean;
//   total_hour: number | null;
//   documents: object;
//   uuid: string;
//   status: "pending" | "approved" | "rejected" | "cancelled";
//   number_of_days: number;
//   applied_by_self: boolean;
//   applied_by: number;
//   leave_type: LeaveType;
//   staff: StaffType;
// }
