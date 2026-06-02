import { useEffect, useMemo, useRef, useState } from 'react';
import type { VirtualizationProject } from '../../types/domain';
import { useAuth } from '../auth/AuthContext';
import { isProjectNotFoundError } from './apiMappers';
import { useOperations } from './OperationsContext';

export function useEnsureProjectDetail(projectId: string | undefined): {
  project: VirtualizationProject | undefined;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  redirectProjectId: string | null;
} {
  const { isLoading: authLoading } = useAuth();
  const {
    projects,
    backendEnabled,
    loadProjectDetail,
    refreshProjects,
    isLoadingProjectDetail,
    isLoadingProjects,
    selectedProjectError,
  } = useOperations();

  const [isRecovering, setIsRecovering] = useState(false);
  const recoveryAttemptedRef = useRef(false);

  const project = projects.find((item) => item.id === projectId);
  const hasFullDetail = Boolean(project && project.semesters.length > 0);

  useEffect(() => {
    if (!projectId || !backendEnabled || authLoading) return;
    if (!project || project.semesters.length === 0) {
      void loadProjectDetail(projectId);
    }
  }, [projectId, backendEnabled, authLoading, project?.id, project?.semesters.length, loadProjectDetail]);

  useEffect(() => {
    recoveryAttemptedRef.current = false;
    setIsRecovering(false);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !backendEnabled || authLoading || project) return;
    if (!selectedProjectError || recoveryAttemptedRef.current) return;
    if (!isProjectNotFoundError(selectedProjectError)) return;

    recoveryAttemptedRef.current = true;
    setIsRecovering(true);
    void refreshProjects(true).finally(() => {
      setIsRecovering(false);
    });
  }, [projectId, backendEnabled, authLoading, project, selectedProjectError, refreshProjects]);

  const redirectProjectId = useMemo(() => {
    if (project || !projectId || !selectedProjectError || isRecovering) return null;
    if (!isProjectNotFoundError(selectedProjectError)) return null;
    if (projects.length === 1 && projects[0].id !== projectId) return projects[0].id;
    return null;
  }, [project, projectId, selectedProjectError, isRecovering, projects]);

  if (!projectId) {
    return { project: undefined, isLoading: false, error: null, notFound: true, redirectProjectId: null };
  }

  if (!backendEnabled) {
    return {
      project,
      isLoading: false,
      error: null,
      notFound: !project,
      redirectProjectId: null,
    };
  }

  const isResolving = Boolean(
    !authLoading &&
    !selectedProjectError &&
    (isLoadingProjects || isLoadingProjectDetail || !project || !hasFullDetail),
  );

  const notFound = Boolean(!authLoading && !isResolving && !isRecovering && !project);

  return {
    project: hasFullDetail ? project : undefined,
    isLoading: authLoading || isResolving || isRecovering,
    error: isRecovering ? null : selectedProjectError,
    notFound,
    redirectProjectId,
  };
}
