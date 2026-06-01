import { createSlice } from "@reduxjs/toolkit"
import type { RootState } from "../store"
import exp from "constants"

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
    address: string
}

interface InitialSchoolState {
    school_data: School | null
}

const initialState: InitialSchoolState = {
    school_data: null
}

const schoolSlice = createSlice({
    name: "school",
    initialState,
    reducers: {
        setSchoolCredential: (state, action) => {
            state.school_data = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase("auth/logout", (state) => {
            state.school_data = null
        })
    }
})

export const selectSchool = (state: RootState) => state.school.school_data

export const {setSchoolCredential} = schoolSlice.actions;

export default schoolSlice.reducer;