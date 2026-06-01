import { createAsyncThunk } from "@reduxjs/toolkit";
import ApiService from "./ApiService";
import type { Class } from "@/types/class";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { AcademicClasses, Division } from "@/types/academic";
import { setAcademicClasses } from "@/redux/slices/academicSlice";
import baseUrl from "@/utils/base-urls";

interface AcademicSession {
  id?: number;
  school_id: number;
  start_month: string;
  end_month: string;
  start_year: string;
  end_year: string;
  is_active?: boolean;
}

/**
 *
 * RTK Query for query which are simeple to execute and need to caching
 */

export const AcademicApi = createApi({
  reducerPath: "AcademicApi",
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
    getAcademicClasses: builder.query<AcademicClasses[], number>({
      query: (school_id) => ({
        url: `/classes/${school_id}`,
        method: "GET",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAcademicClasses([...data]));
        } catch (error) {
          console.log("Error while fetching academic classes", error);
        }
      },
    }),
    getAllClassesWithOutFeesPlan: builder.query<
      AcademicClasses[],
      { school_id: number }
    >({
      query: ({ school_id }) => ({
        url: `/classes/${school_id}?without_fees_plan=true`,
        method: "GET",
      }),
    }),
    getAcademicSessions: builder.query<any, number>({
      query: (school_id) => ({
        url: `/academic-sessions/${school_id}`,
        method: "GET",
      }),
    }),
    createAcademicSession: builder.mutation<
      AcademicSession,
      Omit<AcademicSession, "id">
    >({
      query: (session) => ({
        url: "/academic-session",
        method: "POST",
        body: session,
      }),
    }),
    setActiveSession: builder.mutation<AcademicSession, number>({
      query: (sessionId) => ({
        url: `/academic-session/${sessionId}`,
        method: "PUT",
        body: { is_active: true },
      }),
    }),
    deleteAcademicSession: builder.mutation<void, number>({
      query: (sessionId) => ({
        url: `/academic-session/${sessionId}`,
        method: "DELETE",
      }),
    }),
    getBatches: builder.query<any[], number>({
      query: (school_id) => ({
        url: `/batches?entity_id=${school_id}`,
        method: "GET",
      }),
    }),
    createBatch: builder.mutation<any, any>({
      query: (batch) => ({
        url: "/batches",
        method: "POST",
        body: batch,
      }),
    }),
    updateBatch: builder.mutation<any, {id: number, name: string}>({
      query: ({id, ...body}) => ({
        url: `/batches/${id}`,
        method: "PUT",
        body,
      }),
    }),
    deleteBatch: builder.mutation<void, number>({
      query: (id) => ({
        url: `/batches/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetAcademicClassesQuery,
  useLazyGetAcademicClassesQuery,
  useGetAcademicSessionsQuery,
  useCreateAcademicSessionMutation,
  useSetActiveSessionMutation,
  useDeleteAcademicSessionMutation,
  useLazyGetAllClassesWithOutFeesPlanQuery,
  useGetBatchesQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useDeleteBatchMutation,
} = AcademicApi;

/**
 *
 *   Query using Thunk for complicated one , which need some operation after or before trigger query
 */

export const createClasses = createAsyncThunk<
  Class,
  Omit<Class, "id" | "school_id">[]
>("academic/createClass", async (newClass, { rejectWithValue }) => {
  try {
    const response = await ApiService.post("/classes", newClass);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to create class");
  }
});

export const createDivision = createAsyncThunk<
  Division,
  Omit<Division, "id" | "class">
>("academic/createDivision", async (paylaod, { rejectWithValue }) => {
  try {
    const res = await ApiService.post("class/division", paylaod);
    return res.data;
  } catch (error: any) {
    console.log(error);
    return rejectWithValue(error.response?.data || "Failed to create class");
  }
});

export const editDivision = createAsyncThunk<
  Class[],
  { aliases: string | null; class_id: number }
>("academic/updateDivision", async (paylaod, { rejectWithValue }) => {
  try {
    const res = await ApiService.put(`class/${paylaod.class_id}`, {aliases : paylaod.aliases});
    return res.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || "Failed to create class");
  }
});

// Get all classes for a school
export const getClasses = createAsyncThunk<Class[], number>(
  "academic/getClasses",
  async (school_id, { rejectWithValue }) => {
    try {
      const response = await ApiService.get(`/classes/${school_id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch classes");
    }
  }
);

// Update a class
export const updateClass = createAsyncThunk<Class, Class>(
  "academic/updateClass",
  async (updatedClass, { rejectWithValue }) => {
    try {
      const response = await ApiService.put(
        `/classes/${updatedClass.school_id}`,
        updatedClass
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to update class");
    }
  }
);
