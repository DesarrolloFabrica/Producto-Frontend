import type { InstitutionalOperationalAction } from '../../types/domain';

const ACTION_TIMELINE_LABELS: Record<InstitutionalOperationalAction, string> = {
  INSTITUTIONAL_SUBJECT_CREATED: 'Solicitud institucional creada',
  PLANNING_VALIDATE_INITIAL: 'Solicitud inicial validada',
  PLANNING_RETURN_INITIAL: 'Solicitud devuelta a Product',
  PRODUCT_RESUBMIT_REQUEST: 'Product reenvi? solicitud',
  FACTORY_START_PRODUCTION: 'F?brica inici? producci?n',
  FACTORY_DELIVER_CONTENT: 'Producci?n entregada',
  PLANNING_VALIDATE_PRODUCTION: 'Producci?n validada',
  PLANNING_RETURN_PRODUCTION: 'Producci?n devuelta a F?brica',
  LMS_START_UPLOAD: 'LMS inici? carga',
  LMS_CONFIRM_UPLOAD: 'LMS confirm? publicaci?n',
  PLANNING_VALIDATE_LMS: 'Carga LMS validada',
  PLANNING_RETURN_LMS: 'Carga LMS devuelta',
  PRODUCT_START_ACADEMIC_REVIEW: 'Product inici? revisi?n acad?mica',
  PRODUCT_REQUEST_CHANGES: 'Product solicit? correcciones acad?micas',
  PRODUCT_APPROVE_ACADEMIC: 'Product aprob? revisi?n acad?mica',
};

const LEGACY_ACTION_TIMELINE_LABELS: Record<string, string> = {
  PLANNING_FINALIZE: 'Radicaci?n finalizada',
};

export function actionTimelineLabel(action: string): string {
  return (
    ACTION_TIMELINE_LABELS[action as InstitutionalOperationalAction] ??
    LEGACY_ACTION_TIMELINE_LABELS[action] ??
    'Evento operacional'
  );
}
