import { useQuery } from '@tanstack/react-query';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';

export function useSemesterOperationalWorkspaceQuery(semesterId?: string) {
  return useQuery({
    queryKey: ['semester-operational-workspace', semesterId],
    queryFn: () => institutionalWorkflowApi.getSemesterWorkspace(semesterId!),
    enabled: Boolean(semesterId),
  });
}
