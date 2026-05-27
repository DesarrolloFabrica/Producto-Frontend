import { apiClient } from './apiClient';

export type ProjectInstitutionalState =
  | 'INSTITUTIONAL_IN_PROGRESS'
  | 'READY_FOR_PRODUCT_RADICATION'
  | 'PENDING_PLANNING_RADICATION_CHECK'
  | 'RADICATION_RETURNED_TO_PRODUCT'
  | 'FINALIZED';

export interface ProjectRadicationReadinessDto {
  ready: boolean;
  blockers: string[];
  scope: {
    semesters: number;
    subjectsTotal: number;
    subjectsApproved: number;
    subjectsPending: number;
  };
  bySemester: Array<{
    semesterNumber: number;
    total: number;
    approved: number;
    pending: number;
    statesBreakdown: Record<string, number>;
  }>;
  canRegisterRadication: boolean;
  canResubmitRadication: boolean;
  projectInstitutionalState: ProjectInstitutionalState | null;
  institutionalScopeLockedAt: string | null;
  radicationNumber: string | null;
  radicatedAt: string | null;
  lastRadicationReturnReason: string | null;
  productRadicationDueAt: string | null;
  planningRadicationCheckDueAt: string | null;
}

export interface ProjectRadicationWorkItemDto {
  projectId: string;
  school: string;
  program: string;
  institutionalState: ProjectInstitutionalState;
  radicationNumber: string | null;
  radicatedAt: string | null;
  scopeSubjectsTotal: number;
  scopeSubjectsApproved: number;
  productRadicationDueAt: string | null;
  planningRadicationCheckDueAt: string | null;
  lastRadicationReturnReason: string | null;
}

export interface RegisterProjectRadicationBody {
  radicationNumber: string;
  radicatedAt: string;
  comment?: string;
  evidenceUrl?: string;
}

export const projectRadicationApi = {
  getReadiness(projectId: string) {
    return apiClient.get<ProjectRadicationReadinessDto>(`/projects/${projectId}/radication-readiness`);
  },
  register(projectId: string, body: RegisterProjectRadicationBody) {
    return apiClient.post<ProjectRadicationReadinessDto>(`/projects/${projectId}/radication`, body);
  },
  resubmit(projectId: string, body: RegisterProjectRadicationBody) {
    return apiClient.post<ProjectRadicationReadinessDto>(`/projects/${projectId}/radication/resubmit`, body);
  },
  validate(projectId: string) {
    return apiClient.post<ProjectRadicationReadinessDto>(`/projects/${projectId}/radication/validate`, {});
  },
  returnRadication(projectId: string, body: { returnReason: string }) {
    return apiClient.post<ProjectRadicationReadinessDto>(`/projects/${projectId}/radication/return`, body);
  },
  productWork() {
    return apiClient.get<ProjectRadicationWorkItemDto[]>('/product/radication-work');
  },
  planningWork() {
    return apiClient.get<ProjectRadicationWorkItemDto[]>('/planning/radication-work');
  },
};
