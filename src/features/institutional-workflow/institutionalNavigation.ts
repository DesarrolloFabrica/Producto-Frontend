import type { SemesterSubjectOperationalDto } from '../../services/institutionalWorkflowApi';

/** Rutas del flujo institucional semester-first. */

export type SemesterHubTab = 'asignaturas' | 'operaciones';

export function semesterOperationsPath(projectId: string, semesterId: string): string {
  return `/projects/${projectId}/semesters/${semesterId}/operations`;
}

/** Panel de tarjetas por asignatura (revisión Product). Usa número de semestre, no UUID. */
export function semesterSubjectsPanelPath(projectId: string, semesterNumber: number): string {
  return `/projects/${projectId}/semesters/${semesterNumber}`;
}

/** Hub unificado de semestre (Product y Fábrica): asignaturas o flujo operacional en la misma URL. */
export function semesterHubPath(
  projectId: string,
  semesterNumber: number,
  tab: SemesterHubTab = 'asignaturas',
): string {
  const base = semesterSubjectsPanelPath(projectId, semesterNumber);
  return tab === 'operaciones' ? `${base}?tab=operaciones` : base;
}

/** Atajo Product: flujo operacional del semestre vía hub (sin UUID en URL). */
export function productSemesterOperationsPath(projectId: string, semesterNumber: number): string {
  return semesterHubPath(projectId, semesterNumber, 'operaciones');
}

/** Atajo Fábrica: flujo operacional del semestre vía hub (sin UUID en URL). */
export function factorySemesterOperationsPath(projectId: string, semesterNumber: number): string {
  return semesterHubPath(projectId, semesterNumber, 'operaciones');
}

/** Abre la asignatura en el panel de checklist (fase 7 Product). */
export function productSubjectChecklistReviewPath(subjectId: string): string {
  return `/subjects/${subjectId}?panel=checklist`;
}

/** Abre la asignatura en el panel de temas / gránulos (fase 7 Product). */
export function productSubjectTopicsPath(subjectId: string): string {
  return `/subjects/${subjectId}?panel=topics`;
}

/** Abre la asignatura en el panel de cierre (aprobación). */
export function productSubjectClosurePath(subjectId: string): string {
  return `/subjects/${subjectId}?panel=cierre`;
}

export function subjectChecklistPath(subjectId: string): string {
  return `/subjects/${subjectId}`;
}

export function subjectOperationsPath(subjectId: string): string {
  return `/subjects/${subjectId}/operations`;
}

/** Abre la asignatura y desplaza al bloque de correcciones de Product (Fábrica). */
export function subjectFactoryCorrectionsPath(subjectId: string): string {
  return `/subjects/${subjectId}?focus=correction`;
}

export function resolveInstitutionalWorkHref(item: {
  actionUrl?: string | null;
  projectId: string;
  semesterId?: string | null;
  subjectId: string;
}): string {
  if (item.actionUrl?.startsWith('/')) return item.actionUrl;
  if (item.semesterId) return semesterOperationsPath(item.projectId, item.semesterId);
  return `/subjects/${item.subjectId}/operations`;
}

export function factorySubjectHasOpenObservations(subject: SemesterSubjectOperationalDto): boolean {
  return subject.internalState === 'HAS_OBSERVATIONS' || (subject.openObservationsCount ?? 0) > 0;
}

export function isFactorySubjectNeedsWork(subject: SemesterSubjectOperationalDto): boolean {
  if (factorySubjectHasOpenObservations(subject)) return true;
  return subject.internalState !== 'FACTORY_PRODUCTION_COMPLETE';
}

/** Primera asignatura a trabajar: observaciones abiertas, luego producción incompleta. */
export function pickFactoryWorkSubject(
  subjects: SemesterSubjectOperationalDto[],
): SemesterSubjectOperationalDto | null {
  if (subjects.length === 0) return null;
  const withObservations = subjects.find(factorySubjectHasOpenObservations);
  if (withObservations) return withObservations;
  const pendingProduction = subjects.find((s) => s.internalState !== 'FACTORY_PRODUCTION_COMPLETE');
  return pendingProduction ?? null;
}

/** Primera asignatura pendiente de revisión académica (menor avance de checklist). */
export function pickProductChecklistSubject(
  subjects: SemesterSubjectOperationalDto[],
): SemesterSubjectOperationalDto | null {
  if (subjects.length === 0) return null;
  const sorted = [...subjects].sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0));
  return sorted[0] ?? null;
}

export function factorySubjectWorkPath(subject: SemesterSubjectOperationalDto): string {
  return factorySubjectHasOpenObservations(subject)
    ? subjectFactoryCorrectionsPath(subject.subjectId)
    : subjectChecklistPath(subject.subjectId);
}
