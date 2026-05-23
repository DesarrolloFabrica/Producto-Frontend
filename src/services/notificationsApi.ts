import { apiClient } from './apiClient';
import type { ApiNotification } from './types/workflowApi.types';

export interface ApiNotificationSummary {
  actionableCount: number;
  unreadCount: number;
  inboxCount: number;
}

export interface ApiNotificationInbox {
  summary: ApiNotificationSummary;
  items: ApiNotification[];
  hasMore: boolean;
}

const buildQuery = (params?: Record<string, string | number | undefined>) => {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const notificationsApi = {
  getInbox: (params?: { limit?: number; offset?: number; readDays?: number }) =>
    apiClient.get<ApiNotificationInbox>(`/notifications${buildQuery(params)}`),

  getSummary: () => apiClient.get<ApiNotificationSummary>('/notifications/summary'),

  markNotificationRead: (id: string) =>
    apiClient.patch<ApiNotification>(`/notifications/${id}/read`, {}),

  markAllNotificationsRead: () =>
    apiClient.patch<{ updatedCount: number }>('/notifications/read-all', {}),

  markReadByResource: (payload: { projectId?: string; subjectId?: string }) =>
    apiClient.patch<{ updatedCount: number }>('/notifications/read-by-resource', payload),

  dismissInformative: () =>
    apiClient.patch<{ updatedCount: number }>('/notifications/dismiss-informative', {}),

  dismissNotifications: (payload: {
    ids?: string[];
    projectId?: string;
    subjectId?: string;
  }) => apiClient.patch<{ updatedCount: number }>('/notifications/dismiss', payload),

  dismissNotification: (id: string) =>
    apiClient.patch<ApiNotification>(`/notifications/${id}/dismiss`, {}),
};
