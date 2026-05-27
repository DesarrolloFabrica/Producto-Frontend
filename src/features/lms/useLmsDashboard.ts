import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import { lmsApi } from '../../services/lmsApi';
import { lmsStateLabel } from './lmsCopy';
import { invalidateLmsDashboard } from './lmsInvalidation';
import type { LmsDashboardFilter } from './lmsTypes';
import { filterLmsRows, mapPreview, mapWorkItem } from './lmsTypes';
import { queryKeys } from '../queries/queryKeys';

export function useLmsDashboard(filter: LmsDashboardFilter) {
  const queryClient = useQueryClient();

  const workQuery = useQuery({
    queryKey: queryKeys.institutionalWork.lms(),
    queryFn: () => institutionalWorkflowApi.lmsWork(),
    staleTime: 15_000,
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.lms.dashboardSummary(),
    queryFn: () => lmsApi.dashboardSummary(),
    staleTime: 15_000,
  });

  const allRows = useMemo(() => {
    const workRows = (workQuery.data ?? []).map((item) => {
      const row = mapWorkItem(item);
      row.stageLabel = lmsStateLabel(row.operationalState);
      return row;
    });
    const returnedRows = (summaryQuery.data?.returnedPreview ?? []).map((item) => {
      const row = mapPreview(item, 'returned');
      row.stageLabel = lmsStateLabel(row.operationalState);
      return row;
    });
    const completedRows = (summaryQuery.data?.completedPreview ?? []).map((item) => {
      const row = mapPreview(item, 'completed');
      row.stageLabel = lmsStateLabel(row.operationalState);
      return row;
    });
    const workIds = new Set(workRows.map((r) => r.subjectId));
    const dedupedReturned = returnedRows.filter((r) => !workIds.has(r.subjectId));
    const dedupedCompleted = completedRows.filter(
      (r) => !workIds.has(r.subjectId) && !dedupedReturned.some((d) => d.subjectId === r.subjectId),
    );
    return [...workRows, ...dedupedReturned, ...dedupedCompleted];
  }, [workQuery.data, summaryQuery.data]);

  const visibleRows = useMemo(() => filterLmsRows(allRows, filter), [allRows, filter]);

  const kpis = useMemo(() => {
    const summary = summaryQuery.data?.kpis;
    const work = workQuery.data ?? [];
    const countState = (state: string) => work.filter((w) => w.operationalState === state).length;
    return {
      pendingUpload: summary?.pendingUpload ?? countState('PENDING_LMS_UPLOAD'),
      inUpload: summary?.inUpload ?? countState('IN_LMS_UPLOAD'),
      completedUpload: summary?.completedUpload ?? 0,
      returnedByPlanning:
        summary?.returnedByPlanning ?? countState('RETURNED_TO_LMS_FROM_PLANNING'),
      inProgressProjects: summary?.inProgressProjects ?? 0,
      finalizedProjects: summary?.finalizedProjects ?? 0,
    };
  }, [workQuery.data, summaryQuery.data]);

  const pendingCount =
    (workQuery.data ?? []).filter((w) =>
      ['PENDING_LMS_UPLOAD', 'IN_LMS_UPLOAD', 'RETURNED_TO_LMS_FROM_PLANNING'].includes(
        w.operationalState,
      ),
    ).length ?? 0;

  const hasNoPending = pendingCount === 0;

  const isLoading = workQuery.isLoading || summaryQuery.isLoading;
  const error =
    workQuery.error || summaryQuery.error ? 'No se pudo cargar el panel de LMS' : null;

  const refetchAll = async () => {
    await invalidateLmsDashboard(queryClient);
  };

  return {
    visibleRows,
    kpis,
    recentActivity: summaryQuery.data?.recentActivity ?? [],
    hasNoPending,
    pendingCount,
    isLoading,
    error,
    refetchAll,
  };
}
