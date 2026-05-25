import { useEffect, useRef } from 'react';
import { useOperations } from '../operations/OperationsContext';

export function useDismissNotificationsOnVisit(params: {
  projectId?: string;
  subjectId?: string;
  enabled?: boolean;
}) {
  const { markNotificationsReadByResource, backendEnabled } = useOperations();
  const lastMarkedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (params.enabled === false) return;
    if (!backendEnabled) return;
    if (!params.projectId && !params.subjectId) return;

    const key = `${params.projectId ?? ''}:${params.subjectId ?? ''}`;
    if (lastMarkedKeyRef.current === key) return;
    lastMarkedKeyRef.current = key;

    void markNotificationsReadByResource({
      projectId: params.projectId,
      subjectId: params.subjectId,
    });
  }, [
    backendEnabled,
    params.enabled,
    params.projectId,
    params.subjectId,
    markNotificationsReadByResource,
  ]);
}
