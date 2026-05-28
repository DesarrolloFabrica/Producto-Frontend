import type { VirtualizationProject } from '../../types/domain';

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
