import { apiClient } from './apiClient';

export type CDigitalUserAuditUser = {
  id: string;
  name: string;
  email: string;
};

export type CDigitalUserRecord = {
  id: string;
  programName: string;
  username: string;
  passwordProtected: boolean;
  createdBy: CDigitalUserAuditUser;
  updatedBy: CDigitalUserAuditUser | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedCDigitalUsersResponse = {
  items: CDigitalUserRecord[];
  meta: PaginationMeta;
};

export type CDigitalRevealPasswordResponse = {
  password: string;
};

export type CDigitalUserFilters = {
  page?: number;
  limit?: number;
  programName?: string;
  username?: string;
  createdAt?: string;
  order?: 'recent' | 'oldest';
};

export type CDigitalUserPayload = {
  programName: string;
  username: string;
  password?: string;
};

function toQueryString(filters: CDigitalUserFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const cDigitalUsersApi = {
  list: async (filters: CDigitalUserFilters = {}) =>
    await apiClient.get<PaginatedCDigitalUsersResponse>(`/c-digital-users${toQueryString(filters)}`),

  create: async (payload: Required<CDigitalUserPayload>) =>
    await apiClient.post<CDigitalUserRecord>('/c-digital-users', payload),

  update: async (id: string, payload: CDigitalUserPayload) =>
    await apiClient.patch<CDigitalUserRecord>(`/c-digital-users/${id}`, payload),

  revealPassword: async (id: string) =>
    await apiClient.get<CDigitalRevealPasswordResponse>(`/c-digital-users/${id}/reveal-password`),

  remove: async (id: string) => await apiClient.delete<void>(`/c-digital-users/${id}`),
};
