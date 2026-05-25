import type { FactorySubjectsQuery } from '../../services/factoryApi';
import { normalizeFactorySubjectsQuery } from './factoryQueryUtils';

export const queryKeys = {
  projects: () => ['projects'] as const,
  project: (projectId: string) => ['projects', projectId] as const,
  projectObservations: (projectId: string) => ['projects', projectId, 'observations'] as const,
  subjectObservations: (subjectId: string) => ['subjects', subjectId, 'observations'] as const,
  subjectWorkspace: (subjectId: string) => ['subjects', subjectId, 'workspace'] as const,
  notificationsInbox: (filters?: { limit?: number; offset?: number; readDays?: number }) =>
    ['notifications', 'inbox', filters ?? {}] as const,
  notificationsSummary: () => ['notifications', 'summary'] as const,
  factory: {
    all: () => ['factory'] as const,
    summary: () => ['factory', 'dashboard', 'summary'] as const,
    subjectsList: (filters: FactorySubjectsQuery = {}) =>
      ['factory', 'subjects', 'list', normalizeFactorySubjectsQuery(filters)] as const,
    subjectsByStatus: (status: string, page: number, limit: number) =>
      ['factory', 'subjects', 'byStatus', status, page, limit] as const,
    subjectsByOrigin: (origin: string, page: number, limit: number) =>
      ['factory', 'subjects', 'byOrigin', origin, page, limit] as const,
  },
};
