import { createAsyncThunk } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import ApiService from "./ApiService";
import { setSchoolCredential } from "@/redux/slices/schoolSlice";
import baseUrl from "@/utils/base-urls";
import { SchoolSubject, SubjectDivisionMaster, SubjectDivisionStaffMaster } from "@/types/subjects";

export const SubjectApi = createApi({
    reducerPath: 'subjectApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${baseUrl.serverUrl}api/v1/`,
        prepareHeaders: (headers, { getState }) => {
            headers.set("Authorization", `Bearer ${localStorage.getItem('access_token')}`)
            return headers
        },
    }),
    endpoints: (builder) => ({
        getAllSubjects: builder.query<SchoolSubject[], { academic_session_id: number }>({
            query: ({ academic_session_id }) => ({
                url: `/subjects?academic_session=${academic_session_id}`,
                method: "GET",
            }),
        }),
        createSubject: builder.mutation<SchoolSubject, { name: string, description: string, academic_session_id: number, year?: string }>({
            query: ({ name, description, academic_session_id, year }) => ({
                url: `/subject`,
                method: "POST",
                body: {
                    name: name,
                    description: description,
                    academic_session_id: academic_session_id,
                    year: year
                }
            }),
        }),
        updateSubject: builder.mutation<SchoolSubject, { id: number, name: string, description: string, academic_session_id: number, year?: string }>({
            query: ({ id, ...body }) => ({
                url: `/subject/${id}`,
                method: "PUT",
                body: body
            }),
        }),
        deleteSubject: builder.mutation<{ message: string }, { id: number }>({
            query: ({ id }) => ({
                url: `/subject/${id}`,
                method: "DELETE",
            }),
        }),
        getSubjectsForDivision: builder.query<SubjectDivisionMaster[], { academic_session_id: number, division_id: number }>({
            query: ({ academic_session_id, division_id }) => ({
                url: `/subjects/division/${division_id}?academic_session=${academic_session_id}`,
                method: "GET",
            }),
        }),
        assignSubjectToDivision: builder.mutation<
            SubjectDivisionMaster[], { academic_session_id: number, division_id: number, subjects: { subject_id: number, code_for_division: string, description?: string }[] }>({
                query: ({ academic_session_id, division_id, subjects }) => ({
                    url: `/subject/assign`,
                    method: "POST",
                    body: {
                        division_id: division_id,
                        academic_session_id: academic_session_id,
                        subjects: subjects
                    }
                }),
            }),
        assignStaffToSubjects: builder.mutation<
            SubjectDivisionStaffMaster[], 
            { payload: { subjects_division_id: number, staff_enrollment_ids: number[], notes?: string } }>({
                query: ({ payload }) => ({
                    url: `/subject/assign/staffs`,
                    method: "POST",
                    body: payload
                }),
            }),
    })
})

export const {
    useGetAllSubjectsQuery,
    useLazyGetAllSubjectsQuery,
    useCreateSubjectMutation,
    useUpdateSubjectMutation,
    useDeleteSubjectMutation,
    useGetSubjectsForDivisionQuery,
    useAssignSubjectToDivisionMutation,
    useLazyGetSubjectsForDivisionQuery,
    useAssignStaffToSubjectsMutation

} = SubjectApi;