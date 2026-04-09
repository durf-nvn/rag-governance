import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type UserRole = "ADMIN" | "FACULTY" | "STUDENT";

interface User {
  name: string;
  email: string;
  role: UserRole;
}

interface RoleContextType {
  user: User;
  setUserRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>({
    name: "Admin User",
    email: "admin@ctu.edu.ph",
    role: "ADMIN",
  });

  const setUserRole = (role: UserRole) => {
    const names = {
      ADMIN: "Admin User",
      FACULTY: "Faculty User",
      STUDENT: "Student User",
    };
    const emails = {
      ADMIN: "admin@ctu.edu.ph",
      FACULTY: "faculty@ctu.edu.ph",
      STUDENT: "student@ctu.edu.ph",
    };
    setUser({
      name: names[role],
      email: emails[role],
      role,
    });
  };

  return (
    <RoleContext.Provider value={{ user, setUserRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
