import { useEffect } from 'react';
import type { VirtualizationProject } from '../../types/domain';
import { useAuth } from '../auth/AuthContext';
import { useOperations } from './OperationsContext';

export function useEnsureProjectDetail(projectId: string | undefined): {
  project: VirtualizationProject | undefined;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
} {
  const { isLoading: authLoading } = useAuth();
  const {
    projects,
    backendEnabled,
    loadProjectDetail,
    isLoadingProjectDetail,
    isLoadingProjects,
    selectedProjectError,
  } = useOperations();

  const project = projects.find((item) => item.id === projectId);
  const hasFullDetail = Boolean(project && project.semesters.length > 0);

  useEffect(() => {
    if (!projectId || !backendEnabled || authLoading) return;
    if (!project || project.semesters.length === 0) {
      void loadProjectDetail(projectId);
    }
  }, [projectId, backendEnabled, authLoading, project?.id, project?.semesters.length, loadProjectDetail]);

  if (!projectId) {
    return { project: undefined, isLoading: false, error: null, notFound: true };
  }

  if (!backendEnabled) {
    return {
      project,
      isLoading: false,
      error: null,
      notFound: !project,
    };
  }

  const isResolving = Boolean(
    !authLoading &&
    !selectedProjectError &&
    (
      isLoadingProjects ||
      isLoadingProjectDetail ||
      !project ||
      !hasFullDetail
    ),
  );

  const notFound = Boolean(
    !authLoading &&
    !isResolving &&
    !project,
  );

  return {
    project: hasFullDetail ? project : undefined,
    isLoading: authLoading || isResolving,
    error: selectedProjectError,
    notFound,
  };
}
