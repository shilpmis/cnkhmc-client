export type SessionType = 'lecture' | 'lab'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day'

// ─── Marking ──────────────────────────────────────────────────────────────────

export interface AssignedSubject {
  subjects_division_id: number
  division_id: number
  division_name: string
  subject_id: number
  subject_name: string
  subject_code: string
  session_type: SessionType
}

export interface LectureAttendanceStudent {
  student_id: number
  student_name: string
  roll_number: string | null
  status: AttendanceStatus | null
  remarks: string | null
}

export interface LectureAttendanceForDate {
  date: string
  division_id: number
  subject_id: number
  is_marked: boolean
  marked_by: number | null
  session_type: SessionType | null
  attendance_data: LectureAttendanceStudent[]
}

export interface MarkAttendancePayload {
  division_id: number
  subject_id: number
  academic_year: number
  date: string
  session_type: SessionType
  marked_by: number
  attendance_data: {
    student_id: number
    status: AttendanceStatus
    remarks?: string
  }[]
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface LectureHistoryRecord {
  id: number
  attendance_date: string
  session_type: SessionType
  total: number
  present: number
  absent: number
  late: number
  half_day: number
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface StudentSubjectSummary {
  subject_id: number
  subject_name: string
  subject_code: string
  total_lectures: number
  present: number
  absent: number
  late: number
  attendance_percentage: number
}

export interface StudentSubjectDateRecord {
  date: string
  session_type: SessionType
  status: AttendanceStatus
  remarks: string | null
}

export interface StudentSubjectReportResponse {
  data: StudentSubjectDateRecord[]
  summary: {
    total: number
    present: number
    absent: number
    late: number
    attendance_percentage: number
  }
}

export interface ClassStudentSummary {
  student_id: number
  student_name: string
  roll_number: string | null
  subjects: StudentSubjectSummary[]
  overall_percentage: number
}

export interface ClassSubjectStudentRecord {
  student_id: number
  student_name: string
  roll_number: string | null
  records: StudentSubjectDateRecord[]
  present: number
  absent: number
  late: number
  total: number
  attendance_percentage: number
}

export interface ClassSubjectReportResponse {
  data: ClassSubjectStudentRecord[]
  sessions: { date: string; session_type: SessionType }[]
}
