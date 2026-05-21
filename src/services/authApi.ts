import { apiClient } from './apiClient';
import type { Role } from '../types/domain';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
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

  me: async () => await apiClient.get<AuthUser>('/auth/me'),
};
