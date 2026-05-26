import { apiClient } from './apiClient';
import type {
  ApiAddSemesterPayload,
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

  addSemester: (projectId: string, payload: ApiAddSemesterPayload) =>
    apiClient.post<ApiProjectDetail>(`/projects/${projectId}/semesters`, payload),

  markProjectDelivered: (id: string) =>
    apiClient.post<ApiProjectDetail>(`/projects/${id}/mark-delivered`, {}),

  closeProject: (id: string) => apiClient.post<ApiProjectDetail>(`/projects/${id}/close`, {}),

  startProduction: (id: string) => apiClient.post<ApiProjectActionResponse>(`/projects/${id}/start-production`, {}),

  confirmSubjectMatterExpert: (id: string) =>
    apiClient.patch<ApiProjectDetail>(`/projects/${id}/subject-matter-expert/confirm`, {}),
};
