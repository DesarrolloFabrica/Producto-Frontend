import { useCallback, useMemo } from 'react';
import { getApiErrorMessage } from '../operations/apiMappers';
import type { SubjectWorkItem } from '../operations/subjectOperationalState';
import { useFactoryDashboardSummaryQuery } from '../queries/useFactoryDashboardSummaryQuery';
import { useFactorySubjectsQuery } from '../queries/useFactorySubjectsQuery';

export interface NewlyAddedPreview {
  items: SubjectWorkItem[];
  total: number;
}

export interface CorrectionSentPreview {
  items: SubjectWorkItem[];
  total: number;
}

export function useFactoryDashboard(backendEnabled: boolean) {
  const summaryQuery = useFactoryDashboardSummaryQuery(backendEnabled);
  const newlyAddedQuery = useFactorySubjectsQuery({ origin: 'new', page: 1, limit: 5 }, backendEnabled);
  const correctionSentQuery = useFactorySubjectsQuery(
    { status: 'CORRECTION_SENT', page: 1, limit: 5 },
    backendEnabled,
  );

  const summary = summaryQuery.data ?? null;

  const newlyAddedPreview = useMemo<NewlyAddedPreview>(
    () => ({
      items: newlyAddedQuery.data?.items ?? [],
      total: newlyAddedQuery.data?.total ?? 0,
    }),
    [newlyAddedQuery.data],
  );

  const correctionSentPreview = useMemo<CorrectionSentPreview>(
    () => ({
      items: correctionSentQuery.data?.items ?? [],
      total: correctionSentQuery.data?.total ?? 0,
    }),
    [correctionSentQuery.data],
  );

  const isLoading = summaryQuery.isLoading && !summaryQuery.data;
  const isBackgroundRefreshing =
    (summaryQuery.isFetching && Boolean(summaryQuery.data)) ||
    newlyAddedQuery.isBackgroundFetching ||
    correctionSentQuery.isBackgroundFetching;

  const error = useMemo(() => {
    const err = summaryQuery.error ?? newlyAddedQuery.error ?? correctionSentQuery.error;
    return err ? getApiErrorMessage(err) : null;
  }, [summaryQuery.error, newlyAddedQuery.error, correctionSentQuery.error]);

  const loadSummary = useCallback(async () => {
    await Promise.all([summaryQuery.refetch(), newlyAddedQuery.refetch(), correctionSentQuery.refetch()]);
  }, [summaryQuery, newlyAddedQuery, correctionSentQuery]);

  return {
    summary,
    newlyAddedPreview,
    correctionSentPreview,
    isLoading,
    isBackgroundRefreshing,
    error,
    loadSummary,
  };
}
