import { createAsyncThunk } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import ApiService from "./ApiService";
import { setSchoolCredential } from "@/redux/slices/schoolSlice";
import baseUrl from "@/utils/base-urls";

interface Organization {
    name:string,
    organization_id:number,
    organization_logo: any,
    pincode: number,
    username: string,
    head_contact_number: number,
    head_name: string,
    address: string,
    subscription_type: string,
}

interface School {
    id: number,
    name: string,
    email: string,
    username: string,
    contact_number: number,
    subscriptionType: string,
    status: string,
    established_year: string,
    school_type: string,
    address: string,
    branch_code:string,
    city: string,
    enrollment_number_format: string,
    created_at: Date,
    organization: Organization,
    academicSessions: any[]
}

interface TypeForUpdateSchoolData {
    name?: string,
    contact_number?: number,
    subscription_type?: string,
    established_year?: string,
    school_type?: string,
    address?: string,
    enrollment_number_format?: string
}


export const SchoolApi = createApi({
    reducerPath : 'schoolApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${baseUrl.serverUrl}api/v1/`,
        prepareHeaders: (headers, { getState }) => {
            headers.set("Authorization", `Bearer ${localStorage.getItem('access_token')}`)
            return headers
        },
    }),
    endpoints: (builder) => ({
        getSchool: builder.query<School , number>({
            query: (school_id) => ({
                url: `/school/${school_id}`,
                method: "GET",
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                
                const { data } = await queryFulfilled
                dispatch(setSchoolCredential(data))
            }
        }),
        updateSchool: builder.mutation<{ school: School }, { school_id: number, payload: Omit<Partial<School> ,'id' | 'email' | 'username'> }>({
            query: ({ payload, school_id }) => ({
                url: `/school/${school_id}`,
                method: "PUT",
                body: payload
            })
        })
    })
})

export const { useGetSchoolQuery, useLazyGetSchoolQuery, useUpdateSchoolMutation } = SchoolApi;


/**
 *  
 *   Query using Thunk for complicated one , which need some operation after or before trigger query 
 */


export const updateSchoolDetails = createAsyncThunk("school/updateSchool", async ({ id, schoolData }: { id: number; schoolData: TypeForUpdateSchoolData },  { rejectWithValue }) => {
    try {
        const response = await ApiService.put(`/school/${id}`, schoolData);
        return response.data;
    } catch (error: any) {
        console.log("Error while updating basic school infromation" , error)
        return rejectWithValue(error.response?.data || "Failed to update school");
    }
});

