import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LanguageState {
  language: "en" | "gu";
}

const initialState: LanguageState = {
  language: "en",
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<"en" | "gu">) => {
      state.language = action.payload;
      localStorage.setItem("language", action.payload);
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
