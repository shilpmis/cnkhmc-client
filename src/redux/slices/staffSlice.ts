import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store"
import { StaffRole } from "@/types/staff";

interface StaffState {
    staffRoles: StaffRole[] | null,
    status: "idle" | "loading" | "succeeded" | "failed",
    error: string | null
}

const initialState: StaffState = {
    staffRoles: null,
    status: "idle",
    error: null
}

const staffSlice = createSlice({
    name: "staff",
    initialState,
    reducers: {
        setStaffRole : (state ,action)=> {
            state.staffRoles = action.payload
        }
    },
    extraReducers: (builder) => {
        // builder.addCase()
    }
})


export const selectSchoolStaffRoles = (state : RootState) => state.staff.staffRoles

export const {setStaffRole} = staffSlice.actions
    
export default staffSlice.reducer