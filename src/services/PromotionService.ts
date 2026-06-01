import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";

// Define types for the API responses and requests
interface Student {
  id: number;
  academic_session_id: number;
  division_id: number;
  student_id: number;
  status: string;
  class: {
    id: number;
    class_id: number;
    division: string;
    aliases: string | null;
  };
  student: {
    id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    gr_no: number;
    roll_number: number;
    gender: string;
    birth_date: string;
    primary_mobile: number;
    father_name: string;
    mother_name: string;
    is_active: number;
  };
}

interface StudentsResponse {
  success: boolean;
  data: {
    students: Student[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      first_page: number;
      first_page_url: string;
      last_page_url: string;
      next_page_url: string | null;
      previous_page_url: string | null;
    };
  };
}

// Update the PromoteStudentsRequest interface to include the status field
interface PromoteStudentsRequest {
  source_academic_session_id: number;
  target_academic_session_id: number;
  target_class_id: number;
  target_division_id: number | null;
  student_ids: number[];
  status?: string;
}

// New interface for single student promotion
interface PromoteSingleStudentRequest {
  source_academic_session_id: number;
  target_academic_session_id: number;
  source_division_id: number;
  target_division_id: number;
  student_id: number;
  status: string;
  remarks: string;
}

interface HoldBackStudentRequest {
  student_id: number;
  remark: string;
  source_academic_session_id: number;
  target_academic_session_id: number;
}

interface PromotionHistoryResponse {
  success: boolean;
  data: any[]; // Define a more specific type if you know the structure
}

export const PromotionApi = createApi({
  reducerPath: "PromotionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set(
        "Authorization",
        `Bearer ${localStorage.getItem("access_token")}`
      );
      headers.set("Accept", "*/*");
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Get students for promotion
    getStudentsForPromotion: builder.query<
      StudentsResponse,
      {
        academic_session_id: number;
        class_id?: number;
        division_id?: number;
        limit?: number;
        page?: number;
      }
    >({
      query: ({
        academic_session_id,
        class_id,
        division_id,
        limit = 10,
        page = 1,
      }) => {
        const url = `students-for-permotion?limit=${limit}${
          page ? `&page=${page}` : ""
        }`;
        return {
          url,
          method: "POST",
          body: {
            academic_session_id,
            ...(class_id && { class_id }),
            ...(division_id && { division_id }),
          },
        };
      },
    }),

    // Update the promoteStudents mutation to use the bulk-promote endpoint
    promoteStudents: builder.mutation<
      { success: boolean; data: { success: number[]; failed: number[] } },
      PromoteStudentsRequest
    >({
      query: (payload) => ({
        url: "bulk-promote",
        method: "POST",
        body: payload,
      }),
    }),

    // Promote single student
    promoteSingleStudent: builder.mutation<
      { success: boolean; message: string },
      PromoteSingleStudentRequest
    >({
      query: (payload) => ({
        url: "promote-students",
        method: "POST",
        body: payload,
      }),
    }),

    // Hold back student
    holdBackStudent: builder.mutation<
      { success: boolean; message: string },
      HoldBackStudentRequest
    >({
      query: (payload) => ({
        url: "hold-back-student",
        method: "POST",
        body: payload,
      }),
    }),

    // Transfer student
    transferStudent: builder.mutation<
      { success: boolean; message: string },
      FormData
    >({
      query: (formData) => ({
        url: "transfer-student",
        method: "POST",
        body: formData,
        formData: true,
        // For FormData, we need to remove the Content-Type header
        // as the browser will set it with the correct boundary
        prepareHeaders: (headers: Headers): Headers => {
          headers.set(
            "Authorization",
            `Bearer ${localStorage.getItem("access_token")}`
          );
          headers.set("Accept", "*/*");
          headers.delete("Content-Type");
          return headers;
        },
      }),
    }),

    // Get promotion history
    getPromotionHistory: builder.query<PromotionHistoryResponse, number>({
      query: (academicSessionId) => ({
        url: `promotion-history/${academicSessionId}`,
        method: "GET",
      }),
    }),

    // Export students list
    exportStudentsList: builder.mutation<
      Blob,
      { academic_session_id: number; class_id?: number; division_id?: number }
    >({
      query: (payload) => ({
        url: "export-students-for-promotion",
        method: "POST",
        body: payload,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetStudentsForPromotionQuery,
  useLazyGetStudentsForPromotionQuery,
  usePromoteStudentsMutation,
  usePromoteSingleStudentMutation,
  useHoldBackStudentMutation,
  useTransferStudentMutation,
  useGetPromotionHistoryQuery,
  useExportStudentsListMutation,
} = PromotionApi;
