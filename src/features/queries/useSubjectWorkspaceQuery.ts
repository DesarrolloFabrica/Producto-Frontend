import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../../services/subjectsApi';
import type { ApiSubjectWorkspace } from '../../services/subjectsApi';
import type { ApiProjectListItem } from '../../services/types/projectsApi.types';
import { queryKeys } from './queryKeys';
import { projectDetailStaleTime, queryGcTime } from './queryClient';

function buildWorkspacePlaceholder(
  projects: ApiProjectListItem[] | undefined,
  subjectId: string | undefined,
): ApiSubjectWorkspace | undefined {
  if (!projects || !subjectId) return undefined;
  for (const project of projects) {
    const subjectSummary = project.subjectsSummary?.find((item) => item.id === subjectId);
    if (!subjectSummary) continue;
    const date = subjectSummary.updatedAt ?? project.createdAt;
    return {
      projectMeta: {
        id: project.id,
        school: project.school,
        program: project.program,
        modality: project.modality,
        requestType: project.requestType,
        priority: project.priority,
        status: project.status,
        progress: project.progress,
        expectedDeliveryDate: project.expectedDeliveryDate,
        productOwner: project.productOwner,
        factoryOwner: project.factoryOwner,
        createdAt: project.createdAt,
      },
      semesterMeta: {
        id: `placeholder-${subjectSummary.semesterNumber}`,
        semesterNumber: subjectSummary.semesterNumber,
        status: 'PENDING',
        createdFromChange: false,
        factoryExpectedDate: subjectSummary.expectedDeliveryDate ?? project.expectedDeliveryDate,
        continuationDate: null,
        createdAt: date,
        updatedAt: date,
      },
      subject: {
        id: subjectSummary.id,
        name: subjectSummary.name,
        expectedDeliveryDate: subjectSummary.expectedDeliveryDate,
        status: subjectSummary.status,
        operationalState: subjectSummary.operationalState,
        progress: subjectSummary.progress,
        openObservationsCount: subjectSummary.openObservationsCount,
        correctionSentCount: subjectSummary.correctionSentCount,
        createdFromChange: Boolean(subjectSummary.createdFromChange),
        topics: [],
        checklist: [],
        createdAt: date,
        updatedAt: date,
      },
      observations: [],
    };
  }
  return undefined;
}

export function useSubjectWorkspaceQuery(subjectId: string | undefined, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.subjectWorkspace(subjectId ?? ''),
    queryFn: () => subjectsApi.getSubjectWorkspace(subjectId!),
    enabled: Boolean(subjectId) && enabled,
    staleTime: projectDetailStaleTime,
    gcTime: queryGcTime,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: () =>
      buildWorkspacePlaceholder(
        queryClient.getQueryData<ApiProjectListItem[]>(queryKeys.projects()),
        subjectId,
      ),
  });

  return {
    ...query,
    hasCachedData: Boolean(subjectId && queryClient.getQueryData(queryKeys.subjectWorkspace(subjectId))),
    isInitialLoadingWithoutData: query.isLoading && !query.data,
    isBackgroundFetching: query.isFetching && Boolean(query.data),
  };
}
