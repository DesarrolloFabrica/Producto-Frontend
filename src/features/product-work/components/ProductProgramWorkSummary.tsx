import { X } from 'lucide-react';
import { cn, radius, surface } from '../../../components/ui/tokens';
import { getProgramFilterChips, getProgramSortLabel, getProgramStatusLabel } from '../productProgramWorkConstants';
import type { ProductProgramWorkQuery } from '../productProgramWork';

export function ProductProgramWorkSummary({
  total,
  query,
  onRemoveFilter,
  onClearAll,
}: {
  total: number;
  query: ProductProgramWorkQuery;
  onRemoveFilter: (param: string) => void;
  onClearAll?: () => void;
}) {
  const chips = getProgramFilterChips(query as Record<string, unknown>);
  const statusLabel = getProgramStatusLabel(query.status);
  const sortLabel = getProgramSortLabel(query.sort);

  const countLabel = total === 1 ? '1 programa encontrado' : `${total} programas encontrados`;

  return (
    <div className={cn('flex flex-col gap-2.5 px-4 py-3', surface.roleGlass, radius.control)}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
          <span className="text-sm font-semibold tabular-nums tracking-tight text-slate-900">{countLabel}</span>
        </div>
        {statusLabel && (
          <span className="text-xs text-slate-500">
            Estado{' '}
            <span className="font-medium text-slate-700">{statusLabel}</span>
          </span>
        )}
        {sortLabel && (
          <span className="text-xs text-slate-500">
            Orden{' '}
            <span className="font-medium text-slate-700">{sortLabel}</span>
          </span>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onRemoveFilter(chip.param)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full bg-white/55 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-white/60 backdrop-blur-sm transition-colors hover:bg-white/80 hover:text-slate-900',
              )}
            >
              {chip.label}
              <X className="h-2.5 w-2.5 opacity-50" aria-hidden />
              <span className="sr-only">Quitar filtro</span>
            </button>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="ml-auto rounded-md px-2 py-0.5 text-[11px] font-semibold text-slate-400 transition-colors hover:text-slate-600"
            >
              Limpiar todos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
