import type { OperationalStateV2 } from '../../../types/operationalWorkflow';
import { cn } from '../../../components/ui/tokens';
import { stateLabelV2, stateToneV2 } from '../rules/workflowRulesV2';

export function OperationalStateBadgeV2({ state }: { state: OperationalStateV2 }) {
  const tone = stateToneV2(state);
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1', tone.bg, tone.text, tone.ring)} title={stateLabelV2(state)}>
      {stateLabelV2(state)}
    </span>
  );
}

