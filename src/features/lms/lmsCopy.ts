import type { InstitutionalOperationalState } from '../../types/domain';

/** Etiquetas orientadas al panel LMS (sin enums crudos). */
export const LMS_STATE_LABELS: Partial<Record<InstitutionalOperationalState, string>> = {
  PENDING_LMS_UPLOAD: 'Pendiente de carga LMS',
  IN_LMS_UPLOAD: 'En carga LMS',
  PENDING_PLANNING_LMS_VALIDATION: 'Pendiente validación de Planeación',
  RETURNED_TO_LMS_FROM_PLANNING: 'Devuelta por Planeación',
};

export function lmsStateLabel(state: InstitutionalOperationalState): string {
  return LMS_STATE_LABELS[state] ?? 'Carga LMS completada';
}

export const LMS_ACTION_COPY = {
  startUpload: 'Iniciar carga LMS',
  confirmUpload: 'Confirmar carga/publicación',
  viewFlow: 'Ver flujo',
  attendReturn: 'Atender devolución',
} as const;
