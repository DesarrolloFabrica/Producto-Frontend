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
