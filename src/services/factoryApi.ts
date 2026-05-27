import { apiClient } from './apiClient';
import type { ApiProjectDetail } from './types/projectsApi.types';

export type ApiSubjectOperationalState =
  | 'NOT_STARTED'
  | 'IN_PRODUCTION'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'CORRECTION_SENT'
  | 'APPROVED';

export interface ApiFactorySubjectWorkItem {
  subjectId: string;
  semesterId?: string | null;
  subjectName: string;
  projectId: string;
  program: string;
  school: string;
  semesterNumber: number;
  expectedDeliveryDate: string | null;
  priority: string;
  operationalState: ApiSubjectOperationalState;
  openObservationsCount: number;
  correctionSentCount: number;
  lastActivity: string | null;
  actionUrl: string;
  createdFromChange: boolean;
  subjectsTotal?: number;
  subjectsReady?: number;
}

export interface ApiFactoryDashboardSummary {
  countsByState: Record<ApiSubjectOperationalState, number>;
  totalAssigned: number;
  notStartedTop: ApiFactorySubjectWorkItem[];
  inProductionTop: ApiFactorySubjectWorkItem[];
  inReviewTop: ApiFactorySubjectWorkItem[];
  pendingCorrectionsTop: ApiFactorySubjectWorkItem[];
  upcomingDeliveriesTop: ApiFactorySubjectWorkItem[];
  recentlyCompletedTop: ApiFactorySubjectWorkItem[];
  overdueOrDueSoonCount: number;
}

export interface ApiFactoryProgramsPage {
  items: ApiFactoryProgramWorkItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiFactoryProgramWorkItem {
  kind: 'program';
  projectId: string;
  program: string;
  school: string;
  totalSemesters: number;
  completedSemesters: number;
  totalSubjects: number;
  completedSubjects: number;
  pendingSubjects: number;
  activeStageSummary: Array<{ label: string; count: number }>;
  nearestDueDate: string | null;
  openObservations: number;
  actionUrl: string;
  semesters: ApiFactorySubjectWorkItem[];
}

export interface ApiFactorySubjectsPage {
  items: ApiFactorySubjectWorkItem[];
  total: number;
  page: number;
  limit: number;
}

export type FactorySubjectsOrigin = 'all' | 'new' | 'original';

export interface FactorySubjectsQuery {
  origin?: FactorySubjectsOrigin;
  status?: ApiSubjectOperationalState;
  projectId?: string;
  program?: string;
  semester?: number;
  priority?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  limit?: number;
  sort?: 'dueDate' | 'updatedAt' | 'priority';
}

export const factoryApi = {
  getDashboardSummary: () =>
    apiClient.get<ApiFactoryDashboardSummary>('/factory/dashboard/summary'),

  getSubjects: (query?: FactorySubjectsQuery) => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, String(value));
        }
      });
    }
    const qs = params.toString();
    return apiClient.get<ApiFactorySubjectsPage>(
      `/factory/subjects${qs ? `?${qs}` : ''}`,
    );
  },

  getPrograms: (query?: FactorySubjectsQuery) => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, String(value));
        }
      });
    }
    const qs = params.toString();
    return apiClient.get<ApiFactoryProgramsPage>(
      `/factory/subjects/programs${qs ? `?${qs}` : ''}`,
    );
  },

  getSubjectDetail: (subjectId: string) =>
    apiClient.get<ApiProjectDetail>(`/factory/subjects/${subjectId}/detail`),
};
