import { useEffect } from 'react';
import type { VirtualizationProject } from '../../types/domain';
import { useOperations } from './OperationsContext';

export function useEnsureProjectDetail(projectId: string | undefined): {
  project: VirtualizationProject | undefined;
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

  const project = projects.find((item) => item.id === projectId);
  const needsDetail =
    Boolean(backendEnabled && projectId && project && project.subjects.length === 0);

  useEffect(() => {
    if (!projectId || !backendEnabled) return;
    if (!project || project.subjects.length === 0) {
      void loadProjectDetail(projectId);
    }
  }, [projectId, backendEnabled, project?.id, project?.subjects.length, loadProjectDetail]);

  return {
    project,
    isLoading: Boolean(projectId && (needsDetail || isLoadingProjectDetail) && !project?.subjects.length),
    error: selectedProjectError,
  };
}
