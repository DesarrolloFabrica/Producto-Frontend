import type { InstitutionalOperationalState } from '../../types/domain';

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
  finishProduction: 'Finalizar producción',
  finishProductionHint:
    'Entrega la producción a validación operacional de Planeación. El flujo continúa hacia LMS antes de la revisión académica de Product.',
  toastProductionStarted: 'Producción iniciada.',
  toastProductionFinished: 'Producción finalizada — enviada a validación de Planeación.',
  toastCorrectionsRedelivered: 'Producción corregida reentregada a validación operacional.',
  redeliverProduction: 'Reentregar producción corregida',
} as const;
