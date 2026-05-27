import { cn } from '../../../components/ui/tokens';
import { formatActiveStagesSummary } from '../../institutional-workflow/institutionalCopy';

type StageChip = { label: string; count: number };

export function ProgramActiveStageBadge({
  stages,
  variant = 'default',
}: {
  stages: StageChip[];
  variant?: 'default' | 'compact';
}) {
  const active = stages.filter((s) => s.count > 0);
  if (active.length === 0) {
    return (
      <span
        className={cn(
          'inline-flex rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200/80',
          variant === 'compact'
            ? 'px-1.5 py-0.5 text-[9px] font-semibold'
            : 'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
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
            className="inline-flex shrink-0 rounded-md bg-slate-100/80 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 ring-1 ring-slate-200/60"
          >
            {stage.label} · {stage.count}
          </span>
        ))}
        {active.length > 2 ? (
          <span className="inline-flex rounded-md bg-slate-100/80 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
            +{active.length - 2}
          </span>
        ) : null}
      </div>
    );
  }

  const summary = formatActiveStagesSummary(active);

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="inline-flex w-fit rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700 ring-1 ring-orange-100"
        title={summary}
      >
        {summary}
      </span>
      <div className="flex flex-wrap gap-1">
        {active.map((stage) => (
          <span
            key={stage.label}
            className={cn(
              'inline-flex rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80',
            )}
          >
            {stage.label} · {stage.count}
          </span>
        ))}
      </div>
    </div>
  );
}
