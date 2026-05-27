import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InstitutionalOperationalAction } from '../../types/domain';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import { useAuth } from '../auth/AuthContext';
import { invalidateSemesterWorkflowQueries } from './invalidateSemesterWorkflowQueries';
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
      invalidateSemesterWorkflowQueries(queryClient, {
        semesterId,
        projectId: data.projectId,
        role,
      });
      for (const subject of data.subjects ?? []) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.operationalWorkspace(subject.subjectId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.subjectWorkspace(subject.subjectId) });
      }
    },
  });
}
