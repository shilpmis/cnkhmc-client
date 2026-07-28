import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";

export const HostelApi = createApi({
  reducerPath: "HostelApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Hostel", "HostelRoom", "HostelAllocation"],
  endpoints: (builder) => ({
    getHostels: builder.query<any, { school_id: string | number }>({
      query: (params) => ({
        url: `/hostels`,
        params,
      }),
      providesTags: ["Hostel", "HostelRoom", "HostelAllocation"],
    }),
    createHostel: builder.mutation<any, any>({
      query: (body) => ({
        url: `/hostels`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Hostel"],
    }),
    getHostelDetails: builder.query<any, string | number>({
      query: (id) => `/hostels/${id}`,
      providesTags: ["Hostel", "HostelRoom", "HostelAllocation"],
    }),
    updateHostel: builder.mutation<any, { id: string | number; data: any }>({
      query: ({ id, data }) => ({
        url: `/hostels/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Hostel"],
    }),
    deleteHostel: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/hostels/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hostel"],
    }),
    createHostelRoom: builder.mutation<any, { hostel_id: string | number; data: any }>({
      query: ({ hostel_id, data }) => ({
        url: `/hostels/${hostel_id}/rooms`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["HostelRoom", "Hostel"],
    }),
    updateHostelRoom: builder.mutation<any, { id: string | number; data: any }>({
      query: ({ id, data }) => ({
        url: `/hostels/rooms/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["HostelRoom", "Hostel"],
    }),
    deleteHostelRoom: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/hostels/rooms/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["HostelRoom", "Hostel"],
    }),
    allocateBed: builder.mutation<any, any>({
      query: (body) => ({
        url: `/hostels/allocations`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["HostelAllocation", "Hostel"],
    }),
    vacateBed: builder.mutation<any, { id: string | number; vacation_date?: string }>({
      query: ({ id, vacation_date }) => ({
        url: `/hostels/allocations/${id}/vacate`,
        method: "PUT",
        body: { vacation_date },
      }),
      invalidatesTags: ["HostelAllocation", "Hostel"],
    }),
  }),
});

export const {
  useGetHostelsQuery,
  useCreateHostelMutation,
  useGetHostelDetailsQuery,
  useUpdateHostelMutation,
  useDeleteHostelMutation,
  useCreateHostelRoomMutation,
  useUpdateHostelRoomMutation,
  useDeleteHostelRoomMutation,
  useAllocateBedMutation,
  useVacateBedMutation,
} = HostelApi;
