import { useQuery } from '@tanstack/react-query';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import { queryKeys } from './queryKeys';

export function useOperationalWorkspaceQuery(subjectId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.operationalWorkspace(subjectId ?? ''),
    queryFn: () => institutionalWorkflowApi.getWorkspace(subjectId!),
    enabled: Boolean(subjectId) && enabled,
    staleTime: 15_000,
  });
}
