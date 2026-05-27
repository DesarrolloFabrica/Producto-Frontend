import type { InstitutionalOperationalAction, InstitutionalOperationalState, Role, SlaStatus } from '../types/domain';
import { apiClient } from './apiClient';

export interface LmsDashboardKpis {
  pendingUpload: number;
  inUpload: number;
  completedUpload: number;
  returnedByPlanning: number;
  inProgressProjects: number;
  finalizedProjects: number;
}

export interface LmsActivityItem {
  id: string;
  kind: 'subject';
  projectId: string;
  subjectId: string;
  subjectName: string;
  program: string;
  school: string;
  actionLabel: string;
  comment: string | null;
  returnReason: string | null;
  actorName: string;
  createdAt: string;
  deepLink: string;
}

export interface LmsSubjectPreview {
  subjectId: string;
  subjectName: string;
  projectId: string;
  program: string;
  school: string;
  semesterNumber: number;
  operationalState: InstitutionalOperationalState;
  stageDueAt: string | null;
  slaStatus: SlaStatus;
  lastReturnReason: string | null;
  currentResponsibleRole: Role;
  availableActions: InstitutionalOperationalAction[];
}

export interface LmsDashboardSummary {
  kpis: LmsDashboardKpis;
  recentActivity: LmsActivityItem[];
  returnedPreview: LmsSubjectPreview[];
  completedPreview: LmsSubjectPreview[];
}

export const lmsApi = {
  dashboardSummary() {
    return apiClient.get<LmsDashboardSummary>('/lms/dashboard-summary');
  },
};
