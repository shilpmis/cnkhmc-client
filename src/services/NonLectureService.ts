import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";
import ApiService from "@/services/ApiService";

/** One line of the lesson plan sheet: Sl. No., Competency, Miller's Level, Content, SLO, Bloom's, Priority, T-L, Assessment, Integration */
export interface NonLecturePlanRowData {
  id?: number;
  topic_id?: number;
  row_order?: number;
  lesson_plan_number?: string | null;
  sl_no?: string | null;
  competency?: string | null;
  miller?: string | null;
  content?: string | null;
  outcome?: string | null;
  bloom?: string | null;
  priority?: string | null;
  tl_mm?: string | null;
  assessment?: string | null;
  integration?: string | null;
  required_hours?: number;
  is_completed?: boolean;
  completed_hours?: number;
  conclusion?: string | null;
  reference_book?: string | null;
  // added when the plan is read back
  covered_count?: number;
  covered_batches?: string[];
  last_covered_on?: string | null;
}

export interface NonLectureTopic {
  id?: number;
  template_id?: number;
  topic_order: number;
  title: string;
  hours: number;
  activity_type?: string;
  learning_objectives?: string;
  remarks?: string;
  completed_hours?: number;
  is_completed?: boolean;
  rows?: NonLecturePlanRowData[];
}

export interface NonLecturePlanTopicData {
  id?: number;
  title: string;
  topic_order?: number;
  hours: number;
  assigned_staff_ids?: number[];
  required_hours?: number;
  logged_hours?: number;
  is_completed?: boolean;
  rows_total?: number;
  rows_covered?: number;
  percent?: number;
  rows: NonLecturePlanRowData[];
}

export interface NonLecturePlanView {
  template: {
    id: number;
    title: string;
    class_id?: number | null;
    class_name?: string | null;
    subject_id?: number | null;
    subject_name?: string | null;
    academic_session_id?: number | null;
    session_label?: string;
    heading: string;
    teachers: string[];
  };
  topics: NonLecturePlanTopicData[];
  summary: {
    topics: number;
    topics_completed: number;
    rows: number;
    rows_covered: number;
    percent: number;
    logged_hours: number;
    required_hours: number;
  };
}

export interface NonLectureAssignment {
  id: number;
  template_id: number;
  staff_id: number;
  class_id?: number;
  division_id?: number;
  batch_id?: number;
  batch_name?: string;
  academic_session_id?: number;
  status: string;
  notes?: string;
  template?: NonLectureTemplate;
  staff?: any;
  class?: any;
  division?: any;
  batch?: any;
  logged_hours?: number;
  target_hours?: number;
  completion_percentage?: number;
  logged_sessions_count?: number;
  covered_row_ids?: number[];
  rows_total?: number;
  rows_covered?: number;
  logs?: NonLectureLogEntry[];
  created_at?: string;
}

export interface NonLectureLogEntry {
  id: number;
  template_id: number;
  assignment_id?: number | null;
  topic_id?: number | null;
  staff_id: number;
  date: string;
  hours_spent: number;
  batch_name?: string | null;
  students_count?: number | null;
  activity_details: string;
  learning_outcomes?: string | null;
  clinical_cases?: string | null;
  remarks?: string | null;
  row_ids?: number[];
  conclusion?: string | null;
  reference_book?: string | null;
  lesson_plan_number?: string | null;
  template?: NonLectureTemplate;
  topic?: NonLectureTopic;
  staff?: any;
  created_at?: string;
}

export interface NonLectureTemplate {
  id: number;
  school_id?: number;
  department_id?: number | null;
  class_id?: number | null;
  subject_id?: number | null;
  academic_session_id?: number | null;
  title: string;
  code?: string | null;
  activity_type: string;
  total_hours: number;
  description?: string | null;
  is_active: boolean;
  department?: any;
  class?: any;
  topics?: NonLectureTopic[];
  assignments?: NonLectureAssignment[];
  logs?: NonLectureLogEntry[];
  topics_count?: number;
  assignments_count?: number;
  logs_count?: number;
  total_logged_hours?: number;
  pdf_config?: NonLecturePdfConfig | null;
  created_at?: string;
  updated_at?: string;
}

export interface NonLecturePdfColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  width?: number;
}

export interface NonLecturePdfSignatureConfig {
  key: string;
  label: string;
  enabled: boolean;
}

export interface NonLecturePdfConfig {
  institutionName: string;
  subHeader: string;
  themeColor: string;
  orientation: "landscape" | "portrait";
  pageSize: "a4" | "letter";
  tableDensity: "compact" | "normal" | "spacious";
  
  // Metadata fields
  showCollegeHeader: boolean;
  showCourseTitle: boolean;
  showCourseCode: boolean;
  showActivityType: boolean;
  showClass: boolean;
  showDepartment: boolean;
  showAcademicSession: boolean;
  showHoursProgress: boolean;
  showGuidelines: boolean;

  // Columns
  columns: {
    serialNo: NonLecturePdfColumnConfig;
    date: NonLecturePdfColumnConfig;
    faculty: NonLecturePdfColumnConfig;
    topic: NonLecturePdfColumnConfig;
    hours: NonLecturePdfColumnConfig;
    batch: NonLecturePdfColumnConfig;
    studentsCount: NonLecturePdfColumnConfig;
    activityDetails: NonLecturePdfColumnConfig;
    clinicalCases: NonLecturePdfColumnConfig;
    learningOutcomes: NonLecturePdfColumnConfig;
    remarks: NonLecturePdfColumnConfig;
  };

  // Signatures
  signatures: {
    teacher: NonLecturePdfSignatureConfig;
    hod: NonLecturePdfSignatureConfig;
    principal: NonLecturePdfSignatureConfig;
    coordinator: NonLecturePdfSignatureConfig;
  };

  // Footer
  showPageNumbers: boolean;
  showGenerationDate: boolean;
  customFooterNote?: string;
}

export const DEFAULT_NON_LECTURE_PDF_CONFIG: NonLecturePdfConfig = {
  institutionName: "C. N. Kothari Homoeopathic Medical College & Research Centre - VYARA",
  subHeader: "NON-LECTURE / CLINICAL & PRACTICAL LESSON PLAN LOG REPORT",
  themeColor: "#1e293b",
  orientation: "landscape",
  pageSize: "a4",
  tableDensity: "normal",

  showCollegeHeader: true,
  showCourseTitle: true,
  showCourseCode: true,
  showActivityType: true,
  showClass: true,
  showDepartment: true,
  showAcademicSession: true,
  showHoursProgress: true,
  showGuidelines: true,

  columns: {
    serialNo: { key: "serialNo", label: "S.N", enabled: true, width: 10 },
    date: { key: "date", label: "Date", enabled: true, width: 22 },
    faculty: { key: "faculty", label: "Faculty", enabled: true, width: 34 },
    topic: { key: "topic", label: "Curriculum Unit / Topic", enabled: true, width: 52 },
    hours: { key: "hours", label: "Hrs", enabled: true, width: 12 },
    batch: { key: "batch", label: "Batch", enabled: true, width: 18 },
    studentsCount: { key: "studentsCount", label: "Students", enabled: false, width: 16 },
    activityDetails: { key: "activityDetails", label: "Activity Details & Work Done", enabled: true, width: 66 },
    clinicalCases: { key: "clinicalCases", label: "Cases Discussed", enabled: true, width: 30 },
    learningOutcomes: { key: "learningOutcomes", label: "Outcomes / Competencies", enabled: true, width: 30 },
    remarks: { key: "remarks", label: "Remarks", enabled: false, width: 22 },
  },

  signatures: {
    teacher: { key: "teacher", label: "Teacher Signature", enabled: true },
    hod: { key: "hod", label: "HOD Signature", enabled: true },
    principal: { key: "principal", label: "Principal Signature", enabled: true },
    coordinator: { key: "coordinator", label: "Course Coordinator", enabled: false },
  },

  showPageNumbers: true,
  showGenerationDate: true,
  customFooterNote: "Official Teaching, Demonstration & Clinical Posting Record | Homoeopathic Medical Education Regulations",
};

export const NonLectureApi = createApi({
  reducerPath: "nonLectureApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`);
      return headers;
    },
  }),
  tagTypes: ["NonLectureTemplate", "NonLectureTeacherSession", "NonLectureLog", "NonLecturePdfSettings", "NonLecturePlan"],
  endpoints: (builder) => ({
    getNonLectureTemplates: builder.query<
      { success: boolean; data: NonLectureTemplate[] },
      {
        school_id?: number;
        department_id?: number;
        class_id?: number;
        academic_session_id?: number;
        include_inactive?: boolean;
      }
    >({
      query: (params) => ({
        url: `non-lecture-templates`,
        method: "GET",
        params,
      }),
      providesTags: ["NonLectureTemplate"],
    }),

    getNonLectureTemplateById: builder.query<{ success: boolean; data: NonLectureTemplate }, { id: number }>({
      query: ({ id }) => ({
        url: `non-lecture-templates/${id}`,
        method: "GET",
      }),
      providesTags: ["NonLectureTemplate"],
    }),

    createNonLectureTemplate: builder.mutation<
      { success: boolean; data: NonLectureTemplate; message?: string },
      Partial<NonLectureTemplate> & { topics?: Partial<NonLectureTopic>[] }
    >({
      query: (body) => ({
        url: `non-lecture-templates`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["NonLectureTemplate"],
    }),

    updateNonLectureTemplate: builder.mutation<
      { success: boolean; data: NonLectureTemplate; message?: string },
      Partial<NonLectureTemplate> & { id: number; topics?: Partial<NonLectureTopic>[] }
    >({
      query: ({ id, ...body }) => ({
        url: `non-lecture-templates/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["NonLectureTemplate", "NonLectureTeacherSession"],
    }),

    deleteNonLectureTemplate: builder.mutation<{ success: boolean; message?: string }, { id: number }>({
      query: ({ id }) => ({
        url: `non-lecture-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["NonLectureTemplate", "NonLectureTeacherSession"],
    }),

    assignTeachers: builder.mutation<
      { success: boolean; message?: string; data?: any },
      {
        template_id: number;
        staff_ids: number[];
        class_id?: number;
        division_id?: number;
        batch_id?: number;
        batch_name?: string;
        academic_session_id?: number;
        notes?: string;
      }
    >({
      query: (body) => ({
        url: `non-lecture-templates/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["NonLectureTemplate", "NonLectureTeacherSession"],
    }),

    removeAssignment: builder.mutation<{ success: boolean; message?: string }, { id: number }>({
      query: ({ id }) => ({
        url: `non-lecture-templates/assignments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["NonLectureTemplate", "NonLectureTeacherSession"],
    }),

    getMyAssignedSessions: builder.query<
      { success: boolean; data: NonLectureAssignment[] },
      { academic_session_id?: number; staff_id?: number } | void
    >({
      query: (params) => ({
        url: `non-lecture-templates/my-sessions`,
        method: "GET",
        params: params || {},
      }),
      providesTags: ["NonLectureTeacherSession"],
    }),

    getNonLecturePlan: builder.query<{ success: boolean; data: NonLecturePlanView }, { template_id: number }>({
      query: ({ template_id }) => ({
        url: `non-lecture-templates/${template_id}/plan`,
        method: "GET",
      }),
      providesTags: ["NonLecturePlan"],
    }),

    saveNonLecturePlan: builder.mutation<
      { success: boolean; message?: string; data: NonLecturePlanView },
      { template_id: number; topics: NonLecturePlanTopicData[]; removed_topic_ids?: number[] }
    >({
      query: ({ template_id, ...body }) => ({
        url: `non-lecture-templates/${template_id}/plan`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["NonLecturePlan", "NonLectureTemplate", "NonLectureTeacherSession"],
    }),

    uploadNonLecturePlan: builder.mutation<
      { success: boolean; message?: string; warnings?: string[]; data: NonLecturePlanView },
      { template_id: number; file: File; replace_rows?: boolean }
    >({
      query: ({ template_id, file, replace_rows = true }) => {
        const form = new FormData();
        form.append("file", file);
        form.append("replace_rows", String(replace_rows));
        return { url: `non-lecture-templates/${template_id}/plan/upload`, method: "POST", body: form };
      },
      invalidatesTags: ["NonLecturePlan", "NonLectureTemplate", "NonLectureTeacherSession"],
    }),

    logActivity: builder.mutation<
      { success: boolean; data: NonLectureLogEntry; message?: string },
      {
        template_id: number;
        assignment_id?: number | null;
        topic_id?: number | null;
        staff_id?: number;
        date: string;
        hours_spent: number;
        batch_name?: string | null;
        students_count?: number | null;
        activity_details?: string;
        learning_outcomes?: string | null;
        clinical_cases?: string | null;
        remarks?: string | null;
        row_ids?: number[];
        conclusion?: string | null;
        reference_book?: string | null;
        lesson_plan_number?: string | null;
        periods_config_id?: number | null;
      }
    >({
      query: (body) => ({
        url: `non-lecture-templates/log-activity`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["NonLectureTemplate", "NonLectureTeacherSession", "NonLectureLog", "NonLecturePlan"],
    }),

    getLogs: builder.query<
      { success: boolean; data: NonLectureLogEntry[] },
      { template_id?: number; staff_id?: number; from_date?: string; to_date?: string } | void
    >({
      query: (params) => ({
        url: `non-lecture-templates/logs`,
        method: "GET",
        params: params || {},
      }),
      providesTags: ["NonLectureLog"],
    }),

    deleteLog: builder.mutation<{ success: boolean; message?: string }, { id: number }>({
      query: ({ id }) => ({
        url: `non-lecture-templates/logs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["NonLectureTemplate", "NonLectureTeacherSession", "NonLectureLog", "NonLecturePlan"],
    }),

    getPdfSettings: builder.query<{ success: boolean; data: NonLecturePdfConfig | null }, { school_id?: number } | void>({
      query: (params) => ({
        url: `non-lecture-templates/pdf-settings`,
        method: "GET",
        params: params || {},
      }),
      providesTags: ["NonLecturePdfSettings"],
    }),

    savePdfSettings: builder.mutation<
      { success: boolean; message?: string; data?: NonLecturePdfConfig },
      { school_id?: number; config: NonLecturePdfConfig }
    >({
      query: (body) => ({
        url: `non-lecture-templates/pdf-settings`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["NonLecturePdfSettings", "NonLectureTemplate"],
    }),
  }),
});

export const {
  useGetNonLectureTemplatesQuery,
  useGetNonLectureTemplateByIdQuery,
  useCreateNonLectureTemplateMutation,
  useUpdateNonLectureTemplateMutation,
  useDeleteNonLectureTemplateMutation,
  useAssignTeachersMutation,
  useRemoveAssignmentMutation,
  useGetMyAssignedSessionsQuery,
  useLogActivityMutation,
  useGetNonLecturePlanQuery,
  useSaveNonLecturePlanMutation,
  useUploadNonLecturePlanMutation,
  useGetLogsQuery,
  useDeleteLogMutation,
  useGetPdfSettingsQuery,
  useSavePdfSettingsMutation,
} = NonLectureApi;

export default NonLectureApi;

function saveBlob(data: BlobPart, fileName: string) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** The blank lesson plan sheet with the heads (opens the same layout the college uses). */
export async function downloadNonLecturePlanTemplate(templateId?: number) {
  const response = await ApiService.get("non-lecture-templates/plan-template", {
    responseType: "blob",
    params: templateId ? { template_id: templateId } : {},
  });
  saveBlob(response.data, "non-lecture-lesson-plan-template.xlsx");
}

/** The plan as an Excel sheet or a PDF, optionally for one lesson plan number or topic. */
export async function exportNonLecturePlan(
  templateId: number,
  format: "xlsx" | "pdf",
  options: { lp_number?: string; topic_id?: number } = {}
) {
  const response = await ApiService.get(`non-lecture-templates/${templateId}/plan/export`, {
    responseType: "blob",
    params: { format, ...options },
    timeout: 60000,
  });
  saveBlob(response.data, `non-lecture-lesson-plan.${format}`);
}

/** The non-lecture plans of a subject, as the teacher of a timetable period may log against them. */
export async function fetchNonLecturePlansForSubject(subjectId: number): Promise<NonLectureAssignment[]> {
  const response = await ApiService.get(`non-lecture-templates/by-subject/${subjectId}`);
  return response.data?.data || [];
}
