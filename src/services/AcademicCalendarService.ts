import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import baseUrl from "@/utils/base-urls"

export type AcademicCalendarSettings = {
  academic_session_id: number
  non_working_dates: string[] // YYYY-MM-DD
  is_saturday_working: boolean
}

/**
 * Backend contract (to be implemented in saral-server):
 *
 * GET    /api/v1/academic-calendar-settings/:academic_session_id
 * PUT    /api/v1/academic-calendar-settings/:academic_session_id
 *
 * PUT body:
 *   { non_working_dates: string[], is_saturday_working: boolean }
 *
 * Response (both):
 *   { academic_session_id, non_working_dates, is_saturday_working }
 */
export const AcademicCalendarApi = createApi({
  reducerPath: "AcademicCalendarApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    getAcademicCalendarSettings: builder.query<AcademicCalendarSettings, { academic_session_id: number }>({
      query: ({ academic_session_id }) => ({
        url: `academic-calendar-settings/${academic_session_id}`,
        method: "GET",
      }),
    }),
    updateAcademicCalendarSettings: builder.mutation<
      AcademicCalendarSettings,
      { academic_session_id: number; payload: Pick<AcademicCalendarSettings, "non_working_dates" | "is_saturday_working"> }
    >({
      query: ({ academic_session_id, payload }) => ({
        url: `academic-calendar-settings/${academic_session_id}`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
})

export const { useLazyGetAcademicCalendarSettingsQuery, useUpdateAcademicCalendarSettingsMutation } = AcademicCalendarApi

