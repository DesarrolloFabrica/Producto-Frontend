import { apiClient } from './apiClient';
import type { ApiAddTopicsPayload } from './types/projectsApi.types';
import type { ApiProjectDetail } from './types/projectsApi.types';

export const topicsApi = {
  addTopicsToSubject: (subjectId: string, payload: ApiAddTopicsPayload) =>
    apiClient.post<ApiProjectDetail>(`/subjects/${subjectId}/topics`, payload),
};
