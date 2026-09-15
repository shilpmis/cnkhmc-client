import { createAsyncThunk } from "@reduxjs/toolkit";
import ApiService from "./ApiService";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  LeaveApplication,
  LeavePolicy,
  LeaveRequest,
  LeaveType,
  CompOffRequest,
  CreateCompOffPayload,
  ProcessCompOffPayload,
} from "@/types/leave";
import { PageMeta } from "@/types/global";
import { setLeavePolicy, setLeave } from "@/redux/slices/leaveSlice";
import baseUrl from "@/utils/base-urls";

// Types for request payloads and responses
interface CreateLeaveRequestPayload {
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: "sick" | "vacation" | "personal" | "other";
}

// Define the API response structure
interface LeaveBalanceResponse {
  policy: {
    id: number
    leave_type_id: number
    leave_type_name: string
    annual_quota: number
    max_consecutive_days: number
    can_carry_forward: number | boolean
  }
  balance: {
    id: number
    academic_session_id: number
    staff_id: number
    leave_type_id: number
    academic_year: number
    total_leaves: string | number
    used_leaves: string | number
    pending_leaves: string | number
    carried_forward: string | number
    available_balance: string | number
  }
}
// Define the leave balance interface
export interface LeaveBalance {
  id: number
  staff_id: number
  leave_type_id: number
  leave_type: LeaveType
  academic_session_id: number
  annual_quota: number
  remaining_leaves: number
  max_consecutive_days: number
  can_carry_forward: boolean
  max_carry_forward_days: number
}


interface UpdateLeaveRequestStatusPayload {
  requestId: string;
  newStatus: "approved" | "rejected";
}

interface ApiErrorResponse {
  message: string;
}

/**
 * RTK Query for simple queries that need caching
 */
export const LeaveApi = createApi({
  reducerPath: "leaveApi",
  tagTypes: ["LeaveBalances", "CompOff", "LeaveReports", "LeavePolicies"],
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
    getLeaveTypeForSchoolPageWise: builder.query<
      { data: LeaveType[]; page: PageMeta },
      { academic_session_id: number; page: number }
    >({
      query: ({ page, academic_session_id }) => ({
        url: `/leave-type?academic_year=${academic_session_id}&page=${page}`,
        method: "GET",
      }),
    }),
    getAllLeaveTypeForSchool: builder.query<
      LeaveType[],
      { academic_session_id: number }
    >({
      query: ({ academic_session_id }) => ({
        url: `/leave-type?academic_year=${academic_session_id}&page=all`,
        method: "GET",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(setLeave(data));
        } catch (error) {
          console.log("Check Error while Creating ", error);
        }
      },
    }),

    getAllLeavePoliciesForUser: builder.query<
      LeavePolicy[],
      { academic_session_id: number }
    >({
      query: ({ academic_session_id }) => ({
        url: `/leave-policy/user?academic_year=${academic_session_id}`,
        method: "GET",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(setLeavePolicy(data));
        } catch (error) {
          console.log("Check Error while fetching user Policy", error);
        }
      },
    }),

    getLeavePolicyForSchoolPageWise: builder.query<
      { data: LeavePolicy[]; page: PageMeta },
      { academic_session_id: number; page: number }
    >({
      query: ({ page, academic_session_id }) => ({
        url: `/leave-policy?academic_year=${academic_session_id}&page=${page}`,
        method: "GET",
      }),
      providesTags: ["LeavePolicies"],
    }),
    getAllLeavePoliciesForSchool: builder.query<
      LeavePolicy[],
      { academic_session_id?: number } | void
    >({
      query: (args) => {
        const academic_session_id = args?.academic_session_id;
        return {
          url: academic_session_id
            ? `/leave-policy?academic_year=${academic_session_id}&page=all`
            : `/leave-policy?page=all`,
          method: "GET",
        };
      },
      providesTags: ["LeavePolicies"],
    }),
    createLeaveType: builder.mutation<
      LeaveType,
      Omit<LeaveType, "id" | "school_id">
    >({
      query: (payload: any) => {
        const { academic_session_id, ...rest } = payload;
        return {
          url: `/leave-type`,
          method: "POST",
          body: { ...rest, academic_year: academic_session_id || payload.academic_year },
        };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(setLeave(data));
        } catch (error) {
          console.log("Check Error while Creating ", error);
        }
      },
    }),
    updateLeaveType: builder.mutation<
      LeaveType,
      {
        leave_type_id: number;
        payload: Partial<Omit<LeaveType, "id" | "school_id">>;
      }
    >({
      query: ({ leave_type_id, payload }: any) => {
        const { academic_session_id, ...rest } = payload;
        return {
          url: `/leave-type/${leave_type_id}`,
          method: "PUT",
          body: { ...rest, academic_year: academic_session_id || payload.academic_year },
        };
      },
    }),
    createLeavePolicy: builder.mutation<
      LeavePolicy,
      Omit<LeavePolicy, "id" | "staff_role" | "leave_type">
    >({
      query: (payload: any) => {
        const { academic_session_id, ...rest } = payload;
        return {
          url: `/leave-policy`,
          method: "POST",
          body: { ...rest, academic_year: academic_session_id || payload.academic_year },
        };
      },
      invalidatesTags: ["LeavePolicies", "LeaveTemplates"],
    }),
    updateLeavePolicy: builder.mutation<
      LeavePolicy,
      {
        policy_id: number;
        payload: Partial<Omit<LeavePolicy, "id" | "staff_role" | "leave_type">>;
      }
    >({
      query: ({ policy_id, payload }: any) => {
        const { academic_session_id, ...rest } = payload;
        return {
          url: `/leave-policy/${policy_id}`,
          method: "PUT",
          body: { ...rest, academic_year: academic_session_id || payload.academic_year },
        };
      },
      invalidatesTags: ["LeavePolicies", "LeaveTemplates"],
    }),
    deleteLeavePolicy: builder.mutation<{ message: string }, number>({
      query: (policy_id) => ({
        url: `/leave-policy/${policy_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeavePolicies", "LeaveTemplates"],
    }),

    getStaffsLeaveAppication: builder.query<
      { data: LeaveApplication[]; page: PageMeta },
      {
        academic_session_id: number;
        staff_id: number;
        status: "pending" | "approved" | "rejected" | "cancelled";
        page: number;
      }
    >({
      query: ({ staff_id, page, status, academic_session_id }) => ({
        url: `/leave-applications/${staff_id}?academic_year=${academic_session_id}&status=${status}&page=${page}`,
        method: "GET",
      }),
    }),

    applyLeaveForStaff: builder.mutation<
      LeaveApplication,
      Partial<Omit<
        LeaveApplication,
        | "id"
        | "uuid"
        | "status"
        | "number_of_days"
        | "applied_by_self"
        | "applied_by"
        | "leave_type"
        | "staff"
      >>
    >({
      query: (payload: any) => {
        const { academic_session_id, ...rest } = payload;
        return {
          url: `/leave-application`,
          method: "POST",
          body: { ...rest, academic_year: academic_session_id || payload.academic_year },
        };
      },
    }),

    updateLeaveForStaff: builder.mutation<
      LeaveApplication,
      {
        payload: Partial<LeaveApplication>;
        application_id: string;
      }
    >({
      query: ({ payload, application_id }: any) => {
        const { academic_session_id, ...rest } = payload;
        return {
          url: `/leave-application/${application_id}`,
          method: "PUT",
          body: { ...rest, academic_year: academic_session_id || payload.academic_year },
        };
      },
    }),

    fetchLeaveApplicationOfTeachingStaffForAdmin: builder.query<
      { data: LeaveApplication[]; meta: PageMeta },
      {
        status: "pending" | "approved" | "rejected" | "cancelled";
        page: number;
        date: string | undefined;
        academic_session_id: number;
        role: "teaching";
      }
    >({
      query: ({ date, role, status, page = 1, academic_session_id }) => ({
        url: date
          ? `/leave-applications?role=${role}&academic_year=${academic_session_id}&status=${status}&date=${date}&page=${page}`
          : `/leave-applications?role=${role}&academic_year=${academic_session_id}&status=${status}&page=${page}`,
        method: "GET",  
      }),
    }),

    fetchLeaveApplicationOfOtherStaffForAdmin: builder.query<
      { data: LeaveApplication[]; meta: PageMeta },
      {
        status: "pending" | "approved" | "rejected" | "cancelled";
        page: number;
        date: string | undefined;
        academic_session_id: number;
        role: "non-teaching";
      }
    >({
      query: ({ date, role, status, page = 1, academic_session_id }) => ({
        url: date
          ? `/leave-applications?role=${role}&academic_year=${academic_session_id}&status=${status}&date=${date}&page=${page}`
          : `/leave-applications?role=${role}&academic_year=${academic_session_id}&status=${status}&page=${page}`,
        method: "GET",
      }),
    }),

    updateStatusForStaffLeaveApplication: builder.mutation<
      LeaveApplication,
      {
        status: "pending" | "approved" | "rejected" | "cancelled";
        application_id: string;
        academic_session_id: number;
        remarks?: string; // Add remarks parameter
      }
    >({
      query: ({ application_id, status, academic_session_id, remarks }) => ({
        url: `/leave-application/status/${application_id}?status=${status}&academic_year=${academic_session_id}`,
        method: "PUT",
        body: { status, remarks }, // Include remarks in the request body
      }),
    }),

    getLeaveBalances: builder.query<LeaveBalanceResponse[], { staff_id: number; academic_session_id: number }>({
      query: ({ staff_id, academic_session_id }) => ({
        url: `/leave-balances/${staff_id}/?academic_year=${academic_session_id}`,
        method: "GET",
      }),
      providesTags: ["LeaveBalances"],
    }),

    withdrawLeaveApplication: builder.mutation<
      { message: string; application: LeaveApplication },
      {
        application_id: string;
        remarks: string;
      }
    >({
      query: ({ application_id, remarks }) => ({
        url: `/leave-application/withdraw/${application_id}`,
        method: "PUT",
        body: { remarks },
      }),
      invalidatesTags: ["LeaveBalances"],
    }),

    getStaffCompOffRequests: builder.query<{ data: CompOffRequest[] }, { staff_id: number }>({
      query: ({ staff_id }) => ({
        url: `/comp-off/requests/${staff_id}`,
        method: "GET",
      }),
      providesTags: ["CompOff"],
    }),

    submitCompOffRequest: builder.mutation<{ message: string; data: CompOffRequest }, CreateCompOffPayload>({
      query: (body) => ({
        url: `/comp-off/request`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CompOff", "LeaveBalances"],
    }),

    getAdminCompOffRequests: builder.query<{ data: CompOffRequest[] }, { status?: string }>({
      query: ({ status = "all" }) => ({
        url: `/comp-off/admin/requests?status=${status}`,
        method: "GET",
      }),
      providesTags: ["CompOff"],
    }),

    processCompOffRequest: builder.mutation<{ message: string; data: CompOffRequest }, ProcessCompOffPayload>({
      query: ({ uuid, status, admin_remarks }) => ({
        url: `/comp-off/request/status/${uuid}`,
        method: "PUT",
        body: { status, admin_remarks },
      }),
      invalidatesTags: ["CompOff", "LeaveBalances", "LeaveReports"],
    }),

    getTeachersLeaveSummaryReport: builder.query<
      { leave_types: { id: number; name: string }[]; data: any[] },
      { academic_session_id?: number }
    >({
      query: ({ academic_session_id } = {}) => ({
        url: academic_session_id
          ? `/leave-reports/summary?academic_year=${academic_session_id}`
          : `/leave-reports/summary`,
        method: "GET",
      }),
      providesTags: ["LeaveReports"],
    }),

    getIndividualTeacherLeaveReport: builder.query<
      { staff: any; balances: any[]; applications: LeaveApplication[]; comp_off_requests: CompOffRequest[] },
      { staff_id: number }
    >({
      query: ({ staff_id }) => ({
        url: `/leave-reports/individual/${staff_id}`,
        method: "GET",
      }),
      providesTags: ["LeaveReports"],
    }),
  }),
});

export const {
  useLazyGetLeaveTypeForSchoolPageWiseQuery,
  useLazyGetLeavePolicyForSchoolPageWiseQuery,
  useGetLeavePolicyForSchoolPageWiseQuery,
  useGetAllLeavePoliciesForSchoolQuery,
  useLazyGetAllLeavePoliciesForSchoolQuery,
  useLazyGetAllLeaveTypeForSchoolQuery,
  useGetAllLeaveTypeForSchoolQuery,
  useLazyGetStaffsLeaveAppicationQuery,

  useLazyGetAllLeavePoliciesForUserQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,

  useCreateLeavePolicyMutation,
  useUpdateLeavePolicyMutation,
  useDeleteLeavePolicyMutation,
  useApplyLeaveForStaffMutation,
  useUpdateLeaveForStaffMutation,
  useLazyFetchLeaveApplicationOfTeachingStaffForAdminQuery,
  useLazyFetchLeaveApplicationOfOtherStaffForAdminQuery,
  useUpdateStatusForStaffLeaveApplicationMutation,
  useGetLeaveBalancesQuery,
  useWithdrawLeaveApplicationMutation,

  useGetStaffCompOffRequestsQuery,
  useSubmitCompOffRequestMutation,
  useGetAdminCompOffRequestsQuery,
  useProcessCompOffRequestMutation,

  useGetTeachersLeaveSummaryReportQuery,
  useLazyGetIndividualTeacherLeaveReportQuery,
  useGetIndividualTeacherLeaveReportQuery,
} = LeaveApi;


