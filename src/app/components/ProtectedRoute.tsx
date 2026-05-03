import { Navigate } from "react-router"
import { useRole } from "../contexts/RoleContext"
import { hasPermission } from "../utils/rolePermissions"

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: string // <-- The '?' makes this prop optional!
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { userRole } = useRole()

  const currentRole = userRole || "STUDENT"

  // Only check permissions if a specific permission was actually requested
  if (permission && !hasPermission(currentRole, permission as any)) {
    return <Navigate to="/dashboard" replace /> 
  }

  return <>{children}</>
}