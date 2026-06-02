import type { ChecklistItem, OperationalObservation } from '../../types/domain';

export type ObservationDeliverableBadgeState =
  | 'none'
  | 'draft'
  | 'open'
  | 'in_correction'
  | 'resolved';

export function getObservationBadgeState(
  observations: OperationalObservation[],
): ObservationDeliverableBadgeState {
  if (observations.length === 0) return 'none';
  const hasDraft = observations.some(
    (obs) => obs.status === 'ABIERTA' && obs.notificationStatus === 'PENDING',
  );
  if (hasDraft) return 'draft';
  if (observations.some((obs) => obs.status === 'ABIERTA')) return 'open';
  if (observations.some((obs) => obs.status === 'EN_CORRECCION')) return 'in_correction';
  if (observations.some((obs) => obs.status === 'RESUELTA')) return 'resolved';
  return 'none';
}

export type ProductReviewDisplayStatus = 'pendiente' | 'aprobado' | 'rechazado';

export function hasActiveDeliverableObservations(observations: OperationalObservation[]): boolean {
  const badgeState = getObservationBadgeState(observations);
  return badgeState === 'draft' || badgeState === 'open' || badgeState === 'in_correction';
}

function getVisibleDeliverableObservations(
  observations: OperationalObservation[],
): OperationalObservation[] {
  return observations.filter(
    (obs) => !(obs.status === 'ABIERTA' && obs.notificationStatus === 'PENDING'),
  );
}

/** Ciclo de corrección cerrado: todas las observaciones visibles quedaron validadas. */
export function hasResolvedDeliverableCorrectionCycle(
  observations: OperationalObservation[],
): boolean {
  const visible = getVisibleDeliverableObservations(observations);
  return visible.length > 0 && visible.every((obs) => obs.status === 'RESUELTA');
}

/** Estado visible del entregable: observaciones activas prevalecen sobre el checklist guardado. */
export function getEffectiveProductReviewStatus(
  checklistStatus: string,
  observations: OperationalObservation[],
): ProductReviewDisplayStatus {
  if (hasActiveDeliverableObservations(observations)) {
    if (checklistStatus === 'RECHAZADO') return 'rechazado';
    return 'pendiente';
  }

  if (hasResolvedDeliverableCorrectionCycle(observations)) {
    return 'aprobado';
  }

  if (checklistStatus === 'APROBADO') return 'aprobado';
  if (checklistStatus === 'RECHAZADO') return 'rechazado';
  return 'pendiente';
}

export interface EffectiveProductChecklistCounts {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export function getEffectiveProductChecklistCounts(
  items: ChecklistItem[],
  observations: OperationalObservation[],
): EffectiveProductChecklistCounts {
  const productItems = items.filter((item) => item.ownerRole === 'PRODUCT');
  let approved = 0;
  let pending = 0;
  let rejected = 0;

  for (const item of productItems) {
    const itemObservations = filterObservationsForChecklistItem(observations, item.id);
    const effectiveStatus = getEffectiveProductReviewStatus(item.status, itemObservations);
    if (effectiveStatus === 'aprobado') approved += 1;
    else if (effectiveStatus === 'rechazado') rejected += 1;
    else pending += 1;
  }

  return {
    total: productItems.length,
    approved,
    pending,
    rejected,
  };
}

export function isChecklistItemEffectivelyApproved(
  item: ChecklistItem,
  observations: OperationalObservation[],
): boolean {
  const itemObservations = filterObservationsForChecklistItem(observations, item.id);
  return getEffectiveProductReviewStatus(item.status, itemObservations) === 'aprobado';
}

export function isChecklistItemOutOfSync(
  item: ChecklistItem,
  observations: OperationalObservation[],
): boolean {
  const itemObservations = filterObservationsForChecklistItem(observations, item.id);
  const effectiveStatus = getEffectiveProductReviewStatus(item.status, itemObservations);
  return effectiveStatus === 'aprobado' && item.status !== 'APROBADO';
}

export function filterObservationsForChecklistItem(
  observations: OperationalObservation[],
  checklistItemId: string,
): OperationalObservation[] {
  return observations.filter(
    (obs) =>
      obs.checklistItemId === checklistItemId ||
      (obs.relatedEntityType === 'CHECKLIST_ITEM' && obs.relatedEntityId === checklistItemId),
  );
}

export function resolveDeliverableChecklistItemId(
  observation: Pick<OperationalObservation, 'checklistItemId' | 'relatedEntityType' | 'relatedEntityId'>,
): string | undefined {
  return (
    observation.checklistItemId ??
    (observation.relatedEntityType === 'CHECKLIST_ITEM' ? observation.relatedEntityId : undefined)
  );
}

export function countPendingProductObservations(
  observations: OperationalObservation[],
  subjectId: string,
): number {
  return observations.filter(
    (obs) =>
      obs.subjectId === subjectId &&
      obs.role === 'PRODUCT' &&
      obs.status === 'ABIERTA' &&
      obs.notificationStatus === 'PENDING',
  ).length;
}

export function countPendingFactoryCorrectionNotifications(
  observations: OperationalObservation[],
  subjectId: string,
): number {
  return observations.filter(
    (obs) =>
      obs.subjectId === subjectId && isCorrectionReadyToNotify(obs),
  ).length;
}

export type FactoryCorrectionPhase = 'open' | 'ready_to_notify' | 'sent_to_product' | 'resolved';

export function getFactoryCorrectionPhase(observation: OperationalObservation): FactoryCorrectionPhase {
  if (observation.status === 'RESUELTA') return 'resolved';
  if (observation.status === 'ABIERTA') return 'open';
  if (observation.status === 'EN_CORRECCION' && observation.correctionNotificationStatus === 'SENT') {
    return 'sent_to_product';
  }
  if (observation.status === 'EN_CORRECCION') return 'ready_to_notify';
  return 'open';
}

export function isCorrectionReadyToNotify(observation: OperationalObservation): boolean {
  return getFactoryCorrectionPhase(observation) === 'ready_to_notify';
}

export function isCorrectionSentToProduct(observation: OperationalObservation): boolean {
  return getFactoryCorrectionPhase(observation) === 'sent_to_product';
}

export const observationBadgeLabels: Record<ObservationDeliverableBadgeState, string> = {
  none: 'Sin observaciones',
  draft: 'Borrador',
  open: 'Abierta',
  in_correction: 'En corrección',
  resolved: 'Validada',
};

export const observationStatusLabels: Record<OperationalObservation['status'], string> = {
  ABIERTA: 'Abierta',
  EN_CORRECCION: 'En corrección',
  RESUELTA: 'Validada',
};

/** Product borradores (PENDING) no deben mostrarse en Fábrica hasta el envío por lote. */
export function filterObservationsVisibleToFactory(
  observations: OperationalObservation[],
): OperationalObservation[] {
  return observations.filter(
    (obs) => !(obs.role === 'PRODUCT' && obs.notificationStatus === 'PENDING'),
  );
}

/** Observación no resuelta visible para Fábrica (excluye ABIERTA en borrador). */
export function isFactoryVisibleUnresolvedObservation(obs: OperationalObservation): boolean {
  if (obs.status === 'RESUELTA') return false;
  if (obs.status === 'ABIERTA' && obs.notificationStatus === 'PENDING') return false;
  return true;
}

export function countFactoryVisibleOpenObservations(
  observations: OperationalObservation[],
): number {
  return observations.filter(
    (obs) =>
      (obs.status === 'ABIERTA' || obs.status === 'EN_CORRECCION') &&
      isFactoryVisibleUnresolvedObservation(obs),
  ).length;
}

export function countSubjectFactoryOpenObservations(
  observations: OperationalObservation[],
  subjectId: string,
): number {
  return countFactoryVisibleOpenObservations(observations.filter((obs) => obs.subjectId === subjectId));
}

/** Observaciones abiertas visibles para Product (ABIERTA enviada + EN_CORRECCION). */
export function isProductVisibleUnresolvedObservation(obs: OperationalObservation): boolean {
  if (obs.status === 'RESUELTA') return false;
  if (obs.status === 'ABIERTA' && obs.notificationStatus === 'PENDING') return false;
  return obs.status === 'ABIERTA' || obs.status === 'EN_CORRECCION';
}

export function countProductVisibleOpenObservations(
  observations: OperationalObservation[],
): number {
  return observations.filter(isProductVisibleUnresolvedObservation).length;
}

export function countSubjectProductOpenObservations(
  observations: OperationalObservation[],
  subjectId: string,
): number {
  return countProductVisibleOpenObservations(
    observations.filter((obs) => obs.subjectId === subjectId),
  );
}

export function canProductReopenObservation(observation: OperationalObservation): boolean {
  return observation.status === 'EN_CORRECCION' || observation.status === 'RESUELTA';
}

/** Product puede eliminar borradores que aún no se enviaron a Fábrica. */
export function canProductDeleteObservation(observation: OperationalObservation): boolean {
  return (
    observation.role === 'PRODUCT' &&
    observation.status === 'ABIERTA' &&
    observation.notificationStatus === 'PENDING'
  );
}

export function isProductFactoryCorrectionPendingValidation(
  observation: OperationalObservation,
): boolean {
  return (
    observation.role === 'PRODUCT' &&
    observation.status === 'EN_CORRECCION' &&
    observation.correctionNotificationStatus === 'SENT'
  );
}

export type ProductActiveCorrectionPresentation = {
  title: string;
  statusLabel: string;
  footerHint: string;
  canValidate: boolean;
  canRequestReadjustment: boolean;
  cardTone: 'sky' | 'amber';
};

export function getProductActiveCorrectionPresentation(
  observation: OperationalObservation,
): ProductActiveCorrectionPresentation {
  if (isProductFactoryCorrectionPendingValidation(observation)) {
    return {
      title: 'Corrección enviada por Fábrica',
      statusLabel: 'Corrección enviada',
      footerHint: 'Pendiente de validación individual por Product',
      canValidate: true,
      canRequestReadjustment: true,
      cardTone: 'sky',
    };
  }

  if (observation.status === 'ABIERTA' && observation.notificationStatus === 'PENDING') {
    return {
      title: 'Reajuste listo para enviar',
      statusLabel: 'Pendiente de envío',
      footerHint: 'Usa «Enviar observaciones a Fábrica» para notificar este reajuste',
      canValidate: false,
      canRequestReadjustment: false,
      cardTone: 'amber',
    };
  }

  if (observation.status === 'ABIERTA' && observation.notificationStatus === 'SENT') {
    return {
      title: 'Reajuste enviado a Fábrica',
      statusLabel: 'En revisión por Fábrica',
      footerHint: 'Fábrica está aplicando este reajuste',
      canValidate: false,
      canRequestReadjustment: false,
      cardTone: 'amber',
    };
  }

  return {
    title: 'Corrección pendiente de Fábrica',
    statusLabel: 'Fábrica debe corregir',
    footerHint: 'Fábrica debe corregir esta observación',
    canValidate: false,
    canRequestReadjustment: false,
    cardTone: 'amber',
  };
}

/** Combina observaciones del workspace y del contexto priorizando la versión más reciente. */
export function mergeSubjectObservationsForProduct(
  workspaceObservations: OperationalObservation[],
  projectObservations: OperationalObservation[],
  subjectId: string,
): OperationalObservation[] {
  const byId = new Map<string, OperationalObservation>();

  const upsert = (observation: OperationalObservation) => {
    if (observation.subjectId !== subjectId) return;
    const existing = byId.get(observation.id);
    if (!existing) {
      byId.set(observation.id, observation);
      return;
    }
    const existingTime = new Date(existing.updatedAt ?? existing.createdAt).getTime();
    const nextTime = new Date(observation.updatedAt ?? observation.createdAt).getTime();
    if (nextTime >= existingTime) {
      byId.set(observation.id, observation);
    }
  };

  for (const observation of workspaceObservations) upsert(observation);
  for (const observation of projectObservations) upsert(observation);
  return Array.from(byId.values());
}
