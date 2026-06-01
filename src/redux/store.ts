import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import feesReducer from "./slices/feesSlice";
import schoolReducer from "./slices/schoolSlice";
import academicReducer from "./slices/academicSlice";
import staffReducer from "./slices/staffSlice";
import academicCalendarReducer from "./slices/academicCalendarSlice";
// import payrollReducer from "./slices/payrollSlice";
import leaveReducer from "./slices/leaveSlice";
import languageReducer from "./slices/languageSlice";

import userManagementReducer from "./slices/userManagementSlice";
import { OrganisationApi } from "@/services/OrganisationService";
import { Authapi } from "@/services/AuthService";
import { SchoolApi } from "@/services/SchoolServices";
import { AcademicApi } from "@/services/AcademicService";
import { StaffApi } from "@/services/StaffService";
import { LeaveApi } from "@/services/LeaveService";
import { StudentApi } from "@/services/StudentServices";
import { UserManagementApi } from "@/services/UserManagementService";
import { AttendanceApi } from "@/services/AttendanceServices";
import { FeesApi } from "@/services/feesService";
import { InquiryApi } from "@/services/InquiryServices";
import { QuotaApi } from "@/services/QuotaService";
import { DashboardApi } from "@/services/dashboardServices";
import { PromotionApi } from "@/services/PromotionService";
import { PayrollApi } from "@/services/PayrollService";
import { StudentManagementApi } from "@/services/StudentManagementService";
import { SubjectApi } from "@/services/subjects";
import { TimeTableApi } from "@/services/timetableService";
import { StaffAttendanceApi } from "@/services/StaffAttendanceService";
import { AcademicCalendarApi } from "@/services/AcademicCalendarService";
import { DepartmentApi } from "@/services/DepartmentService";

const store = configureStore({
  reducer: {
    auth: authReducer,
    school: schoolReducer,
    academic: academicReducer,
    academicCalendar: academicCalendarReducer,
    staff: staffReducer,
    leave: leaveReducer,
    fees: feesReducer,
    userManagement: userManagementReducer,
    language: languageReducer,
    [Authapi.reducerPath]: Authapi.reducer,
    [SchoolApi.reducerPath]: SchoolApi.reducer,
    [AcademicApi.reducerPath]: AcademicApi.reducer,
    [StaffApi.reducerPath]: StaffApi.reducer,
    [SubjectApi.reducerPath]: SubjectApi.reducer,
    [TimeTableApi.reducerPath]: TimeTableApi.reducer,
    [StudentApi.reducerPath]: StudentApi.reducer,
    [StudentManagementApi.reducerPath] : StudentManagementApi.reducer,
    [UserManagementApi.reducerPath]: UserManagementApi.reducer,
    [LeaveApi.reducerPath]: LeaveApi.reducer,
    [AttendanceApi.reducerPath]: AttendanceApi.reducer,
    [InquiryApi.reducerPath]: InquiryApi.reducer,
    [FeesApi.reducerPath]: FeesApi.reducer,
    [QuotaApi.reducerPath]: QuotaApi.reducer,
    [DashboardApi.reducerPath]: DashboardApi.reducer,
    [PromotionApi.reducerPath]: PromotionApi.reducer,
    [PayrollApi.reducerPath]: PayrollApi.reducer,
    [StaffAttendanceApi.reducerPath]: StaffAttendanceApi.reducer,
    [OrganisationApi.reducerPath]: OrganisationApi.reducer,
    [AcademicCalendarApi.reducerPath]: AcademicCalendarApi.reducer,
    [DepartmentApi.reducerPath]: DepartmentApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      Authapi.middleware,
      SchoolApi.middleware,
      AcademicApi.middleware,
      StaffApi.middleware,
      StudentApi.middleware,
      StudentManagementApi.middleware,
      UserManagementApi.middleware,
      LeaveApi.middleware,
      AttendanceApi.middleware,
      SubjectApi.middleware,
      TimeTableApi.middleware,
      // InquiryApi.middleware,
      FeesApi.middleware,
      QuotaApi.middleware,
      InquiryApi.middleware,
      DashboardApi.middleware,
      PromotionApi.middleware,
      PayrollApi.middleware,
      StaffAttendanceApi.middleware,
      OrganisationApi.middleware,
      AcademicCalendarApi.middleware,
      DepartmentApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type SchoolState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
