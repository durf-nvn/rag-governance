import { useRole } from "../contexts/RoleContext";
import { AdminDashboard } from "./AdminDashboard";
import { FacultyDashboard } from "./FacultyDashboard";
import { StudentDashboard } from "./StudentDashboard";

export function DashboardRouter() {
  // FIXED: We extract 'userRole' instead of 'user'
  const { userRole } = useRole();

  // FIXED: We check 'userRole' directly instead of 'user.role'
  switch (userRole) {
    case "ADMIN":
      return <AdminDashboard />;
    case "FACULTY":
      return <FacultyDashboard />;
    case "STUDENT":
      return <StudentDashboard />;
    default:
      // Fallback just in case
      return <StudentDashboard />; 
  }
}