import { mockAttendanceRecords, mockClasses, mockTeachers } from "@/mock/attendanceData"
import { AttendanceRecord, Teacher } from "@/types/attendance"
import { Class } from "@/types/attendance"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

interface AttendanceState {
  classes: Class[]
  teachers: Teacher[]
  attendanceRecords: AttendanceRecord[]
  loading: boolean
  error: string | null
}

const initialState: AttendanceState = {
  classes: mockClasses,
  teachers: mockTeachers,
  attendanceRecords: mockAttendanceRecords,
  loading: false,
  error: null,
}

export const fetchAttendanceData = createAsyncThunk("attendance/fetchData", async () => {
  // Simulating API call
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return { classes: mockClasses, teachers: mockTeachers, attendanceRecords: mockAttendanceRecords }
})

export const markAttendance = createAsyncThunk(
  "attendance/markAttendance",
  async (record: Omit<AttendanceRecord, "id">) => {
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newRecord: AttendanceRecord = { ...record, id: `att${Date.now()}` }
    return newRecord
  },
)

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceData.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchAttendanceData.fulfilled, (state, action) => {
        state.loading = false
        state.classes = action.payload.classes
        state.teachers = action.payload.teachers
        state.attendanceRecords = action.payload.attendanceRecords
      })
      .addCase(fetchAttendanceData.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch attendance data"
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.attendanceRecords.push(action.payload)
      })
  },
})

export default attendanceSlice.reducer

