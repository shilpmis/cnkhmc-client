import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/redux/hooks/useAuth";
import { UserRole, Permission } from "@/types/user";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowedPermissions?: Permission[];
  redirectTo?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  allowedRoles,
  allowedPermissions,
  redirectTo = "/",
}) => {
  const { isAuthenticated, hasRole, hasPermission, isVerificationInProgress } = useAuth();

  // While verification is in progress, show a loading state.
  if (isVerificationInProgress) {
    return <div>Loading...</div>;
  }

  // If not authenticated after verification, redirect to login.
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} />;
  }

  // Super Admin & Developer bypasses all role/permission checks.
  if (hasRole(UserRole.SUPER_ADMIN) || hasRole(UserRole.DEVELOPER)) {
    return <>{children}</>;
  }

  // If allowedRoles is provided, check if the user’s role matches.
  if (allowedRoles || allowedPermissions) {
    const roleAllowed = allowedRoles ? allowedRoles.some((role) => hasRole(role)) : false;
    const permissionAllowed = allowedPermissions
      ? allowedPermissions.some((perm) => hasPermission(perm))
      : false;

    // Hybrid compatibility: allow access if either legacy role or permission check passes.
    if (!roleAllowed && !permissionAllowed) {
      return <Navigate to="/d" />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
