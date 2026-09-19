import { User } from "@/types/user";
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
      Pick<User, "name" | "role_id" | "is_active" | "username"> & { password: string }
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
        payload: Partial<{ name: string; is_active: boolean }>;
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
      { page: number; school_id?: number }
    >({
      query: ({ page = 1 }) => ({
        url: `users?type=teachers&page=${page}`,
        method: "GET",
      }),
    }),
    fetchNonOnBoardedTeacher: builder.query<
      StaffType[],
      { page: number; school_id: number; academic_sessions: number }
    >({
      query: ({ page, academic_sessions }) => ({
        url: `staff?type=non-activeuser&academic_sessions=${academic_sessions}&page=${page}&alldata=${true}`,
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
} = UserManagementApi;

