import { useState } from "react";
import { Shield, BookOpen, GraduationCap, ChevronDown } from "lucide-react";
import { useRole } from "../contexts/RoleContext";
import type { UserRole } from "../contexts/RoleContext";


export function RoleSwitcher() {
  const { user, setUserRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { value: UserRole; label: string; icon: any; color: string }[] = [
    { value: "ADMIN", label: "Administrator", icon: Shield, color: "#CE0000" },
    { value: "FACULTY", label: "Faculty", icon: BookOpen, color: "#FDB913" },
    { value: "STUDENT", label: "Student", icon: GraduationCap, color: "#006837" },
  ];

  const currentRole = roles.find((r) => r.value === user.role) || roles[0];

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
      >
        <currentRole.icon className="h-5 w-5 text-white" />
        <span className="text-white text-sm font-medium">{currentRole.label}</span>
        <ChevronDown className={`h-4 w-4 text-white transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
            <div className="px-3 py-2 text-xs text-gray-500 border-b">Switch Role (Demo)</div>
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = user.role === role.value;
              return (
                <button
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-[#F5F5F5] transition-colors ${
                    isActive ? "bg-[#F5F5F5]" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" style={{ color: role.color }} />
                  <span className="text-gray-700 text-sm">{role.label}</span>
                  {isActive && (
                    <span className="ml-auto text-xs text-[#006837]">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
