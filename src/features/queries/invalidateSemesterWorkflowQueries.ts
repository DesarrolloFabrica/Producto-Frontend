import type { QueryClient } from '@tanstack/react-query';
import type { Role } from '../../types/domain';
import { queryKeys } from './queryKeys';

export function invalidateSemesterWorkflowQueries(
  queryClient: QueryClient,
  params: { semesterId?: string; projectId?: string; subjectId?: string; role?: Role | null },
): void {
  const { semesterId, projectId, subjectId, role } = params;

  if (semesterId) {
    void queryClient.invalidateQueries({ queryKey: ['semester-operational-workspace', semesterId] });
  }
  if (subjectId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.operationalWorkspace(subjectId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.subjectWorkspace(subjectId) });
  }
  if (projectId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
  }

  void queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
  void queryClient.invalidateQueries({ queryKey: ['institutional-work'] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.factory.all() });
  void queryClient.invalidateQueries({ queryKey: ['factory', 'subjects', 'programs'] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.planning.dashboardSummary() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.planning() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.planning.tracking() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.planning.trackingPrograms() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.productPrograms() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.planningPrograms() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.factoryPrograms() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.factory() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.lms() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.lms.dashboardSummary() });
  if (role) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.forRole(role) });
  }
}
