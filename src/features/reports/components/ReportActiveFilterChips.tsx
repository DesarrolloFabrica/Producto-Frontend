import { X } from 'lucide-react';
import type { ReportFiltersState } from '../../../services/types/reportingApi.types';
import { clearFilterKey, type ActiveFilterChip } from '../reportActiveFilterUtils';

type Props = {
  chips: ActiveFilterChip[];
  onChange: (next: ReportFiltersState) => void;
  filters: ReportFiltersState;
  onClearAll: () => void;
};

export function ReportActiveFilterChips({ chips, filters, onChange, onClearAll }: Props) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100/80 pt-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activos</span>
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.valueLabel}`}
          type="button"
          className="inline-flex max-w-[220px] items-center gap-1 rounded-full bg-white/90 py-1 pl-2.5 pr-1.5 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200/80 transition-colors hover:bg-orange-50 hover:ring-orange-200/80"
          onClick={() => onChange(clearFilterKey(filters, chip.key))}
          title={`Quitar filtro ${chip.label}`}
        >
          <span className="truncate">
            <span className="text-slate-400">{chip.label}:</span> {chip.valueLabel}
          </span>
          <X className="h-3 w-3 shrink-0 text-slate-400" />
        </button>
      ))}
      <button
        type="button"
        className="ml-auto text-[10px] font-bold text-orange-600 transition-colors hover:text-orange-700"
        onClick={onClearAll}
      >
        Limpiar todo
      </button>
    </div>
  );
}
