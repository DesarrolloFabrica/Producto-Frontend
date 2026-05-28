import type { SemesterSubjectOperationalDto } from '../../services/institutionalWorkflowApi';

/** Rutas del flujo institucional semester-first. */

export function semesterOperationsPath(projectId: string, semesterId: string): string {
  return `/projects/${projectId}/semesters/${semesterId}/operations`;
}

/** Panel de tarjetas por asignatura (revisión Product). Usa número de semestre, no UUID. */
export function semesterSubjectsPanelPath(projectId: string, semesterNumber: number): string {
  return `/projects/${projectId}/semesters/${semesterNumber}`;
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

export function factorySubjectWorkPath(subject: SemesterSubjectOperationalDto): string {
  return factorySubjectHasOpenObservations(subject)
    ? subjectFactoryCorrectionsPath(subject.subjectId)
    : subjectChecklistPath(subject.subjectId);
}
