import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";
import type {
  AssignedSubject,
  LectureAttendanceForDate,
  MarkAttendancePayload,
  LectureHistoryRecord,
  StudentSubjectSummary,
  StudentSubjectReportResponse,
  ClassStudentSummary,
  ClassSubjectReportResponse,
} from "@/types/lectureAttendance";

export const LectureAttendanceApi = createApi({
  reducerPath: "lectureAttendanceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // ── Marking ────────────────────────────────────────────────────────────
    getMySubjects: builder.query<{ data: AssignedSubject[] }, { academic_session?: number }>({
      query: ({ academic_session }) => ({
        url: `lecture-attendance/subjects${academic_session ? `?academic_session=${academic_session}` : ""}`,
        method: "GET",
      }),
    }),

    getLectureAttendanceForDate: builder.query<
      LectureAttendanceForDate,
      { division_id: number; subject_id: number; unix_date: number; academic_session: number }
    >({
      query: ({ division_id, subject_id, unix_date, academic_session }) => ({
        url: `lecture-attendance/${division_id}/${subject_id}/${unix_date}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),

    markLectureAttendance: builder.mutation<{ message: string; data: any }, MarkAttendancePayload>({
      query: (payload) => ({
        url: "lecture-attendance",
        method: "POST",
        body: payload,
      }),
    }),

    // ── History ────────────────────────────────────────────────────────────
    getLectureHistory: builder.query<
      { data: LectureHistoryRecord[] },
      { division_id: number; subject_id: number; academic_session: number }
    >({
      query: ({ division_id, subject_id, academic_session }) => ({
        url: `lecture-attendance/history/${division_id}/${subject_id}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),

    // ── Reports ────────────────────────────────────────────────────────────
    getStudentReport: builder.query<
      { data: StudentSubjectSummary[] },
      { student_id: number; academic_session: number }
    >({
      query: ({ student_id, academic_session }) => ({
        url: `lecture-attendance/report/student/${student_id}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),

    getStudentSubjectReport: builder.query<
      StudentSubjectReportResponse,
      { student_id: number; subject_id: number; academic_session: number }
    >({
      query: ({ student_id, subject_id, academic_session }) => ({
        url: `lecture-attendance/report/student/${student_id}/subject/${subject_id}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),

    getClassReport: builder.query<
      { data: ClassStudentSummary[] },
      { division_id: number; academic_session: number }
    >({
      query: ({ division_id, academic_session }) => ({
        url: `lecture-attendance/report/class/${division_id}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),

    getClassSubjectReport: builder.query<
      ClassSubjectReportResponse,
      { division_id: number; subject_id: number; academic_session: number }
    >({
      query: ({ division_id, subject_id, academic_session }) => ({
        url: `lecture-attendance/report/class/${division_id}/subject/${subject_id}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useLazyGetMySubjectsQuery,
  useLazyGetLectureAttendanceForDateQuery,
  useMarkLectureAttendanceMutation,
  useLazyGetLectureHistoryQuery,
  useLazyGetStudentReportQuery,
  useLazyGetStudentSubjectReportQuery,
  useLazyGetClassReportQuery,
  useLazyGetClassSubjectReportQuery,
} = LectureAttendanceApi;

// ── Export helpers (direct URL trigger) ────────────────────────────────────
export const getHistoryExportUrl = (division_id: number, subject_id: number, academic_session: number) =>
  `${baseUrl.serverUrl}api/v1/lecture-attendance/export/history/${division_id}/${subject_id}?academic_session=${academic_session}&token=${localStorage.getItem("access_token")}`;

export const getReportExportUrl = (division_id: number, academic_session: number, subject_id?: number) => {
  const base = `${baseUrl.serverUrl}api/v1/lecture-attendance/export/report/${division_id}?academic_session=${academic_session}`;
  return subject_id ? `${base}&subject_id=${subject_id}` : base;
};
