import { apiClient } from './apiClient';
import type { Role } from '../types/domain';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string | null;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export const authApi = {
  login: async (email: string, password: string) =>
    await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    }),

  loginWithGoogle: async (credential: string) =>
    await apiClient.post<LoginResponse>('/auth/google', { credential }),

  loginWithEmailOnly: async (email: string) =>
    await apiClient.post<LoginResponse>('/auth/dev/email', { email }),

  me: async () => await apiClient.get<AuthUser>('/auth/me'),
};
