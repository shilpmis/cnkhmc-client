import { Permission, UserRole } from "@/types/user"

/**
 * Permission templates: modules ("subjects") and actions.
 *
 * A template is a list of rules such as { action: "manage", subject: "Hostel" }.
 *  - A MODULE is a part of the system a rule can target. Older templates used other names
 *    (Room, Bed, Payments...); SUBJECT_ALIASES maps them onto the module they belong to.
 *  - An ACTION is what the holder may do: read, create, update, delete, or manage (all four).
 *    Exporting counts as read and importing counts as create.
 *  - A rule marked `inverted` is a "deny" rule, and a deny always wins over an allow.
 */

export const ACTIONS = ["manage", "read", "create", "update", "delete"] as const
export type PolicyAction = (typeof ACTIONS)[number]

export const ACTION_LABELS: Record<PolicyAction, string> = {
  manage: "manage (full access)",
  read: "read (view only)",
  create: "create (add only)",
  update: "update (edit only)",
  delete: "delete (remove only)",
}

export type ModuleId =
  | "Student"
  | "Staff"
  | "Subject"
  | "Attendance"
  | "Leave"
  | "Fees"
  | "Payroll"
  | "Admission"
  | "Timetable"
  | "LessonPlan"
  | "Hostel"
  | "DeadStock"
  | "Department"
  | "User"
  | "SystemSettings"
  | "Reports"
  | "Dashboard"
  | "Exam"

export interface ModuleDefinition {
  id: ModuleId
  label: string
  covers: string
}

/**
 * The modules offered when building a template, in the order shown.
 * "User" (user management and permission templates) is deliberately not offered: it stays with the
 * Admin, Principal, IT Admin, Super Admin and Developer roles.
 */
export const MODULES: ModuleDefinition[] = [
  { id: "Student", label: "Student Management", covers: "Students, student profile, import and export" },
  { id: "Staff", label: "Staff Management", covers: "Staff list, staff profile, import and export" },
  { id: "Attendance", label: "Attendance", covers: "Student, lecture and staff attendance" },
  { id: "Fees", label: "Fees & Payments", covers: "Fee plans, collecting fees, receipts, transactions" },
  { id: "Payroll", label: "Payroll", covers: "Salary, pay runs, payroll analytics" },
  { id: "Admission", label: "Admissions", covers: "Inquiries, admissions, quotas and seats" },
  { id: "Leave", label: "Leave", covers: "Applying for and managing leave" },
  { id: "Subject", label: "Subjects", covers: "Subjects and subject allocation" },
  { id: "Timetable", label: "Timetable", covers: "Timetable setup and viewing" },
  { id: "LessonPlan", label: "Lesson Plans", covers: "Curriculum and lesson plans" },
  { id: "Exam", label: "Exams & Grades", covers: "Exam masters, schedules and results" },
  { id: "Hostel", label: "Hostel & Rooms", covers: "Hostels, rooms, beds and allocation" },
  { id: "DeadStock", label: "Inventory / Dead Stock", covers: "Dead stock register and transfers" },
  { id: "Department", label: "Departments", covers: "Inventory and institution departments" },
  { id: "SystemSettings", label: "System Settings", covers: "The Settings area" },
  { id: "Reports", label: "Reports", covers: "Reports and exports" },
  { id: "Dashboard", label: "Dashboard", covers: "Dashboard, calendar and messaging" },
]

/** Older or alternative subject names, lower-cased, and the module each belongs to. */
export const SUBJECT_ALIASES: Record<string, ModuleId> = {
  student: "Student",
  students: "Student",
  staff: "Staff",
  teacher: "Staff",
  teachers: "Staff",
  subject: "Subject",
  subjects: "Subject",
  course: "Subject",
  courses: "Subject",
  attendance: "Attendance",
  lectureattendance: "Attendance",
  leave: "Leave",
  leaves: "Leave",
  fee: "Fees",
  fees: "Fees",
  payment: "Fees",
  payments: "Fees",
  transaction: "Fees",
  transactions: "Fees",
  receipt: "Fees",
  receipts: "Fees",
  payroll: "Payroll",
  salary: "Payroll",
  admission: "Admission",
  admissions: "Admission",
  timetable: "Timetable",
  lessonplan: "LessonPlan",
  lessonplans: "LessonPlan",
  hostel: "Hostel",
  hostels: "Hostel",
  room: "Hostel",
  rooms: "Hostel",
  bed: "Hostel",
  beds: "Hostel",
  hostelallocation: "Hostel",
  deadstock: "DeadStock",
  deadstocks: "DeadStock",
  deadstocktransaction: "DeadStock",
  inventory: "DeadStock",
  department: "Department",
  departments: "Department",
  user: "User",
  users: "User",
  settings: "SystemSettings",
  systemsettings: "SystemSettings",
  report: "Reports",
  reports: "Reports",
  dashboard: "Dashboard",
  grade: "Exam",
  grades: "Exam",
  exam: "Exam",
  exams: "Exam",
}

/** Which module a legacy screen permission belongs to. */
export const PERMISSION_MODULE: Record<Permission, ModuleId> = {
  [Permission.VIEW_DASHBOARD]: "Dashboard",
  [Permission.MANAGE_USERS]: "User",
  [Permission.MANAGE_STUDENTS]: "Student",
  [Permission.MANAGE_STAFF]: "Staff",
  [Permission.MANAGE_SUBJECTS]: "Subject",
  [Permission.MANAGE_CLASSES]: "Student",
  [Permission.MANAGE_ATTENDANCE]: "Attendance",
  [Permission.MANAGE_PAYROLL]: "Payroll",
  [Permission.MANAGE_FEES]: "Fees",
  [Permission.PAY_FEES]: "Fees",
  [Permission.VIEW_REPORTS]: "Reports",
  [Permission.MANAGE_SETTINGS]: "SystemSettings",
  [Permission.MANAGE_LEAVES]: "Leave",
  [Permission.MARK_LEAVES]: "Leave",
  [Permission.MARK_ATTENDANCE]: "Attendance",
  [Permission.MANAGE_ADMISSION]: "Admission",
  [Permission.MANAGE_TIMETABLE]: "Timetable",
  [Permission.MANAGE_LESSON_PLAN]: "LessonPlan",
  [Permission.MANAGE_HOSTEL]: "Hostel",
  [Permission.MANAGE_INVENTORY]: "DeadStock",
}

/**
 * Roles that already work in each module today, taken from the page guards in the router.
 * These roles keep every button in the module; templates only ADD to what a role gives
 * (SUPER_ADMIN and DEVELOPER can do everything).
 */
export const MODULE_ROLES: Partial<Record<ModuleId, UserRole[]>> = {
  Student: [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK, UserRole.HEAD_TEACHER, UserRole.IT_ADMIN],
  Staff: [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK, UserRole.IT_ADMIN],
  Hostel: [UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.PRINCIPAL, UserRole.CLERK],
  DeadStock: [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK, UserRole.SCHOOL_TEACHER, UserRole.HEAD_TEACHER, UserRole.FACULTY, UserRole.IT_ADMIN],
  Department: [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK, UserRole.SCHOOL_TEACHER, UserRole.HEAD_TEACHER, UserRole.FACULTY, UserRole.IT_ADMIN],
  Fees: [UserRole.ADMIN, UserRole.CLERK, UserRole.IT_ADMIN, UserRole.PRINCIPAL],
  Payroll: [UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL],
  Admission: [UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL],
  Attendance: [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.HEAD_TEACHER, UserRole.SCHOOL_TEACHER, UserRole.HOD, UserRole.FACULTY],
  Timetable: [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK],
  LessonPlan: [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.HEAD_TEACHER],
}

export const isKnownSubject = (subject: string): boolean => {
  const key = String(subject).toLowerCase()
  return key === "all" || key === "*" || key in SUBJECT_ALIASES
}
