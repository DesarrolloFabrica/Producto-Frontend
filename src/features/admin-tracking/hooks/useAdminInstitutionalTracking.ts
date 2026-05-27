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
  const workQuery = useQuery({
    queryKey: queryKeys.adminTracking.programs(),
    queryFn: () => institutionalWorkflowApi.planningWork(),
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
    if (!workQuery.data || !projectsQuery.data) return emptyData;
    return aggregateAdminInstitutionalTracking(workQuery.data, projectsQuery.data);
  }, [workQuery.data, projectsQuery.data]);

  const isLoading = workQuery.isLoading || projectsQuery.isLoading;
  const error =
    workQuery.error instanceof Error
      ? workQuery.error.message
      : projectsQuery.error instanceof Error
        ? projectsQuery.error.message
        : null;

  const refetch = async () => {
    await Promise.all([workQuery.refetch(), projectsQuery.refetch()]);
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    isFetching: workQuery.isFetching || projectsQuery.isFetching,
  };
}
