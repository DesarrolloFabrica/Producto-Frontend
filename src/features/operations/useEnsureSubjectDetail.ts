import { useEffect, useMemo } from 'react';
import type { SubjectVirtualization, VirtualizationProject } from '../../types/domain';
import { useOperations } from './OperationsContext';

export function useEnsureSubjectDetail(subjectId: string | undefined): {
  project: VirtualizationProject | undefined;
  subject: SubjectVirtualization | undefined;
  isLoading: boolean;
  error: string | null;
} {
  const {
    projects,
    backendEnabled,
    loadProjectDetail,
    isLoadingProjectDetail,
    selectedProjectError,
  } = useOperations();

  const match = useMemo(() => {
    for (const project of projects) {
      const subject = project.subjects.find((item) => item.id === subjectId);
      if (subject) return { project, subject };
    }
    return { project: undefined, subject: undefined };
  }, [projects, subjectId]);

  useEffect(() => {
    if (!subjectId || !backendEnabled || match.subject) return;
    projects.forEach((project) => {
      if (project.subjects.length === 0) {
        void loadProjectDetail(project.id);
      }
    });
  }, [subjectId, backendEnabled, match.subject, projects, loadProjectDetail]);

  const isLoading =
    Boolean(subjectId && backendEnabled && !match.subject) &&
    (isLoadingProjectDetail || projects.some((p) => p.subjects.length === 0));

  return {
    project: match.project,
    subject: match.subject,
    isLoading,
    error: selectedProjectError,
  };
}
