import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";

export interface CertificateTemplate {
  id: number;
  name: string;
  type: string;
  content: string;
  schoolId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CertificateTemplateApi = createApi({
  reducerPath: "certificateTemplateApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`);
      return headers;
    },
  }),
  tagTypes: ["CertificateTemplate"],
  endpoints: (builder) => ({
    getCertificateTemplates: builder.query<{ success: boolean, data: CertificateTemplate[] }, { school_id: number }>({
      query: ({ school_id }) => ({
        url: `/certificate-templates?school_id=${school_id}`,
        method: "GET",
      }),
      providesTags: ["CertificateTemplate"],
    }),
    createCertificateTemplate: builder.mutation<{ success: boolean, data: CertificateTemplate }, Partial<CertificateTemplate>>({
      query: (body) => ({
        url: `/certificate-templates`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CertificateTemplate"],
    }),
    updateCertificateTemplate: builder.mutation<{ success: boolean, data: CertificateTemplate }, Partial<CertificateTemplate> & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `/certificate-templates/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["CertificateTemplate"],
    }),
    deleteCertificateTemplate: builder.mutation<{ success: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `/certificate-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CertificateTemplate"],
    }),
    generateCertificate: builder.mutation<{ success: boolean, data: { content: string, certificate_number: string } }, { id: number, student_id: number, purpose?: string, exam_passed?: string }>({
      query: ({ id, student_id, purpose, exam_passed }) => ({
        url: `/certificate-templates/0/generate/${student_id}?purpose=${encodeURIComponent(purpose || '')}&exam_passed=${encodeURIComponent(exam_passed || '')}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetCertificateTemplatesQuery,
  useCreateCertificateTemplateMutation,
  useUpdateCertificateTemplateMutation,
  useDeleteCertificateTemplateMutation,
  useGenerateCertificateMutation,
} = CertificateTemplateApi;
