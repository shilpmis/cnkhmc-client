import { FeesPlan, FeesType } from "@/types/fees";
import { RootState } from "../store";
import { LeaveType } from "@/types/leave";
import { createSlice } from "@reduxjs/toolkit";


interface FeesState {
    Fees_type: FeesType[] | null,
    Fees_plan: FeesPlan[] | null,

}

const initialState: FeesState = {
    Fees_plan: null,
    Fees_type: null,
}

const feesSlice = createSlice({
    name: "feesSlice",
    initialState,
    reducers: {
        setFeesType: (state, action) => {
            state.Fees_type = action.payload
        },
        setFeesPlan: (state, action) => {
            state.Fees_plan = action.payload
        }
    }
})


export const selecFeesTypeForSchool = (state: RootState) => state.fees.Fees_type
export const selectFeesPlanForSchool = (state: RootState) => state.fees.Fees_plan

export const { setFeesPlan, setFeesType } =
    feesSlice.actions
export default feesSlice.reducer