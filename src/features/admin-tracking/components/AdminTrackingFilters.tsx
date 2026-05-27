import { Search, X } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';
import {
  ADMIN_TRACKING_OWNER_OPTIONS,
  ADMIN_TRACKING_STATUS_OPTIONS,
  type AdminTrackingFiltersState,
  hasActiveAdminFilters,
} from '../adminTrackingFilters';

interface AdminTrackingFiltersProps {
  filters: AdminTrackingFiltersState;
  modalityOptions: string[];
  visibleCount: number;
  totalCount: number;
  onChange: (next: AdminTrackingFiltersState) => void;
  onClear: () => void;
}

const fieldClass =
  'h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-orange-300 focus:ring-1 focus:ring-orange-100';

export function AdminTrackingFilters({
  filters,
  modalityOptions,
  visibleCount,
  totalCount,
  onChange,
  onClear,
}: AdminTrackingFiltersProps) {
  const active = hasActiveAdminFilters(filters);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="relative block min-w-0 flex-1 lg:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Buscar programa, escuela o modalidad"
            className={cn(fieldClass, 'pl-8')}
          />
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-2">
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value as AdminTrackingFiltersState['status'] })
            }
            className={cn(fieldClass, 'lg:w-[9.5rem]')}
            aria-label="Filtrar por estado"
          >
            {ADMIN_TRACKING_STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.owner}
            onChange={(e) =>
              onChange({ ...filters, owner: e.target.value as AdminTrackingFiltersState['owner'] })
            }
            className={cn(fieldClass, 'lg:w-[8.5rem]')}
            aria-label="Filtrar por responsable"
          >
            {ADMIN_TRACKING_OWNER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.modality}
            onChange={(e) => onChange({ ...filters, modality: e.target.value })}
            className={cn(fieldClass, 'col-span-2 sm:col-span-1 lg:w-[9.5rem]')}
            aria-label="Filtrar por modalidad"
          >
            <option value="all">Todas</option>
            {modalityOptions.map((modality) => (
              <option key={modality} value={modality}>
                {modality}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2 lg:ml-auto lg:justify-end">
          <span className="whitespace-nowrap text-[10px] font-semibold text-slate-500">
            {visibleCount} de {totalCount}
          </span>
          {active ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
