import { X } from 'lucide-react';
import type { FactorySubjectsQuery } from '../../../services/factoryApi';
import { cn } from '../../../components/ui/tokens';
import { getActiveFilterChips, getSortLabel, getStatusLabel } from '../factoryWorkConstants';

export function FactoryWorkSummary({
  total,
  query,
  onRemoveFilter,
  onClearAll,
}: {
  total: number;
  query: FactorySubjectsQuery;
  onRemoveFilter: (param: string) => void;
  onClearAll?: () => void;
}) {
  const chips = getActiveFilterChips(query);
  const statusLabel = getStatusLabel(query.status);
  const sortLabel = getSortLabel(query.sort);

  const countLabel =
    total === 1 ? '1 programa encontrado' : `${total} programas encontrados`;

  return (
    <div className="rounded-[16px] border border-slate-200/60 bg-white/90 px-4 py-3 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-bold text-[#1E293B]">{countLabel}</span>
        {statusLabel && (
          <span className="text-[#64748B]">
            Filtro: <span className="font-semibold text-[#475569]">{statusLabel}</span>
          </span>
        )}
        {sortLabel && (
          <span className="text-[#64748B]">
            Orden: <span className="font-semibold text-[#475569]">{sortLabel}</span>
          </span>
        )}
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onRemoveFilter(chip.param)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50/80 px-3 py-1 text-xs font-semibold text-[#9A3412] transition-colors hover:bg-orange-100',
              )}
            >
              {chip.label}
              <X className="h-3 w-3 opacity-70" aria-hidden />
              <span className="sr-only">Quitar filtro</span>
            </button>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-[#64748B] transition-colors hover:bg-slate-50 hover:text-[#1E293B]"
            >
              Limpiar todos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
