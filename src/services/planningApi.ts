import type { InstitutionalOperationalState, Role, SlaStatus } from '../types/domain';
import { apiClient } from './apiClient';

export interface PlanningDashboardKpis {
  initialValidations: number;
  productionValidations: number;
  lmsValidations: number;
  radicationsPending: number;
  inProgress: number;
  finalized: number;
}

export interface PlanningActivityItem {
  id: string;
  kind: 'subject' | 'project';
  projectId: string;
  subjectId: string | null;
  subjectName: string | null;
  program: string;
  school: string;
  actionLabel: string;
  comment: string | null;
  returnReason: string | null;
  actorName: string;
  createdAt: string;
  deepLink: string;
}

export interface PlanningSubjectPreview {
  subjectId: string;
  subjectName: string;
  projectId: string;
  program: string;
  school: string;
  operationalState: InstitutionalOperationalState;
  stageDueAt: string | null;
  slaStatus: SlaStatus;
  lastReturnReason: string | null;
  currentResponsibleRole: Role;
}

export interface PlanningFinalizedProject {
  projectId: string;
  program: string;
  school: string;
  radicationNumber: string | null;
  radicatedAt: string | null;
  finalizedAt: string | null;
  productOwnerName: string;
  subjectsCount: number;
  semestersCount: number;
}

export interface PlanningDashboardSummary {
  kpis: PlanningDashboardKpis;
  recentActivity: PlanningActivityItem[];
  returnedPreview: PlanningSubjectPreview[];
  finalizedProjects: PlanningFinalizedProject[];
}

export const planningApi = {
  dashboardSummary() {
    return apiClient.get<PlanningDashboardSummary>('/planning/dashboard-summary');
  },
};
