/**
 * Badge para estados del flujo institucional (operationalState).
 * Para estados legacy de proyecto/materia usar StatusBadge.
 */
import type { InstitutionalOperationalState } from '../../types/domain';
import type { OperationalStateV2 } from '../../types/operationalWorkflow';
import { OperationalStateBadgeV2 } from '../../features/operations-v2/components/OperationalStateBadgeV2';

type InstitutionalBadgeState = InstitutionalOperationalState | OperationalStateV2;

export function InstitutionalStateBadge({ state }: { state: InstitutionalBadgeState }) {
  return <OperationalStateBadgeV2 state={state as OperationalStateV2} />;
}
