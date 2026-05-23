import { apiClient } from './apiClient';
import type { ApiAddSubjectPayload, ApiProjectDetail, ApiSubjectDetail } from './types/projectsApi.types';

export const subjectsApi = {
  getSubjectDetail: (subjectId: string) =>
    apiClient.get<ApiProjectDetail>(`/subjects/${subjectId}/detail`),

  addSubjectToSemester: (semesterId: string, payload: ApiAddSubjectPayload) =>
    apiClient.post<ApiProjectDetail>(`/semesters/${semesterId}/subjects`, payload),

  submitSubject: (subjectId: string) =>
    apiClient.post<ApiSubjectDetail>(`/subjects/${subjectId}/submit`, {}),

  approveSubject: (subjectId: string) =>
    apiClient.post<ApiSubjectDetail>(`/subjects/${subjectId}/approve`, {}),

  rejectSubject: (subjectId: string, reason?: string) =>
    apiClient.post<ApiSubjectDetail>(`/subjects/${subjectId}/reject`, reason?.trim() ? { reason: reason.trim() } : {}),

  requestCorrection: (subjectId: string, reason: string) =>
    apiClient.post<ApiProjectDetail>(`/subjects/${subjectId}/request-correction`, { reason: reason.trim() }),

  updateProductionStatus: (
    subjectId: string,
    status: 'PENDIENTE' | 'EN_PRODUCCION' | 'COMPLETADA',
  ) => apiClient.patch<ApiProjectDetail>(`/subjects/${subjectId}/production-status`, { status }),
};
