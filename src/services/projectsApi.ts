import { apiClient } from './apiClient';
import type {
  ApiAddSemesterPayload,
  ApiCreateProjectPayload,
  ApiProjectActionResponse,
  ApiProjectDetail,
  ApiProjectListItem,
  ApiPaginatedProjectListResponse,
} from './types/projectsApi.types';

export const projectsApi = {
  getProjectsPage: (params: { page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiClient.get<ApiPaginatedProjectListResponse>(`/projects${qs ? `?${qs}` : ''}`);
  },

  getProjects: async () => {
    const response = await projectsApi.getProjectsPage({ page: 1, limit: 100 });
    return response.items;
  },

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
