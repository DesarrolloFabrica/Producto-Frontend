import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import type { InstitutionalOperationalAction } from '../../types/domain';
import { invalidateInstitutionalWorkflowQueries } from '../institutional-workflow/institutionalQueryUtils';

export function useInstitutionalWorkTransitionMutation() {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  return useMutation({
    mutationFn: (params: {
      subjectId: string;
      action: InstitutionalOperationalAction;
      comment?: string;
      returnReason?: string;
      evidenceUrl?: string;
    }) =>
      institutionalWorkflowApi.transition(params.subjectId, {
        action: params.action,
        comment: params.comment,
        returnReason: params.returnReason ?? params.comment,
        evidenceUrl: params.evidenceUrl,
      }),
    onSuccess: async (data, variables) => {
      await invalidateInstitutionalWorkflowQueries(queryClient, {
        subjectId: variables.subjectId,
        projectId: data.projectId,
        role,
      });
    },
  });
}
