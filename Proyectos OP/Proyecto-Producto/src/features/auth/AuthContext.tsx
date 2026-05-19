import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '../../types/domain';

interface AuthContextValue {
  role: Role | null;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'fabrica-academica-role';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => (localStorage.getItem(STORAGE_KEY) as Role | null) ?? null);

  const value = useMemo<AuthContextValue>(() => ({
    role,
    login: (nextRole) => {
      localStorage.setItem(STORAGE_KEY, nextRole);
      setRole(nextRole);
    },
    logout: () => {
      localStorage.removeItem(STORAGE_KEY);
      setRole(null);
    },
  }), [role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
