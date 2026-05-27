import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InstitutionalOperationalAction } from '../../types/domain';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import { useAuth } from '../auth/AuthContext';
import { queryKeys } from './queryKeys';

export function useSemesterInstitutionalTransitionMutation(semesterId?: string) {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  return useMutation({
    mutationFn: (body: {
      action: InstitutionalOperationalAction;
      comment?: string;
      returnReason?: string;
      evidenceUrl?: string;
    }) => institutionalWorkflowApi.transitionSemester(semesterId!, body),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['semester-operational-workspace', semesterId] });
      void queryClient.invalidateQueries({ queryKey: ['institutional-work'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.factory.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.planning.dashboardSummary() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.planning() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.factory() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.lms.dashboardSummary() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.lms() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(data.projectId) });
      if (role) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.institutionalWork.forRole(role) });
      }
    },
  });
}
