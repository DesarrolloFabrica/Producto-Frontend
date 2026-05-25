import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '../../types/domain';
import type { AuthUser } from '../../services/authApi';
import { authApi } from '../../services/authApi';
import { resetNotificationReadDedup } from '../notifications/notificationReadDedup';
import { resetProjectsBootstrap } from '../operations/projectsBootstrapState';
import { queryClient } from '../queries/queryClient';

const TOKEN_KEY = 'producto_access_token';
const USER_KEY = 'producto_auth_user';

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const role = user?.role ?? null;

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
    resetProjectsBootstrap();
    resetNotificationReadDedup();
    queryClient.clear();
    setUser(null);
  };

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    const token = (() => {
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    })();

    // No token => not authenticated.
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(me));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        if (cancelled) return;
        logout();
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    isAuthenticated: Boolean(user),
    isLoading,
    login: async (email: string, password: string) => {
      const { accessToken, user: nextUser } = await authApi.login(email, password);
      try {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      } catch {
        // ignore
      }
      setUser(nextUser);
    },
    logout,
  }), [user, role, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
