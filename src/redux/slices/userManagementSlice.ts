import { User, UserApiResponse } from "@/types/user"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState } from "../store"
import { set } from "date-fns"


interface UserManagementState {
  users: User[] | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: UserManagementState = {
  users: null,
  status: "idle",
  error: null,
}

const userManagementSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers: {
    setUsers : (state, action)=>{
      state.users = action.payload
    } 
  },
  extraReducers: (builder) => {
    builder
    // .addCase(fetchUsers.pending, (state) => {
    //   state.status = "loading"
    // })
    // .addCase(fetchUsers.fulfilled, (state, action) => {
    //   state.status = "succeeded";
    //   state.users = action.payload;
    // })

    // .addCase(fetchUsers.rejected, (state, action) => {
    //   state.status = "failed"
    //   state.error = action.error.message || null
    // })
    // .addCase(addUser.fulfilled, (state, action) => {
    //   state.users.push(action.payload)
    // })
    // .addCase(updateUser.fulfilled, (state, action) => {
    //   const index = state.users.findIndex((user) => user.id === action.payload.id)
    //   if (index !== -1) {
    //     state.users[index] = action.payload
    //   }
    // })
    // .addCase(deleteUser.fulfilled, (state, action) => {
    //   state.users = state.users.filter((user) => user.id !== action.payload)
    // })
  },
})

export const selectManagementUsers = (state : RootState) => state.userManagement.users;
export const {setUsers} = userManagementSlice.actions
export default userManagementSlice.reducer



