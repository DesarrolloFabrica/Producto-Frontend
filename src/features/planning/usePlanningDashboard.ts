import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import { planningApi } from '../../services/planningApi';
import { projectRadicationApi } from '../../services/projectRadicationApi';
import { institutionalStateLabel } from '../institutional-workflow/institutionalCopy';
import { queryKeys } from '../queries/queryKeys';
import { invalidatePlanningDashboard } from './planningInvalidation';
import type { PlanningDashboardFilter } from './planningTypes';
import {
  filterPlanningRows,
  mapFinalizedProject,
  mapRadicationWorkItem,
  mapReturnedPreview,
  mapSubjectWorkItem,
} from './planningTypes';

export function usePlanningDashboard(filter: PlanningDashboardFilter) {
  const queryClient = useQueryClient();

  const workQuery = useQuery({
    queryKey: queryKeys.institutionalWork.planning(),
    queryFn: () => institutionalWorkflowApi.planningWork(),
    staleTime: 15_000,
  });

  const radicationQuery = useQuery({
    queryKey: queryKeys.planning.radicationWork(),
    queryFn: () => projectRadicationApi.planningWork(),
    staleTime: 15_000,
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.planning.dashboardSummary(),
    queryFn: () => planningApi.dashboardSummary(),
    staleTime: 15_000,
  });

  const allRows = useMemo(() => {
    const subjectRows = (workQuery.data ?? []).map((item) => {
      const row = mapSubjectWorkItem(item);
      if (row.kind === 'subject') {
        row.stageLabel = institutionalStateLabel(row.operationalState);
      }
      return row;
    });
    const radicationRows = (radicationQuery.data ?? []).map(mapRadicationWorkItem);
    const returnedRows = (summaryQuery.data?.returnedPreview ?? []).map((item) => {
      const row = mapReturnedPreview(item);
      if (row.kind === 'returned') {
        row.stageLabel = institutionalStateLabel(row.operationalState);
      }
      return row;
    });
    const finalizedRows = (summaryQuery.data?.finalizedProjects ?? []).map(mapFinalizedProject);
    return [...subjectRows, ...radicationRows, ...returnedRows, ...finalizedRows];
  }, [workQuery.data, radicationQuery.data, summaryQuery.data]);

  const visibleRows = useMemo(() => filterPlanningRows(allRows, filter), [allRows, filter]);

  const kpis = useMemo(() => {
    const summary = summaryQuery.data?.kpis;
    const work = workQuery.data ?? [];
    const countState = (state: string) =>
      work.filter((w) => w.operationalState === state).length;
    return {
      initialValidations:
        summary?.initialValidations ?? countState('PENDING_PLANNING_INITIAL_VALIDATION'),
      productionValidations:
        summary?.productionValidations ?? countState('PENDING_PLANNING_PRODUCTION_VALIDATION'),
      lmsValidations: summary?.lmsValidations ?? countState('PENDING_PLANNING_LMS_VALIDATION'),
      radicationsPending: summary?.radicationsPending ?? (radicationQuery.data?.length ?? 0),
      inProgress: summary?.inProgress ?? 0,
      finalized: summary?.finalized ?? 0,
    };
  }, [workQuery.data, radicationQuery.data, summaryQuery.data]);

  const pendingSubjectCount = workQuery.data?.length ?? 0;
  const pendingRadicationCount = radicationQuery.data?.length ?? 0;
  const hasNoPending = pendingSubjectCount === 0 && pendingRadicationCount === 0;

  const isLoading = workQuery.isLoading || radicationQuery.isLoading || summaryQuery.isLoading;
  const error =
    workQuery.error || radicationQuery.error || summaryQuery.error
      ? 'No se pudo cargar el panel de Planeación'
      : null;

  const refetchAll = async () => {
    await invalidatePlanningDashboard(queryClient);
  };

  return {
    workQuery,
    radicationQuery,
    summaryQuery,
    visibleRows,
    allRows,
    kpis,
    recentActivity: summaryQuery.data?.recentActivity ?? [],
    returnedPreview: summaryQuery.data?.returnedPreview ?? [],
    finalizedProjects: summaryQuery.data?.finalizedProjects ?? [],
    hasNoPending,
    pendingSubjectCount,
    pendingRadicationCount,
    isLoading,
    error,
    refetchAll,
  };
}
