import { useQuery } from '@tanstack/react-query';
import { projectRadicationApi } from '../../services/projectRadicationApi';
import { projectRadicationKeys } from '../project-radication/ProjectRadicationPanel';

const RADICATION_READINESS_STALE_MS = 30_000;

export function useProjectRadicationReadiness(projectId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: projectRadicationKeys.readiness(projectId ?? ''),
    queryFn: () => projectRadicationApi.getReadiness(projectId!),
    enabled: Boolean(projectId) && enabled,
    staleTime: RADICATION_READINESS_STALE_MS,
    retry: 1,
  });
}
