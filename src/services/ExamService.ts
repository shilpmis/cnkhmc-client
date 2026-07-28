import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";

export interface ExamMaster {
  id: number;
  name: string;
  description: string | null;
  school_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamSchedule {
  id: number;
  exam_master_id: number;
  class_id: number;
  division_id: number;
  start_date: string;
  end_date: string;
  status: string;
  school_id: number;
  created_at: string;
  updated_at: string;
}

export interface ExamSubject {
  id: number;
  exam_schedule_id: number;
  subject_id: number;
  exam_date: string;
  start_time: string;
  end_time: string;
  max_marks: number;
  passing_marks: number;
  created_at: string;
  updated_at: string;
}

export const ExamApi = createApi({
  reducerPath: "examApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`);
      return headers;
    },
  }),
  tagTypes: ["ExamMaster", "ExamSchedule", "ExamSubject"],
  endpoints: (builder) => ({
    getExamMasters: builder.query<{ success: boolean, data: ExamMaster[] }, { school_id: number }>({
      query: ({ school_id }) => ({
        url: `/exam-masters?school_id=${school_id}`,
        method: "GET",
      }),
      providesTags: ["ExamMaster"],
    }),
    createExamMaster: builder.mutation<{ success: boolean, data: ExamMaster }, Partial<ExamMaster>>({
      query: (body) => ({
        url: `/exam-masters`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExamMaster"],
    }),
    updateExamMaster: builder.mutation<{ success: boolean, data: ExamMaster }, Partial<ExamMaster> & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `/exam-masters/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ExamMaster"],
    }),
    deleteExamMaster: builder.mutation<{ success: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `/exam-masters/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExamMaster"],
    }),

    getExamSchedules: builder.query<{ success: boolean, data: ExamSchedule[] }, { school_id: number }>({
      query: ({ school_id }) => ({
        url: `/exam-schedules?school_id=${school_id}`,
        method: "GET",
      }),
      providesTags: ["ExamSchedule"],
    }),
    createExamSchedule: builder.mutation<{ success: boolean, data: ExamSchedule }, Partial<ExamSchedule>>({
      query: (body) => ({
        url: `/exam-schedules`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExamSchedule"],
    }),
    updateExamSchedule: builder.mutation<{ success: boolean, data: ExamSchedule }, Partial<ExamSchedule> & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `/exam-schedules/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ExamSchedule"],
    }),
    deleteExamSchedule: builder.mutation<{ success: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `/exam-schedules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExamSchedule"],
    }),

    getExamSubjects: builder.query<{ success: boolean, data: ExamSubject[] }, { exam_schedule_id: number }>({
      query: ({ exam_schedule_id }) => ({
        url: `/exam-subjects?exam_schedule_id=${exam_schedule_id}`,
        method: "GET",
      }),
      providesTags: ["ExamSubject"],
    }),
    createExamSubject: builder.mutation<{ success: boolean, data: ExamSubject }, Partial<ExamSubject>>({
      query: (body) => ({
        url: `/exam-subjects`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExamSubject"],
    }),
    updateExamSubject: builder.mutation<{ success: boolean, data: ExamSubject }, Partial<ExamSubject> & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `/exam-subjects/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ExamSubject"],
    }),
    deleteExamSubject: builder.mutation<{ success: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `/exam-subjects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExamSubject"],
    }),
  }),
});

export const {
  useGetExamMastersQuery,
  useCreateExamMasterMutation,
  useUpdateExamMasterMutation,
  useDeleteExamMasterMutation,
  useGetExamSchedulesQuery,
  useCreateExamScheduleMutation,
  useUpdateExamScheduleMutation,
  useDeleteExamScheduleMutation,
  useGetExamSubjectsQuery,
  useCreateExamSubjectMutation,
  useUpdateExamSubjectMutation,
  useDeleteExamSubjectMutation,
} = ExamApi;
