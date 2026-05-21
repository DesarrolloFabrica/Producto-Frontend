import { apiClient } from './apiClient';
import type { ChecklistStatus } from '../types/domain';

export interface UpdateChecklistStatusPayload {
  status: ChecklistStatus;
}

export const checklistApi = {
  updateStatus: (checklistItemId: string, payload: UpdateChecklistStatusPayload) =>
    apiClient.patch<unknown>(`/checklist/${checklistItemId}/status`, payload),
};
