import { Division } from "./academic";
import { StaffEnrollmentForPayroll } from "./payroll";
import { StaffEnrollment } from "./staff";
import { AcademicSession } from "./user";

export interface SchoolSubject {
    id: number;
    name: string;
    description: string;
    code: string;
    academic_session_id: string;
    status: "Active" | "Inactive";
    year?: string;
}

export interface SubjectDivisionStaffMaster {
    id: number;
    subjects_division_id: number;
    staff_enrollment_id: number;
    notes: string | null
    status: 'Active' | 'Inactive'
    staff_enrollment: StaffEnrollment
}

export interface SubjectDivisionMaster {
    id: number;
    subject_id: number;
    division_id: number;
    academic_session_id: number;
    code_for_division: string;
    description: string;
    status: "Active" | "Inactive";
    subject?: SchoolSubject
    division?: Division
    academic_session?: AcademicSession
    Staff_enrollment?: StaffEnrollment
    subject_staff_divisioin_master: SubjectDivisionStaffMaster[]
}

// timetable 

export interface TimeTableConfigForSchool {
    id: number;
    academic_session_id: number;
    max_periods_per_day: number;
    default_period_duration: number;
    allowed_period_durations: number[];
    lab_enabled: boolean;
    pt_enabled: boolean;
    period_gap_duration: number | null;
    teacher_max_periods_per_day: number | null;
    teacher_max_periods_per_week: number | null;
    is_lab_included_in_max_periods: boolean;
    lab_config: labConfig[];
    class_day_config: ClassDayConfigForTimeTable[];
}

export interface labConfig {
    id: number;
    school_timetable_config_id: number;
    name: string;
    max_capacity: number; // in term of class , how many clas can attend lab at one go
    availability_per_day: number | null
}

export interface ClassDayConfigForTimeTable {
    id: number;
    school_timetable_config_id: number;
    class_id: number;
    day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
    allowed_durations: number[]
    max_consecutive_periods: number | null;
    total_breaks: number | null;
    break_durations: number[] | null
    day_start_time: string;
    day_end_time: string;
    is_working_day: boolean;
    period_config : PeriodsConfig[]
}


export interface PeriodsConfig {
    id : number;
    class_day_config_id : number;
    division_id : number; 
    period_order : number;
    start_time : string;
    end_time : string;
    is_break : boolean;
    subjects_division_masters_id : number | null ;
    staff_enrollment_id  : number | null
    lab_id : number | null
    is_pt : boolean
    is_free_period : boolean
    batch_name: string | null;
}


export interface TypeForCretePeriodsConfigForADay {    
    class_day_config_id : number;
    division_id : number; 
    periods : {
        period_order : number;
        start_time : string;
        end_time : string;
        is_break : boolean;
        subjects_division_masters_id : number | null ;
        staff_enrollment_id  : number | null
        lab_id : number | null
        is_pt : boolean
        is_free_period : boolean
        batch_name: string | null;
    }[]
}

export interface TypeForUpdatePeriodsConfigForADay {    
    class_day_config_id : number;
    division_id : number; 
        periods : Partial<Omit<PeriodsConfig , 'class_day_config_id' | 'division_id' | 'period_order'>>[]
}

export interface TypeForUpdatePeriodsConfigForAWeek {
    division_id: number;
    days: {
        class_day_config_id: number;
        periods: Partial<Omit<PeriodsConfig, 'class_day_config_id' | 'division_id' | 'period_order'>>[];
    }[];
}

export interface WeeklyTimeTableForDivision {
    class_day_config_id : number;
    periods : {
        period_order : number;
        start_time : string;
        end_time : string;
        is_break : boolean;
        subjects_division_masters_id : number | null ;
        staff_enrollment_id  : number | null
        lab_id : number | null
        is_pt : boolean
        is_free_period : boolean
        batch_name: string | null;
    }[]
}; 
     

export interface TimeTableForDivisionItem extends ClassDayConfigForTimeTable {
    periods: PeriodsConfig[];
    division_id: number;
    subject_id: number;
    notes?: string;
}

export type TimeTableForDivision = TimeTableForDivisionItem[];