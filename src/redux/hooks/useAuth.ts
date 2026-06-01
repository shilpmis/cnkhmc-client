import { useAppSelector } from "@/redux/hooks/useAppSelector";
import { selectAuthState } from "@/redux/slices/authSlice";
import { Permission, UserRole } from "@/types/user";

export function useAuth() {
  const auth = useAppSelector(selectAuthState);
  const normalizedUserRole = auth.user?.role?.toUpperCase();

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
    return auth.user.permissions.includes(permission);
  };

  // Check if the current user has any of the provided permissions.
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!auth.user) return false;
    return permissions.some((permission) => auth.user!.permissions.includes(permission));
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
