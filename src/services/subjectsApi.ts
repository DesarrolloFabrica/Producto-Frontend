import { apiClient } from './apiClient';
import type { ApiSubjectDetail } from './types/projectsApi.types';

export const subjectsApi = {
  submitSubject: (subjectId: string) =>
    apiClient.post<ApiSubjectDetail>(`/subjects/${subjectId}/submit`, {}),

  approveSubject: (subjectId: string) =>
    apiClient.post<ApiSubjectDetail>(`/subjects/${subjectId}/approve`, {}),

  rejectSubject: (subjectId: string, reason?: string) =>
    apiClient.post<ApiSubjectDetail>(`/subjects/${subjectId}/reject`, reason?.trim() ? { reason: reason.trim() } : {}),
};
