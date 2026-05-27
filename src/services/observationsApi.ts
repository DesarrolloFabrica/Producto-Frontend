import { apiClient } from './apiClient';
import type { ApiCreateObservationPayload, ApiObservation } from './types/workflowApi.types';

interface ApiObservationStatusResponse {
  observation: ApiObservation;
  projectId?: string;
}

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
    apiClient.post<ApiObservationStatusResponse>(`/observations/${observationId}/mark-correction-applied`, {}),

  validateObservation: (observationId: string) =>
    apiClient.post<ApiObservationStatusResponse>(`/observations/${observationId}/validate`, {}),

  reopenObservation: (observationId: string, reason: string) =>
    apiClient.post<ApiObservationStatusResponse>(`/observations/${observationId}/reopen`, { reason }),

  sendObservationsToFactory: (subjectId: string) =>
    apiClient.post<{ id: string; observationCount: number }>(
      `/subjects/${subjectId}/observation-batches/send-to-factory`,
      {},
    ),

  notifyCorrectionsToProduct: (subjectId: string) =>
    apiClient.post<{ id: string; observationCount: number }>(
      `/subjects/${subjectId}/observation-batches/notify-corrections`,
      {},
    ),
};
