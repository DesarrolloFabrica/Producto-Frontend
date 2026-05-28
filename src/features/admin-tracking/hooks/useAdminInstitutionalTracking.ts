import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { institutionalWorkflowApi } from '../../../services/institutionalWorkflowApi';
import { projectsApi } from '../../../services/projectsApi';
import { queryKeys } from '../../queries/queryKeys';
import { projectsListStaleTime, queryGcTime } from '../../queries/queryClient';
import { aggregateAdminInstitutionalTracking } from '../aggregateAdminTracking';
import type { AdminInstitutionalTrackingData } from '../adminTrackingTypes';

const emptyData: AdminInstitutionalTrackingData = {
  rows: [],
  kpis: { active: 0, overdue: 0, returned: 0, finalized: 0 },
};

export function useAdminInstitutionalTracking(enabled = true) {
  const trackingQuery = useQuery({
    queryKey: queryKeys.adminTracking.programs(),
    queryFn: () => institutionalWorkflowApi.planningTrackingPrograms(),
    enabled,
    staleTime: 15_000,
    gcTime: queryGcTime,
  });

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => projectsApi.getProjects(),
    enabled,
    staleTime: projectsListStaleTime,
    gcTime: queryGcTime,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const data = useMemo(() => {
    if (!trackingQuery.data || !projectsQuery.data) return emptyData;
    return aggregateAdminInstitutionalTracking(trackingQuery.data, projectsQuery.data);
  }, [trackingQuery.data, projectsQuery.data]);

  const isLoading = trackingQuery.isLoading || projectsQuery.isLoading;
  const error =
    trackingQuery.error instanceof Error
      ? trackingQuery.error.message
      : projectsQuery.error instanceof Error
        ? projectsQuery.error.message
        : null;

  const refetch = async () => {
    await Promise.all([trackingQuery.refetch(), projectsQuery.refetch()]);
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    isFetching: trackingQuery.isFetching || projectsQuery.isFetching,
  };
}
