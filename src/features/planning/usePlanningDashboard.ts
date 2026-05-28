import { useMemo } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';

import { planningApi } from '../../services/planningApi';

import { projectRadicationApi } from '../../services/projectRadicationApi';

import { usePlanningTrackingProgramsQuery } from '../queries/useInstitutionalProgramsWorkQuery';

import { queryKeys } from '../queries/queryKeys';

import { invalidatePlanningDashboard } from './planningInvalidation';

import type { PlanningDashboardFilter } from './planningTypes';

import {

  applyPlanningInboxAdvancedFilters,

  countPlanningProgramsWithState,

  filterPlanningRows,

  mapFinalizedProject,

  mapProgramTrackingWorkItem,

  mapProgramWorkItem,

  mapReturnedPrograms,

} from './planningTypes';

import type { InboxAdvancedFilters } from '../operations-v2/operationalInboxFilters';



export function usePlanningDashboard(filter: PlanningDashboardFilter, advanced: InboxAdvancedFilters) {

  const queryClient = useQueryClient();



  const workProgramsQuery = useQuery({

    queryKey: queryKeys.institutionalWork.planningPrograms(),

    queryFn: () => institutionalWorkflowApi.planningWorkPrograms(),

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



  const trackingProgramsQuery = usePlanningTrackingProgramsQuery();



  const allRows = useMemo(() => {

    const pendingProgramRows = (workProgramsQuery.data ?? []).map((item) =>

      mapProgramWorkItem(item, 'pending'),

    );

    const radicationByProject = new Map(
      (radicationQuery.data ?? []).map((item) => [item.projectId, item] as const),
    );

    const returnedRows = mapReturnedPrograms(summaryQuery.data?.returnedPreview ?? []);

    const finalizedRows = (summaryQuery.data?.finalizedProjects ?? []).map(mapFinalizedProject);

    const trackingRows = (trackingProgramsQuery.data ?? [])
      .map((item) =>
        mapProgramTrackingWorkItem(item, {
          radicationReview: radicationByProject.has(item.projectId),
        }),
      )
      .filter((row) => !pendingProgramRows.some((pending) => pending.projectId === row.projectId));



    const pendingProjectIds = new Set(pendingProgramRows.map((row) => row.projectId));

    const dedupedReturned = returnedRows.filter((row) => !pendingProjectIds.has(row.projectId));



    return [...pendingProgramRows, ...dedupedReturned, ...trackingRows, ...finalizedRows];

  }, [workProgramsQuery.data, radicationQuery.data, summaryQuery.data, trackingProgramsQuery.data]);



  const categoryRows = useMemo(() => filterPlanningRows(allRows, filter), [allRows, filter]);

  const visibleRows = useMemo(

    () => applyPlanningInboxAdvancedFilters(categoryRows, advanced),

    [categoryRows, advanced],

  );



  const kpis = useMemo(() => {

    const summary = summaryQuery.data?.kpis;

    const programs = workProgramsQuery.data ?? [];

    return {

      initialValidations:

        summary?.initialValidations ??

        countPlanningProgramsWithState(programs, 'PENDING_PLANNING_INITIAL_VALIDATION'),

      productionValidations:

        summary?.productionValidations ??

        countPlanningProgramsWithState(programs, 'PENDING_PLANNING_PRODUCTION_VALIDATION'),

      lmsValidations:

        summary?.lmsValidations ??

        countPlanningProgramsWithState(programs, 'PENDING_PLANNING_LMS_VALIDATION'),

      radicationsPending: summary?.radicationsPending ?? (radicationQuery.data?.length ?? 0),

      inProgress: summary?.inProgress ?? 0,

      finalized: summary?.finalized ?? 0,

    };

  }, [workProgramsQuery.data, radicationQuery.data, summaryQuery.data]);



  const pendingProgramCount = workProgramsQuery.data?.length ?? 0;

  const pendingRadicationCount = radicationQuery.data?.length ?? 0;

  const pendingTrackingCount = trackingProgramsQuery.data?.length ?? 0;

  const hasNoPending =

    pendingProgramCount === 0 &&

    pendingRadicationCount === 0 &&

    pendingTrackingCount === 0 &&

    (summaryQuery.data?.returnedPreview?.length ?? 0) === 0;



  const isLoading =

    workProgramsQuery.isLoading ||

    radicationQuery.isLoading ||

    summaryQuery.isLoading ||

    trackingProgramsQuery.isLoading;

  const error =

    workProgramsQuery.error ||

    radicationQuery.error ||

    summaryQuery.error ||

    trackingProgramsQuery.error

      ? 'No se pudo cargar el panel de Planeación'

      : null;



  const refetchAll = async () => {

    await invalidatePlanningDashboard(queryClient);

  };



  return {

    workProgramsQuery,

    radicationQuery,

    summaryQuery,

    visibleRows,

    categoryRows,

    allRows,

    kpis,

    recentActivity: summaryQuery.data?.recentActivity ?? [],

    returnedPreview: summaryQuery.data?.returnedPreview ?? [],

    finalizedProjects: summaryQuery.data?.finalizedProjects ?? [],

    hasNoPending,

    pendingProgramCount,

    pendingRadicationCount,

    isLoading,

    error,

    refetchAll,

  };

}

