import type { InstitutionalOperationalAction } from '../../types/domain';

/** Acciones ejecutables en el centro operacional de asignatura (fase 7 Product). */
export const SUBJECT_LEVEL_OPERATIONAL_ACTIONS = new Set<InstitutionalOperationalAction>([
  'PRODUCT_REQUEST_CHANGES',
  'PRODUCT_APPROVE_ACADEMIC',
]);

export function filterSubjectOperationalActions(
  actions: InstitutionalOperationalAction[],
  institutionalFlowActive: boolean,
): InstitutionalOperationalAction[] {
  if (!institutionalFlowActive) return actions;
  return actions.filter((action) => SUBJECT_LEVEL_OPERATIONAL_ACTIONS.has(action));
}

export function isSemesterScopedOperationalState(state: string): boolean {
  return state !== 'IN_PRODUCT_ACADEMIC_REVIEW' && state !== 'CHANGES_REQUESTED_BY_PRODUCT';
}
