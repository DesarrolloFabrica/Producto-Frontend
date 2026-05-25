import { useEffect, useMemo, useState } from 'react';
import type { SubjectVirtualization, VirtualizationProject } from '../../types/domain';
import { useAuth } from '../auth/AuthContext';
import { useOperations } from './OperationsContext';

export function useEnsureSubjectDetail(subjectId: string | undefined): {
  project: VirtualizationProject | undefined;
  subject: SubjectVirtualization | undefined;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
} {
  const { isLoading: authLoading } = useAuth();
  const {
    projects,
    backendEnabled,
    loadSubjectWorkspace,
    isLoadingProjectDetail,
    isLoadingSubjectObservations,
    selectedProjectError,
  } = useOperations();
  const [subjectDetailError, setSubjectDetailError] = useState<string | null>(null);
  const [subjectDetailLoading, setSubjectDetailLoading] = useState(false);

  const match = useMemo(() => {
    for (const project of projects) {
      const subject = project.subjects.find((item) => item.id === subjectId);
      if (subject) return { project, subject };
    }
    return { project: undefined, subject: undefined };
  }, [projects, subjectId]);

  useEffect(() => {
    if (!subjectId || !backendEnabled || authLoading || match.subject) return;

    let cancelled = false;
    setSubjectDetailLoading(true);
    setSubjectDetailError(null);

    void (async () => {
      try {
        await loadSubjectWorkspace(subjectId);
      } catch (error) {
        if (!cancelled) {
          setSubjectDetailError(error instanceof Error ? error.message : 'No se pudo cargar el detalle de la asignatura.');
        }
      } finally {
        if (!cancelled) setSubjectDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [subjectId, backendEnabled, authLoading, match.subject, loadSubjectWorkspace]);

  if (!subjectId) {
    return { project: undefined, subject: undefined, isLoading: false, error: null, notFound: true };
  }

  if (!backendEnabled) {
    return {
      project: match.project,
      subject: match.subject,
      isLoading: false,
      error: null,
      notFound: !match.subject,
    };
  }

  const error = subjectDetailError ?? selectedProjectError;
  const isResolving = Boolean(
    !authLoading &&
    !match.subject &&
    !error &&
    (subjectDetailLoading || isLoadingProjectDetail || isLoadingSubjectObservations),
  );

  const notFound = Boolean(
    !authLoading &&
    !isResolving &&
    !match.subject &&
    Boolean(error),
  );

  return {
    project: match.project,
    subject: match.subject,
    isLoading: authLoading || isResolving,
    error,
    notFound,
  };
}
