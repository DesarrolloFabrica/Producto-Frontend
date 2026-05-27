import type { ChecklistItem, SubjectStatus, SubjectVirtualization } from '../../types/domain';

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

/** Materiales por gránulo: Product puede aprobar desde cualquier estado previo a APROBADO. */
export function countApprovableTopicItems(items: ChecklistItem[]) {
  return items.filter(
    (item) =>
      item.status === 'PENDIENTE' ||
      item.status === 'EN_PRODUCCION' ||
      item.status === 'ENTREGADO' ||
      item.status === 'RECHAZADO',
  ).length;
}

export function getAcademicApprovalBlockers(params: {
  subject: Pick<SubjectVirtualization, 'checklist' | 'topicChecklists'>;
  unresolvedObservationCount?: number;
  topicsCount?: number;
}): string[] {
  const blockers: string[] = [];
  const { subject, unresolvedObservationCount = 0, topicsCount } = params;

  const productItems = subject.checklist.filter((item) => item.ownerRole === 'PRODUCT');
  const topicItems = subject.topicChecklists.flatMap((topic) => topic.items ?? []);
  const resolvedTopicsCount = topicsCount ?? subject.topicChecklists.length;

  if (resolvedTopicsCount === 0) {
    blockers.push('Debe definir los gránulos/temas antes de aprobar académicamente.');
  }

  const pendingProduct = productItems.filter((item) => item.status !== 'APROBADO');
  if (pendingProduct.length > 0) {
    blockers.push(
      `Faltan ${pendingProduct.length} entregable(s) de Product por aprobar en el checklist general.`,
    );
  }

  const pendingTopics = topicItems.filter((item) => item.status !== 'APROBADO');
  if (pendingTopics.length > 0) {
    blockers.push(
      `Faltan ${pendingTopics.length} ítem(s) de temas/gránulos por aprobar.`,
    );
  }

  if (unresolvedObservationCount > 0) {
    blockers.push(
      `Hay ${unresolvedObservationCount} observación(es) pendientes de validación.`,
    );
  }

  return blockers;
}

export function isReadyForAcademicApproval(params: Parameters<typeof getAcademicApprovalBlockers>[0]): boolean {
  return getAcademicApprovalBlockers(params).length === 0;
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

  return 'No hay materiales pendientes de revisión en este tema.';
}
