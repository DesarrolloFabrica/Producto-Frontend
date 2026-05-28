import type { InstitutionalOperationalAction } from '../../types/domain';

const ACTION_TIMELINE_LABELS: Record<InstitutionalOperationalAction, string> = {
  INSTITUTIONAL_SUBJECT_CREATED: 'Solicitud institucional creada',
  PLANNING_VALIDATE_INITIAL: 'Solicitud inicial validada',
  PLANNING_RETURN_INITIAL: 'Solicitud devuelta a Product',
  PRODUCT_RESUBMIT_REQUEST: 'Product reenvió solicitud',
  FACTORY_START_PRODUCTION: 'Fábrica inició producción',
  FACTORY_DELIVER_CONTENT: 'Producción entregada',
  PLANNING_VALIDATE_PRODUCTION: 'Producción validada',
  PLANNING_RETURN_PRODUCTION: 'Producción devuelta a Fábrica',
  LMS_START_UPLOAD: 'LMS inició carga',
  LMS_CONFIRM_UPLOAD: 'LMS confirmó publicación',
  PLANNING_VALIDATE_LMS: 'Carga LMS validada',
  PLANNING_RETURN_LMS: 'Carga LMS devuelta',
  PRODUCT_START_ACADEMIC_REVIEW: 'Product inició revisión académica',
  PRODUCT_REQUEST_CHANGES: 'Product solicitó correcciones académicas',
  PRODUCT_APPROVE_ACADEMIC: 'Product aprobó revisión académica',
};

const LEGACY_ACTION_TIMELINE_LABELS: Record<string, string> = {
  PLANNING_FINALIZE: 'Radicación finalizada',
  PRODUCT_REGISTER_RADICATION: 'Product registró radicado institucional',
  PRODUCT_RESUBMIT_RADICATION: 'Product reenvió radicado',
  PLANNING_VALIDATE_RADICATION: 'Planeación validó radicado y cerró solicitud',
  PLANNING_RETURN_RADICATION: 'Planeación devolvió radicado a Product',
  AUTO_READY_FOR_RADICATION: 'Solicitud lista para radicación',
};

export function actionTimelineLabel(action: string): string {
  return closureTimelineLabel(action);
}

export function closureTimelineLabel(action: string): string {
  return (
    ACTION_TIMELINE_LABELS[action as InstitutionalOperationalAction] ??
    LEGACY_ACTION_TIMELINE_LABELS[action] ??
    'Evento operacional'
  );
}
