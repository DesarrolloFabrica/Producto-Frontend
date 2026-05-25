import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { factoryApi, type FactorySubjectsQuery } from '../../services/factoryApi';
import { mapFactoryWorkItemFromApi } from '../operations/factoryMappers';
import type { SubjectWorkItem } from '../operations/subjectOperationalState';
import { factoryQueryDefaults } from './queryClient';
import { queryKeys } from './queryKeys';

export interface FactorySubjectsPageData {
  items: SubjectWorkItem[];
  total: number;
  page: number;
  limit: number;
}

function hasExtraSubjectFilters(query: FactorySubjectsQuery): boolean {
  return Object.entries(query).some(([key, value]) => {
    if (key === 'page' || key === 'limit' || key === 'status' || key === 'origin') return false;
    return value !== undefined && value !== '';
  });
}

function resolveSubjectsQueryKey(query: FactorySubjectsQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const { status, origin } = query;

  if (!hasExtraSubjectFilters(query) && status && !origin) {
    return queryKeys.factory.subjectsByStatus(status, page, limit);
  }
  if (!hasExtraSubjectFilters(query) && origin && !status) {
    return queryKeys.factory.subjectsByOrigin(origin, page, limit);
  }
  return queryKeys.factory.subjectsList(query);
}

export function useFactorySubjectsQuery(query: FactorySubjectsQuery, enabled = true) {
  const queryKey = useMemo(() => resolveSubjectsQueryKey(query), [query]);

  const result = useQuery({
    queryKey,
    queryFn: async () => {
      const page = await factoryApi.getSubjects(query);
      return {
        items: page.items.map(mapFactoryWorkItemFromApi),
        total: page.total,
        page: page.page,
        limit: page.limit,
      } satisfies FactorySubjectsPageData;
    },
    enabled,
    ...factoryQueryDefaults,
    placeholderData: keepPreviousData,
  });

  return {
    ...result,
    isInitialLoadingWithoutData: result.isLoading && !result.data,
    isBackgroundFetching: result.isFetching && Boolean(result.data),
  };
}
