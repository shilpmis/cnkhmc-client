import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { PageMeta } from "@/types/global";
import baseUrl from "@/utils/base-urls";
import { ReqBodyForOnBoardingStudent, StudentEnrollment, StudentEntry } from "@/types/student";
import { E } from "framer-motion/dist/types.d-DDSxwf0n";
import { number } from "framer-motion";

// Define the Inquiry type based on the API response
export interface Inquiry {
  id: number;
  school_id: number;
  academic_session_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  birth_date: string;
  gender: "male" | "female";
  primary_mobile: number;
  parent_email: string | null;
  address: string;
  previous_school: string | null;
  previous_class: string | null;
  inquiry_for_class: number | undefined;
  father_name: string;
  previous_percentage: string | null;
  previous_year: string | null;
  special_achievements: string | null;
  applying_for_quota: boolean;
  quota_type: number | null;
  status: string;
  admin_notes: string | null;
  created_by: number;
  is_converted_to_student: number;
  student_enrollments_id : number | null;
  student_enrollment : StudentEnrollment | null;
}

interface GetInquiriesResponse {
  data: Array<Inquiry & { student_id: number }>;
  meta: PageMeta;
}

interface AddInquiryResponse {
  message: string;
  inquiry: Inquiry;
}

interface UpdateInquiryResponse {
  message: string;
  inquiry: Inquiry;
}

// Create the API service
export const InquiryApi = createApi({
  reducerPath: "InquiryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers, { getState }) => {
      headers.set(
        "Authorization",
        `Bearer ${localStorage.getItem("access_token")}`
      );
      return headers;
    },
  }),
  tagTypes: ["Inquiry"],
  endpoints: (builder) => ({
    // Get all inquiries with pagination
    getInquiries: builder.query<
      GetInquiriesResponse,
      { academic_session_id: number ;
        page?: number;
        class_id ?: number ;
        status ?: string
        search ?: string }
    >({
      query: ({ page = 1, status = "All" , class_id = 'All', search = undefined ,academic_session_id }) => ({
        url: `/inquiries?page=${page}&status=${status}&class=${class_id}&search=${search}&academic_session=${academic_session_id}`,
        // params: { page, limit },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Inquiry" as const,
                id,
              })),
              { type: "Inquiry", id: "LIST" },
            ]
          : [{ type: "Inquiry", id: "LIST" }],
    }),

    // Get a single inquiry by ID
    getInquiryById: builder.query<Inquiry, number>({
      query: (id) => `/inquiry/${id}`,
      providesTags: (result, error, id) => [{ type: "Inquiry", id }],
    }),

    // Add a new inquiry
    addInquiry: builder.mutation<
      AddInquiryResponse,
      Omit<
        Inquiry,
        | "id"
        | "school_id"
        | "created_by"
        | "is_converted_to_student"
        | "is_converted_to_student"
        | "created_by"
        | "student_enrollment"
        | "student_enrollments_id"
      >
    >({
      query: (body) => ({
        url: "/inquiry",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Inquiry", id: "LIST" }],
    }),

    // Update an existing inquiry
    updateInquiry: builder.mutation<
      UpdateInquiryResponse,
      {
        inquiry_id: number;
        payload: Partial<
          Omit<
            Inquiry,
            | "id"
            | "school_id"
            | "created_by"
            | "is_converted_to_student"
            | "is_converted_to_student"
            | "created_by"
          >
        >;
      }
    >({
      query: ({ inquiry_id, payload }) => ({
        url: `/inquiry/${inquiry_id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (result, error, { inquiry_id }) => [
        { type: "Inquiry", inquiry_id },
        { type: "Inquiry", id: "LIST" },
      ],
    }),

    convertQueryToStudent: builder.mutation<
      any,
      { inquiry_id: number; payload: ReqBodyForOnBoardingStudent }
    >({
      query: ({ inquiry_id, payload }) => ({
        url: `/inquiry/convert/${inquiry_id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result, error, { inquiry_id }) => [
        { type: "Inquiry", inquiry_id },
        { type: "Inquiry", id: "LIST" },
      ],
    }),

    // Delete an inquiry
    deleteInquiry: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/inquiry/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Inquiry", id: "LIST" }],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetInquiriesQuery,
  useLazyGetInquiriesQuery,
  useGetInquiryByIdQuery,
  useAddInquiryMutation,
  useUpdateInquiryMutation,
  useDeleteInquiryMutation,
  useConvertQueryToStudentMutation,
} = InquiryApi;
