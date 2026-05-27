import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';

export async function invalidateLmsDashboard(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.lms.dashboardSummary() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.lms() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.planning() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationsSummary() }),
  ]);
}
