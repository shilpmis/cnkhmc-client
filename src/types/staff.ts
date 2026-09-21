import { AcademicClasses, Division } from "./academic";
import { AssignedClasses } from "./class";

export enum StaffStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
}

export interface StaffRole {
  id: number;
  school_id: number;
  role: string;
  is_teaching_role: boolean;
  permissions: object;
  working_hours: number;
}

export interface RoleType {
  id: number;
  school_id: number;
  role: string;
  permissions: JSON;
  is_teaching_role: boolean;
}

export interface StaffEnrollment {
  id: number;
  academic_session_id: number;
  staff_id: number;
  status: 'Retained' | 'Transfer' | 'Resigned' | 'New-Joiner'
  remarks: string | null;
  staff?: Partial<StaffType>;
}

export interface StaffType {
  id: number;
  staff_enrollment_id: number;
  academic_session_id: number;
  status: 'Retained' | 'Transfer' | 'Resigned' | 'New-Joiner'
  school_id: number;
  employee_code: string;
  is_teaching_role: boolean;
  staff_role_id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  first_name_in_guj: string;
  middle_name_in_guj: string;
  last_name_in_guj: string;
  gender: "Male" | "Female";
  birth_date: Date | null;
  marital_status: string | null;
  mobile_number: number | string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: number | null;
  qualification: string | null;
  subject_specialization: string | null;
  joining_date: Date | null;
  employment_status: string;
  experience_years: number | null;
  aadhar_no: number | null;
  pan_card_no: string | null;
  epf_no: string | null;
  epf_uan_no: string | null;
  blood_group: string | null;
  religion: string | null;
  religion_in_guj: string | null;
  caste: string | null;
  caste_in_guj: string | null;
  category: "ST" | "SC" | "OBC" | "OPEN" | null;
  nationality: string | null;
  address: string | null;
  permanent_address?: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postal_code: number | null;
  bank_name: string | null;
  account_no: number | null;
  IFSC_code: string | null;
  profile_photo: null;
  is_active: boolean;
  is_teching_staff: boolean;
  role: string;
  working_hours: number | null;
  assigend_classes: AssignedClasses[];
  salary?: any;
  role_type?: RoleType;
  enrollments?: StaffEnrollment[];

  // New Fields
  ayush_id_no?: string | null;
  teacher_code?: string | null;
  state_council_reg_no?: string | null;
  ayush_registration_no?: string | null;
  date_of_registration?: Date | string | null;
  university_appointment_letter_no?: string | null;
  university_appointment_date?: Date | string | null;
  university_approval_letter_no?: string | null;
  university_approval_date?: Date | string | null;
  uni_approval_number?: string | null;
  uni_approval_date?: Date | string | null;
  ug_degree?: string | null;
  ug_passing_university?: string | null;
  ug_passing_year?: number | null;
  pg_degree?: string | null;
  pg_passing_university?: string | null;
  pg_passing_year?: number | null;
  diploma_degree?: string | null;
  diploma_council?: string | null;
  diploma_passing_year?: number | null;
  other_degree?: string | null;
  other_passing_university?: string | null;
  other_passing_year?: number | null;
  area_of_expertise?: string | null;
  bank_branch_name?: string | null;
  pay_scale?: string | null;
  retirement_age?: number | null;
  resignation_date?: Date | string | null;
  retirement_date?: Date | string | null;
  staff_type?: string | null;
  staff_category?: string | null;
  designation?: string | null;
  department?: string | null;
  department_id?: number | null;
  leave_policy_ids?: number[];
  staff_experiences?: StaffExperience[];
  letters?: StaffLetter[];
}

export interface StaffLetter {
  id?: number;
  staff_id?: number;
  letter_type: string;
  letter_type_id?: number | null;
  letter_no?: string | null;
  letter_date?: Date | string | null;
  remarks?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface StaffExperience {
  id: number;
  staff_id: number;
  post_name: string;
  from_date: Date | string | null;
  to_date: Date | string | null;
  department: string | null;
  institute_name: string | null;
  appointment_regulation: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export type CategoryType = "ST" | "SC" | "OBC" | "OPEN";
export type EmploymentStatusType = "Permanent" | "Trial_Period" | "Resigned";

export interface StaffConfiguration {
  id: number;
  school_id: number;
  config_type: 'STAFF_TYPE' | 'STAFF_CATEGORY' | 'DESIGNATION' | 'EMPLOYMENT_STATUS' | 'LETTER_TYPE' | 'SUBJECT_SPECIALIZATION' | 'QUALIFICATION';
  name: string;
  parent_id: number | null;
  parent?: StaffConfiguration;
  children?: StaffConfiguration[];
}
