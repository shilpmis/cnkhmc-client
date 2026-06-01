import { Value } from "@radix-ui/react-select";
import { setFeesPlan } from "@/redux/slices/feesSlice";
import {
  Concession,
  ConcessionDetails,
  ConcessionStudenMaster,
  DetailedFeesPlan,
  ExtraFeesAppliedToStudent,
  FeePaymentReqForExtraFees,
  FeePaymentRequest,
  FeesPlan,
  FeesPlanDetail,
  FeesType,
  InstallmentBreakdown,
  ReqBodyForApplyConsessionToPlan,
  ReqBodyForApplyConsessionToStudent,
  ReqObjectForCreateFeesPlan,
  ReqObjectForUpdateFeesPlan,
  RequestForApplyExtraFees,
  StudentFeeDetails,
  StudentFeesInstallment,
  StudentWithFeeStatus,
  TypeOfInstallmentWiseReportForClass,
} from "@/types/fees";
import { PageMeta } from "@/types/global";
import baseUrl from "@/utils/base-urls";
import { FeePaymentFormData } from "@/utils/fees.validation";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Student } from "@/types/student";

export const FeesApi = createApi({
  reducerPath: "feesApi",
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
    getFeesType: builder.query<
      { data: FeesType[]; meta: PageMeta },
      { page?: number; academic_session: number, applicable_to: "All" | "student" | "plan", status?: "Active" | "Inactive" }
    >({
      query: ({ page = 1, academic_session, applicable_to = 'All', status = 'Active' }) => ({
        url: `/feestype?page=${page}&academic_session=${academic_session}&type=${applicable_to}&status=${status}`,
        method: "GET",
      }),
    }),
    getAllFeesType: builder.query<FeesType[], { academic_session_id: number, applicable_to: "All" | "student" | "plan", status?: "Active" | "Inactive" }>({
      query: ({ academic_session_id, applicable_to = 'All', status = 'Active' }) => ({
        url: `/feestype?all=true&academic_session=${academic_session_id}&type=${applicable_to}&status=${status}`,
        method: "GET",
      }),
    }),
    getFilterFeesType: builder.query<
      FeesType[],
      {
        academic_session_id: number;
        filter: "division";
        value: number | string;
      }
    >({
      query: ({ academic_session_id, filter, value }) => ({
        url: `/feestype/filter?type=${filter}&value=${value}&academic_session=${academic_session_id}`,
        method: "GET",
      }),
    }),
    createFeesType: builder.mutation<
      FeesType,
      { data: Omit<FeesType, "id" | "school_id"> }
    >({
      query: ({ data }) => ({
        url: `/feestype`,
        method: "POST",
        body: data,
      }),
    }),
    updateFeesType: builder.mutation<
      FeesType,
      {
        data: Partial<Omit<FeesType, "school_id" | "id">>;
        id: number;
      }
    >({
      query: ({ data, id }) => ({
        url: `/feestype/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    deleteFeesType: builder.mutation<
      FeesType,
      { fees_type_id: number }
    >({
      query: ({ fees_type_id }) => ({
        url: `/feestype/${fees_type_id}`,
        method: "DELETE"
      }),
    }),
    getFeesPlan: builder.query<
      { data: FeesPlan[]; meta: PageMeta },
      {
        academic_session: number;
        status?: "All" | "Active" | "Inactive";
        page?: number;
      }
    >({
      query: ({ academic_session, status = "All", page = 1 }) => ({
        url: `/feesplan?academic_session=${academic_session}&status=${status}&page=${page}`,
        method: "GET",
      }),

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setFeesPlan([...data.data]));
        } catch (error) {
          console.log("Error while fetching Fees Plan", error);
        }
      },
    }),
    getFilteredFeesPlan: builder.query<
      { data: FeesPlan[]; meta: PageMeta },
      {
        academic_session: number;
        page?: number;
        filter_by: "eligible_for_concession";
        value: number | string;
      }
    >({
      query: ({ academic_session, page = 1, filter_by, value }) => ({
        url: `/feesplan?academic_session=${academic_session}&${filter_by}=${value}&page=${page}`,
        method: "GET",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setFeesPlan([...data.data]));
        } catch (error) {
          console.log("Error while fetching Fees Plan", error);
        }
      },
    }),
    FetchDetailFeePlan: builder.query<
      DetailedFeesPlan,
      { academic_session: number; plan_id: number }
    >({
      query: ({ plan_id, academic_session }) => ({
        url: `/feesplan/detail/${plan_id}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),
    createFeesPlan: builder.mutation<
      FeesPlan,
      { data: ReqObjectForCreateFeesPlan; academic_session: number }
    >({
      query: ({ data, academic_session }) => ({
        url: `/feesplan`,
        method: "POST",
        body: { ...data, academic_session_id: academic_session },
      }),
    }),

    updateFeesPlanStatus: builder.query<
      FeesPlan,
      { status: "Active" | "Inactive"; plan_id: number }
    >({
      query: ({ plan_id, status }) => ({
        url: `/feesplan/status/${plan_id}/${status}`,
        method: "GET",
      }),
    }),

    updateFeesPlan: builder.mutation<
      FeesPlan,
      { payload: ReqObjectForUpdateFeesPlan; plan_id: number }
    >({
      query: ({ payload, plan_id }) => ({
        url: `/feesplan/${plan_id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    deleteFeesPlan: builder.mutation<
      any,
      { plan_id: number }
    >({
      query: ({ plan_id }) => ({
        url: `/feesplan/${plan_id}`,
        method: "DELETE",
      }),
    }),

    getStudentFeesDetailsForClass: builder.query<
      { data: StudentWithFeeStatus[]; meta: PageMeta },
      { class_id: number; page?: number; academic_session: number }
    >({
      query: ({ class_id, page = 1, academic_session }) => ({
        url: `/fees/status/class/${class_id}?academic_session=${academic_session}&page=${page}`,
        method: "GET",
      }),
    }),

    getFilterdStudentFeesDetailsForClass: builder.query<
      { data: StudentWithFeeStatus[]; meta: PageMeta },
      {
        class_id: number;
        page?: number;
        academic_session: number;
        filter_by: "eligible_for_concession";
        value: number | string;
      }
    >({
      query: ({ class_id, page = 1, academic_session, filter_by, value }) => ({
        url: `/fees/status/class/${class_id}?academic_session=${academic_session}&${filter_by}=${value}&page=${page}`,
        method: "GET",
      }),
    }),

    getStudentFeesDetails: builder.query<StudentFeeDetails, { student_id: number, academic_session_id: number }>({
      query: ({ student_id, academic_session_id }) => ({
        url: `/fees/status/student/${student_id}?academic_session=${academic_session_id}`,
        method: "GET",
      }),
    }),

    applyExtraFeesPlanOnStudentFeesPlan: builder.mutation<
      ExtraFeesAppliedToStudent,
      { payload: RequestForApplyExtraFees }
    >({
      query: ({ payload }) => ({
        url: `/feesplan/applyextrafees`,
        method: "POST",
        body: payload,
      }),
    }),

    payFees: builder.mutation<
      any,
      { payload: FeePaymentRequest; student_id: number }
    >({
      query: ({ payload, student_id }) => ({
        url: `/fees/pay/2`,
        method: "GET",
        body: payload,
      }),
    }),

    payMultipleInstallments: builder.mutation<
      any,
      { installments: FeePaymentRequest[]; student_id: number, academic_session_id: number }
    >({
      query: ({ installments, student_id, academic_session_id }) => ({
        url: `/fees/pay/installments?academic_session=${academic_session_id}`,
        method: "POST",
        body: {
          student_id: student_id,
          installments: installments,
        },
      }),
    }),


    payMultipleInstallmentsForExtraFees: builder.mutation<
      any,
      { payload: FeePaymentReqForExtraFees, academic_session_id: number }
    >({
      query: ({ payload, academic_session_id }) => ({
        url: `/fees/pay/extra/installments?academic_session=${academic_session_id}`,
        method: "POST",
        body: payload,
      }),
    }),

    updatePaymentStatus: builder.mutation<
      any,
      { payload: { status: string; remarks: string }; transaction_id: number }
    >({
      query: ({ transaction_id, payload }) => ({
        url: `/transaction/${transaction_id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    getConcessions: builder.query<
      { data: Concession[]; meta: PageMeta },
      {
        academic_session: number;
        status?: "all" | "active" | "inactive",
        category?: string,
        search_term?: string,
        page?: number
      }
    >({
      query: ({ page = 1, academic_session, status = 'all', category = 'all', search_term = undefined }) => ({
        url: `/concessions?academic_session=${academic_session}&status=${status}&category=${category}&search=${search_term}&page=${page}`,
        method: "GET",
      }),
    }),

    getAllConcessions: builder.query<
      Concession[],
      { academic_session_id: number }
    >({
      query: ({ academic_session_id }) => ({
        url: `/concessions/all?academic_session=${academic_session_id}`,
        method: "GET",
      }),
    }),

    getConcessionsInDetail: builder.query<
      Concession,
      { concession_id: number; academic_session: number }
    >({
      query: ({ concession_id, academic_session }) => ({
        url: `/concession/${concession_id}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),

    getConcessionsHolderStudents: builder.query<
      {data : ConcessionStudenMaster[] , meta : PageMeta},
      { concession_id: number; academic_session: number , class_id ?: number , division_id ?: number , search ?: string}
    >({
      query: ({ concession_id, academic_session , class_id = undefined , division_id = undefined , search = undefined}) => ({
        url: `/concession/holder-students/${concession_id}?academic_session=${academic_session}&class_id=${class_id}&division_id=${division_id}&search=${search}`,
        method: "GET",
      }),
    }),

    createConcessions: builder.mutation<
      Concession,
      { payload: Omit<Concession, "id" | 'created_at'> }
    >({
      query: ({ payload }) => ({
        url: `/concession`,
        method: "POST",
        body: payload,
      }),
    }),

    updateConcessions: builder.mutation<
      Concession,
      {
        concession_id: number;
        payload: Pick<
          Concession,
          "name" | "description" | "status" | "category"
        >;
      }
    >({
      query: ({ payload, concession_id }) => ({
        url: `/concession/${concession_id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    applyConcessionsToPlan: builder.mutation<
      Concession,
      {
        payload: ReqBodyForApplyConsessionToPlan;
      }
    >({
      query: ({ payload }) => ({
        url: `/concession/apply/plan`,
        method: "POST",
        body: payload,
      }),
    }),

    updateConcsessionAppliedToPlan: builder.mutation<
      Concession,
      {
        concession_id: number;
        plan_id: number;
        payload: {
          status: "Active" | "Inactive";
        };
      }
    >({
      query: ({ payload, concession_id, plan_id }) => ({
        url: `/concession/paln/${concession_id}/${plan_id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    applyConcessionsToStudent: builder.mutation<
      Concession,
      {
        payload: ReqBodyForApplyConsessionToStudent;
      }
    >({
      query: ({ payload }) => ({
        url: `/concession/apply/student`,
        method: "POST",
        body: payload,
      }),
    }),

    updateConcsessionAppliedToStudent: builder.mutation<
      Concession,
      {
        concession_id: number;
        student_id: number;
        plan_id: number;
        payload: {
          status: "Active" | "Inactive";
        };
      }
    >({
      query: ({ payload, concession_id, plan_id, student_id }) => ({
        url: `/concession/student/${concession_id}/${plan_id}/${student_id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    fetchInstallmentDetails: builder.query<
      FeesPlan,
      { division_id: number; academic_session_id: number }
    >({
      query: ({ division_id, academic_session_id }) => ({
        url: `/feesplan/installments/${division_id}?academic_session=${academic_session_id}`,
        method: "GET",
      }),
    }),

    fetchInsatllmentWiseReport: builder.query<
      { data: TypeOfInstallmentWiseReportForClass[]; fees_type_details: FeesPlanDetail; installment: InstallmentBreakdown; message: string },
      { division_id: number; academic_session: number; fees_type_id: number; installment_id: number }
    >({
      query: ({ division_id, academic_session, installment_id, fees_type_id }) => ({
        url: `/fees/report/installmentwisereport/${division_id}/${fees_type_id}/${installment_id}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),

    fetchReportBasedOnFeesType: builder.query<
      { data: TypeOfInstallmentWiseReportForClass[]; fees_type_details: FeesPlanDetail; installment: InstallmentBreakdown; message: string },
      { division_id: number; academic_session: number; fees_type_id: number; installment_id: number }
    >({
      query: ({ division_id, academic_session, installment_id, fees_type_id }) => ({
        url: `/fees/report/installmentwisereport/${division_id}/${fees_type_id}/${installment_id}?academic_session=${academic_session}`,
        method: "GET",
      }),
    }),


    updateStatusForTransaction: builder.mutation<
      { data: StudentFeesInstallment },
      {
        student_fees_master_id: number, transaction_id: number,
        payload: {
          status?: 'Reversal Requested',
          remarks?: string,
          payment_status?: 'Success' | 'In Progress' | 'Failed' | 'Disputed' | 'Cancelled',
        }
        is_extra_fees?: boolean
      }
    >({
      query: ({ student_fees_master_id, transaction_id, payload, is_extra_fees = false }) => ({
        url: `/transaction/${student_fees_master_id}/${transaction_id}?is_extra_fees=${is_extra_fees}`,
        method: "PUT",
        body: payload,
      }),
    }),

    reverseTransaction: builder.mutation<
      { data: StudentFeesInstallment },
      {
        student_fees_master_id: number, transaction_id: number,
        payload: { remarks: string },
        is_extra_fees?: boolean
      }
    >({
      query: ({ student_fees_master_id, transaction_id, payload, is_extra_fees = false }) => ({
        url: `/transaction/reverse/${student_fees_master_id}/${transaction_id}?is_extra_fees=${is_extra_fees}`,
        method: "PUT",
        body: payload,
      }),
    })


  }),
});

export const {
  useGetFeesTypeQuery,
  useLazyGetFeesTypeQuery,
  useLazyGetAllFeesTypeQuery,
  useDeleteFeesTypeMutation,
  useGetAllFeesTypeQuery,
  useLazyGetFilterFeesTypeQuery,
  useCreateFeesTypeMutation,
  useUpdateFeesTypeMutation,
  useCreateFeesPlanMutation,
  useUpdateFeesPlanMutation,
  useLazyGetFeesPlanQuery,
  useLazyGetFilteredFeesPlanQuery,
  useLazyFetchDetailFeePlanQuery, // to fetch single fee plan

  useLazyUpdateFeesPlanStatusQuery,

  useGetAllConcessionsQuery,
  useLazyGetAllConcessionsQuery,

  useUpdateConcsessionAppliedToPlanMutation,
  useUpdateConcsessionAppliedToStudentMutation,

  useLazyGetStudentFeesDetailsQuery,
  useGetStudentFeesDetailsQuery,

  useLazyGetStudentFeesDetailsForClassQuery,
  useLazyGetFilterdStudentFeesDetailsForClassQuery,

  usePayFeesMutation,
  usePayMultipleInstallmentsMutation,
  useUpdatePaymentStatusMutation,

  useLazyGetConcessionsQuery,
  useCreateConcessionsMutation,
  useUpdateConcessionsMutation,
  useLazyGetConcessionsInDetailQuery,
  useLazyGetConcessionsHolderStudentsQuery,
  useApplyConcessionsToPlanMutation,
  useApplyConcessionsToStudentMutation,

  useApplyExtraFeesPlanOnStudentFeesPlanMutation,
  usePayMultipleInstallmentsForExtraFeesMutation,


  useFetchInstallmentDetailsQuery,
  useLazyFetchInsatllmentWiseReportQuery,

  useReverseTransactionMutation,
  useUpdateStatusForTransactionMutation,

  useDeleteFeesPlanMutation
} = FeesApi;
