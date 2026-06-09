import type { SlaStatusV2 } from '../../../types/operationalWorkflow';
import { cn } from '../../../components/ui/tokens';
import { slaLabelV2, slaToneV2 } from '../sla/slaV2';

export function SlaBadgeV2({ status }: { status: SlaStatusV2 }) {
  const tone = slaToneV2(status);
  const label = slaLabelV2(status);
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', tone.bg, tone.text, tone.ring)} title={label}>
      <span className={cn('h-1 w-1 rounded-full', tone.dot)} />
      {label}
    </span>
  );
}
