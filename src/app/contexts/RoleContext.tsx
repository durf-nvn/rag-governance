import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

interface RoleContextType {
  userRole: UserRole | null;
  setUserRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  // Initialize state by checking localStorage first
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    const savedRole = localStorage.getItem('userRole');
    return (savedRole as UserRole) || null;
  });

  // Keep localStorage in sync if the role changes
  const handleSetRole = (role: UserRole) => {
    localStorage.setItem('userRole', role);
    setUserRole(role);
  };

  return (
    <RoleContext.Provider value={{ userRole, setUserRole: handleSetRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}