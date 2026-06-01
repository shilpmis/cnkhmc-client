import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";
import { AttendanceDetails } from "@/types/attendance";
import {
  SalaryComponent,
  SalaryTemplate,
  SalaryTemplateUpdatePayload,
  StaffEnrollmentForPayroll,
  StaffPayRun,
  StaffSalaryTemplate,
  TypeForCreateSalaryTemplateForrStaff,
  TypeForUpdateStaffPayRun,
} from "@/types/payroll";
import { PageMeta } from "@/types/global";

export const PayrollApi = createApi({
  reducerPath: "payrollApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`, // Updated to match your API URL
    prepareHeaders: (headers, { getState }) => {
      // headers.set('Accept', 'application/json')
      headers.set(
        "Authorization",
        `Bearer ${localStorage.getItem("access_token")}`
      );
      return headers;
    },
  }),
  endpoints: (builder) => ({
    fetchSalaryComponent: builder.query<
      { data: SalaryComponent[]; meta: PageMeta },
      { academic_session: number }
    >({
      query: ({ academic_session }) => ({
        url: `/payroll/salary-component?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),

    fetchAllSalaryComponent: builder.query<
      SalaryComponent[],
      { academic_session: number }
    >({
      query: ({ academic_session }) => ({
        url: `/payroll/salary-component?academic_session=${academic_session}&all=true`,
        method: "GET",
      }),
    }),

    createSalaryComponent: builder.mutation<
      SalaryComponent,
      {
        payload: Omit<
          SalaryComponent,
          "id" | "school_id" | "created_at" | "updated_at"
        >;
      }
    >({
      query: ({ payload }) => ({
        url: `/payroll/salary-component`,
        method: "POST",
        body: payload,
      }),
    }),

    updaetSalaryComponent: builder.mutation<
      SalaryComponent,
      {
        payload: Partial<
          Omit<
            SalaryComponent,
            "id" | "school_id" | "created_at" | "updated_at"
          >
        >;
        salary_component_id: number;
      }
    >({
      query: ({ payload, salary_component_id }) => ({
        url: `/payroll/salary-component/${salary_component_id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    deleteSalaryComponent: builder.query<
      void,
      {
        salary_component_id: number;
      }
    >({
      query: ({ salary_component_id }) => ({
        url: `/payroll/salary-component/${salary_component_id}`,
        method: "delete",
      }),
    }),

    fetchSalaryTemplate: builder.query<
      { data: SalaryTemplate[]; meta: PageMeta },
      { academic_session: number }
    >({
      query: ({ academic_session }) => ({
        url: `/payroll/salary-template?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),

    fetchAllSalaryTemplate: builder.query<
      SalaryTemplate[],
      { academic_session: number }
    >({
      query: ({ academic_session }) => ({
        url: `/payroll/salary-template?academic_session=${academic_session}&all=true`,
        method: "GET",
      }),
    }),

    fetchSingleSalaryTemplate: builder.query<
      SalaryTemplate,
      { template_id: number }
    >({
      query: ({ template_id }) => ({
        url: `/payroll/salary-template/${template_id}`,
        method: "GET",
      }),
    }),

    createSalaryTemplate: builder.mutation<
      SalaryTemplate,
      {
        payload: Omit<
          SalaryTemplate,
          "id" | "school_id" | "created_at" | "updated_at"
        >;
      }
    >({
      query: ({ payload }) => ({
        url: `/payroll/salary-template`,
        method: "POST",
        body: payload,
      }),
    }),

    updaetSalaryTemplate: builder.mutation<
      SalaryTemplate,
      {
        payload: Partial<SalaryTemplateUpdatePayload>;
        salary_template_id: number;
      }
    >({
      query: ({ payload, salary_template_id }) => ({
        url: `/payroll/salary-template/${salary_template_id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    createStaffSalaryTemplate: builder.mutation<
      StaffSalaryTemplate,
      {
        payload: TypeForCreateSalaryTemplateForrStaff;
      }
    >({
      query: ({ payload }) => ({
        url: `/payroll/staff-salary-template`,
        method: "POST",
        body: payload,
      }),
    }),

    updaetStaffSalaryTemplate: builder.mutation<
      SalaryTemplate,
      {
        payload: Partial<SalaryTemplateUpdatePayload>;
        salary_template_id: number;
        staff_id: number;
      }
    >({
      query: ({ payload, salary_template_id, staff_id }) => ({
        url: `/payroll/staff-salary-template/${staff_id}/${salary_template_id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    fetchSingleStaffSalaryTemplate: builder.query<
      StaffSalaryTemplate,
      { staff_id: number }
    >({
      query: ({ staff_id }) => ({
        url: `/payroll/staff-salary-template/${staff_id}`,
        method: "GET",
      }),
    }),

    indexStaffWithPayroll: builder.query<
      { data: StaffEnrollmentForPayroll[]; meta: PageMeta },
      { month: string; year: string }
    >({
      query: ({ month, year }) => ({
        url: `/payroll/staff?period=${year}-${month}`,
        method: "GET",
      }),
    }),

    createDraftForStaffPayroll: builder.mutation<
      StaffPayRun,
      {
        payload: StaffPayRun;
      }
    >({
      query: ({ payload }) => ({
        url: `/payroll/payrun`,
        method: "POST",
        body: payload,
      }),
    }),

    updateDraftForStaffPayroll: builder.mutation<
      StaffPayRun,
      {
        payload: TypeForUpdateStaffPayRun;
        staff_id: number;
        payrun_template_id: number;
      }
    >({
      query: ({ payload, staff_id, payrun_template_id }) => ({
        url: `/payroll/payrun/${staff_id}/${payrun_template_id}`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

export const {
  useLazyFetchSalaryComponentQuery,
  useLazyFetchAllSalaryComponentQuery,
  useFetchAllSalaryComponentQuery,
  useCreateSalaryComponentMutation,
  useUpdaetSalaryComponentMutation,
  useLazyDeleteSalaryComponentQuery,
  useCreateSalaryTemplateMutation,
  useUpdaetSalaryTemplateMutation,
  useLazyFetchSalaryTemplateQuery,
  useLazyFetchSingleSalaryTemplateQuery,

  useFetchSalaryTemplateQuery,
  useLazyFetchAllSalaryTemplateQuery,
  useFetchAllSalaryTemplateQuery,

  useCreateStaffSalaryTemplateMutation,
  useUpdaetStaffSalaryTemplateMutation,

  useFetchSingleStaffSalaryTemplateQuery,
  useLazyFetchSingleStaffSalaryTemplateQuery,

  useLazyIndexStaffWithPayrollQuery,
  useIndexStaffWithPayrollQuery,

  useCreateDraftForStaffPayrollMutation,
  useUpdateDraftForStaffPayrollMutation,
} = PayrollApi;
