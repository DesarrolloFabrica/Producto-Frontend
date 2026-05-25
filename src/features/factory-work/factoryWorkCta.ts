import type { SubjectOperationalState } from '../operations/subjectOperationalState';

export function getCompactWorkCta(state: SubjectOperationalState): { shortLabel: string; title: string } {
  switch (state) {
    case 'NOT_STARTED':
      return { shortLabel: 'Iniciar', title: 'Iniciar producción' };
    case 'IN_PRODUCTION':
      return { shortLabel: 'Continuar', title: 'Continuar producción' };
    case 'CHANGES_REQUESTED':
      return { shortLabel: 'Correcciones', title: 'Ver correcciones' };
    case 'IN_REVIEW':
      return { shortLabel: 'Ver estado', title: 'Esperando Product' };
    case 'CORRECTION_SENT':
      return { shortLabel: 'Ver estado', title: 'Esperando validación' };
    case 'APPROVED':
      return { shortLabel: 'Ver aprobado', title: 'Ver aprobado' };
    default:
      return { shortLabel: 'Ver', title: 'Abrir materia' };
  }
}
