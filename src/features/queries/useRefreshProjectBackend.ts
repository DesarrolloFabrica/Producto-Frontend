import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOperations } from '../operations/OperationsContext';
import { refreshProjectBackendData } from './refreshProjectBackendData';

type RefreshProjectBackendOptions = {
  semesterIds?: string[];
  subjectIds?: string[];
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function useRefreshProjectBackend(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const { refreshWorkflowContext, backendEnabled } = useOperations();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(
    async (options?: RefreshProjectBackendOptions) => {
      if (!projectId) return false;
      if (!backendEnabled) {
        options?.onError?.('Backend deshabilitado.');
        return false;
      }

      setIsRefreshing(true);
      try {
        await refreshProjectBackendData({
          queryClient,
          projectId,
          refreshWorkflowContext,
          semesterIds: options?.semesterIds,
          subjectIds: options?.subjectIds,
        });
        options?.onSuccess?.();
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo actualizar desde el servidor';
        options?.onError?.(message);
        return false;
      } finally {
        setIsRefreshing(false);
      }
    },
    [backendEnabled, projectId, queryClient, refreshWorkflowContext],
  );

  return { refresh, isRefreshing, canRefresh: Boolean(projectId && backendEnabled) };
}
