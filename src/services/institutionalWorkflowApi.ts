import type {
  InstitutionalOperationalAction,
  InstitutionalOperationalState,
  Role,
  SlaStatus,
} from '../types/domain';
import { apiClient } from './apiClient';

export interface OperationalCheckDto {
  key: string;
  label: string;
  responsibleRole: Role;
  status: 'PENDING' | 'CHECKED' | 'RETURNED';
  checkedAt: string | null;
  checkedByName: string | null;
  comment: string | null;
  evidenceUrl: string | null;
}

export interface OperationalTransitionRecordDto {
  id: string;
  fromState: InstitutionalOperationalState | null;
  toState: InstitutionalOperationalState;
  action: InstitutionalOperationalAction;
  actorName: string;
  actorRole: Role;
  comment: string | null;
  returnReason: string | null;
  createdAt: string;
}

export interface OperationalWorkspaceDto {
  subjectId: string;
  subjectName: string;
  projectId: string;
  program: string;
  school: string;
  operationalState: InstitutionalOperationalState;
  academicReviewEnabled: boolean;
  academicChecklistEnabled: boolean;
  academicReviewReady: boolean;
  correctionInFactory: boolean;
  institutionalFlowActive: boolean;
  academicApprovalReady?: boolean;
  academicApprovalBlockers?: string[];
  slaStatus: SlaStatus;
  stageDueAt: string | null;
  lastReturnReason: string | null;
  lastReturnAt: string | null;
  checks: OperationalCheckDto[];
  timeline: OperationalTransitionRecordDto[];
  availableActions: InstitutionalOperationalAction[];
}

export interface OperationalWorkItemDto {
  subjectId: string;
  subjectName: string;
  projectId: string;
  program: string;
  school: string;
  semesterNumber: number;
  operationalState: InstitutionalOperationalState;
  currentResponsibleRole: Role;
  stageDueAt: string | null;
  slaStatus: SlaStatus;
  availableActions: InstitutionalOperationalAction[];
  lastReturnReason: string | null;
  actionUrl: string;
}

export const institutionalWorkflowApi = {
  getWorkspace(subjectId: string) {
    return apiClient.get<OperationalWorkspaceDto>(`/subjects/${subjectId}/operational-workspace`);
  },
  transition(subjectId: string, body: { action: InstitutionalOperationalAction; comment?: string; returnReason?: string; evidenceUrl?: string }) {
    return apiClient.post<OperationalWorkspaceDto>(`/subjects/${subjectId}/operational-transitions`, body);
  },
  planningWork() {
    return apiClient.get<OperationalWorkItemDto[]>('/planning/work');
  },
  lmsWork() {
    return apiClient.get<OperationalWorkItemDto[]>('/lms/work');
  },
  productWork() {
    return apiClient.get<OperationalWorkItemDto[]>('/product/operational-work');
  },
  factoryWork() {
    return apiClient.get<OperationalWorkItemDto[]>('/factory/operational-work');
  },
};
