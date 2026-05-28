import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../../services/projectsApi';
import { projectRadicationApi } from '../../../services/projectRadicationApi';
import { queryKeys } from '../../queries/queryKeys';
import { queryGcTime } from '../../queries/queryClient';
import { useProjectOperationalProgramQuery } from '../../queries/useInstitutionalProgramsWorkQuery';
import { projectRadicationKeys } from '../../project-radication/ProjectRadicationPanel';

export function useAdminProjectDetail(projectId: string | undefined) {
  const programQuery = useProjectOperationalProgramQuery(projectId, Boolean(projectId));

  const projectQuery = useQuery({
    queryKey: queryKeys.adminTracking.projectDetail(projectId ?? ''),
    queryFn: () => projectsApi.getProjectById(projectId!),
    enabled: Boolean(projectId),
    staleTime: 15_000,
    gcTime: queryGcTime,
  });

  const radicationQuery = useQuery({
    queryKey: projectRadicationKeys.readiness(projectId ?? ''),
    queryFn: () => projectRadicationApi.getReadiness(projectId!),
    enabled: Boolean(projectId),
    staleTime: 15_000,
  });

  const isLoading = programQuery.isLoading || projectQuery.isLoading;
  const error =
    programQuery.error instanceof Error
      ? programQuery.error.message
      : projectQuery.error instanceof Error
        ? projectQuery.error.message
        : null;

  return {
    program: programQuery.data ?? null,
    project: projectQuery.data ?? null,
    radication: radicationQuery.data ?? null,
    isLoading,
    error,
    refetch: async () => {
      await Promise.all([programQuery.refetch(), projectQuery.refetch(), radicationQuery.refetch()]);
    },
    isFetching: programQuery.isFetching || projectQuery.isFetching,
  };
}
