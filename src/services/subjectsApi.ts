import { apiClient } from './apiClient';
import type { ApiObservation } from './types/workflowApi.types';
import type {
  ApiAddSubjectPayload,
  ApiProjectDetail,
  ApiProjectListItem,
  ApiSemesterDetail,
  ApiSubjectDetail,
} from './types/projectsApi.types';

export interface ApiSubjectWorkspaceLegacy {
  project: ApiProjectDetail;
  observations: ApiObservation[];
}

export type ApiSubjectWorkspaceProjectMeta = Omit<ApiProjectListItem, 'subjectsSummary'>;
export type ApiSubjectWorkspaceSemesterMeta = Omit<ApiSemesterDetail, 'subjects'>;

export interface ApiSubjectWorkspaceLight {
  projectMeta: ApiSubjectWorkspaceProjectMeta;
  semesterMeta: ApiSubjectWorkspaceSemesterMeta;
  subject: ApiSubjectDetail;
  observations: ApiObservation[];
}

export type ApiSubjectWorkspace = ApiSubjectWorkspaceLegacy | ApiSubjectWorkspaceLight;

export const subjectsApi = {
  getSubjectDetail: (subjectId: string) =>
    apiClient.get<ApiProjectDetail>(`/subjects/${subjectId}/detail`),

  getSubjectWorkspace: (subjectId: string) =>
    apiClient.get<ApiSubjectWorkspace>(`/subjects/${subjectId}/workspace`),

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
