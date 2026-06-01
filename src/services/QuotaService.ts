import { Division } from "@/types/academic";
import baseUrl from "@/utils/base-urls";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Quota {
  id: number;
  name: string;
  description: string;
  eligibility_criteria: string;
  academic_session_id: number;
  is_active: boolean;
}

export interface QuotaRequest {
  name: string;
  description: string;
  eligibility_criteria: string;
  is_active: boolean;
}

export interface QuotaAllocation {
  total_seats: number;
  quota: any;
  id: number;
  quota_name: string;
  total_allocated_seats: number;
  filled_seats: number;
  available_seats: number;
  class: Division;
}

// New interfaces for seat management
export interface ClassSeatAvailability {
  id: number;
  academic_session_id: number;
  class_id: number;
  total_seats: number;
  quota_allocated_seats: number;
  general_available_seats: number;
  filled_seats: number;
  remaining_seats: number;
  quota_allocation: QuotaAllocationItem[];
  class: ClassInfo;
}

export interface QuotaAllocationItem {
  id: number;
  quota_id: number;
  class_id: number;
  total_seats: number;
  filled_seats: number;
}

export interface ClassInfo {
  id: number;
  school_id: number;
  class: string;
  division: string;
  aliases: string | null;
  academic_session_id: number;
}

export interface SeatAvailabilityRequest {
  class_id: number;
  academic_session_id: number;
  total_seats: number;
}

export interface QuotaSeatAllocationRequest {
  quota_id: number;
  class_id: number;
  total_seats: number;
  academic_session_id: number;
}

export const QuotaApi = createApi({
  reducerPath: "quotaApi",
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
  tagTypes: ["Quota", "Seats"],
  endpoints: (builder) => ({
    getQuotas: builder.query<Quota[], { academic_session_id: number }>({
      query: ({ academic_session_id }) =>
        `quota/all?academic_session=${academic_session_id}`,
      providesTags: ["Quota"],
    }),
    getQuotaAllocations: builder.query<any, void>({
      query: () => `quota-allocation/all`,
      providesTags: ["Quota"],
    }),
    addQuota: builder.mutation<
      Quota,
      QuotaRequest & { academic_session_id: number }
    >({
      query: (data) => {
        const { academic_session_id, ...quota } = data;
        return {
          url: `quota?academic_session=${academic_session_id}`,
          method: "POST",
          body: { ...quota, academic_session_id },
        };
      },
      invalidatesTags: ["Quota"],
    }),
    updateQuota: builder.mutation<
      Quota,
      { payload: Partial<Quota>; academic_session_id: number; quota_id: number }
    >({
      query: ({ payload, academic_session_id, quota_id }) => ({
        url: `quota/${quota_id}?academic_session=${academic_session_id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Quota"],
    }),
    deleteQuota: builder.mutation<
      void,
      { id: number; academic_session_id: number }
    >({
      query: ({ id, academic_session_id }) => ({
        url: `quota/${id}?academic_session=${academic_session_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quota"],
    }),

    // New endpoints for seat management
    getClassSeatAvailability: builder.query<ClassSeatAvailability[], {acadamic_session_id :number}>({
      query: ({acadamic_session_id}) => `classes/seats/all?acadamic_session=${acadamic_session_id}`,
      providesTags: ["Seats"],
    }),

    addSeatAvailability: builder.mutation<any, SeatAvailabilityRequest>({
      query: (seatData) => ({
        url: "classes/seats",
        method: "POST",
        body: seatData,
      }),
      invalidatesTags: ["Seats"],
    }),

    updateSeatAvailability: builder.mutation<
      any,
      { total_seats: number; class_id: number }
    >({
      query: ({ total_seats, class_id }) => ({
        url: `classes/seats/${class_id}`,
        method: "PUT",
        body: { total_seats: total_seats },
      }),
      invalidatesTags: ["Seats"],
    }),

    addQuotaSeatAllocation: builder.mutation<any, QuotaSeatAllocationRequest>({
      query: (allocationData) => ({
        url: "quota-allocation",
        method: "POST",
        body: allocationData,
      }),
      invalidatesTags: ["Seats", "Quota"],
    }),

    updateQuotaSeatAllocation: builder.mutation<
      any,
      {
        quota_allocation_id: number;
        payload: Pick<QuotaAllocationItem, "total_seats">;
      }
    >({
      query: ({ quota_allocation_id, payload }) => ({
        url: `quota-allocation/${quota_allocation_id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Seats", "Quota"],
    }),
  }),
});

// Add the new hook to the exports
export const {
  useGetQuotasQuery,
  useGetQuotaAllocationsQuery,
  useAddQuotaMutation,
  useUpdateQuotaMutation,
  useDeleteQuotaMutation,
  useGetClassSeatAvailabilityQuery,
  useAddSeatAvailabilityMutation,
  useUpdateSeatAvailabilityMutation,
  useAddQuotaSeatAllocationMutation,
  useUpdateQuotaSeatAllocationMutation,
} = QuotaApi;
