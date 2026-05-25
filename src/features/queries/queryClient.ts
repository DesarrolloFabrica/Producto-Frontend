import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const projectsListStaleTime = 5 * 60_000;
export const projectDetailStaleTime = 5 * 60_000;
export const notificationsSummaryStaleTime = 60_000;
export const factoryDashboardStaleTime = 5 * 60_000;
export const queryGcTime = 30 * 60_000;

export const factoryQueryDefaults = {
  staleTime: factoryDashboardStaleTime,
  gcTime: queryGcTime,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;
