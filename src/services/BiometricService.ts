import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import baseUrl from "@/utils/base-urls"
import type { MdbEmployee, MdbPunch } from "@/utils/biometricMdb"

export type BiometricRules = {
  shift_start: string
  grace_minutes: number
  half_day_minutes: number
  full_day_minutes: number
  duplicate_window_minutes: number
  overwrite_self_marked: boolean
}

export type BiometricSummary = {
  punches: number
  first_punch: string | null
  last_punch: string | null
  linked_staff: number
  active_staff: number
  unlinked_device_users: number
  employees: number
  rules: BiometricRules
}

export type MappingStaff = {
  id: number
  employee_code: string
  name: string
  department: string | null
  designation: string | null
  is_active: boolean
  biometric_code: string | null
  suggested_code: string | null
}

export type MappingEmployee = {
  device_user_id: string
  name: string | null
  department: string | null
  status: string | null
  punches: number
  last_punch: string | null
}

export type DaySummary = {
  check_in: string | null
  check_out: string | null
  worked_minutes: number | null
  punches: number
  missing_punch: boolean
  status: "present" | "late" | "half_day" | "absent"
}

export type DailyRow = {
  staff_id: number
  name: string
  department: string | null
  biometric_code: string
  punches: string[]
  computed: DaySummary | null
  stored: {
    status: string
    check_in_time: string | null
    check_out_time: string | null
    remarks: string | null
    from_biometric: boolean
  } | null
}

export type ProcessResult = {
  days_with_punches: number
  created: number
  updated: number
  unchanged: number
  skipped_manual: number
  skipped_edited: number
  skipped_leave: number
  missing_punch: number
}

export const BiometricApi = createApi({
  reducerPath: "biometricApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`)
      return headers
    },
  }),
  tagTypes: ["BiometricSummary", "BiometricMapping", "BiometricDaily", "BiometricSettings"],
  endpoints: (builder) => ({
    getBiometricSummary: builder.query<BiometricSummary, void>({
      query: () => ({ url: "biometric/summary" }),
      providesTags: ["BiometricSummary"],
    }),
    storeBiometricEmployees: builder.mutation<{ saved: number }, { employees: MdbEmployee[] }>({
      query: (body) => ({ url: "biometric/employees", method: "POST", body }),
      invalidatesTags: ["BiometricSummary", "BiometricMapping"],
    }),
    // Tags are invalidated once after the whole import, not per batch
    storeBiometricPunches: builder.mutation<
      { received: number; inserted: number; duplicates: number; rejected: number },
      { punches: MdbPunch[]; source?: string }
    >({
      query: (body) => ({ url: "biometric/punches", method: "POST", body }),
    }),
    getBiometricMapping: builder.query<{ staff: MappingStaff[]; employees: MappingEmployee[] }, void>({
      query: () => ({ url: "biometric/mapping" }),
      providesTags: ["BiometricMapping"],
    }),
    saveBiometricMapping: builder.mutation<{ saved: number }, { links: { staff_id: number; biometric_code: string | null }[] }>({
      query: (body) => ({ url: "biometric/mapping", method: "PUT", body }),
      invalidatesTags: ["BiometricMapping", "BiometricSummary", "BiometricDaily"],
    }),
    getBiometricSettings: builder.query<BiometricRules, void>({
      query: () => ({ url: "biometric/settings" }),
      providesTags: ["BiometricSettings"],
    }),
    saveBiometricSettings: builder.mutation<BiometricRules, Partial<BiometricRules>>({
      query: (body) => ({ url: "biometric/settings", method: "PUT", body }),
      invalidatesTags: ["BiometricSettings", "BiometricSummary", "BiometricDaily"],
    }),
    processBiometricAttendance: builder.mutation<
      ProcessResult,
      { from: string; to: string; academic_session_id: number; staff_ids?: number[] }
    >({
      query: (body) => ({ url: "biometric/process", method: "POST", body }),
      invalidatesTags: ["BiometricDaily"],
    }),
    getBiometricDaily: builder.query<
      { date: string; rules: BiometricRules; rows: DailyRow[]; unlinked_device_users: number },
      { date: string }
    >({
      query: ({ date }) => ({ url: `biometric/daily?date=${date}` }),
      providesTags: ["BiometricDaily"],
    }),
  }),
})

export const {
  useGetBiometricSummaryQuery,
  useStoreBiometricEmployeesMutation,
  useStoreBiometricPunchesMutation,
  useGetBiometricMappingQuery,
  useSaveBiometricMappingMutation,
  useGetBiometricSettingsQuery,
  useSaveBiometricSettingsMutation,
  useProcessBiometricAttendanceMutation,
  useGetBiometricDailyQuery,
} = BiometricApi
