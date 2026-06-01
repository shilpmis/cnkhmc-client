import { Fees } from "@/pages/Fees";
import { EnumValues } from "zod";
import { ClassData, Division } from "./academic";
import { Quota } from "@/services/QuotaService";
import { AppliedConcessioinToStudent, FeesPlan, FeeStatus } from "./fees";

export enum StudentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
}

export interface StudentEnrollment {
  id: number;
  academic_session_id: number;
  division_id: number;
  student_id: number;
  quota_id: number | null;
  status: 'pursuing' | 'promoted' | 'failed' | 'drop' | 'migrated' | 'completed' | 'transfered' | 'suspended' | 'onboarded' | 'admission_cancel';
  is_new_admission: boolean;
  remarks: string | null;
  type: string;
  class?: Division; // here noted as class , actual
  student: Partial<Student>;
  quota?: Quota | null;
  fees_status?: FeeStatus;
  provided_concession?: AppliedConcessioinToStudent[];
}

export interface StudentMeta {
  aadhar_dise_no: number | null;
  birth_place: string | null;
  birth_place_in_guj: string | null;
  religion: string | null;
  religion_in_guj: string | null;
  caste: string | null;
  caste_in_guj: string | null;
  category: "ST" | "SC" | "OBC" | "OPEN" | null;
  // category_in_guj: string;
  admission_date: string | null;
  admission_class_id: number | null;
  secondary_mobile: number | null;
  privious_school: string | null;
  privious_school_in_guj: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  bank_name: string | null;
  account_no: number | null;
  IFSC_code: string | null;
  blood_group?: string | null;
  identification_mark?: string | null;
}

export interface Student {
  // enrollment_id: any;
  id: number;
  school_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  enrollment_code: string;
  first_name_in_guj: string | null;
  middle_name_in_guj: string | null;
  last_name_in_guj: string | null;
  gender: "Male" | "Female";
  gr_no: number;
  birth_date: string | null;
  primary_mobile: number;
  father_name: string | null;
  father_name_in_guj: string | null;
  mother_name: string | null;
  mother_name_in_guj: string | null;
  class_id: number;
  roll_number: number | null;
  aadhar_no: number | null;
  is_active: boolean;
  student_meta?: StudentMeta;
  academic_class: StudentEnrollment[];
}

export interface PageDetailsForStudents {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  first_page: number;
  first_page_url: string | null;
  last_page_url: string | null;
  next_page_url: string | null;
  previous_page_url: string | null;
}

export interface StudentEntry {
  students_data: Omit<
    Student,
    "id" | "student_meta" | "school_id" | "academic_class" | "enrollment_code"
  >;
  student_meta_data: StudentMeta;
}

export interface ReqBodyForOnBoardingStudent {
  first_name : string;
  middle_name : string | null;
  last_name : string;
  birth_date : string;
  class_id : number;
  gender : "Male" | "Female";
  division_id : number;
  primary_mobile : number;
  father_name : string | null;
  academic_session_id : number;
}

export interface UpdateStudent {
  students_data: Partial<Student>;
  student_meta_data: Partial<StudentMeta>;
}

export interface AddStudentsRequest {
  class_id: number;
  students: StudentEntry[];
}
export interface InquiriesForStudent {
  id: number;
  student_name: string;
  parent_name: string;
  contact_number: string;
  email: string;
  grade_applying: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  totalInquiries: number;
  pendingApplications: number;
  acceptedAdmissions: number;
  rejectedApplications: number;
  upcomingInterviews: number;
}

export interface AdmissionTrend {
  grade: string;
  inquiries: number;
}


export interface ReqBodyForStundetMigration {
  reason : string;
  migrated_class : number;
  migrated_division : number;
  is_migration_for_class : number;
}

export interface ReqBodyForDropStudent {
  reason : string;
}

export interface ReqBodyForStudentCompletion {
  reason : string;
}

export interface ReqBodyForStudentSuspension {
    reason: string,
    status : 'suspended' | 'remove_suspension',
}