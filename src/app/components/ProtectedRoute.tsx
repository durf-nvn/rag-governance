import { Navigate } from "react-router";
import { useRole } from "../contexts/RoleContext";
import { hasPermission } from "../utils/rolePermissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission: string;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user } = useRole();

  if (!hasPermission(user.role, permission as any)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
