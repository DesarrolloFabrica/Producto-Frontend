import { useCallback, useMemo } from 'react';
import { getApiErrorMessage } from '../operations/apiMappers';
import { useFactoryDashboardSummaryQuery } from '../queries/useFactoryDashboardSummaryQuery';
import { useFactoryProgramsQuery } from '../queries/useFactoryProgramsQuery';
import {
  countFactoryProgramsUpcoming,
  countFactoryProgramsWithNewSemesters,
  filterNewlyAddedFactoryPrograms,
  groupFactoryProgramsByTray,
  mapFactoryProgramsToTableItems,
} from '../factory-work/factoryProgramWork';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';

export function useFactoryDashboard(backendEnabled: boolean) {
  const summaryQuery = useFactoryDashboardSummaryQuery(backendEnabled);
  const programsQuery = useFactoryProgramsQuery({ page: 1, limit: 100 }, backendEnabled);

  const summary = summaryQuery.data ?? null;
  const allPrograms = programsQuery.data?.items ?? [];

  const trays = useMemo(
    () => groupFactoryProgramsByTray(allPrograms),
    [allPrograms],
  );

  const tablePrograms = useMemo(
    () => mapFactoryProgramsToTableItems(allPrograms),
    [allPrograms],
  );

  const newlyAddedPrograms = useMemo(
    () => filterNewlyAddedFactoryPrograms(allPrograms),
    [allPrograms],
  );

  const programCounts = useMemo(
    () => ({
      total: allPrograms.length,
      corrections: trays.CHANGES_REQUESTED.length,
      inProduction: trays.IN_PRODUCTION.length,
      notStarted: trays.NOT_STARTED.length,
      upcoming: countFactoryProgramsUpcoming(allPrograms),
      newlyAdded: countFactoryProgramsWithNewSemesters(allPrograms),
      inReview: trays.IN_REVIEW.length,
      completed: trays.APPROVED.length,
      correctionSent: trays.CORRECTION_SENT.length,
    }),
    [allPrograms, trays],
  );

  const isLoading = summaryQuery.isLoading && !summaryQuery.data;
  const isBackgroundRefreshing =
    (summaryQuery.isFetching && Boolean(summaryQuery.data)) ||
    programsQuery.isBackgroundFetching;

  const error = useMemo(() => {
    const err = summaryQuery.error ?? programsQuery.error;
    return err ? getApiErrorMessage(err) : null;
  }, [summaryQuery.error, programsQuery.error]);

  const loadSummary = useCallback(async () => {
    await Promise.all([summaryQuery.refetch(), programsQuery.refetch()]);
  }, [summaryQuery, programsQuery]);

  return {
    summary,
    allPrograms: tablePrograms,
    trays,
    programCounts,
    newlyAddedPrograms,
    isLoading,
    isBackgroundRefreshing,
    error,
    loadSummary,
  };
}

export type FactoryProgramTrayItems = Record<string, ProgramOperationalWorkItemDto[]>;
