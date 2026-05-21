import { apiClient } from './apiClient';
import type { ApiCreateObservationPayload, ApiObservation } from './types/workflowApi.types';

export const observationsApi = {
  getProjectObservations: (projectId: string) =>
    apiClient.get<ApiObservation[]>(`/projects/${projectId}/observations`),

  getSubjectObservations: (subjectId: string) =>
    apiClient.get<ApiObservation[]>(`/subjects/${subjectId}/observations`),

  createObservation: (payload: ApiCreateObservationPayload) =>
    apiClient.post<ApiObservation>('/observations', payload),

  addObservationMessage: (observationId: string, message: string) =>
    apiClient.post<ApiObservation>(`/observations/${observationId}/messages`, { message }),

  markCorrectionApplied: (observationId: string) =>
    apiClient.post<ApiObservation>(`/observations/${observationId}/mark-correction-applied`, {}),

  validateObservation: (observationId: string) =>
    apiClient.post<ApiObservation>(`/observations/${observationId}/validate`, {}),
};
