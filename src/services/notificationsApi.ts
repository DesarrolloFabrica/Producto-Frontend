import { apiClient } from './apiClient';
import type { ApiNotification } from './types/workflowApi.types';

export const notificationsApi = {
  getNotifications: () => apiClient.get<ApiNotification[]>('/notifications'),

  markNotificationRead: (id: string) =>
    apiClient.patch<ApiNotification>(`/notifications/${id}/read`, {}),

  markAllNotificationsRead: () =>
    apiClient.patch<ApiNotification[]>('/notifications/read-all', {}),
};
