import { MessageSquare } from 'lucide-react';
import { cn } from '../../components/ui/tokens';
import type { ObservationDeliverableBadgeState } from './observationDeliverableHelpers';
import { observationBadgeLabels } from './observationDeliverableHelpers';

type ObservationDeliverableButtonProps = {
  count: number;
  state: ObservationDeliverableBadgeState;
  onClick: () => void;
  disabled?: boolean;
};

const stateStyles: Record<ObservationDeliverableBadgeState, string> = {
  none: 'text-slate-400 ring-slate-200 hover:bg-slate-50',
  draft: 'text-amber-700 ring-amber-200 bg-amber-50/80 hover:bg-amber-50',
  open: 'text-rose-700 ring-rose-200 bg-rose-50/80 hover:bg-rose-50',
  in_correction: 'text-sky-700 ring-sky-200 bg-sky-50/80 hover:bg-sky-50',
  resolved: 'text-emerald-700 ring-emerald-200 bg-emerald-50/80 hover:bg-emerald-50',
};

export function ObservationDeliverableButton({
  count,
  state,
  onClick,
  disabled,
}: ObservationDeliverableButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      title={observationBadgeLabels[state]}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ring-1 transition-colors',
        stateStyles[state],
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <MessageSquare className="h-3 w-3" />
      <span>{count > 0 ? count : 'Obs.'}</span>
    </button>
  );
}
