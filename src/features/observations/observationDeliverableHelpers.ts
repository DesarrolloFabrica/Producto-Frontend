import type { OperationalObservation } from '../../types/domain';

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
      obs.subjectId === subjectId &&
      obs.status === 'EN_CORRECCION' &&
      obs.correctionNotificationStatus === 'PENDING',
  ).length;
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
