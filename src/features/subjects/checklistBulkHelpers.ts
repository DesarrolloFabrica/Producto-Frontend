import type { ChecklistItem, SubjectStatus } from '../../types/domain';

const SUBJECT_REVIEWABLE_STATUSES: SubjectStatus[] = ['IN_REVIEW', 'CHANGES_REQUESTED', 'SUBMITTED'];
const SUBJECT_APPROVED_STATUSES: SubjectStatus[] = ['APPROVED', 'DELIVERED'];

export function isSubjectReviewableForBulkApprove(status: SubjectStatus) {
  return SUBJECT_REVIEWABLE_STATUSES.includes(status);
}

export function isSubjectApproved(status: SubjectStatus) {
  return SUBJECT_APPROVED_STATUSES.includes(status);
}

/** Product puede aprobar solo mientras la asignatura está en revisión activa. */
export function canProductApproveSubject(status: SubjectStatus) {
  return isSubjectReviewableForBulkApprove(status) && !isSubjectApproved(status);
}

/** Product puede solicitar corrección mientras la asignatura no está cerrada. */
export function canProductRequestSubjectCorrection(status: SubjectStatus) {
  return !isSubjectApproved(status);
}

export function countApprovableProductItems(items: ChecklistItem[]) {
  return items.filter(
    (item) =>
      item.ownerRole === 'PRODUCT' &&
      (item.status === 'PENDIENTE' || item.status === 'RECHAZADO'),
  ).length;
}

export function countApprovableTopicItems(items: ChecklistItem[]) {
  return items.filter((item) => item.status === 'ENTREGADO' || item.status === 'RECHAZADO').length;
}

/** Mensaje cuando la asignatura aún no está en revisión Product. */
export function getSubjectNotReviewableMessage(status: SubjectStatus): string | null {
  if (isSubjectReviewableForBulkApprove(status)) return null;

  if (isSubjectApproved(status)) {
    return status === 'DELIVERED'
      ? 'Esta asignatura ya fue entregada al LMS. No hay más acciones de revisión.'
      : 'Esta asignatura ya fue aprobada.';
  }

  switch (status) {
    case 'PENDING':
      return 'Fábrica aún no ha iniciado la producción. Podrás aprobar cuando envíe la asignatura a revisión Product.';
    case 'IN_PRODUCTION':
      return 'Fábrica está produciendo la asignatura. La aprobación se habilitará cuando la envíe a revisión Product.';
    default:
      return 'La asignatura no está en revisión activa.';
  }
}

export function getProductSectionBulkBlockMessage(
  items: ChecklistItem[],
  canBulkApprove: boolean,
): string | null {
  if (!canBulkApprove) return null;

  if (countApprovableProductItems(items) > 0) return null;

  const productItems = items.filter((item) => item.ownerRole === 'PRODUCT');
  if (productItems.length === 0) return null;

  if (productItems.every((item) => item.status === 'APROBADO')) {
    return 'Todos los entregables de esta sección ya están aprobados.';
  }

  return 'No hay entregables pendientes de aprobación en esta sección.';
}

export function getTopicBulkBlockMessage(
  items: ChecklistItem[],
  subjectCanBulkApprove: boolean,
  hasTopicId: boolean,
): string | null {
  if (!subjectCanBulkApprove) return null;

  if (!hasTopicId) {
    return 'Este tema aún no está sincronizado. Recarga la página e inténtalo de nuevo.';
  }

  if (countApprovableTopicItems(items) > 0) return null;

  if (items.length === 0) {
    return 'Este tema no tiene materiales configurados.';
  }

  if (items.every((item) => item.status === 'APROBADO')) {
    return 'Todos los materiales de este tema ya están aprobados.';
  }

  const pendingCount = items.filter((item) => item.status === 'PENDIENTE').length;
  const inProductionCount = items.filter((item) => item.status === 'EN_PRODUCCION').length;

  if (pendingCount > 0 && inProductionCount === 0) {
    return 'Esperando que Fábrica entregue los materiales de este tema.';
  }

  if (inProductionCount > 0 && pendingCount === 0) {
    return 'Fábrica está produciendo los materiales de este tema.';
  }

  if (pendingCount > 0 || inProductionCount > 0) {
    return 'Esperando que Fábrica termine y entregue los materiales de este tema.';
  }

  return 'No hay materiales listos para aprobar en este tema.';
}
