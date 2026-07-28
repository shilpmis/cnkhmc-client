import { createClasses } from "@/services/AcademicService";
import { AcademicClasses, Division, AcademicSession } from "@/types/academic";
import { Class } from "@/types/class";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface AcademicState {
  academicClasses: AcademicClasses[] | null;
  allAcademicClasses: Division[] | null;
  classes: Class[];
  activeAcademicSession: AcademicSession | null;
  loading: boolean;
  error: string | null;
}

const initialState: AcademicState = {
  /**
   * academicClasses variable store all the class division wise
   */
  academicClasses: null,
  /**
   * allAcademicClasses is an array which store all divisioi
   */
  allAcademicClasses: null,
  classes: [],
  activeAcademicSession: null,
  loading: false,
  error: null,
};

const academicSlice = createSlice({
  name: "academic",
  initialState,
  reducers: {
    setAcademicClasses: (state, action) => {
      state.academicClasses = action.payload;
      let clas: Division[] = [];
      state.academicClasses &&
        state.academicClasses.map((cls) => {
          clas.push(...cls.divisions);
        });
      state.allAcademicClasses = clas;
    },
    setActiveAcademicSession: (state, action: PayloadAction<AcademicSession | null>) => {
      state.activeAcademicSession = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createClasses.fulfilled, (state) => {
      // window.location.reload()
    });
  },
});

export const { setAcademicClasses, setActiveAcademicSession } = academicSlice.actions;

export const selectAcademicClasses = (state: RootState) =>
  state.academic.academicClasses;
export const selectAllAcademicClasses = (state: RootState) =>
  state.academic.allAcademicClasses;
export const selectActiveAcademicSession = (state: RootState) =>
  state.academic.activeAcademicSession;

export default academicSlice.reducer;
