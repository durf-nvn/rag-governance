import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  Award,
  FileText,
  Clock,
  Users,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut,
  User,
  Shield,
  BookOpen,
  Radio,
  ClipboardCheck
} from "lucide-react";
import { useRole } from "../contexts/RoleContext";
import { hasPermission } from "../utils/rolePermissions";
import { RoleSwitcher } from "../components/RoleSwitcher";
import { NotificationSidebar } from "../components/NotificationSidebar";

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // FIXED: We extract 'userRole' from our context instead of 'user'
  const { userRole } = useRole();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch the saved data, or use fallbacks if something goes wrong
  const currentRole = userRole || "STUDENT";
  const userProfile = {
    role: currentRole,
    name: localStorage.getItem('userName') || "CTU User",
    email: localStorage.getItem('userEmail') || "user@ctu.edu.ph"
  };

  const allMenuItems = [
    { path: "/app", label: "Dashboard", icon: LayoutDashboard, permission: "canAccessDashboard" },
    { path: "/app/knowledge-repository", label: "Knowledge Repository", icon: Database, permission: "canAccessKnowledgeRepository" },
    { path: "/app/ask-policy", label: "Ask Policy", icon: MessageSquare, permission: "canAccessAskPolicy" },
    { path: "/app/accreditation-support", label: "Accreditation Support", icon: Award, permission: "canAccessAccreditationSupport" },
    { path: "/app/governance-reference", label: "Governance Reference", icon: FileText, permission: "canAccessGovernanceReference" },
    { path: "/app/audit-trail", label: "Audit Trail", icon: Clock, permission: "canAccessAuditTrail" },
    { path: "/app/users-roles", label: "Users & Roles", icon: Users, permission: "canAccessUsersRoles" },
    { path: "/app/broadcast-announcement", label: "Broadcast Announcement", icon: Radio, permission: "canAccessBroadcastAnnouncement" },
    { path: "/app/document-generator", label: "Document Generator", icon: FileText, permission: "canAccessDocumentGenerator" },
    { path: "/app/grade-evaluation", label: "Grade Evaluation", icon: ClipboardCheck, permission: "canAccessGradeEvaluation" },
    { path: "/app/settings", label: "Settings", icon: Settings, permission: "canAccessSettings" },
  ];

  const menuItems = allMenuItems.filter((item) =>
    hasPermission(userProfile.role, item.permission as any)
  );

  const getRoleBadge = () => {
    switch (userProfile.role) {
      case "ADMIN":
        return { icon: Shield, color: "bg-[#1D6FA3]", textColor: "text-white", label: "Administrator" };
      case "FACULTY":
        return { icon: BookOpen, color: "bg-[#1D6FA3]", textColor: "text-white", label: "Faculty" };
      case "STUDENT":
        return { icon: GraduationCap, color: "bg-[#1D6FA3]", textColor: "text-white", label: "Student" };
      default:
        return { icon: GraduationCap, color: "bg-[#1D6FA3]", textColor: "text-white", label: "Student" };
    }
  };

  const badge = getRoleBadge();

  const handleLogout = () => {
    // FIXED: Clear the JWT token so the user is securely logged out
    localStorage.removeItem('token');
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-[#E5E7EB] fixed top-0 left-0 right-0 z-30 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1D6FA3] rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1F2937]">CTU Argao Campus</div>
                <div className="text-xs text-[#6B7280]">Knowledge Management System</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-xl mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search documents, policies..."
                className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RoleSwitcher />

            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5 text-[#6B7280]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#F5F7FA] rounded-lg transition-colors"
              >
                <div className={`w-8 h-8 ${badge.color} rounded-lg flex items-center justify-center`}>
                  {badge.icon === Shield && <Shield className="h-4 w-4 text-white" />}
                  {badge.icon === BookOpen && <BookOpen className="h-4 w-4 text-white" />}
                  {badge.icon === GraduationCap && <GraduationCap className="h-4 w-4 text-white" />}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-sm font-medium text-[#1F2937]">{userProfile.name}</div>
                  <div className="text-xs text-[#6B7280]">{badge.label}</div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-2 z-50">
                  <div className="px-4 py-3 border-b border-[#E5E7EB]">
                    <p className="text-sm font-medium text-[#1F2937]">{userProfile.name}</p>
                    <p className="text-xs text-[#6B7280]">{userProfile.email}</p>
                  </div>
                  <button className="w-full px-4 py-2 text-left text-sm text-[#1F2937] hover:bg-[#F5F7FA] flex items-center gap-2 transition-colors">
                    <User className="h-4 w-4 text-[#6B7280]" />
                    My Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-[#1F2937] hover:bg-[#F5F7FA] flex items-center gap-2 transition-colors">
                    <Settings className="h-4 w-4 text-[#6B7280]" />
                    Settings
                  </button>
                  <div className="border-t border-[#E5E7EB] my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-[65px] bottom-0 bg-white border-r border-[#E5E7EB] transition-all duration-300 z-20 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4 px-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#1D6FA3] text-white"
                      : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#1F2937]"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : ""}`} />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-[#E5E7EB] p-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5 text-[#6B7280]" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <ChevronLeft className="h-5 w-5" />
                  <span>Collapse</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-[65px] min-h-screen ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* Notification Sidebar */}
      <NotificationSidebar
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}