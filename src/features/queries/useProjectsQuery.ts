import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../services/projectsApi';
import { queryKeys } from './queryKeys';
import { projectsListStaleTime, queryGcTime } from './queryClient';

export function useProjectsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => projectsApi.getProjects(),
    enabled,
    staleTime: projectsListStaleTime,
    gcTime: queryGcTime,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
