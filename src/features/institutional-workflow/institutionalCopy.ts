import type { InstitutionalOperationalState, Role } from '../../types/domain';

/** Fase 7 del pipeline: revisión académica Product (checklist, temas, granularidad). */
export const PRODUCT_ACADEMIC_REVIEW_STATES: InstitutionalOperationalState[] = [
  'PENDING_PRODUCT_ACADEMIC_REVIEW',
  'IN_PRODUCT_ACADEMIC_REVIEW',
  'CHANGES_REQUESTED_BY_PRODUCT',
];

export function isSemesterProductAcademicReviewPhase(state: InstitutionalOperationalState): boolean {
  return PRODUCT_ACADEMIC_REVIEW_STATES.includes(state);
}

/** Columna de requisitos académicos: solo Product/Admin en fase 7. */
export function shouldShowSemesterAcademicRequirements(
  role: Role | undefined,
  operationalState: InstitutionalOperationalState,
): boolean {
  if (role !== 'PRODUCT' && role !== 'ADMIN') return false;
  return isSemesterProductAcademicReviewPhase(operationalState);
}

export const INSTITUTIONAL_STATE_LABELS: Record<InstitutionalOperationalState, string> = {
  PENDING_PLANNING_INITIAL_VALIDATION: 'Pendiente validación de Planeación',
  RETURNED_TO_PRODUCT_FROM_PLANNING: 'Devuelta a Product',
  PENDING_FACTORY: 'Pendiente Fábrica',
  IN_FACTORY_PRODUCTION: 'En producción — Fábrica',
  PENDING_PLANNING_PRODUCTION_VALIDATION: 'Pendiente validación de Planeación (producción)',
  RETURNED_TO_FACTORY_FROM_PLANNING: 'Devuelta a Fábrica',
  PENDING_LMS_UPLOAD: 'Pendiente carga LMS',
  IN_LMS_UPLOAD: 'En carga LMS',
  PENDING_PLANNING_LMS_VALIDATION: 'Pendiente validación de Planeación (LMS)',
  RETURNED_TO_LMS_FROM_PLANNING: 'Devuelta a LMS',
  PENDING_PRODUCT_ACADEMIC_REVIEW: 'Pendiente revisión académica',
  IN_PRODUCT_ACADEMIC_REVIEW: 'En revisión académica',
  CHANGES_REQUESTED_BY_PRODUCT: 'Correcciones solicitadas por Product',
  PENDING_PROJECT_RADICATION: 'Pendiente radicación del proyecto',
  FINALIZED: 'Finalizado',
};

export function institutionalStateLabel(state: InstitutionalOperationalState): string {
  return INSTITUTIONAL_STATE_LABELS[state] ?? 'Estado en actualización';
}

export const FACTORY_COPY = {
  startProduction: 'Iniciar producción',
  finishProduction: 'Marcar producción completa',
  finishProductionHint:
    'Marca el avance interno de esta asignatura. La entrega formal del paquete semestral a Planeación se realiza desde el centro operacional del semestre cuando todas las materias estén completas.',
  toastProductionStarted: 'Producción iniciada.',
  toastProductionFinished: 'Producción interna marcada como completa.',
  toastCorrectionsRedelivered: 'Producción corregida reentregada a validación operacional.',
  redeliverProduction: 'Reentregar producción corregida',
  institutionalSubjectBanner:
    'Detalle interno del paquete semestral. Esta pantalla no avanza el flujo institucional principal.',
  internalProductionCompleteBanner:
    'Producción interna completa. La entrega formal se realiza desde el centro operacional del semestre.',
  internalProductionCompleteLabel: 'Producción interna completa',
  correctionMarkSelected: 'Marcar seleccionadas como corregidas',
  correctionMarkApplied: 'Marcar como corregida',
  correctionMarkedLocally: 'Corrección marcada como lista. Aún no se notificó a Product.',
  correctionBatchMarked: 'Correcciones marcadas como listas. Envíalas a Product cuando quieras.',
  correctionNotifySelected: 'Enviar correcciones seleccionadas a Product',
  correctionNotifyHint:
    'Primero marca las correcciones que ya aplicaste. Luego elige cuáles notificar a Product y envíalas en un solo paso.',
  correctionReadyLabel: 'Lista para notificar',
  correctionSentLabel: 'Notificada a Product',
} as const;

export type SemesterSubjectInternalState =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'FACTORY_PRODUCTION_COMPLETE'
  | 'HAS_OBSERVATIONS'
  | 'ACADEMIC_APPROVED'
  | 'FINALIZED'
  | 'BLOCKED';

const SEMESTER_SUBJECT_INTERNAL_STATE: Record<
  SemesterSubjectInternalState,
  { label: string; tone: 'slate' | 'orange' | 'emerald' | 'amber' | 'sky' | 'rose' }
> = {
  NOT_STARTED: { label: 'Pendiente de producción', tone: 'slate' },
  IN_PROGRESS: { label: 'En producción', tone: 'orange' },
  FACTORY_PRODUCTION_COMPLETE: { label: 'Producción interna completa', tone: 'emerald' },
  HAS_OBSERVATIONS: { label: 'Observaciones de Product', tone: 'amber' },
  ACADEMIC_APPROVED: { label: 'Aprobada académicamente', tone: 'sky' },
  FINALIZED: { label: 'Finalizada', tone: 'emerald' },
  BLOCKED: { label: 'Requisitos pendientes', tone: 'amber' },
};

export function semesterSubjectInternalStateMeta(state: string) {
  const key = state as SemesterSubjectInternalState;
  return SEMESTER_SUBJECT_INTERNAL_STATE[key] ?? { label: 'En seguimiento', tone: 'slate' as const };
}

export function formatSemesterSubjectBlocker(message: string): string {
  if (message.includes('between 4 and 6 topics')) {
    return 'Definir entre 4 y 6 temas académicos';
  }
  if (message.includes('Each subject must have')) {
    return 'Definir entre 4 y 6 temas académicos';
  }
  return message;
}
