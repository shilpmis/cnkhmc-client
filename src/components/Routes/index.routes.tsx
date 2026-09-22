import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import AdminLayout from "@/layouts/Admin/AdminLayout"
import AuthLayout from "@/layouts/Auth/AuthLayout"
import SettingsPage from "@/pages/Setting"
import { Staff } from "@/pages/Staff"
import { UserManagement } from "@/pages/UserManagement"
import { Fees } from "@/pages/Fees"
import Login from "@/pages/LogIn"
import Students from "@/pages/Students"
import GeneralSettings from "../Settings/GeneralSettings"
import AcademicSettings from "../Settings/AcademicSettings/AcademicSettings"
import StaffSettings from "../Settings/StaffSettings"
import CertificateTemplateSettings from "../Settings/CertificateTemplateSettings"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectIsAuthenticated } from "@/redux/slices/authSlice"
import PrivateRoute from "./private.routes"
import { useVerifyQuery } from "@/services/AuthService"
import AdminLeaveManagement from "@/pages/AdminLeaveManagement"
import AdminAttendanceView from "../../pages/AdminAttendance"
import StudentAttendanceView from "@/pages/AttendancePage"
import LectureAttendancePage from "@/pages/LectureAttendancePage"
import { Permission, UserRole } from "@/types/user"
import { LeaveManagementSettings } from "../Settings/LeaveManagementSettings"
import { SearchProvider } from "../Dashboard/searchContext"
import NotFound from "@/pages/NotFound"
import LeaveDashboardForTeachers from "@/pages/LeaveDashboardForTeachers"
import { Toaster } from "@/components/ui/toaster"
import AdminAdmissonView from "@/pages/AdmissionPage"
import StudentFeesPanel from "@/pages/StudentFeesPanel"
import PayFeesPanel from "../Fees/PayFees/PayFeesPanel"
import AdmissionSetting from "../Settings/AdmissionSettings/AdmissionSetting"
import QuotaManagement from "../Settings/AdmissionSettings/QuotaSetting"
import SeatsManagement from "../Settings/AdmissionSettings/SeatSetting"
import InquiriesManagement from "../Admission/Inquiries"
import { WelcomeDashboard } from "@/pages/WelcomeDashBoard"
import StudentProfilePage from "@/pages/StudentProfilePage"
import StaffProfilePage from "@/pages/StaffProfilePage" // Import the StaffProfilePage component
import { StudentPromotionManagement } from "../Settings/StudentManagement/StudentPromotionManagement"
import EmployeePayrollDashboard from "@/pages/EmployeePayrollDashboard"
import EmployeePayrollDetail from "@/pages/EmployeePayrollDetail"
import PayrollAnalytics from "@/pages/PayrollAnalytics"
import SalaryComponentsManagement from "../Payroll/SalaryComponentsManagement"
import PayScheduleManagement from "../Payroll/PayScheduleManagement"
import SalaryTemplatesManagement from "../Payroll/SalaryTemplatesManagement"
import EmployeeManagement from "../Payroll/EmployeeManagement"
import EmployeeDetail from "../Payroll/EmployeeDetail"
import SalaryTemplateForm from "../Payroll/SalaryTemplateForm"
import SalaryTemplateFormForStaff from "../Payroll/Employee/SalaryTemplateFormForStaff"
import PayRun from "../Payroll/Payrun"
import StundetFeesStatus from "@/pages/StundetFeesStatus"
import ManageStudents from "../Settings/StudentManagement/StudentManagement"
import SubjectSettings from "../Settings/AcademicSettings/SubjectSettings"
import CalendarCategorySettings from "../Settings/AcademicSettings/CalendarCategorySettings"
import SubjectAssignment from "@/pages/SubjectAssignment"
import TimetableConfig from "../Settings/AcademicSettings/TimetableConfig"
import TimetableManagement from "@/pages/TimeTable"
import StaffAttendancePage from "../Attendance/StaffAttendancePage"
import AdminEditRequestsPanel from "../Attendance/AdminEditRequestsPanel"
import OrganisationManagement from "@/pages/OrganisationManagement"
import DepartmentManagement from "@/pages/DepartmentManagement"
import AcademicCalendar from "@/pages/AcademicCalendar"
import OrganizationDashboard from "@/pages/OrganizationDashboard"
import TeacherDashboard from "@/pages/TeacherDashboard"
import LessonPlanManager from "@/pages/LessonPlanManager"
import TeacherLogsReport from "@/pages/TeacherLogsReport"
import ChatLayout from "@/components/chat/ChatLayout"
import CertificateTemplates from "@/pages/CertificateTemplates"
import ExamMasters from "@/pages/ExamMasters"
import ExamSchedules from "@/pages/ExamSchedules"
import HostelManagement from "@/pages/HostelManagement"
import DeadStockRegister from "@/pages/DeadStockRegister"
import InventoryDepartments from "@/pages/InventoryDepartments"
import PracticalBatchSettings from "@/components/Settings/PracticalBatchSettings"

export default function RootRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  /**
   * If localhost has no access_token , then there is no need to make request for verification
   */
  const { data, error, isLoading, isFetching, isSuccess, isError } = useVerifyQuery()

  return (
    <SearchProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
          </Route>

          {/* Protected routes under /d */}
          <Route
            path="/d"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            {/* Dashboard */}
            {/* <Route index element={<DashboardPage />} /> */}
            <Route index element={<WelcomeDashboard />} />

            {/* Students */}
            <Route
              path="students"
              element={
                <PrivateRoute
                  allowedRoles={[
                    UserRole.ADMIN,
                    UserRole.PRINCIPAL,
                    UserRole.CLERK,
                    UserRole.HEAD_TEACHER,
                    UserRole.IT_ADMIN,
                  ]}
                  allowedPermissions={[Permission.MANAGE_STUDENTS]}
                >
                  <Students />
                </PrivateRoute>
              }
            />

            {/* New Student Profile Route */}
            <Route
              path="student/:id"
              element={
                <PrivateRoute
                  allowedRoles={[
                    UserRole.ADMIN,
                    UserRole.PRINCIPAL,
                    UserRole.CLERK,
                    UserRole.HEAD_TEACHER,
                    UserRole.IT_ADMIN,
                    UserRole.SCHOOL_TEACHER,
                  ]}
                  allowedPermissions={[Permission.MANAGE_STUDENTS]}
                >
                  <StudentProfilePage />
                </PrivateRoute>
              }
            />

            {/* Staff */}
            <Route
              path="staff"
              element={
                <PrivateRoute
                  allowedRoles={[UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK, UserRole.IT_ADMIN]}
                  allowedPermissions={[Permission.MANAGE_STAFF]}
                >
                  <Staff />
                </PrivateRoute>
              }
            />

            {/* New Staff Profile Route */}
            <Route
              path="staff/:id"
              element={
                <PrivateRoute
                  allowedRoles={[
                    UserRole.ADMIN,
                    UserRole.PRINCIPAL,
                    UserRole.CLERK,
                    UserRole.IT_ADMIN,
                    UserRole.SCHOOL_TEACHER,
                  ]}
                  allowedPermissions={[Permission.MANAGE_STAFF]}
                >
                  <StaffProfilePage />
                </PrivateRoute>
              }
            />

            <Route
              path="subjects"
              element={
                <PrivateRoute
                  allowedRoles={[UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK, UserRole.SCHOOL_TEACHER]}
                  allowedPermissions={[Permission.MANAGE_SUBJECTS]}
                >
                  <SubjectAssignment />
                </PrivateRoute>
              }
            />

            <Route
              path="calendar"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK, UserRole.IT_ADMIN, UserRole.SCHOOL_TEACHER]}>
                  <AcademicCalendar />
                </PrivateRoute>
              }
            />

            <Route
              path="chat"
              element={
                <PrivateRoute>
                  <ChatLayout />
                </PrivateRoute>
              }
            />

            <Route
              path="timetable"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK]}>
                  <TimetableManagement />
                </PrivateRoute>
              }
            />

            <Route
              path="teacher/dashboard"
              element={
                <PrivateRoute allowedRoles={[UserRole.SCHOOL_TEACHER, UserRole.HEAD_TEACHER]}>
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="teacher/logs"
              element={
                <PrivateRoute allowedRoles={[UserRole.SCHOOL_TEACHER, UserRole.HEAD_TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DEVELOPER, UserRole.PRINCIPAL]}>
                  <TeacherLogsReport />
                </PrivateRoute>
              }
            />

            <Route
              path="curriculum"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.HEAD_TEACHER]}>
                  <LessonPlanManager />
                </PrivateRoute>
              }
            />

            <Route
              path="hostels"
              element={<Navigate to="/d/settings/hostels" replace />}
            />

            <Route
              path="inventory/departments"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK]}>
                  <InventoryDepartments />
                </PrivateRoute>
              }
            />

            <Route
              path="inventory/dead-stock"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.CLERK]}>
                  <DeadStockRegister />
                </PrivateRoute>
              }
            />

            {/* Fees */}
            <Route
              path="fee"
              element={
                <PrivateRoute
                  allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.IT_ADMIN, UserRole.PRINCIPAL]}
                  allowedPermissions={[Permission.MANAGE_FEES]}
                >
                  <Fees />
                </PrivateRoute>
              }
            />

            <Route
              path="fee/student/:student_id"
              element={
                <PrivateRoute
                  allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.IT_ADMIN, UserRole.PRINCIPAL]}
                  allowedPermissions={[Permission.MANAGE_FEES]}
                >
                  <StundetFeesStatus />
                </PrivateRoute>
              }
            />

            <Route
              path="pay-fees"
              element={
                <PrivateRoute allowedRoles={[UserRole.CLERK]} allowedPermissions={[Permission.MANAGE_FEES]}>
                  <PayFeesPanel />
                </PrivateRoute>
              }
            />

            {/* Fees */}
            <Route
              path="pay-fees/:student_id"
              element={
                <PrivateRoute
                  allowedRoles={[UserRole.ADMIN, UserRole.CLERK]}
                  allowedPermissions={[Permission.MANAGE_FEES]}
                >
                  <StudentFeesPanel />
                </PrivateRoute>
              }
            />

            {/* User Management */}
            <Route
              path="users"
              element={
                <PrivateRoute
                  allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}
                  allowedPermissions={[Permission.MANAGE_USERS]}
                >
                  <UserManagement />
                </PrivateRoute>
              }
            />

            {/* Leave */}
            <Route
              path="leave-applications"
              element={
                <PrivateRoute
                  allowedRoles={[UserRole.ADMIN, UserRole.SCHOOL_TEACHER, UserRole.CLERK]}
                  allowedPermissions={[Permission.MARK_LEAVES]}
                >
                  <LeaveDashboardForTeachers />
                </PrivateRoute>
              }
            />

            {/* Admin Leave Management */}
            <Route
              path="leaves"
              element={
                <PrivateRoute
                  allowedRoles={[
                    UserRole.ADMIN,
                    UserRole.SUPER_ADMIN,
                    UserRole.DEVELOPER,
                    UserRole.HEAD_TEACHER,
                    UserRole.PRINCIPAL,
                    UserRole.CLERK,
                    UserRole.SCHOOL_TEACHER,
                  ]}
                >
                  <AdminLeaveManagement />
                </PrivateRoute>
              }
            />

            {/* Admin Attendance Management */}
            <Route
              path="attendance"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.HEAD_TEACHER]}>
                  <AdminAttendanceView />
                </PrivateRoute>
              }
            />

            {/* Staff Attendance Management for admin */}
            <Route
              path="staff/attendance"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.HEAD_TEACHER]}>
                  <AdminEditRequestsPanel />
                </PrivateRoute>
              }
            />

            {/* Staff Attendance */}
            <Route
              path="staff/mark-attendance"
              element={
                <PrivateRoute allowedRoles={[UserRole.SCHOOL_TEACHER, UserRole.HEAD_TEACHER]}>
                    <StaffAttendancePage />
                </PrivateRoute>
              }
            />

            {/* Student Attendance */}
            <Route
              path="mark-attendance"
              element={
                <PrivateRoute
                  allowedRoles={[UserRole.ADMIN, UserRole.SCHOOL_TEACHER, UserRole.HEAD_TEACHER]}
                  allowedPermissions={[Permission.MARK_ATTENDANCE]}
                >
                  <StudentAttendanceView />
                </PrivateRoute>
              }
            />

            {/* Student Attendance */}
            <Route
              path="mark-attendance/:classId"
              element={
                <PrivateRoute allowedRoles={[UserRole.SCHOOL_TEACHER, UserRole.HEAD_TEACHER]}>
                  <StudentAttendanceView />
                </PrivateRoute>
              }
            />

            {/* Lecture/Lab Attendance */}
            <Route
              path="lecture-attendance"
              element={
                <PrivateRoute
                  allowedRoles={[
                    UserRole.SUPER_ADMIN,
                    UserRole.ADMIN,
                    UserRole.PRINCIPAL,
                    UserRole.HEAD_TEACHER,
                    UserRole.SCHOOL_TEACHER,
                  ]}
                >
                  <LectureAttendancePage />
                </PrivateRoute>
              }
            />

            <Route
              path="admissions"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL]}>
                  <AdminAdmissonView />
                </PrivateRoute>
              }
            />

            {/* Payroll */}

            <Route
              path="payroll/dashboard"
              element={
                <PrivateRoute
                  allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL]}
                  allowedPermissions={[Permission.MANAGE_PAYROLL]}
                >
                  <EmployeePayrollDashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="payroll/employee"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL]}>
                  <EmployeeManagement />
                </PrivateRoute>
              }
            />

            <Route
              path="payroll/payrun"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL]}>
                  <PayRun />
                </PrivateRoute>
              }
            />

            <Route
              path="payroll/employee/:employeeId"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL]}>
                  <EmployeeDetail />
                </PrivateRoute>
              }
            />

            <Route
              path="payroll/employee/:employeeId/salary/create"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL]}>
                  <SalaryTemplateFormForStaff mode="create" />
                </PrivateRoute>
              }
            />

            <Route
              path="payroll/employee/:employeeId/salary/edit"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL]}>
                  <SalaryTemplateFormForStaff mode="edit" />
                </PrivateRoute>
              }
            />

            <Route
              path="payroll/analytics"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.CLERK, UserRole.PRINCIPAL]}>
                  <PayrollAnalytics />
                </PrivateRoute>
              }
            />

            {/* Settings - nested routes */}
            <Route
              path="settings"
              element={
                <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                  <SettingsPage />
                </PrivateRoute>
              }
            >
              <Route
                index
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <GeneralSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="general"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <GeneralSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="academic"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <AcademicSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="calendar-categories"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <CalendarCategorySettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="subjects"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <SubjectSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="timetable"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <TimetableConfig />
                  </PrivateRoute>
                }
              />
              <Route
                path="departments"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <DepartmentManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="manage/students"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <ManageStudents />
                  </PrivateRoute>
                }
              />
              <Route
                path="manage/promotion"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <StudentPromotionManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="manage/batches"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <PracticalBatchSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="manage/certificates"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.PRINCIPAL]}>
                    <CertificateTemplates />
                  </PrivateRoute>
                }
              />
              <Route
                path="exams/masters"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <ExamMasters />
                  </PrivateRoute>
                }
              />
              <Route
                path="exams/schedules"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <ExamSchedules />
                  </PrivateRoute>
                }
              />
              <Route
                path="staff"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <StaffSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="certificate-templates"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <CertificateTemplateSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="leave"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <LeaveManagementSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="admission"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <AdmissionSetting />
                  </PrivateRoute>
                }
              />
              <Route
                path="admission/quotas"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <QuotaManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="admission/seats"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <SeatsManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="hostels"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.PRINCIPAL, UserRole.CLERK]}>
                    <HostelManagement />
                  </PrivateRoute>
                }
              />

              {/* Salary Component */}

              <Route
                path="payroll/salary-components"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <SalaryComponentsManagement />
                  </PrivateRoute>
                }
              />

              <Route
                path="payroll/payroll-schedual"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <PayScheduleManagement />
                  </PrivateRoute>
                }
              />

              <Route
                path="payroll/salary-template"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <SalaryTemplatesManagement />
                  </PrivateRoute>
                }
              />

              <Route
                path="payroll/salary-template/edit/:id"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <SalaryTemplateForm />
                  </PrivateRoute>
                }
              />

              <Route
                path="payroll/salary-template/create"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN, UserRole.IT_ADMIN]}>
                    <SalaryTemplateForm />
                  </PrivateRoute>
                }
              />





            </Route>
          </Route>
          <Route
            path="/sys/organisation"
            element={
              <PrivateRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.DEVELOPER]}>
                <OrganisationManagement />
              </PrivateRoute>
            }
          />
          <Route path="/sys/organization" element={<Navigate to="/sys/organisation" replace />} />
          <Route
            path="/sys"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route
              path="dashboard"
              element={
                <PrivateRoute allowedRoles={[UserRole.ORG_ADMIN]}>
                  <OrganizationDashboard />
                </PrivateRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />}></Route>
        </Routes>
      </Router>
      <Toaster />
    </SearchProvider>
  )
}
