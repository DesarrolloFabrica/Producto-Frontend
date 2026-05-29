import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { Role, VirtualizationProject } from '../../types/domain';

export function isProjectCompleted(project: VirtualizationProject): boolean {
  return project.status === 'CLOSED';
}

/** Progreso mostrado en listados (solicitudes Product, etc.). */
export function resolveProjectListProgress(project: VirtualizationProject): number {
  if (isProjectCompleted(project)) return 100;

  const summary = project.subjectsSummary ?? [];
  if (summary.length > 0) {
    const allComplete = summary.every(
      (s) =>
        (s.progress ?? 0) >= 100 ||
        s.status === 'DELIVERED' ||
        s.status === 'APPROVED' ||
        s.operationalState === 'APPROVED',
    );
    if (allComplete) return 100;

    const avg = Math.round(
      summary.reduce((acc, s) => acc + Math.min(100, Math.max(0, s.progress ?? 0)), 0) / summary.length,
    );
    return Math.max(project.progress ?? 0, avg);
  }

  return Math.min(100, Math.max(0, project.progress ?? 0));
}

export function projectListProgressLabel(project: VirtualizationProject, progress: number): string {
  if (isProjectCompleted(project) || progress >= 100) return 'Completo';
  return `${progress}%`;
}

export function buildProjectResponsibleRoleMap(
  programs: ProgramOperationalWorkItemDto[],
): Map<string, Role> {
  const map = new Map<string, Role>();
  for (const program of programs) {
    if (program.currentResponsibleRole) {
      map.set(program.projectId, program.currentResponsibleRole);
    }
  }
  return map;
}

function resolveProjectResponsibleRoleFallback(project: VirtualizationProject): Role | null {
  switch (project.status) {
    case 'PENDING_SYLLABUS':
    case 'PENDING_SUBJECT_MATTER_EXPERT':
    case 'IN_REVIEW':
    case 'FEEDBACK_PENDING':
      return 'PRODUCT';
    case 'READY_FOR_PRODUCTION':
    case 'IN_PRODUCTION':
      return 'FABRICA';
    case 'DELIVERED_TO_LMS':
      return 'LMS';
    case 'CLOSED':
      return null;
    default:
      return 'PRODUCT';
  }
}

export function resolveProjectResponsibleRole(
  project: VirtualizationProject,
  roleByProjectId?: Map<string, Role>,
): Role | null {
  if (isProjectCompleted(project)) return null;
  return roleByProjectId?.get(project.id) ?? resolveProjectResponsibleRoleFallback(project);
}
