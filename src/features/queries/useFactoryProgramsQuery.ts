import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { factoryApi, type ApiFactoryProgramWorkItem, type FactorySubjectsQuery } from '../../services/factoryApi';
import { factoryQueryDefaults } from './queryClient';
import { queryKeys } from './queryKeys';

export type FactoryProgramWorkItem = ApiFactoryProgramWorkItem;

export interface FactoryProgramsPageData {
  items: FactoryProgramWorkItem[];
  total: number;
  page: number;
  limit: number;
}

export function useFactoryProgramsQuery(query: FactorySubjectsQuery, enabled = true) {
  const queryKey = useMemo(() => queryKeys.factory.subjectsPrograms(query), [query]);

  const result = useQuery({
    queryKey,
    queryFn: async () => {
      const page = await factoryApi.getPrograms(query);
      return {
        items: page.items,
        total: page.total,
        page: page.page,
        limit: page.limit,
      } satisfies FactoryProgramsPageData;
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
