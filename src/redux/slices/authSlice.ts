const currentYear = new Date().getFullYear();

export const generateDefaultAcademicYears = () => {
  let customYears: any[] = [];
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_academic_years') : null;
    customYears = raw ? JSON.parse(raw) : [];
  } catch {
    customYears = [];
  }

  const defaultYears: any[] = [];
  for (let year = currentYear - 3; year <= currentYear + 5; year++) {
    defaultYears.push({
      id: year,
      academic_year: year,
      session_name: `${year}-${year + 1}`,
      start_year: `${year}`,
      end_year: `${year + 1}`,
      start_month: `01-${year}`,
      end_month: `12-${year}`,
      year: year,
      is_active: year === currentYear,
    });
  }

  const map = new Map();
  defaultYears.forEach((y) => map.set(y.id, y));
  customYears.forEach((y: any) => map.set(y.id || y.academic_year, y));

  return Array.from(map.values());
};

export const DEFAULT_ACADEMIC_SESSION: any = generateDefaultAcademicYears().find((y: any) => y.academic_year === currentYear) || generateDefaultAcademicYears()[0];

import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { login, logout } from "../../services/AuthService";
import {
  Permission,
  RolePermissions,
  User,
  UserRole,
  UserStatus,
} from "@/types/user";
import { AcademicSession } from "@/types/user";

// Mapping from role_id (from your DB) to UserRole
const roleMapping: Record<number, UserRole> = {
  1: UserRole.ADMIN,
  2: UserRole.PRINCIPAL,
  3: UserRole.HEAD_TEACHER,
  4: UserRole.CLERK,
  5: UserRole.IT_ADMIN,
  6: UserRole.SCHOOL_TEACHER,
  7: UserRole.ORG_ADMIN,
  8: UserRole.SUPER_ADMIN,
  9: UserRole.HOD,
  10: UserRole.FACULTY,
  11: UserRole.DEVELOPER,
};

const getSwitchedSchoolId = () => {
    try {
        return localStorage.getItem('switched_school_id');
    } catch {
        return null;
    }
};

const normalizePermissionList = (permissions: unknown): string[] => {
  if (!Array.isArray(permissions)) return [];
  return permissions
    .filter((permission): permission is string => typeof permission === "string")
    .map((permission) => permission.trim())
    .filter(Boolean);
};

const buildEffectivePermissions = (
  systemRole: UserRole | undefined,
  templatePermissions: unknown
): string[] => {
  const rolePermissions = systemRole ? RolePermissions[systemRole] ?? [] : [];
  const dynamicPermissions = normalizePermissionList(templatePermissions);
  return Array.from(new Set([...rolePermissions, ...dynamicPermissions]));
};

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  currentActiveAcademicSession: AcademicSession | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isVerificationInProgress: boolean;
  isVerificationFails: boolean;
  verificationError: string | null;
  isVerificationSuccess: boolean;
  isSignOutInProgress: boolean;
  rolePermissions: Record<UserRole, Permission[]>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  currentActiveAcademicSession: DEFAULT_ACADEMIC_SESSION,
  token: null,
  status: "idle",
  error: null,
  isVerificationInProgress: true,
  isVerificationFails: false,
  verificationError: null,
  isVerificationSuccess: false,
  isSignOutInProgress: false,
  rolePermissions: RolePermissions,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const apiUser = action.payload.user;
      const derivedSystemRole = roleMapping[apiUser.role_id];
      const roleName = typeof apiUser.role === "string" ? apiUser.role : derivedSystemRole ?? "TEMPLATE_ROLE";
      const newUser = {
        ...apiUser,
        role: roleName,
        system_role: derivedSystemRole ?? null,
        permissions: buildEffectivePermissions(derivedSystemRole, apiUser.permissions),
      };

      // Check for persistent switched school ID if Super Admin
      if (derivedSystemRole === UserRole.SUPER_ADMIN || derivedSystemRole === UserRole.DEVELOPER) {
        const switchedId = getSwitchedSchoolId();
        if (switchedId) {
          const numericSwitchedId = Number(switchedId);
          newUser.school_id = numericSwitchedId;
          
          // Clear stale school data if it doesn't match the target school
          if (newUser.school && Number(newUser.school.id) !== numericSwitchedId) {
             (newUser as any).school = null; 
          }
        }
      }

      state.user = newUser;
      state.currentActiveAcademicSession =
        newUser.school?.academicSessions?.find(
          (session: AcademicSession) => session.is_active
        ) || DEFAULT_ACADEMIC_SESSION;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.status = "succeeded";
    },
    setCurrentActiveAcademicSession: (state, action) => {
      state.currentActiveAcademicSession = action.payload;
    },

    setCredentialsForVerificationStatus: (state, action) => {
      state.isVerificationInProgress = action.payload.isVerificationInProgress;
      state.isVerificationFails = action.payload.isVerificationFails;
      state.verificationError = action.payload.verificationError;
      state.isVerificationSuccess = action.payload.isVerificationSuccess;
    },

    switchSchool: (state, action) => {
      if (state.user) {
        state.user.school = action.payload;
        state.user.school_id = action.payload.id;
        state.currentActiveAcademicSession =
          action.payload.academicSessions?.find(
            (session: AcademicSession) => session.is_active
          ) || DEFAULT_ACADEMIC_SESSION;
        
        // Persist for Super Admin
        if (state.user.system_role === UserRole.SUPER_ADMIN || state.user.system_role === UserRole.DEVELOPER) {
           localStorage.setItem('switched_school_id', action.payload.id.toString());
        }
      }
    },

    updateUserSchool: (state, action) => {
      if (state.user) {
        // Force sync: If we have an intentional name from a 'switch', keep it if the ID matches.
        const currentSchoolId = Number(state.user.school?.id);
        const incomingSchoolId = Number(action.payload.id);
        
        const updatedSchool = {
          ...action.payload,
          name: (currentSchoolId === incomingSchoolId && state.user.school?.name) 
                ? state.user.school.name : action.payload.name
        };
        
        state.user.school = updatedSchool;
        state.currentActiveAcademicSession =
          updatedSchool.academicSessions?.find(
            (session: AcademicSession) => session.is_active
          ) || DEFAULT_ACADEMIC_SESSION;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
      })
      .addCase(login.fulfilled, (state, action) => {
          state.status = "succeeded";
          state.isAuthenticated = true;
          const apiUser = action.payload.user;
          const derivedSystemRole = roleMapping[apiUser.role_id];
          const roleName = derivedSystemRole ?? "TEMPLATE_ROLE";
          state.user = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          role: roleName,
          system_role: derivedSystemRole ?? null,
          role_id: apiUser.role_id,
          is_active: apiUser.is_active,
          staff_id: apiUser.staff_id,
          school_id: apiUser.school_id,
          username: apiUser.username,
          permissions: buildEffectivePermissions(derivedSystemRole, apiUser.permissions),
          staff: apiUser.staff,
          school: apiUser.school,
        };

        // Check for persistent switched school ID if Super Admin
        if ((derivedSystemRole === UserRole.SUPER_ADMIN || derivedSystemRole === UserRole.DEVELOPER) && state.user) {
          const switchedId = getSwitchedSchoolId();
          if (switchedId) {
            state.user.school_id = Number(switchedId);
          }
        }

        state.currentActiveAcademicSession =
          state.user?.school?.academicSessions?.find(
            (session) => session.is_active
          ) || DEFAULT_ACADEMIC_SESSION;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state) => {
        state.status = "idle";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(logout.pending, (state) => {
        state.status = "loading";
        state.isSignOutInProgress = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isSignOutInProgress = false;
        state.status = "idle";
        localStorage.removeItem('switched_school_id');
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Logout failed";
        state.isSignOutInProgress = false;
      });
  },
});

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentSchool = (state: RootState) => state.auth.user?.school || null;
export const selectCurrentStaff = (state: RootState) =>
  state.auth.user?.staff || null;
const selectAcademicSessionsRaw = (state: RootState) => state.auth.user?.school?.academicSessions;

export const selectAccademicSessionsForSchool = createSelector(
  [selectAcademicSessionsRaw],
  (sessions) => sessions?.length ? sessions : generateDefaultAcademicYears()
);

export const selectActiveAccademicSessionsForSchool = (state: RootState) =>
  state.auth.currentActiveAcademicSession || DEFAULT_ACADEMIC_SESSION;
export const selectVerificationStatus = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthState = (state: RootState) => state.auth;

export const { setCredentials, setCredentialsForVerificationStatus, switchSchool, updateUserSchool, setCurrentActiveAcademicSession } =
  authSlice.actions;
export default authSlice.reducer;
