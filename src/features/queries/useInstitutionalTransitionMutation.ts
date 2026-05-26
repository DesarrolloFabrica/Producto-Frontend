import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import type { InstitutionalOperationalAction } from '../../types/domain';
import { invalidateInstitutionalWorkflowQueries } from '../institutional-workflow/institutionalQueryUtils';
import { queryKeys } from './queryKeys';

export function useInstitutionalTransitionMutation(subjectId: string | undefined) {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  return useMutation({
    mutationFn: (body: {
      action: InstitutionalOperationalAction;
      comment?: string;
      returnReason?: string;
      evidenceUrl?: string;
    }) => institutionalWorkflowApi.transition(subjectId!, body),
    onSuccess: async (data) => {
      if (subjectId) {
        queryClient.setQueryData(queryKeys.operationalWorkspace(subjectId), data);
      }
      await invalidateInstitutionalWorkflowQueries(queryClient, {
        subjectId,
        projectId: data.projectId,
        role,
      });
      if (subjectId) {
        await queryClient.refetchQueries({ queryKey: queryKeys.operationalWorkspace(subjectId) });
        await queryClient.refetchQueries({ queryKey: queryKeys.subjectWorkspace(subjectId) });
      }
    },
  });
}
