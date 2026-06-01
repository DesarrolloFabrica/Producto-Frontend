import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '../../types/domain';
import type { AuthUser } from '../../services/authApi';
import { authApi } from '../../services/authApi';
import { extractGoogleAvatarUrl } from '../../utils/googleCredential';
import { resetNotificationReadDedup } from '../notifications/notificationReadDedup';
import { clearBootPending, markBootPending } from '../boot/appBootStorage';
import { resetProjectsBootstrap } from '../operations/projectsBootstrapState';
import { queryClient } from '../queries/queryClient';

const TOKEN_KEY = 'producto_access_token';
const USER_KEY = 'producto_auth_user';
const ENTRY_REDIRECT_KEY = 'producto_entry_redirect_done';
const OPS_V2_STORAGE_KEY = 'producto_ops_v2_state_v1';

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithEmailOnly: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function mergeAvatarUrl(nextUser: AuthUser, previousUser: AuthUser | null): AuthUser {
  if (nextUser.avatarUrl || !previousUser?.avatarUrl) {
    return nextUser;
  }

  return { ...nextUser, avatarUrl: previousUser.avatarUrl };
}

function withGoogleAvatar(user: AuthUser, credential: string): AuthUser {
  if (user.avatarUrl) return user;

  const avatarUrl = extractGoogleAvatarUrl(credential);
  return avatarUrl ? { ...user, avatarUrl } : user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const role = user?.role ?? null;

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(OPS_V2_STORAGE_KEY);
      sessionStorage.removeItem(ENTRY_REDIRECT_KEY);
      clearBootPending();
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
        const mergedUser = mergeAvatarUrl(me, readStoredUser());
        setUser(mergedUser);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
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

  const persistSession = (accessToken: string, nextUser: AuthUser) => {
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      sessionStorage.removeItem(ENTRY_REDIRECT_KEY);
      markBootPending();
    } catch {
      // ignore
    }
    setUser(nextUser);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    isAuthenticated: Boolean(user),
    isLoading,
    login: async (email: string, password: string) => {
      const { accessToken, user: nextUser } = await authApi.login(email, password);
      persistSession(accessToken, nextUser);
    },
    loginWithGoogle: async (credential: string) => {
      const { accessToken, user: nextUser } = await authApi.loginWithGoogle(credential);
      persistSession(accessToken, withGoogleAvatar(nextUser, credential));
    },
    loginWithEmailOnly: async (email: string) => {
      const { accessToken, user: nextUser } = await authApi.loginWithEmailOnly(email);
      persistSession(accessToken, nextUser);
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
