import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { factoryApi } from '../../services/factoryApi';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import { lmsApi } from '../../services/lmsApi';
import { notificationsApi } from '../../services/notificationsApi';
import { planningApi } from '../../services/planningApi';
import { projectsApi } from '../../services/projectsApi';
import type { Role } from '../../types/domain';
import { mapFactorySummaryFromApi, mapFactoryWorkItemFromApi } from '../operations/factoryMappers';
import {
  factoryQueryDefaults,
  notificationsSummaryStaleTime,
  projectsListStaleTime,
  queryGcTime,
} from '../queries/queryClient';
import { queryKeys } from '../queries/queryKeys';

export const BOOT_MIN_DURATION_MS = 1400;
export const BOOT_MAX_DURATION_MS = 5000;
export const BOOT_EXIT_DURATION_MS = 500;

type BootPrefetchTask = {
  queryKey: QueryKey;
  queryFn: () => Promise<unknown>;
  staleTime?: number;
  gcTime?: number;
};

function notificationSummaryTask(): BootPrefetchTask {
  return {
    queryKey: queryKeys.notificationsSummary(),
    queryFn: () => notificationsApi.getSummary(),
    staleTime: notificationsSummaryStaleTime,
    gcTime: queryGcTime,
  };
}

export function getBootPrefetchTasks(role: Role | null): BootPrefetchTask[] {
  const shared = [notificationSummaryTask()];

  switch (role) {
    case 'PRODUCT':
      return [
        ...shared,
        {
          queryKey: queryKeys.projects(),
          queryFn: () => projectsApi.getProjects(),
          staleTime: projectsListStaleTime,
          gcTime: queryGcTime,
        },
        {
          queryKey: queryKeys.institutionalWork.productTrackingPrograms(),
          queryFn: () => institutionalWorkflowApi.productTrackingPrograms(),
          staleTime: 15_000,
        },
      ];
    case 'ADMIN':
      return [
        ...shared,
        {
          queryKey: queryKeys.adminTracking.programs(),
          queryFn: () => institutionalWorkflowApi.planningTrackingPrograms(),
          staleTime: 15_000,
          gcTime: queryGcTime,
        },
        {
          queryKey: queryKeys.projects(),
          queryFn: () => projectsApi.getProjects(),
          staleTime: projectsListStaleTime,
          gcTime: queryGcTime,
        },
      ];
    case 'FABRICA':
      return [
        ...shared,
        {
          queryKey: queryKeys.factory.summary(),
          queryFn: async () => mapFactorySummaryFromApi(await factoryApi.getDashboardSummary()),
          ...factoryQueryDefaults,
        },
        {
          queryKey: queryKeys.factory.subjectsByOrigin('all', 1, 20),
          queryFn: async () => {
            const page = await factoryApi.getSubjects({ origin: 'all', page: 1, limit: 20 });
            return {
              items: page.items.map(mapFactoryWorkItemFromApi),
              total: page.total,
              page: page.page,
              limit: page.limit,
            };
          },
          ...factoryQueryDefaults,
        },
      ];
    case 'PLANEACION':
      return [
        ...shared,
        {
          queryKey: queryKeys.planning.dashboardSummary(),
          queryFn: () => planningApi.dashboardSummary(),
          staleTime: 15_000,
        },
        {
          queryKey: queryKeys.institutionalWork.planningPrograms(),
          queryFn: () => institutionalWorkflowApi.planningWorkPrograms(),
          staleTime: 15_000,
        },
      ];
    case 'LMS':
      return [
        ...shared,
        {
          queryKey: queryKeys.lms.dashboardSummary(),
          queryFn: () => lmsApi.dashboardSummary(),
          staleTime: 15_000,
        },
        {
          queryKey: queryKeys.institutionalWork.lmsPrograms(),
          queryFn: () => institutionalWorkflowApi.lmsWorkPrograms(),
          staleTime: 15_000,
        },
      ];
    default:
      return shared;
  }
}

export function getBootQueryKeys(role: Role | null): QueryKey[] {
  return getBootPrefetchTasks(role).map((task) => task.queryKey);
}

export async function prefetchBootQueries(
  queryClient: QueryClient,
  role: Role | null,
): Promise<void> {
  const tasks = getBootPrefetchTasks(role);
  await Promise.allSettled(
    tasks.map((task) =>
      queryClient.fetchQuery({
        queryKey: task.queryKey,
        queryFn: task.queryFn,
        staleTime: task.staleTime,
        gcTime: task.gcTime,
      }),
    ),
  );
}

export function areBootQueriesSettled(
  queryClient: QueryClient,
  role: Role | null,
): boolean {
  return getBootQueryKeys(role).every((queryKey) => {
    const state = queryClient.getQueryState(queryKey);
    return state?.status === 'success' || state?.status === 'error';
  });
}
