import type { InstitutionalOperationalAction } from '../../types/domain';

const ACTION_TIMELINE_LABELS: Record<InstitutionalOperationalAction, string> = {
  INSTITUTIONAL_SUBJECT_CREATED: 'Solicitud institucional creada',
  PLANNING_VALIDATE_INITIAL: 'Planeación validó solicitud inicial',
  PLANNING_RETURN_INITIAL: 'Planeación devolvió a Product',
  PRODUCT_RESUBMIT_REQUEST: 'Product reenvió solicitud',
  FACTORY_START_PRODUCTION: 'Fábrica inició producción',
  FACTORY_DELIVER_CONTENT: 'Fábrica entregó producción a Planeación',
  PLANNING_VALIDATE_PRODUCTION: 'Planeación aprobó producción',
  PLANNING_RETURN_PRODUCTION: 'Planeación devolvió producción a Fábrica',
  LMS_START_UPLOAD: 'LMS inició carga',
  LMS_CONFIRM_UPLOAD: 'LMS confirmó publicación',
  PLANNING_VALIDATE_LMS: 'Planeación validó LMS',
  PLANNING_RETURN_LMS: 'Planeación devolvió carga LMS',
  PRODUCT_START_ACADEMIC_REVIEW: 'Product inició revisión académica',
  PRODUCT_REQUEST_CHANGES: 'Product solicitó correcciones académicas',
  PRODUCT_APPROVE_ACADEMIC: 'Product aprobó revisión académica',
};

const LEGACY_ACTION_TIMELINE_LABELS: Record<string, string> = {
  PLANNING_FINALIZE: 'Planeación radicó y finalizó',
};

export function actionTimelineLabel(action: string): string {
  return (
    ACTION_TIMELINE_LABELS[action as InstitutionalOperationalAction] ??
    LEGACY_ACTION_TIMELINE_LABELS[action] ??
    'Evento operacional'
  );
}
