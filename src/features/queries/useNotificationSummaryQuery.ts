import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../services/notificationsApi';
import { queryKeys } from './queryKeys';
import { notificationsSummaryStaleTime, queryGcTime } from './queryClient';

export function useNotificationSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificationsSummary(),
    queryFn: () => notificationsApi.getSummary(),
    enabled,
    staleTime: notificationsSummaryStaleTime,
    gcTime: queryGcTime,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
