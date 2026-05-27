import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import { lmsApi } from '../../services/lmsApi';
import { invalidateLmsDashboard } from './lmsInvalidation';
import type { LmsDashboardFilter } from './lmsTypes';
import {
  applyLmsInboxAdvancedFilters,
  countLmsProgramsWithState,
  filterLmsRows,
  mapCompletedPrograms,
  mapLmsProgramWorkItem,
} from './lmsTypes';
import { queryKeys } from '../queries/queryKeys';
import type { InboxAdvancedFilters } from '../operations-v2/operationalInboxFilters';

export function useLmsDashboard(filter: LmsDashboardFilter, advanced: InboxAdvancedFilters) {
  const queryClient = useQueryClient();

  const workProgramsQuery = useQuery({
    queryKey: queryKeys.institutionalWork.lmsPrograms(),
    queryFn: () => institutionalWorkflowApi.lmsWorkPrograms(),
    staleTime: 15_000,
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.lms.dashboardSummary(),
    queryFn: () => lmsApi.dashboardSummary(),
    staleTime: 15_000,
  });

  const allRows = useMemo(() => {
    const workRows = (workProgramsQuery.data ?? []).map(mapLmsProgramWorkItem);
    const completedRows = mapCompletedPrograms(summaryQuery.data?.completedPreview ?? []);
    const workProjectIds = new Set(workRows.map((row) => row.projectId));
    const dedupedCompleted = completedRows.filter((row) => !workProjectIds.has(row.projectId));
    return [...workRows, ...dedupedCompleted];
  }, [workProgramsQuery.data, summaryQuery.data]);

  const categoryRows = useMemo(() => filterLmsRows(allRows, filter), [allRows, filter]);
  const visibleRows = useMemo(
    () => applyLmsInboxAdvancedFilters(categoryRows, advanced),
    [categoryRows, advanced],
  );

  const kpis = useMemo(() => {
    const summary = summaryQuery.data?.kpis;
    const programs = workProgramsQuery.data ?? [];
    return {
      pendingUpload:
        summary?.pendingUpload ?? countLmsProgramsWithState(programs, 'PENDING_LMS_UPLOAD'),
      inUpload: summary?.inUpload ?? countLmsProgramsWithState(programs, 'IN_LMS_UPLOAD'),
      completedUpload: summary?.completedUpload ?? 0,
      returnedByPlanning:
        summary?.returnedByPlanning ??
        countLmsProgramsWithState(programs, 'RETURNED_TO_LMS_FROM_PLANNING'),
      inProgressProjects: summary?.inProgressProjects ?? 0,
      finalizedProjects: summary?.finalizedProjects ?? 0,
    };
  }, [workProgramsQuery.data, summaryQuery.data]);

  const pendingCount = workProgramsQuery.data?.length ?? 0;
  const hasNoPending = pendingCount === 0;

  const isLoading = workProgramsQuery.isLoading || summaryQuery.isLoading;
  const error =
    workProgramsQuery.error || summaryQuery.error ? 'No se pudo cargar el panel de LMS' : null;

  const refetchAll = async () => {
    await invalidateLmsDashboard(queryClient);
  };

  return {
    visibleRows,
    categoryRows,
    allRows,
    kpis,
    recentActivity: summaryQuery.data?.recentActivity ?? [],
    hasNoPending,
    pendingCount,
    isLoading,
    error,
    refetchAll,
  };
}
