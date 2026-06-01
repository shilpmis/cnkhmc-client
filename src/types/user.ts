import { StaffType } from "./staff";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
}

export interface AcademicSession {
  id: number;
  uuid: string;
  school_id: number;
  session_name: string;
  start_month: string;
  end_month: string;
  start_year: string;
  end_year: string;
  is_active: boolean;
}

export interface School {
  id: number;
  name: string;
  organization_id: number;
  email: string;
  branch_code: string;
  contact_number: 9876543210;
  status: string;
  established_year: string;
  school_type: string;
  address: string;
  district: string;
  city: string;
  state: string;
  school_logo: string;
  pincode: number;
  academicSessions: AcademicSession[];
}
export interface User {
  id: number;
  school_id: number;
  email: string;
  username: string | null;
  name: string;
  role: string;
  system_role?: UserRole | null;
  role_id: number;
  is_active: boolean;
  staff_id: number | null;
  permissions: string[];
  school: School;
  staff: StaffType | null;
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  PRINCIPAL = "PRINCIPAL",
  HEAD_TEACHER = "HEAD_TEACHER",
  CLERK = "CLERK",
  IT_ADMIN = "IT_ADMIN",
  SCHOOL_TEACHER = "SCHOOL_TEACHER",
  ORG_ADMIN = "ORG_ADMIN",
  HOD = "HOD",
  FACULTY = "FACULTY",
  DEVELOPER = "DEVELOPER",
}

export enum Permission {
  VIEW_DASHBOARD = "VIEW_DASHBOARD",
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_STUDENTS = "MANAGE_STUDENTS",
  MANAGE_STAFF = "MANAGE_STAFF",
  MANAGE_SUBJECTS = "MANAGE_SUBJECTS",
  MANAGE_CLASSES = "MANAGE_CLASSES",
  MANAGE_ATTENDANCE = "MANAGE_ATTENDANCE",
  MANAGE_PAYROLL = "MANAGE_PAYROLL",
  MANAGE_FEES = "MANAGE_FEES",
  PAY_FEES = "PAY_FEES",
  VIEW_REPORTS = "VIEW_REPORTS",
  MANAGE_SETTINGS = "MANAGE_SETTINGS",
  MANAGE_LEAVES = "MANAGE_LEAVES",
  MARK_LEAVES = "MARK_LEAVES",
  MARK_ATTENDANCE = "MARK_ATTENDANCE",
  MANAGE_ADMISSION = "MANAGE_ADMISSION",
  MANAGE_TIMETABLE = "MANAGE_TIMETABLE",
  MANAGE_LESSON_PLAN = "MANAGE_LESSON_PLAN",
}

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_USERS,
    Permission.MANAGE_STUDENTS,
    Permission.MANAGE_STAFF,
    Permission.MANAGE_SUBJECTS,
    Permission.MANAGE_CLASSES,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_PAYROLL,
    Permission.MANAGE_FEES,
    Permission.PAY_FEES,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_LEAVES,
    Permission.MARK_LEAVES,
    Permission.MARK_ATTENDANCE,
    Permission.MANAGE_ADMISSION,
    Permission.MANAGE_TIMETABLE,
    Permission.MANAGE_LESSON_PLAN,
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_USERS,
    Permission.MANAGE_STUDENTS,
    Permission.MANAGE_STAFF,
    Permission.MANAGE_CLASSES,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_PAYROLL,
    Permission.MANAGE_FEES,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_LEAVES,
    Permission.MANAGE_ADMISSION,
    Permission.MANAGE_SUBJECTS,
    Permission.MARK_ATTENDANCE,
    Permission.MARK_LEAVES,
    Permission.MANAGE_TIMETABLE,
    Permission.MANAGE_LESSON_PLAN,
  ],
  [UserRole.PRINCIPAL]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_STUDENTS,
    Permission.MANAGE_STAFF,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_FEES,
    Permission.MANAGE_CLASSES,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_ADMISSION,
    Permission.MANAGE_SUBJECTS,
    Permission.MANAGE_TIMETABLE,
    Permission.MANAGE_LESSON_PLAN,
  ],
  [UserRole.HEAD_TEACHER]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_STUDENTS,
    Permission.MANAGE_SUBJECTS
  ],
  [UserRole.CLERK]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_FEES,
    Permission.MANAGE_ADMISSION,
    Permission.MANAGE_LEAVES,
    Permission.PAY_FEES,
    Permission.MANAGE_SUBJECTS
  ],
  [UserRole.IT_ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_STUDENTS,
    Permission.MANAGE_STAFF,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_FEES,
    Permission.MANAGE_CLASSES,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_ADMISSION,
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_SUBJECTS,
  ],
  [UserRole.SCHOOL_TEACHER]: [
    Permission.VIEW_DASHBOARD,
    Permission.MARK_LEAVES,
    Permission.MARK_ATTENDANCE,
    Permission.MANAGE_SUBJECTS
  ],
  [UserRole.ORG_ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_REPORTS
  ],
  [UserRole.HOD]: [
    Permission.VIEW_DASHBOARD,
    Permission.MARK_LEAVES,
    Permission.MANAGE_LEAVES,
    Permission.MARK_ATTENDANCE,
    Permission.MANAGE_SUBJECTS,
    Permission.MANAGE_LESSON_PLAN,
  ],
  [UserRole.FACULTY]: [
    Permission.VIEW_DASHBOARD,
    Permission.MARK_LEAVES,
    Permission.MARK_ATTENDANCE,
    Permission.MANAGE_SUBJECTS,
  ],
  [UserRole.DEVELOPER]: Object.values(Permission),
};

export interface ApiResponse<T> {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string;
    lastPageUrl: string;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: T[];
}

export type UserApiResponse = ApiResponse<User>;
