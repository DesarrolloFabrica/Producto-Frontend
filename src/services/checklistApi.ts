import { apiClient } from './apiClient';
import type { ChecklistStatus } from '../types/domain';

export interface UpdateChecklistStatusPayload {
  status: ChecklistStatus;
}

export type BulkApproveSectionScope = 'SUBJECT' | 'CATEGORY' | 'TOPIC';

export interface BulkApproveSectionPayload {
  subjectId: string;
  scope: BulkApproveSectionScope;
  topicId?: string;
  category?: string;
}

export interface BulkApproveSectionResponse {
  countUpdated: number;
  subjectId: string;
  projectId: string;
  alreadyApproved: boolean;
  updatedItemIds: string[];
}

export const checklistApi = {
  updateStatus: (checklistItemId: string, payload: UpdateChecklistStatusPayload) =>
    apiClient.patch<unknown>(`/checklist/${checklistItemId}/status`, payload),

  bulkApproveSection: (payload: BulkApproveSectionPayload) =>
    apiClient.post<BulkApproveSectionResponse>('/checklist/bulk-approve-section', payload),
};
