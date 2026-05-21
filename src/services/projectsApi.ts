import { apiClient } from './apiClient';
import type {
  ApiCreateProjectPayload,
  ApiProjectActionResponse,
  ApiProjectDetail,
  ApiProjectListItem,
} from './types/projectsApi.types';

export const projectsApi = {
  getProjects: () => apiClient.get<ApiProjectListItem[]>('/projects'),

  getProjectById: (id: string) => apiClient.get<ApiProjectDetail>(`/projects/${id}`),

  createProject: (payload: ApiCreateProjectPayload) =>
    apiClient.post<ApiProjectDetail>('/projects', payload),

  markProjectDelivered: (id: string) =>
    apiClient.post<ApiProjectDetail>(`/projects/${id}/mark-delivered`, {}),

  closeProject: (id: string) => apiClient.post<ApiProjectDetail>(`/projects/${id}/close`, {}),

  startProduction: (id: string) => apiClient.post<ApiProjectActionResponse>(`/projects/${id}/start-production`, {}),
};
