import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';

export async function invalidatePlanningDashboard(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.planning.dashboardSummary() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.planning.radicationWork() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.planning() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.planning.tracking() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.planning.trackingPrograms() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.planningPrograms() }),
  ]);
}
