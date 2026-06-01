import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";

export interface Entity {
  id: number;
  organization_id: number;
  name: string;
  type: "SCHOOL" | "COLLEGE";
  email?: string | null;
  branch_code?: string | null;
  contact_number?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  logo?: string | null;
  config?: any;
  status: "ACTIVE" | "INACTIVE";
  created_at?: string;
  updated_at?: string;
}

export interface Organisation {
  id: number;
  name: string;
  email: string;
  contact_number?: number;
  subscription_type: "FREE" | "PREMIUM";
  subscription_start_date?: string;
  subscription_end_date?: string;
  is_email_verified?: boolean;
  status: "ACTIVE" | "INACTIVE";
  organization_logo?: string | null;
  established_year?: string;
  address?: string;
  head_name?: string;
  head_contact_number?: number;
  district?: string;
  city?: string;
  state?: string;
  pincode?: string;
  entities?: Entity[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrganisationPayload {
  name: string;
  email: string;
  contact_number: number;
  subscription_type: "FREE" | "PREMIUM";
  subscription_start_date: string;
  subscription_end_date: string;
  is_email_verified?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  organization_logo?: string;
  established_year?: string;
  address?: string;
  head_name?: string;
  head_contact_number?: number;
  district?: string;
  city?: string;
  state?: string;
  pincode?: string;
  admin_username?: string;
  admin_password?: string;
}

export interface CreateEntityPayload {
  name: string;
  type: "SCHOOL" | "COLLEGE";
  config?: any;
  email?: string;
  branch_code?: string;
  contact_number?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  admin_username?: string;
  admin_password?: string;
}

export const OrganisationApi = createApi({
  reducerPath: "organisationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl.serverUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("access_token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Organisation", "Entity", "Report"],
  endpoints: (builder) => ({
    getOrganizations: builder.query<Organisation[], void>({
      query: () => "/api/v1/organizations",
      providesTags: ["Organisation"],
    }),
    getOrganizationById: builder.query<Organisation, number>({
      query: (id) => `/api/v1/organization/${id}`,
      providesTags: ["Organisation"],
    }),
    createOrganization: builder.mutation<Organisation, CreateOrganisationPayload>({
      query: (body) => ({
        url: "/api/v1/onboard-organization",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Organisation"],
    }),
    updateOrganization: builder.mutation<Organisation, { id: number; payload: Partial<CreateOrganisationPayload> }>({
      query: ({ id, payload }) => ({
        url: `/api/v1/organization/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Organisation"],
    }),
    getEntities: builder.query<Entity[], number>({
      query: (organization_id) => `/api/v1/super-admin/organizations/${organization_id}/entities`,
      providesTags: ["Entity"],
    }),
    createEntity: builder.mutation<Entity, { organization_id: number; payload: CreateEntityPayload }>({
      query: ({ organization_id, payload }) => ({
        url: `/api/v1/super-admin/organizations/${organization_id}/entities`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Entity", "Organisation"],
    }),
    getOrganizationAggregatedReport: builder.query<any, number>({
      query: (organization_id) => `/api/v1/organization/${organization_id}/reports/aggregated`,
      providesTags: ["Report"],
    }),
    getEntityDetailedReport: builder.query<any, number>({
      query: (entity_id) => `/api/v1/entity/${entity_id}/reports/detailed`,
      providesTags: ["Report"],
    }),
    deleteOrganization: builder.mutation<any, { id: number; payload: { password?: string } }>({
      query: ({ id, payload }) => ({
        url: `/api/v1/organization/${id}`,
        method: "DELETE",
        body: payload,
      }),
      invalidatesTags: ["Organisation"],
    }),
  }),
});

export const {
  useGetOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useGetEntitiesQuery,
  useCreateEntityMutation,
  useGetOrganizationAggregatedReportQuery,
  useGetEntityDetailedReportQuery,
  useDeleteOrganizationMutation,
} = OrganisationApi;
