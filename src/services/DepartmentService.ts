import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";

export interface Department {
  id: string;
  name: string;
  code: string;
  head_name?: string;
  total_students?: number;
  subjects?: string[];
}

export const DepartmentApi = createApi({
  reducerPath: "departmentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`);
      return headers;
    },
  }),
  tagTypes: ["Department"],
  endpoints: (builder) => ({
    getDepartments: builder.query<Department[], { school_id: number }>({
      query: ({ school_id }) => ({
        url: `/departments?school_id=${school_id}`,
        method: "GET",
      }),
      providesTags: ["Department"],
    }),
    createDepartment: builder.mutation<Department, Partial<Department> & { school_id: number }>({
      query: (body) => ({
        url: `/departments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Department"],
    }),
    updateDepartment: builder.mutation<Department, Partial<Department> & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/departments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Department"],
    }),
    deleteDepartment: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Department"],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = DepartmentApi;
