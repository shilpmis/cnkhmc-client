import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../store"

interface AcademicCalendarState {
  /**
   * Dates that should be treated as non-working (holidays, closures, etc).
   * Stored as `YYYY-MM-DD` in local timezone.
   */
  nonWorkingDates: string[]

  /**
   * If true, Saturdays are working days. If false, all Saturdays are non-working.
   */
  isSaturdayWorking: boolean
}

const STORAGE_KEY = "saral.academicCalendar"

function safeParseState(raw: string | null): AcademicCalendarState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AcademicCalendarState>
    const nonWorkingDates = Array.isArray(parsed.nonWorkingDates) ? parsed.nonWorkingDates.filter((d) => typeof d === "string") : []
    
    // Support database representations like 1, 0, "true", "false", or boolean true/false
    let isSaturdayWorking = true
    if (parsed.isSaturdayWorking !== undefined && parsed.isSaturdayWorking !== null) {
      isSaturdayWorking = parsed.isSaturdayWorking === true || 
                          parsed.isSaturdayWorking === 1 || 
                          parsed.isSaturdayWorking === "true"
    }
    
    return { nonWorkingDates, isSaturdayWorking }
  } catch {
    return null
  }
}

function loadInitialState(): AcademicCalendarState {
  if (typeof window === "undefined") {
    return { nonWorkingDates: [], isSaturdayWorking: true }
  }
  return safeParseState(window.localStorage.getItem(STORAGE_KEY)) ?? { nonWorkingDates: [], isSaturdayWorking: true }
}

function persistState(state: AcademicCalendarState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const initialState: AcademicCalendarState = loadInitialState()

const academicCalendarSlice = createSlice({
  name: "academicCalendar",
  initialState,
  reducers: {
    hydrateAcademicCalendar: (
      state,
      action: PayloadAction<{ nonWorkingDates: string[]; isSaturdayWorking: any }>,
    ) => {
      const parsedDates = (action.payload.nonWorkingDates || []).map((item) => {
        if (item && typeof item === "string" && item.trim().startsWith("{")) {
          try {
            const obj = JSON.parse(item);
            if (obj.isWorkingDay === false) {
              return obj.date;
            }
            return null;
          } catch {
            return null;
          }
        }
        return item;
      }).filter((d): d is string => typeof d === "string");

      state.nonWorkingDates = Array.from(new Set(parsedDates))
      state.isSaturdayWorking = action.payload.isSaturdayWorking === true || 
                               action.payload.isSaturdayWorking === 1 || 
                               action.payload.isSaturdayWorking === "true"
      persistState(state)
    },
    setNonWorkingDates: (state, action: PayloadAction<string[]>) => {
      const parsedDates = (action.payload || []).map((item) => {
        if (item && typeof item === "string" && item.trim().startsWith("{")) {
          try {
            const obj = JSON.parse(item);
            if (obj.isWorkingDay === false) {
              return obj.date;
            }
            return null;
          } catch {
            return null;
          }
        }
        return item;
      }).filter((d): d is string => typeof d === "string");

      state.nonWorkingDates = Array.from(new Set(parsedDates))
      persistState(state)
    },
    setIsSaturdayWorking: (state, action: PayloadAction<any>) => {
      state.isSaturdayWorking = action.payload === true || 
                               action.payload === 1 || 
                               action.payload === "true"
      persistState(state)
    },
  },
})

export const { hydrateAcademicCalendar, setNonWorkingDates, setIsSaturdayWorking } = academicCalendarSlice.actions

export const selectNonWorkingDates = (state: RootState) => state.academicCalendar.nonWorkingDates
export const selectIsSaturdayWorking = (state: RootState) => state.academicCalendar.isSaturdayWorking

export default academicCalendarSlice.reducer

