import { User, PolicyTemplate, PolicyRule } from "@/types/user";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { PageMeta } from "@/types/global";
import { StaffType } from "@/types/staff";
import baseUrl from "@/utils/base-urls";

export const UserManagementApi = createApi({
  reducerPath: "userManagementApi",
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
  endpoints: (builder) => ({
    fetchManagementUsers: builder.query<
      { data: User[]; meta: PageMeta },
      { type: "management" | "staff"; school_id: number; page: number }
    >({
      query: ({ type, school_id, page = 1 }) => ({
        url: `users?type=${type}&page=${page}`,
        method: "GET",
      }),
    }),
    addUser: builder.mutation<
      User,
      Pick<User, "name" | "role_id" | "is_active" | "username"> & { password: string; policy_ids?: number[] }
    >({
      query: (user) => ({
        url: "user",
        method: "POST",
        body: user,
      }),
    }),
    updateUser: builder.mutation<
      User,
      {
        payload: Partial<{ name: string; is_active: boolean; policy_ids: number[] }>;
        user_id: number;
      }
    >({
      query: ({ user_id, payload }) => ({
        url: `user/${user_id}`,
        method: "PUT",
        body: payload,
      }),
    }),
    fetchOnBoardedUser: builder.query<
      { data: User[]; meta: PageMeta },
      { page: number; school_id?: number; staff_category?: string }
    >({
      query: ({ page = 1, staff_category }) => ({
        url: `users?type=staff&page=${page}${staff_category && staff_category !== "all" ? `&staff_category=${staff_category}` : ""}`,
        method: "GET",
      }),
    }),
    fetchNonOnBoardedTeacher: builder.query<
      StaffType[],
      { page?: number; school_id?: number; academic_sessions?: number; staff_category?: string }
    >({
      query: ({ page = 1, academic_sessions, staff_category } = {}) => ({
        url: `staff?type=non-activeuser${academic_sessions ? `&academic_sessions=${academic_sessions}` : ""}${staff_category && staff_category !== "all" ? `&staff_category=${staff_category}` : ""}&page=${page}&alldata=${true}`,
        method: "GET",
      }),
    }),
    onBoardTeacherAsUser: builder.mutation<
      User,
      {
        payload: {
          assign_classes: number[];
          staff_id: number;
          username: string;
          password: string;
          is_active: boolean;
          policy_ids?: number[];
        };
      }
    >({
      query: ({ payload }) => ({
        url: `user/onboard/staff`,
        method: "POST",
        body: payload,
      }),
    }),
    updateOnBoardTeacherAsUser: builder.mutation<
      User,
      {
        user_id: number;
        payload: {
          assign_classes?: number[];
          unassign_classes?: number[];
          is_active?: boolean;
          policy_ids?: number[];
        };
      }
    >({
      query: ({ user_id, payload }) => ({
        url: `user/onboard/staff/${user_id}`,
        method: "PUT",
        body: payload,
      }),
    }),
    deleteUser: builder.mutation<{ message: string }, number>({
      query: (user_id) => ({
        url: `user/${user_id}`,
        method: "DELETE",
      }),
    }),

    // Permission Templates / Policies endpoints
    fetchPolicies: builder.query<PolicyTemplate[], void>({
      query: () => ({
        url: "policies",
        method: "GET",
      }),
    }),
    createPolicy: builder.mutation<
      PolicyTemplate,
      { name: string; description?: string; rules: PolicyRule[] }
    >({
      query: (body) => ({
        url: "policies",
        method: "POST",
        body,
      }),
    }),
    updatePolicy: builder.mutation<
      PolicyTemplate,
      { id: number; name?: string; description?: string; rules?: PolicyRule[] }
    >({
      query: ({ id, ...body }) => ({
        url: `policies/${id}`,
        method: "PUT",
        body,
      }),
    }),
    deletePolicy: builder.mutation<void, number>({
      query: (id) => ({
        url: `policies/${id}`,
        method: "DELETE",
      }),
    }),
    assignPoliciesToUser: builder.mutation<
      User,
      { userId: number; policyIds: number[] }
    >({
      query: ({ userId, policyIds }) => ({
        url: `users/${userId}/policies`,
        method: "POST",
        body: { policyIds },
      }),
    }),
  }),
});

export const {
  useLazyFetchManagementUsersQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,

  useUpdateOnBoardTeacherAsUserMutation,
  useOnBoardTeacherAsUserMutation,

  useLazyFetchOnBoardedUserQuery,
  useLazyFetchNonOnBoardedTeacherQuery,

  useFetchPoliciesQuery,
  useLazyFetchPoliciesQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
  useAssignPoliciesToUserMutation,
} = UserManagementApi;

