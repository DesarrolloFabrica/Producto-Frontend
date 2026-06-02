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
  semesterId: string;
  semesterNumber: number;
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

export interface ProgramActiveStageSummaryDto {
  label: string;
  count: number;
}

export interface ProgramOperationalWorkItemDto {
  kind: 'program';
  projectId: string;
  program: string;
  school: string;
  productOwnerName?: string | null;
  totalSemesters: number;
  completedSemesters: number;
  totalSubjects: number;
  completedSubjects: number;
  pendingSubjects: number;
  academicReviewPendingCount: number;
  activeStageSummary: ProgramActiveStageSummaryDto[];
  nearestDueDate: string | null;
  slaStatus: SlaStatus;
  currentResponsibleRole: Role;
  openObservations: number;
  actionUrl: string;
  semesters: OperationalWorkItemDto[];
}

export interface OperationalWorkItemDto {
  kind?: 'subject' | 'semester';
  semesterId?: string;
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
  subjectsTotal?: number;
  subjectsReady?: number;
  subjectsApproved?: number;
  openObservations?: number;
}

export interface SemesterSubjectOperationalDto {
  subjectId: string;
  subjectName: string;
  status: string;
  operationalState: InstitutionalOperationalState;
  internalState: string;
  progress: number;
  blockers: string[];
  openObservationsCount: number;
}

export interface SemesterOperationalWorkspaceDto {
  semesterId: string;
  semesterNumber: number;
  projectId: string;
  program: string;
  school: string;
  productOwnerName?: string | null;
  operationalState: InstitutionalOperationalState;
  currentResponsibleRole: Role;
  academicReviewEnabled: boolean;
  academicChecklistEnabled: boolean;
  academicReviewReady: boolean;
  correctionInFactory: boolean;
  institutionalFlowActive: boolean;
  slaStatus: SlaStatus;
  stageDueAt: string | null;
  lastReturnReason: string | null;
  lastReturnAt: string | null;
  checks: OperationalCheckDto[];
  timeline: OperationalTransitionRecordDto[];
  availableActions: InstitutionalOperationalAction[];
  readiness: { ready: boolean; blockers: string[] };
  subjects: SemesterSubjectOperationalDto[];
  metrics: {
    subjectsTotal: number;
    subjectsReady: number;
    subjectsApproved: number;
    subjectsBlocked: number;
    openObservations: number;
  };
}

export const institutionalWorkflowApi = {
  getWorkspace(subjectId: string) {
    return apiClient.get<OperationalWorkspaceDto>(`/subjects/${subjectId}/operational-workspace`);
  },
  transition(subjectId: string, body: { action: InstitutionalOperationalAction; comment?: string; returnReason?: string; evidenceUrl?: string }) {
    return apiClient.post<OperationalWorkspaceDto>(`/subjects/${subjectId}/operational-transitions`, body);
  },
  getSemesterWorkspace(semesterId: string) {
    return apiClient.get<SemesterOperationalWorkspaceDto>(`/semesters/${semesterId}/operational-workspace`);
  },
  transitionSemester(semesterId: string, body: { action: InstitutionalOperationalAction; comment?: string; returnReason?: string; evidenceUrl?: string }) {
    return apiClient.post<SemesterOperationalWorkspaceDto>(`/semesters/${semesterId}/operational-transitions`, body);
  },
  planningWork() {
    return apiClient.get<OperationalWorkItemDto[]>('/planning/work');
  },
  planningTracking() {
    return apiClient.get<OperationalWorkItemDto[]>('/planning/tracking');
  },
  planningTrackingPrograms() {
    return apiClient.get<ProgramOperationalWorkItemDto[]>('/planning/tracking/programs');
  },
  planningWorkPrograms() {
    return apiClient.get<ProgramOperationalWorkItemDto[]>('/planning/work/programs');
  },
  getProjectOperationalProgram(projectId: string) {
    return apiClient.get<ProgramOperationalWorkItemDto>(`/projects/${projectId}/operational-program`);
  },
  lmsWork() {
    return apiClient.get<OperationalWorkItemDto[]>('/lms/work');
  },
  lmsWorkPrograms() {
    return apiClient.get<ProgramOperationalWorkItemDto[]>('/lms/work/programs');
  },
  productWork() {
    return apiClient.get<OperationalWorkItemDto[]>('/product/operational-work');
  },
  productProgramsWork() {
    return apiClient.get<ProgramOperationalWorkItemDto[]>('/product/operational-work/programs');
  },
  productTrackingPrograms() {
    return apiClient.get<ProgramOperationalWorkItemDto[]>('/product/tracking/programs');
  },
  factoryWork() {
    return apiClient.get<OperationalWorkItemDto[]>('/factory/operational-work');
  },
  factoryProgramsWork() {
    return apiClient.get<ProgramOperationalWorkItemDto[]>('/factory/operational-work/programs');
  },
};
