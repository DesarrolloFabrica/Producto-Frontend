import type { QueryClient } from '@tanstack/react-query';
import type { FactorySubjectsQuery } from '../../services/factoryApi';
import { queryKeys } from './queryKeys';

const SUBJECTS_QUERY_KEYS: (keyof FactorySubjectsQuery)[] = [
  'origin',
  'status',
  'projectId',
  'program',
  'semester',
  'priority',
  'search',
  'dueFrom',
  'dueTo',
  'sort',
  'page',
  'limit',
];

/** Normaliza filtros para queryKeys estables (sin undefined ni strings vacíos). */
export function normalizeFactorySubjectsQuery(query: FactorySubjectsQuery = {}): Record<string, string | number> {
  const normalized: Record<string, string | number> = {};
  for (const key of SUBJECTS_QUERY_KEYS) {
    const value = query[key];
    if (value !== undefined && value !== '') {
      normalized[key] = value;
    }
  }
  if (!normalized.page) normalized.page = 1;
  if (!normalized.limit) normalized.limit = 20;
  return normalized;
}

/** Marca cache de Fábrica como stale sin refetch agresivo. */
export function markFactoryQueriesStale(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.factory.all(), refetchType: 'none' });
}
