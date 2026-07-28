import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
    AddStudentsRequest,
    ReqBodyForDropStudent,
    ReqBodyForStudentCompletion,
    ReqBodyForStudentSuspension,
    ReqBodyForStundetMigration,
    Student,
    StudentEnrollment,
    StudentEntry,
    UpdateStudent,
} from "@/types/student";
import baseUrl from "@/utils/base-urls";
import { PageMeta } from "@/types/global";

/**
 *
 * RTK Query for query which are simple to execute and need caching
 */

export const StudentManagementApi = createApi({
    reducerPath: "studentManagementApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${baseUrl.serverUrl}api/v1/`,
        prepareHeaders: (headers) => {
            headers.set(
                "Authorization",
                `Bearer ${localStorage.getItem("access_token")}`
            );
            headers.set("Accept", "*/*");
            return headers;
        },
    }),
    endpoints: (builder) => ({
        fetchStudentEnrollmentsForDivision: builder.query<{ data: StudentEnrollment[], meta: PageMeta }, { division_id: number, page?: number }>({
            query: ({ division_id, page = 1 }) => ({
                url: `/management/students/${division_id}?page=${page}`,
                method: "GET",
            }),
        }),


        migrateStudent: builder.mutation<
            Student,
            { student_enrollment_id: number, payload: ReqBodyForStundetMigration }
        >({
            query: ({ student_enrollment_id, payload }) => ({
                url: `management/student/migrate/${student_enrollment_id}`,
                method: "POST",
                body: payload,
            }),
        }),


        DropStudent: builder.mutation<
            Student,
            { student_enrollment_id: number, payload: ReqBodyForDropStudent }
        >({
            query: ({ student_enrollment_id, payload }) => ({
                url: `management/student/drop/${student_enrollment_id}`,
                method: "POST",
                body: payload,
            }),
        }),


        updaeStudentStatusToComplete: builder.mutation<
            Student,
            { student_enrollment_id: number, payload: ReqBodyForStudentCompletion }
        >({
            query: ({ student_enrollment_id, payload }) => ({
                url: `management/student/complete/${student_enrollment_id}`,
                method: "POST",
                body: payload,
            }),
        }),


        suspensendStudent: builder.mutation<
            Student,
            { student_enrollment_id: number, payload: ReqBodyForStudentSuspension }
        >({
            query: ({ student_enrollment_id, payload }) => ({
                url: `management/student/suspend/${student_enrollment_id}`,
                method: "POST",
                body: payload,
            }),
        }),


        autoAssignRollNumbers: builder.mutation<
            any,
            { division_id: number }
        >({
            query: ({ division_id }) => ({
                url: `management/students/${division_id}/auto-assign-roll-numbers`,
                method: "POST",
            }),
        }),

        manuallyUpdateRollNumber: builder.mutation<
            any,
            { student_id: number, payload: { roll_number: number } }
        >({
            query: ({ student_id, payload }) => ({
                url: `management/students/${student_id}/roll-number`,
                method: "PUT",
                body: payload,
            }),
        }),

    }),
});

export const {
    useFetchStudentEnrollmentsForDivisionQuery,
    useLazyFetchStudentEnrollmentsForDivisionQuery,
    useSuspensendStudentMutation,
    useUpdaeStudentStatusToCompleteMutation,
    useDropStudentMutation,
    useMigrateStudentMutation,
    useAutoAssignRollNumbersMutation,
    useManuallyUpdateRollNumberMutation
} = StudentManagementApi;
