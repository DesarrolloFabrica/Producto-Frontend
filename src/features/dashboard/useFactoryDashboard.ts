import { useCallback, useEffect, useState } from 'react';
import { factoryApi, type FactorySubjectsQuery } from '../../services/factoryApi';
import {
  mapFactorySummaryFromApi,
  mapFactoryWorkItemFromApi,
} from '../operations/factoryMappers';
import type { SubjectWorkItem } from '../operations/subjectOperationalState';
import { getApiErrorMessage } from '../operations/apiMappers';

export function useFactoryDashboard(backendEnabled: boolean) {
  const [summary, setSummary] = useState<ReturnType<typeof mapFactorySummaryFromApi> | null>(null);
  const [remoteItems, setRemoteItems] = useState<SubjectWorkItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!backendEnabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const apiSummary = await factoryApi.getDashboardSummary();
      setSummary(mapFactorySummaryFromApi(apiSummary));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [backendEnabled]);

  const loadSubjects = useCallback(
    async (query?: FactorySubjectsQuery) => {
      if (!backendEnabled) return;
      setIsLoading(true);
      setError(null);
      try {
        const page = await factoryApi.getSubjects(query);
        setRemoteItems(page.items.map(mapFactoryWorkItemFromApi));
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [backendEnabled],
  );

  useEffect(() => {
    if (backendEnabled) {
      void loadSummary();
    }
  }, [backendEnabled, loadSummary]);

  return {
    summary,
    remoteItems,
    isLoading,
    error,
    loadSummary,
    loadSubjects,
  };
}
