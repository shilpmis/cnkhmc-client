import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/utils/base-urls";

export interface InventoryDepartment {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  issuedItems?: { id: number; itemName: string; quantity: number }[];
}

export interface DeadStock {
  id: number;
  itemName: string;
  invoiceNumber: string | null;
  supplierName: string | null;
  purchaseDate: string | null;
  unitPrice: number;
  totalQuantity: number;
  totalAmount: number;
  expiryDate: string | null;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
  transactions?: DeadStockTransaction[];
}

export interface DeadStockTransaction {
  id: number;
  deadStockId: number;
  departmentId: number | null;
  transactionType: 'ISSUE' | 'RETURN' | 'DISCARD';
  quantity: number;
  transactionDate: string;
  remark: string | null;
  createdAt: string;
  department?: InventoryDepartment;
}

export const DeadStockApi = createApi({
  reducerPath: "deadStockApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl.serverUrl}api/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", `Bearer ${localStorage.getItem("access_token")}`);
      return headers;
    },
  }),
  tagTypes: ["InventoryDepartment", "DeadStock"],
  endpoints: (builder) => ({
    // Inventory Departments
    getInventoryDepartments: builder.query<{ data: InventoryDepartment[] }, void>({
      query: () => ({
        url: `/inventory-departments`,
        method: "GET",
      }),
      providesTags: ["InventoryDepartment"],
    }),
    createInventoryDepartment: builder.mutation<{ message: string, data: InventoryDepartment }, Partial<InventoryDepartment>>({
      query: (body) => ({
        url: `/inventory-departments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryDepartment"],
    }),
    deleteInventoryDepartment: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/inventory-departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["InventoryDepartment"],
    }),

    // Dead Stock
    getDeadStocks: builder.query<{ data: DeadStock[] }, void>({
      query: () => ({
        url: `/dead-stocks`,
        method: "GET",
      }),
      providesTags: ["DeadStock"],
    }),
    getDeadStockById: builder.query<{ data: DeadStock }, number>({
      query: (id) => ({
        url: `/dead-stocks/${id}`,
        method: "GET",
      }),
      providesTags: ["DeadStock"],
    }),
    createDeadStock: builder.mutation<{ message: string, data: DeadStock }, Partial<DeadStock>>({
      query: (body) => ({
        url: `/dead-stocks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["DeadStock"],
    }),

    // Transactions
    issueDeadStock: builder.mutation<{ message: string, data: DeadStockTransaction }, any>({
      query: (body) => ({
        url: `/dead-stocks/issue`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["DeadStock", "InventoryDepartment"],
    }),
    returnDeadStock: builder.mutation<{ message: string, data: DeadStockTransaction }, any>({
      query: (body) => ({
        url: `/dead-stocks/return`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["DeadStock", "InventoryDepartment"],
    }),
    discardDeadStock: builder.mutation<{ message: string, data: DeadStockTransaction }, any>({
      query: (body) => ({
        url: `/dead-stocks/discard`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["DeadStock", "InventoryDepartment"],
    }),
    transferDeadStock: builder.mutation<{ message: string, data: { returnTxn: DeadStockTransaction, issueTxn: DeadStockTransaction } }, any>({
      query: (body) => ({
        url: `/dead-stocks/transfer`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["DeadStock", "InventoryDepartment"],
    }),
  }),
});

export const {
  useGetInventoryDepartmentsQuery,
  useCreateInventoryDepartmentMutation,
  useDeleteInventoryDepartmentMutation,
  useGetDeadStocksQuery,
  useGetDeadStockByIdQuery,
  useCreateDeadStockMutation,
  useIssueDeadStockMutation,
  useReturnDeadStockMutation,
  useDiscardDeadStockMutation,
  useTransferDeadStockMutation,
} = DeadStockApi;
