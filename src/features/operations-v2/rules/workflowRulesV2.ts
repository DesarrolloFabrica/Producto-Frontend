import type { OperationalActionV2, OperationalRoleV2, OperationalStateV2, OperationalSubjectV2 } from '../../../types/operationalWorkflow';
import { institutionalStateLabel } from '../../institutional-workflow/institutionalCopy';
import type { InstitutionalOperationalState } from '../../../types/domain';

export function stateLabelV2(state: OperationalStateV2): string {
  return institutionalStateLabel(state as InstitutionalOperationalState);
}

export function stateToneV2(state: OperationalStateV2): { bg: string; text: string; ring: string } {
  switch (state) {
    case 'FINALIZED':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/80' };
    case 'RETURNED_TO_PRODUCT_FROM_PLANNING':
    case 'RETURNED_TO_FACTORY_FROM_PLANNING':
    case 'RETURNED_TO_LMS_FROM_PLANNING':
      return { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200/80' };
    case 'IN_FACTORY_PRODUCTION':
    case 'IN_LMS_UPLOAD':
    case 'IN_PRODUCT_ACADEMIC_REVIEW':
      return { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200/80' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200/80' };
  }
}

export function roleLabelV2(role: OperationalRoleV2): string {
  if (role === 'PLANEACION') return 'Planeación';
  if (role === 'FABRICA') return 'Fábrica';
  if (role === 'PRODUCT') return 'Producto';
  if (role === 'LMS') return 'LMS';
  return role;
}

export function isChecklistPhase(state: OperationalStateV2): boolean {
  return state === 'IN_PRODUCT_ACADEMIC_REVIEW';
}

export function getAvailableActionsV2(params: {
  role: OperationalRoleV2;
  subject: Pick<OperationalSubjectV2, 'operationalState'>;
}): { primary: OperationalActionV2; actions: OperationalActionV2[] } {
  const { role, subject } = params;
  const s = subject.operationalState;

  const view: OperationalActionV2[] = ['VIEW_DETAIL', 'VIEW_TIMELINE'];
  const actions: OperationalActionV2[] = [];

  if (role === 'ADMIN') {
    return view;
  } else if (role === 'PLANEACION') {
    if (s === 'PENDING_PLANNING_INITIAL_VALIDATION') actions.push('PLANNING_VALIDATE_INITIAL', 'PLANNING_RETURN_INITIAL');
    if (s === 'RETURNED_TO_PRODUCT_FROM_PLANNING') actions.push('PLANNING_VALIDATE_INITIAL');
    if (s === 'PENDING_PLANNING_PRODUCTION_VALIDATION') actions.push('PLANNING_VALIDATE_PRODUCTION', 'PLANNING_RETURN_PRODUCTION');
    if (s === 'RETURNED_TO_FACTORY_FROM_PLANNING') actions.push('PLANNING_VALIDATE_PRODUCTION');
    if (s === 'PENDING_PLANNING_LMS_VALIDATION') actions.push('PLANNING_VALIDATE_LMS', 'PLANNING_RETURN_LMS');
    if (s === 'RETURNED_TO_LMS_FROM_PLANNING') actions.push('PLANNING_VALIDATE_LMS');
  } else if (role === 'FABRICA') {
    if (s === 'PENDING_FACTORY' || s === 'RETURNED_TO_FACTORY_FROM_PLANNING' || s === 'CHANGES_REQUESTED_BY_PRODUCT') actions.push('FACTORY_START_PRODUCTION');
    if (s === 'IN_FACTORY_PRODUCTION') actions.push('FACTORY_DELIVER_CONTENT');
  } else if (role === 'LMS') {
    if (s === 'PENDING_LMS_UPLOAD' || s === 'RETURNED_TO_LMS_FROM_PLANNING') actions.push('LMS_START_UPLOAD');
    if (s === 'IN_LMS_UPLOAD') actions.push('LMS_CONFIRM_UPLOAD');
  } else if (role === 'PRODUCT') {
    if (s === 'RETURNED_TO_PRODUCT_FROM_PLANNING') actions.push('VIEW_DETAIL');
    if (s === 'PENDING_PRODUCT_ACADEMIC_REVIEW') actions.push('PRODUCT_START_ACADEMIC_REVIEW');
    if (s === 'IN_PRODUCT_ACADEMIC_REVIEW') actions.push('PRODUCT_OPEN_ACADEMIC_CHECKLIST', 'PRODUCT_REQUEST_CHANGES', 'PRODUCT_APPROVE_ACADEMIC');
    if (s === 'CHANGES_REQUESTED_BY_PRODUCT') actions.push('PRODUCT_OPEN_ACADEMIC_CHECKLIST');
  }

  // Always allow view actions
  for (const a of view) {
    if (!actions.includes(a)) actions.push(a);
  }

  const primary: OperationalActionV2 =
    actions.find((a) =>
      [
        'PLANNING_VALIDATE_INITIAL',
        'PLANNING_VALIDATE_PRODUCTION',
        'PLANNING_VALIDATE_LMS',
        'FACTORY_START_PRODUCTION',
        'FACTORY_DELIVER_CONTENT',
        'LMS_START_UPLOAD',
        'LMS_CONFIRM_UPLOAD',
        'PRODUCT_START_ACADEMIC_REVIEW',
        'PRODUCT_APPROVE_ACADEMIC',
      ].includes(a),
    ) ?? 'VIEW_DETAIL';

  return { primary, actions };
}

export function actionLabelV2(action: OperationalActionV2): string {
  switch (action) {
    case 'PLANNING_VALIDATE_INITIAL':
      return 'Validar solicitud';
    case 'PLANNING_RETURN_INITIAL':
      return 'Devolver a Product';
    case 'FACTORY_START_PRODUCTION':
      return 'Iniciar producción';
    case 'FACTORY_DELIVER_CONTENT':
      return 'Confirmar entrega';
    case 'PLANNING_VALIDATE_PRODUCTION':
      return 'Validar producción';
    case 'PLANNING_RETURN_PRODUCTION':
      return 'Devolver a Fábrica';
    case 'LMS_START_UPLOAD':
      return 'Iniciar carga LMS';
    case 'LMS_CONFIRM_UPLOAD':
      return 'Confirmar publicación';
    case 'PLANNING_VALIDATE_LMS':
      return 'Validar carga LMS';
    case 'PLANNING_RETURN_LMS':
      return 'Devolver a LMS';
    case 'PRODUCT_START_ACADEMIC_REVIEW':
      return 'Iniciar revisión';
    case 'PRODUCT_OPEN_ACADEMIC_CHECKLIST':
      return 'Ir al checklist';
    case 'PRODUCT_REQUEST_CHANGES':
      return 'Solicitar correcciones';
    case 'PRODUCT_APPROVE_ACADEMIC':
      return 'Aprobar académicamente';
    case 'PRODUCT_RESUBMIT_REQUEST':
      return 'Reenviar solicitud';
    case 'VIEW_TIMELINE':
      return 'Ver timeline';
    default:
      return 'Ver detalle';
  }
}
