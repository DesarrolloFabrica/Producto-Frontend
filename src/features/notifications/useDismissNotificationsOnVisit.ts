import { useEffect } from 'react';
import { useOperations } from '../operations/OperationsContext';

export function useDismissNotificationsOnVisit(params: {
  projectId?: string;
  subjectId?: string;
}) {
  const { markNotificationsReadByResource, backendEnabled } = useOperations();

  useEffect(() => {
    if (!backendEnabled) return;
    if (!params.projectId && !params.subjectId) return;
    void markNotificationsReadByResource({
      projectId: params.projectId,
      subjectId: params.subjectId,
    });
  }, [backendEnabled, params.projectId, params.subjectId, markNotificationsReadByResource]);
}
