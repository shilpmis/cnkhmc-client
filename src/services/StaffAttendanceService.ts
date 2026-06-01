import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import baseUrl from "@/utils/base-urls"

export interface StaffAttendance {
  id: number
  staff_id: number
  academic_session_id: number
  attendance_date: string
  check_in_time: string | null
  check_out_time: string | null
  status: "present" | "absent" | "late" | "half_day"
  remarks: string | null
  is_self_marked: boolean
  marked_by: number
  created_at: string
  updated_at: string
}

export interface EditRequest {
  id: number
  staff_attendance_id: number
  requested_check_in_time: string | null
  requested_check_out_time: string | null
  reason: string
  status: "pending" | "approved" | "rejected"
  admin_remarks: string | null
  requested_by: number
  actioned_by: number | null
  actioned_at: string | null
  created_at: string
  updated_at: string
  attendance?: StaffAttendance
  requester?: {
    id: number
    first_name: string
    last_name: string
  }
}

export interface CheckInRequest {
  academic_session_id: number
  check_in_time: string
}

export interface CheckOutRequest {
  check_out_time: string
}

export interface EditRequestPayload {
  staff_attendance_id: number
  requested_check_in_time?: string
  requested_check_out_time?: string
  reason: string
}

export interface ProcessEditRequestPayload {
  status: "approved" | "rejected"
  admin_remarks: string
}

export const StaffAttendanceApi = createApi({
  reducerPath: "staffAttendanceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`)
      return headers
    },
  }),
  tagTypes: ["StaffAttendance", "EditRequests"],
  endpoints: (builder) => ({
    checkIn: builder.mutation<{ message: string }, CheckInRequest>({
      query: (payload) => ({
        url: "staff-attendance/check-in",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["StaffAttendance"],
    }),
    checkOut: builder.mutation<{ message: string }, CheckOutRequest>({
      query: (payload) => ({
        url: "staff-attendance/check-out",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["StaffAttendance"],
    }),
    requestEdit: builder.mutation<{ message: string; request: EditRequest }, EditRequestPayload>({
      query: (payload) => ({
        url: "staff-attendance/edit-request",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["StaffAttendance", "EditRequests"],
    }),
    getStaffAttendance: builder.query<
      {
        staff: any
        period: any
        statistics: any
        attendance: StaffAttendance[]
      },
      { year?: number; month?: number }
    >({
      query: ({ year, month }) => {
        let url = "staff-attendance/me"
        if (year && month) {
          url += `?year=${year}&month=${month}`
        }
        return { url }
      },
      providesTags: ["StaffAttendance"],
    }),
    getEditRequests: builder.query<
      { meta: any; data: EditRequest[] },
      { status?: string; page?: number; perPage?: number }
    >({
      query: ({ status = "pending", page = 1, perPage = 10 }) => ({
        url: `staff-attendance/edit-requests?status=${status}&page=${page}&per_page=${perPage}`,
      }),
      providesTags: ["EditRequests"],
    }),
    processEditRequest: builder.mutation<{ message: string }, { id: number; payload: ProcessEditRequestPayload }>({
      query: ({ id, payload }) => ({
        url: `staff-attendance/edit-request/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["EditRequests", "StaffAttendance"],
    }),
  }),
})

export const {
  useCheckInMutation,
  useCheckOutMutation,
  useRequestEditMutation,
  useGetStaffAttendanceQuery,
  useGetEditRequestsQuery,
  useProcessEditRequestMutation,
} = StaffAttendanceApi
