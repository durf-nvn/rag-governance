import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Database, MessageSquare, Award, FileText,
  Clock, Users, Settings, Search, Bell, ChevronLeft, ChevronRight,
  GraduationCap, LogOut, Shield, BookOpen, Radio, ClipboardCheck, Sparkles, X
} from "lucide-react";
import { useRole } from "../contexts/RoleContext";
import { hasPermission } from "../utils/rolePermissions";
import { RoleSwitcher } from "../components/RoleSwitcher";
import { NotificationSidebar } from "../components/NotificationSidebar";
import { useNotifications } from "../utils/useNotifications";
import { AskPolicy } from "../pages/AskPolicy"; 

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useRole();

  const isProfileSettings = location.pathname === '/app/profile-settings';

  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false);
  const [showUserMenu,      setShowUserMenu]       = useState(false);
  const [showNotifications, setShowNotifications]  = useState(false);
  const [isAIChatOpen,      setIsAIChatOpen]       = useState(false); 

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifs = useNotifications();

  const currentRole = userRole || "STUDENT";
  const userProfile = {
    role:  currentRole,
    name:  sessionStorage.getItem("userName")  || "CTU User",
    email: sessionStorage.getItem("userEmail") || "user@ctu.edu.ph",
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  const allMenuItems = [
    { path: "/app",                        label: "Dashboard",              icon: LayoutDashboard,  permission: "canAccessDashboard"             },
    { path: "/app/knowledge-repository",   label: "Knowledge Repository",   icon: Database,         permission: "canAccessKnowledgeRepository"    },
    { path: "/app/accreditation-support",  label: "Accreditation Support",  icon: Award,            permission: "canAccessAccreditationSupport"   },
    { path: "/app/audit-trail",            label: "Audit Trail",            icon: Clock,            permission: "canAccessAuditTrail"             },
    { path: "/app/users-roles",            label: "Users & Roles",          icon: Users,            permission: "canAccessUsersRoles"             },
    { path: "/app/broadcast-announcement", label: "Broadcast Announcement", icon: Radio,            permission: "canAccessBroadcastAnnouncement"  },
    { path: "/app/document-generator",     label: "Document Generator",     icon: FileText,         permission: "canAccessDocumentGenerator"      },
    { path: "/app/grade-evaluation",       label: "Grade Evaluation",       icon: ClipboardCheck,   permission: "canAccessGradeEvaluation"        },
    { path: "/app/settings",               label: "Settings",               icon: Settings,         permission: "canAccessSettings"              },
  ];

  const menuItems = allMenuItems.filter((item) =>
    hasPermission(userProfile.role, item.permission as any)
  );

  const getRoleBadge = () => {
    switch (userProfile.role) {
      case "ADMIN":   return { icon: Shield,        color: "bg-[#FF9501]", label: "Administrator" };
      case "FACULTY": return { icon: BookOpen,      color: "bg-[#FF9501]", label: "Faculty"       };
      default:        return { icon: GraduationCap, color: "bg-[#FF9501]", label: "Student"       };
    }
  };

  const badge = getRoleBadge();

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* Top Navigation */}
      <nav className="bg-white border-b border-[#E5E7EB] fixed top-0 left-0 right-0 z-30 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF9501] rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1F2937]">CTU Argao Campus</div>
              <div className="text-xs text-[#6B7280]">Knowledge Management System</div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-xl mx-8">
            
          </div>

          <div className="flex items-center gap-3">
            <RoleSwitcher />

            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors cursor-pointer"
              aria-label={`Notifications${notifs.unreadCount > 0 ? ` — ${notifs.unreadCount} unread` : ""}`}
            >
              <Bell className="h-5 w-5 text-[#6B7280]" />
              {notifs.unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#CE0000] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-sm animate-[badgePop_300ms_ease-out]">
                  {notifs.unreadCount > 99 ? "99+" : notifs.unreadCount}
                </span>
              )}
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#F5F7FA] rounded-lg transition-colors cursor-pointer"
              >
                <div className={`w-8 h-8 ${badge.color} rounded-lg flex items-center justify-center`}>
                  {badge.icon === Shield        && <Shield        className="h-4 w-4 text-white" />}
                  {badge.icon === BookOpen      && <BookOpen      className="h-4 w-4 text-white" />}
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
                  <Link 
                    to="/app/profile-settings" 
                    className="w-full px-4 py-2 text-left text-sm text-[#1F2937] hover:bg-[#F5F7FA] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-[#6B7280]" />
                    <span>Settings</span>
                  </Link>
                  <div className="border-t border-[#E5E7EB] my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {!isProfileSettings && (
        <aside
          className={`fixed left-0 top-20 bottom-0 bg-white border-r border-[#E5E7EB] transition-all duration-300 z-20 ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="top-20 flex-1 overflow-y-auto py-4 px-3">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#FF9501] text-white"
                        : "text-[#6B7280] hover:bg-[#FFF4E5] hover:text-[#D97E00]"
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
                className="w-full flex items-center justify-center p-2 hover:bg-[#F5F7FA] rounded-lg transition-colors cursor-pointer"
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
      )}

      {/* Main Layout Body */}
      <main
        className={`transition-all duration-300 pt-[73px] min-h-screen ${
          isProfileSettings ? "ml-0" : (sidebarCollapsed ? "ml-16" : "ml-64")
        }`}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* Notification Drawer */}
      <NotificationSidebar
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        {...notifs}
      />

      {/* ══ FLOATING ON-DISPLAY AI WIDGET SYSTEM ═════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none">
        {isAIChatOpen && (
          <div className="w-[350px] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
            
            <div className="p-4 bg-[#FF9501] text-white flex justify-between items-center shadow-md shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse text-white" />
                <span className="font-bold text-sm tracking-wide">AskPolicy Assistant</span>
              </div>
              <button 
                onClick={() => setIsAIChatOpen(false)}
                className="p-1 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 bg-[#F5F7FA]">
              <AskPolicy />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer bg-gradient-to-br from-[#FF9501] to-[#D97E00] ${
            isAIChatOpen ? "rotate-90 bg-gray-800" : ""
          }`}
        >
          {isAIChatOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 animate-pulse" />}
        </button>
      </div>

      <style>{`
        @keyframes badgePop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1);   opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>
    </div>
  );
}