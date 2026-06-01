
export interface AttendanceRecord {
  student_id: number;
  student_name: string;
  roll_number: string;
  status: "present" | "absent" | "late" | "half_day";
}

export interface AttendanceDetails {
  attendance_data: AttendanceRecord[];
  academic_session_id: number;
  class_id: number;
  date: string;
  marked_by: number;
  is_marked: boolean;
}

export interface DayStats {
  date: string;
  present_percentage: number;
  absent_percentage: number;
  late_percentage: number;
  half_day_percentage: number;
}

export interface MonthStats {
  month: string;
  average_attendance: number;
}

export interface SummaryStats {
  average_present_percentage: number;
  average_absent_percentage: number;
  average_late_percentage: number;
  average_half_day_percentage: number;
  total_days_recorded: number;
}

export interface AttendanceStats {
  daily?: DayStats[];
  monthly?: MonthStats[];
  summary?: SummaryStats;
}

export interface DateAttendanceSummary {
  present_count: number;
  absent_count: number;
  late_count: number;
  half_day_count: number;
  total_students: number;
  present_percentage: number;
  absent_percentage: number;
  late_percentage: number;
  half_day_percentage: number;
  marked_by?: number;
  marked_by_name?: string;
  is_holiday?: boolean;
  is_weekend?: boolean;
}

export interface AttendanceHistoryData {
  dates: Record<string, DateAttendanceSummary>;
}

export interface AttendanceRecord {
  student_id: number;
  student_name: string;
  roll_number: string;
  status: "present" | "absent" | "late" | "half_day";
}

// export interface AttendanceDetails {
//   attendance_data: AttendanceRecord[];
//   academic_session_id: number;
//   class_id: number;
//   date: string;
//   marked_by: number;
//   is_marked?: boolean;
// }

export interface StudentAttendanceUpdate {
  attendance_master_id : number;
  student_id: number;
  status: "present" | "absent" | "late" | "half_day";
}

export interface AttendanceUpdatePayload {
  // class_id: number;
  // date: string;
  // academic_session_id: number;
  updates: StudentAttendanceUpdate[];
}
