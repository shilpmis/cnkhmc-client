// import { baseUrl } from '@/utils/base-urls';
// import { createAsyncThunk } from "@reduxjs/toolkit";
// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
// import { StaffRole } from "@/types/staff";


// export const StaffApi = createApi({
//     reducerPath: "staffApi",
//     baseQuery: fetchBaseQuery({
//         baseUrl: `${baseUrl.serverUrl}api/v1/`,
//         prepareHeaders: (headers, { getState }) => {
//             headers.set("Authorization", `Bearer ${localStorage.getItem('access_token')}`)
//             return headers
//         },
//     }),
//     endpoints: (builder) => ({
//         getSchoolStaff: builder.query<{ staff: StaffRole[] }, number>({
//             query: (school_id) => ({
//                 url: `staff/${school_id}`,
//                 method: "GET"
//             })
//         }),
//     })
// })

// export const { useGetSchoolStaffQuery , useLazyGetSchoolStaffRoleQuery } = StaffApi;

// // import ApiService from "./ApiService"

// // export interface Role {
// //   id: string
// //   role: string
// //   is_teaching_role: boolean
// // }

// // export const roleService = {
// //   getRoles: async (): Promise<Role[]> => {
// //     const response = await ApiService.get("staff/1");
// //     return response.data
// //   },

// //   addRole: async (role: Omit<Role, "id">): Promise<Role> => {
// //     const response = await ApiService.post("staff", role)
// //     return response.data
// //   },

// //   updateRole: async (role: Role): Promise<Role> => {
// //     const response = await ApiService.put(`staff/${role.id}`, role)
// //     return response.data
// //   },

// //   deleteRole: async (id: string): Promise<void> => {
// //     await ApiService.delete(`staff/${id}`)
// //   },
// // }

