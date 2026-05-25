import { useQuery } from '@tanstack/react-query';
import { factoryApi } from '../../services/factoryApi';
import { mapFactorySummaryFromApi } from '../operations/factoryMappers';
import { factoryQueryDefaults } from './queryClient';
import { queryKeys } from './queryKeys';

export function useFactoryDashboardSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.factory.summary(),
    queryFn: async () => mapFactorySummaryFromApi(await factoryApi.getDashboardSummary()),
    enabled,
    ...factoryQueryDefaults,
  });
}
