import { useAppSelector } from "@/redux/hooks/useAppSelector";
import { selectAuthState } from "@/redux/slices/authSlice";
import { useMemo } from "react";
import { Permission, UserRole, RolePermissions } from "@/types/user";
import { PERMISSION_MODULE } from "@/permissions/catalog";
import { buildPolicyAbility, canAccessModule } from "@/permissions/policyAbility";

export function useAuth() {
  const auth = useAppSelector(selectAuthState);
  const normalizedUserRole = auth.user?.role?.toUpperCase();
  const policyAbility = useMemo(() => buildPolicyAbility(auth.user?.policies), [auth.user?.policies]);

  // Check if the current user has the specified role.
  const hasRole = (role: UserRole | string): boolean => {
    if (!auth.user) return false;
    const normalizedRole = role.toUpperCase();
    return (
      auth.user.system_role === normalizedRole ||
      normalizedUserRole === normalizedRole
    );
  };

  // Check if the current user has any of the roles in the list.
  const hasAnyRole = (roles: Array<UserRole | string>): boolean => {
    return roles.some((role) => hasRole(role));
  };

  // Check if the current user has the specified permission.
  const hasPermission = (permission: Permission): boolean => {
    if (!auth.user) return false;

    // 1. Check direct permissions array
    if (auth.user.permissions && auth.user.permissions.includes(permission)) {
      return true;
    }

    // 2. Check system role default permissions
    if (auth.user.system_role && RolePermissions[auth.user.system_role as UserRole]) {
      if (RolePermissions[auth.user.system_role as UserRole].includes(permission)) {
        return true;
      }
    }

    // 3. Permission templates: allowed when a template grants any action on the screen's module
    //    (deny rules override allows; see permissions/policyAbility.ts)
    //    User management is never granted by a template (not even "manage all"): it stays with the
    //    admin roles, because assigning templates decides everyone else's access.
    const module = PERMISSION_MODULE[permission];
    if (module && module !== "User" && canAccessModule(policyAbility, module)) return true;

    return false;
  };

  // Check if the current user has any of the provided permissions.
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!auth.user) return false;
    return permissions.some((permission) => hasPermission(permission));
  };

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    status: auth.status,
    error: auth.error,
    isVerificationInProgress: auth.isVerificationInProgress,
    isVerificationFails: auth.isVerificationFails,
    verificationError: auth.verificationError,
    isVerificationSuccess: auth.isVerificationSuccess,
    isSignOutInProgress: auth.isSignOutInProgress,
  };
}
