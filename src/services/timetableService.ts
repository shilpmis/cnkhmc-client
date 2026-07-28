import { createAsyncThunk } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import ApiService from "./ApiService";
import { setSchoolCredential } from "@/redux/slices/schoolSlice";
import baseUrl from "@/utils/base-urls";
import { ClassDayConfigForTimeTable, labConfig, PeriodsConfig, SchoolSubject, SubjectDivisionMaster, SubjectDivisionStaffMaster, TimeTableConfigForSchool, TypeForCretePeriodsConfigForADay, TypeForUpdatePeriodsConfigForADay, WeeklyTimeTableForDivision, TypeForUpdatePeriodsConfigForAWeek } from "@/types/subjects";

export const TimeTableApi = createApi({
    reducerPath: 'timeTableApi',
    tagTypes: ['TimeTableConfig', 'PeriodsConfig', 'LabConfig'],
    baseQuery: fetchBaseQuery({
        baseUrl: `${baseUrl.serverUrl}api/v1/`,
        prepareHeaders: (headers, { getState }) => {
            headers.set("Authorization", `Bearer ${localStorage.getItem('access_token')}`)
            return headers
        },
    }),
    endpoints: (builder) => ({
        getTimeTableConfigForSchool: builder.query<TimeTableConfigForSchool, { academic_session_id: number }>({
            query: ({ academic_session_id }) => ({
                url: `/timetable/config/${academic_session_id}`,
                method: "GET",
            }),
            providesTags: ['TimeTableConfig'],
        }),
        createTimeTableConfig: builder.mutation<TimeTableConfigForSchool, { payload: Omit<TimeTableConfigForSchool, 'id' | 'lab_config' | 'class_day_config'> }>({
            query: ({ payload }) => ({
                url: `/timetable/config`,
                method: "POST",
                body: payload
            }),
            invalidatesTags: ['TimeTableConfig'],
        }),
        updateTimeTableConfig: builder.mutation<TimeTableConfigForSchool, { config_id: number, payload: Partial<Omit<TimeTableConfigForSchool, 'lab_config' | 'class_day_config'>> }>({
            query: ({ payload, config_id }) => ({
                url: `/timetable/config/${config_id}`,
                method: "PUT",
                body: payload
            }),
            invalidatesTags: ['TimeTableConfig'],
        }),
        createLabConfig: builder.mutation<labConfig, { payload: { school_timetable_config_id: number, labs: Omit<labConfig, 'id' | 'school_timetable_config_id'>[] } }>({
            query: ({ payload }) => ({
                url: `/timetable/config/lab`,
                method: "POST",
                body: payload
            }),
            invalidatesTags: ['LabConfig', 'TimeTableConfig'],
        }),

        updateLabConfig: builder.mutation<labConfig, { lab_id: number, payload: Partial<Omit<labConfig, 'school_timetable_config_id'>> }>({
            query: ({ payload, lab_id }) => ({
                url: `/timetable/config/lab/${lab_id}`,
                method: "PUT",
                body: payload
            }),
            invalidatesTags: ['LabConfig', 'TimeTableConfig'],
        }),

        deleteLab: builder.query<labConfig, { lab_id: number }>({
            query: ({ lab_id }) => ({
                url: `/timetable/config/lab/${lab_id}`,
                method: "DELETE",
            }),
        }),

        createDayWiseTimeTableConfigForClass: builder.mutation<ClassDayConfigForTimeTable, { payload: Omit<ClassDayConfigForTimeTable, 'id' | 'period_config'> }>({
            query: ({ payload }) => ({
                url: `/timetable/config/class/day`,
                method: "POST",
                body: payload
            }),
            invalidatesTags: ['TimeTableConfig'],
        }),

        updateDayWiseTimeTableConfigForClass: builder.mutation<ClassDayConfigForTimeTable, { class_id: number, class_day_config_id: number, payload: Partial<Omit<ClassDayConfigForTimeTable, 'id' | 'school_timetable_config_id' | 'class_id' | 'day' | 'period_config'>> }>({
            query: ({ payload, class_day_config_id, class_id }) => ({
                url: `/timetable/config/class/day/${class_id}/${class_day_config_id}`,
                method: "PUT",
                body: payload
            }),
            invalidatesTags: ['TimeTableConfig'],
        }),
        
        deleteDayWiseTimeTableConfigForClass: builder.mutation<any, { id: number }>({
            query: ({ id }) => ({
                url: `/timetable/config/class/day/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ['TimeTableConfig'],
        }),

        fetchTimeTableConfigForDivision: builder.query<TimeTableConfigForSchool, { academic_session_id: number, division_id: number }>({
            query: ({ academic_session_id, division_id }) => ({
                url: `/timetable/${division_id}?academic_session=${academic_session_id}`,
                method: "GET",
            }),
            providesTags: ['PeriodsConfig', 'TimeTableConfig'],
        }),

        createDayWiseTimeTableForDivison: builder.mutation<PeriodsConfig[], { payload: TypeForCretePeriodsConfigForADay }>({
            query: ({ payload }) => ({
                url: `/timetable/config/period`,
                method: "POST",
                body: payload
            }),
            invalidatesTags: ['PeriodsConfig', 'TimeTableConfig'],
        }),

        updateDayWiseTimeTableForDivison: builder.mutation<PeriodsConfig[], { payload: TypeForUpdatePeriodsConfigForADay }>({
            query: ({ payload }) => ({
                url: `/timetable/config/period`,
                method: "PUT",
                body: payload
            }),
            invalidatesTags: ['PeriodsConfig', 'TimeTableConfig'],
        }),

        updateWeekWiseTimeTableForDivision: builder.mutation<PeriodsConfig[], { payload: TypeForUpdatePeriodsConfigForAWeek }>({
            query: ({ payload }) => ({
                url: `/timetable/config/period/week`,
                method: "PUT",
                body: payload
            }),
            invalidatesTags: ['PeriodsConfig', 'TimeTableConfig'],
        }),


        deleteDayWiseTimeTableForDivison: builder.mutation<any, { school_timetable_config_id: number, division_id: number }>({
            query: ({ school_timetable_config_id, division_id }) => ({
                url: `/timetable/config/${school_timetable_config_id}/${division_id}`,
                method: "DELETE",
            }),
            invalidatesTags: ['PeriodsConfig', 'TimeTableConfig'],
        }),
        
        deleteDayWiseTimeTableForAllDivisions: builder.mutation<any, { class_day_config_id: number }>({
            query: ({ class_day_config_id }) => ({
                url: `/timetable/config/period/all/${class_day_config_id}`,
                method: "DELETE",
            }),
            invalidatesTags: ['PeriodsConfig', 'TimeTableConfig'],
        }),


        verifyPeriodConfigurationForDay: builder.mutation<PeriodsConfig, { payload: Omit<PeriodsConfig, 'id'> }>({
            query: ({ payload }) => ({
                url: `/timetable/verify/config/period`,
                method: "POST",
                body: payload
            }),
        }),

        autoGenerateTimeTableForWeek: builder.mutation<{ timetable: WeeklyTimeTableForDivision[], message: string },
            {
                division_id: number, academic_session_id: number, configuration: {
                    free_periods_count: number,
                    max_consecutive_periods: number,
                    include_pt_periods: boolean,
                    selected_labs: number[],
                    subject_preferences: {
                        subject_id: number,
                        periods_per_week: number,
                        priority: number
                    }[],
                    // Additional configuration from timetable config
                    max_periods_per_day: number,
                    default_period_duration: number,
                    lab_enabled: boolean,
                    pt_enabled: boolean,
                }
            }>({
                query: ({ division_id, academic_session_id , configuration}) => ({
                    url: `/timetable/auto-generate/${division_id}?academic_session=${academic_session_id}`,
                    method: "POST",
                    body: configuration
                }),
                invalidatesTags: ['PeriodsConfig'],
            }),

        saveTimetableVersion: builder.mutation<any, { payload: { division_id: number, academic_session_id: number, periods_config: any[] } }>({
            query: ({ payload }) => ({
                url: `/timetable/version`,
                method: "POST",
                body: payload
            }),
        }),

        getTimetableVersions: builder.query<any, { division_id: number, academic_session_id: number }>({
            query: ({ division_id, academic_session_id }) => ({
                url: `/timetable/version/${division_id}?academic_session=${academic_session_id}`,
                method: "GET",
            }),
        }),

        restoreTimetableVersion: builder.mutation<any, { version_id: number }>({
            query: ({ version_id }) => ({
                url: `/timetable/version/restore/${version_id}`,
                method: "POST",
            }),
            invalidatesTags: ['PeriodsConfig', 'TimeTableConfig'],
        }),

    })

})

export const {
    useGetTimeTableConfigForSchoolQuery,
    useCreateTimeTableConfigMutation,
    useCreateLabConfigMutation,
    useCreateDayWiseTimeTableConfigForClassMutation,
    useUpdateDayWiseTimeTableConfigForClassMutation,
    useLazyFetchTimeTableConfigForDivisionQuery,
    useCreateDayWiseTimeTableForDivisonMutation,
    useVerifyPeriodConfigurationForDayMutation,
    useAutoGenerateTimeTableForWeekMutation,
    useUpdateTimeTableConfigMutation,
    useLazyDeleteLabQuery,
    useUpdateLabConfigMutation,
    useUpdateDayWiseTimeTableForDivisonMutation,
    useUpdateWeekWiseTimeTableForDivisionMutation,
    useDeleteDayWiseTimeTableForDivisonMutation,
    useDeleteDayWiseTimeTableForAllDivisionsMutation,
    useDeleteDayWiseTimeTableConfigForClassMutation,
    useSaveTimetableVersionMutation,
    useLazyGetTimetableVersionsQuery,
    useRestoreTimetableVersionMutation
} = TimeTableApi;

export const exportTimetablePDF = async (divisionId: number, academicSessionId: number) => {
  return ApiService.get(`/timetable/export/${divisionId}?academic_session=${academicSessionId}`, {
    responseType: 'blob',
    timeout: 30000
  });
}