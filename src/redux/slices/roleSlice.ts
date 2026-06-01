// import { roleService, type Role } from "@/services/RoleService"
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// interface RoleState {
//   roles: Role[]
//   status: "idle" | "loading" | "succeeded" | "failed"
//   error: string | null
// }

// const initialState: RoleState = {
//   roles: [],
//   status: "idle",
//   error: null,
// }

// export const fetchRoles = createAsyncThunk("role/fetchRoles", async () => {
//   return await roleService.getRoles()
// })

// export const addRole = createAsyncThunk("role/addRole", async (role: Omit<Role, "id">) => {
//   return await roleService.addRole(role)
// })

// export const updateRole = createAsyncThunk("role/updateRole", async (role: Role) => {
//   return await roleService.updateRole(role)
// })

// export const deleteRole = createAsyncThunk("role/deleteRole", async (id: string) => {
//   await roleService.deleteRole(id)
//   return id
// })

// const roleSlice = createSlice({
//   name: "role",
//   initialState,
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchRoles.pending, (state) => {
//         state.status = "loading"
//       })
//       .addCase(fetchRoles.fulfilled, (state, action) => {
//         state.status = "succeeded"
//         state.roles = action.payload
//       })
//       .addCase(fetchRoles.rejected, (state, action) => {
//         state.status = "failed"
//         state.error = action.error.message || null
//       })
//       .addCase(addRole.fulfilled, (state, action) => {
//         state.roles.push(action.payload)
//       })
//       .addCase(updateRole.fulfilled, (state, action) => {
//         const index = state.roles.findIndex((role) => role.id === action.payload.id)
//         if (index !== -1) {
//           state.roles[index] = action.payload
//         }
//       })
//       .addCase(deleteRole.fulfilled, (state, action) => {
//         state.roles = state.roles.filter((role) => role.id !== action.payload)
//       })
//   },
// })

// export default roleSlice.reducer

