import { useRole } from "../contexts/RoleContext";
import { AdminDashboard } from "./AdminDashboard";
import { FacultyDashboard } from "./FacultyDashboard";
import { StudentDashboard } from "./StudentDashboard";

export function DashboardRouter() {
  const { user } = useRole();

  switch (user.role) {
    case "ADMIN":
      return <AdminDashboard />;
    case "FACULTY":
      return <FacultyDashboard />;
    case "STUDENT":
      return <StudentDashboard />;
    default:
      return <AdminDashboard />;
  }
}
