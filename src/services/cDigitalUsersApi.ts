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
  password: string;
  createdBy: CDigitalUserAuditUser;
  updatedBy: CDigitalUserAuditUser | null;
  createdAt: string;
  updatedAt: string;
};

export type CDigitalUserFilters = {
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
    await apiClient.get<CDigitalUserRecord[]>(`/c-digital-users${toQueryString(filters)}`),

  create: async (payload: Required<CDigitalUserPayload>) =>
    await apiClient.post<CDigitalUserRecord>('/c-digital-users', payload),

  update: async (id: string, payload: CDigitalUserPayload) =>
    await apiClient.patch<CDigitalUserRecord>(`/c-digital-users/${id}`, payload),

  remove: async (id: string) => await apiClient.delete<void>(`/c-digital-users/${id}`),
};
