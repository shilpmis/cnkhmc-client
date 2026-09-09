import { createAsyncThunk } from "@reduxjs/toolkit"
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { StaffRole, StaffType, StaffConfiguration } from "@/types/staff"
import { setStaffRole } from "@/redux/slices/staffSlice"
import ApiService from "./ApiService"
import type { StaffFormData } from "@/utils/staff.validation"
import type { PageMeta } from "@/types/global"
import baseUrl from "@/utils/base-urls"

export const StaffApi = createApi({
  reducerPath: "staffApi",
  tagTypes: ["Staff", "StaffRole", "StaffConfig"],
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers, { getState }) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    getStaffConfigurations: builder.query<StaffConfiguration[], { config_type?: 'STAFF_TYPE' | 'STAFF_CATEGORY' | 'DESIGNATION' } | void>({
      query: (params) => {
        let url = 'staff-configurations'
        if (params?.config_type) {
          url += `?config_type=${params.config_type}`
        }
        return { url, method: 'GET' }
      },
      providesTags: ['StaffConfig'],
    }),
    createStaffConfiguration: builder.mutation<StaffConfiguration, { config_type: string; name: string; parent_id?: number | null }>({
      query: (payload) => ({
        url: 'staff-configurations',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['StaffConfig'],
    }),
    updateStaffConfiguration: builder.mutation<StaffConfiguration, { id: number; payload: { name?: string; parent_id?: number | null } }>({
      query: ({ id, payload }) => ({
        url: `staff-configurations/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['StaffConfig'],
    }),
    deleteStaffConfiguration: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `staff-configurations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StaffConfig'],
    }),
    getSchoolStaffRole: builder.query<StaffRole[], number>({
      query: (schoolId) => ({
        url: `staff-role/${schoolId}`,
        method: "GET",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(setStaffRole(data))
      },
    }),
    getTeachingStaff: builder.query<
      { data: StaffType[]; meta: PageMeta },
      { academic_sessions: number; page?: number; status_filter?: string }
    >({
      query: ({ academic_sessions, page = 1, status_filter }) => {
        let url = `staff?page=${page}&type=${"teaching"}&academic_sessions=${academic_sessions}`
        if (status_filter) url += `&status_filter=${status_filter}`
        return { url, method: "GET" }
      },
    }),
    getAllTeachingStaff: builder.query<StaffType[],{ academic_sessions: number;}>({
      query: ({ academic_sessions }) => ({
        url: `staff?type=${"teaching"}&academic_sessions=${academic_sessions}&alldata=true`,
        method: "GET",
      }),
    }),
    getOtherStaff: builder.query<{ data: StaffType[]; meta: PageMeta }, { academic_sessions: number; page?: number; status_filter?: string }>({
      query: ({ academic_sessions, page = 1, status_filter }) => {
        let url = `staff?page=${page}&type=${"other"}&academic_sessions=${academic_sessions}`
        if (status_filter) url += `&status_filter=${status_filter}`
        return { url, method: "GET" }
      },
    }),
    getHospitalStaff: builder.query<{ data: StaffType[]; meta: PageMeta }, { academic_sessions: number; page?: number; status_filter?: string }>({
      query: ({ academic_sessions, page = 1, status_filter }) => {
        let url = `staff?page=${page}&type=${"hospital"}&academic_sessions=${academic_sessions}`
        if (status_filter) url += `&status_filter=${status_filter}`
        return { url, method: "GET" }
      },
    }),

    // Get staff by ID
    getStaffById: builder.query<StaffType, number>({
      query: (staffId) => ({
        url: `staff/${staffId}`,
        method: "GET",
      }),
    }),

    addStaff: builder.mutation<StaffType, { academic_sessions: number; payload: StaffFormData }>({
      query: ({ academic_sessions, payload }) => ({
        url: `staff?academic_sessions=${academic_sessions}`,
        method: "POST",
        body: payload,
      }),
    }),

    updateStaff: builder.mutation<StaffType, { staff_id: number; payload: Partial<StaffFormData> }>({
      query: ({ payload, staff_id }) => ({
        url: `staff/${staff_id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    deleteStaff: builder.mutation<{ message: string }, number>({
      query: (staff_id) => ({
        url: `staff/${staff_id}`,
        method: "DELETE",
      }),
    }),

    bulkUploadStaff: builder.mutation<
      { message: string; totalInserted: number },
      { academic_session: number; type: "teaching" | "non-teaching" | "hospital"; file: File }
    >({
      query: ({ academic_session, type, file }) => {
        const formData = new FormData()
        formData.append("file", file)
        return {
          url: `staff/bulk-upload?academic_sessions=${academic_session}&staff-type=${type}`,
          method: "POST",
          body: formData,
        }
      },
    }),
    uploadStaffExperience: builder.mutation<
      { message: string; processed_count: number; unmatched_staff: string[] },
      { file: File }
    >({
      query: ({ file }) => {
        const formData = new FormData()
        formData.append("file", file)
        return {
          url: `staff/experience/upload`,
          method: "POST",
          body: formData,
        }
      },
    }),
    downloadExcelTemplate: builder.mutation<any, { type: "teaching" | "non-teaching" | "hospital" , school_id : number, academic_session : number,  fields: string[] }>({
      query: ({ school_id ,academic_session , fields , type }) => ({
        url: `staff/export/${school_id}/${academic_session}`,
        method: "POST",
        body: {
          fields: fields,
          'staff-type': type, 
        },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Search staff endpoint
    searchStaff: builder.query<
      StaffType[],
      {
        name?: string
        employee_code?: string
        staff_role_id?: number
        mobile_number?: number
        academic_session_id?: number
      }
    >({
      query: ({ name, employee_code, staff_role_id, mobile_number, academic_session_id }) => {
        const params = new URLSearchParams()
        if (name) params.append("name", name)
        if (employee_code) params.append("employee_code", employee_code)
        if (staff_role_id) params.append("staff_role_id", staff_role_id.toString())
        if (mobile_number) params.append("mobile_number", mobile_number.toString())
        if (academic_session_id) params.append("academic_session_id", academic_session_id.toString())

        return {
          url: `staff/search?${params.toString()}`,
          method: "GET",
        }
      },
    }),
  }),
})

export const {
  useGetSchoolStaffRoleQuery,
  useLazyGetSchoolStaffRoleQuery,
  useLazyGetTeachingStaffQuery,
  useLazyGetOtherStaffQuery,
  useGetHospitalStaffQuery,
  useLazyGetHospitalStaffQuery,
  useBulkUploadStaffMutation,
  useAddStaffMutation,
  useUpdateStaffMutation,
  useDownloadExcelTemplateMutation,
  useSearchStaffQuery,
  useLazySearchStaffQuery,
  useGetStaffByIdQuery,
  useLazyGetStaffByIdQuery,
  useGetAllTeachingStaffQuery,
  useLazyGetAllTeachingStaffQuery,
  useGetStaffConfigurationsQuery,
  useLazyGetStaffConfigurationsQuery,
  useCreateStaffConfigurationMutation,
  useUpdateStaffConfigurationMutation,
  useDeleteStaffConfigurationMutation,
  useUploadStaffExperienceMutation,
  useDeleteStaffMutation,
} = StaffApi

export const createStaffRole = createAsyncThunk(
  "staff/create",
  async (
    {
      academic_session,
      payload,
    }: { academic_session: number; payload: { role: string; is_teaching_role: boolean; school_id?: number } },
    { rejectWithValue },
  ) => {
    try {
      const created_role = await ApiService.post(`staff-role?academic_session=${academic_session}`, payload)
      return created_role.data
    } catch (error: any) {
      console.log("Error while adding staff", error)
      return rejectWithValue(error.response?.data || "Failed to create staff role")
    }
  },
)

export const updateStaffRole = createAsyncThunk(
  "staff/update",
  async ({ staff_id, payload }: { staff_id: number; payload: { role: string } }, { rejectWithValue }) => {
    try {
      const updated_role = await ApiService.put(`staff-role/${staff_id}`, payload)
      return updated_role.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to update staff role")
    }
  },
)

export const deleteStaffRole = createAsyncThunk("staff-role/delete", async (staff_id: number, { rejectWithValue }) => {
  try {
    const deleted_role = await ApiService.delete(`staff/${staff_id}`)
    return deleted_role.data
  } catch (error: any) {
    console.log("Error while deleting staff", error)
    return rejectWithValue(error.response?.data || "Failed to delete staff role")
  }
})
