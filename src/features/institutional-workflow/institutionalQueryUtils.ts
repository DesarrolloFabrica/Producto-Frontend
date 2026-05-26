import type { QueryClient } from '@tanstack/react-query';
import type { Role } from '../../types/domain';
import { queryKeys } from '../queries/queryKeys';

export async function invalidateInstitutionalWorkflowQueries(
  queryClient: QueryClient,
  options: {
    subjectId?: string;
    projectId?: string;
    role?: Role | null;
  } = {},
) {
  const tasks: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: queryKeys.projects() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationsSummary() }),
    queryClient.invalidateQueries({ queryKey: ['institutional-work'] }),
  ];

  if (options.subjectId) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: queryKeys.subjectWorkspace(options.subjectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.operationalWorkspace(options.subjectId) }),
    );
  }

  if (options.projectId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.project(options.projectId) }));
  }

  if (options.role === 'PLANEACION' || options.role === 'ADMIN') {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.planning() }));
  }
  if (options.role === 'LMS') {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.lms() }));
  }
  if (options.role === 'PRODUCT') {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.product() }));
  }
  if (options.role === 'FABRICA') {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.factory() }));
  }

  await Promise.all(tasks);
}
