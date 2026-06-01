import { LeaveApplication, LeavePolicy, LeaveType } from "@/types/leave";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { stat } from "fs";

interface LeaveState {
  leave_type: LeaveType[];
  leave_policies_for_user: LeavePolicy[] | null;
  leave_application_for_teacher: {
    page: number;
    application: LeaveApplication[];
  } | null;
}

const initialState: LeaveState = {
  leave_type: [],
  leave_policies_for_user: null,
  leave_application_for_teacher: null,
};

const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    setLeave: (state, action) => {
      state.leave_type = action.payload;
    },
    setNewlyCreatedType: (state, action) => {
      state.leave_type.push(action.payload);
    },
    setLeavePolicy: (state, actioin) => {
      state.leave_policies_for_user = actioin.payload;
    },
  },
});

export const selectLeaveTypeForSchool = (state: RootState) =>
  state.leave.leave_type;
export const selectLeavePolicyForUser = (state: RootState) =>
  state.leave.leave_policies_for_user;

export const { setLeavePolicy, setLeave } = leaveSlice.actions;

export default leaveSlice.reducer;
