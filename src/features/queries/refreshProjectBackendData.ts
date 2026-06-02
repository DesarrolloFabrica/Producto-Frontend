import type { QueryClient } from '@tanstack/react-query';
import { projectRadicationKeys } from '../project-radication/ProjectRadicationPanel';
import { queryKeys } from './queryKeys';

type RefreshWorkflowContext = (options: {
  projectId?: string;
  subjectId?: string;
  scopes: 'detail' | 'projectObservations' | 'subjectObservations' | 'list' | 'notifications' | Array<
    'detail' | 'projectObservations' | 'subjectObservations' | 'list' | 'notifications'
  >;
}) => Promise<void>;

export async function refreshProjectBackendData(params: {
  queryClient: QueryClient;
  projectId: string;
  refreshWorkflowContext: RefreshWorkflowContext;
  semesterIds?: string[];
  subjectIds?: string[];
}): Promise<void> {
  const { queryClient, projectId, refreshWorkflowContext, semesterIds = [], subjectIds = [] } = params;

  await Promise.all([
    queryClient.resetQueries({ queryKey: queryKeys.project(projectId) }),
    queryClient.resetQueries({ queryKey: queryKeys.projectObservations(projectId) }),
    queryClient.resetQueries({ queryKey: queryKeys.institutionalWork.projectProgram(projectId) }),
    ...semesterIds.map((semesterId) =>
      queryClient.resetQueries({ queryKey: ['semester-operational-workspace', semesterId] }),
    ),
    ...subjectIds.map((subjectId) =>
      queryClient.resetQueries({ queryKey: queryKeys.operationalWorkspace(subjectId) }),
    ),
    queryClient.invalidateQueries({ queryKey: ['institutional-work'] }),
    queryClient.invalidateQueries({ queryKey: projectRadicationKeys.productWork() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.productTrackingPrograms() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects() }),
  ]);

  await refreshWorkflowContext({
    projectId,
    scopes: ['detail', 'projectObservations', 'list'],
  });

  await queryClient.invalidateQueries({ queryKey: projectRadicationKeys.readiness(projectId) });
}
