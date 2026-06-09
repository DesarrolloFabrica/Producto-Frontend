import { cn } from '../../../components/ui/tokens';
import { formatActiveStagesSummary } from '../../institutional-workflow/institutionalCopy';

type StageChip = { label: string; count: number };

const stageChipClass = (label: string) =>
  label === 'Completadas'
    ? 'bg-emerald-50/90 text-emerald-700 ring-emerald-200/70'
    : 'bg-slate-50/90 text-slate-600 ring-slate-200/60';

export function ProgramActiveStageBadge({
  stages,
  variant = 'default',
}: {
  stages: StageChip[];
  variant?: 'default' | 'compact';
}) {
  const active = stages.filter((s) => s.count > 0);
  const isFullyComplete =
    active.length === 1 && active[0]?.label === 'Completadas' && active[0].count > 0;

  if (active.length === 0) {
    return (
      <span
        className={cn(
          'inline-flex rounded-full bg-slate-50/90 font-medium text-slate-500 ring-1 ring-slate-200/60',
          variant === 'compact' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        )}
      >
        Sin etapa
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex min-w-0 flex-wrap justify-end gap-1">
        {active.slice(0, 2).map((stage) => (
          <span
            key={stage.label}
            className={cn(
              'inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium ring-1',
              stageChipClass(stage.label),
            )}
          >
            {stage.label} · {stage.count}
          </span>
        ))}
        {active.length > 2 ? (
          <span className="inline-flex rounded-md bg-slate-50/90 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 ring-1 ring-slate-200/50">
            +{active.length - 2}
          </span>
        ) : null}
      </div>
    );
  }

  const summary = formatActiveStagesSummary(active);

  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          'inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1',
          isFullyComplete
            ? 'bg-emerald-50/90 text-emerald-700 ring-emerald-200/70'
            : 'bg-orange-50/90 text-orange-700 ring-orange-200/60',
        )}
        title={summary}
      >
        {summary}
      </span>
      <div className="flex flex-wrap gap-1">
        {active.map((stage) => (
          <span
            key={stage.label}
            className={cn(
              'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1',
              stageChipClass(stage.label),
            )}
          >
            {stage.label} · {stage.count}
          </span>
        ))}
      </div>
    </div>
  );
}
