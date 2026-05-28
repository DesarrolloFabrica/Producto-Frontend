import { Search, X } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { cn, surface } from '../../../components/ui/tokens';
import {
  ADMIN_TRACKING_OWNER_OPTIONS,
  type AdminTrackingFiltersState,
  hasActiveAdminFilters,
} from '../adminTrackingFilters';

interface AdminTrackingFiltersProps {
  filters: AdminTrackingFiltersState;
  modalityOptions: string[];
  schoolOptions: string[];
  visibleCount: number;
  totalCount: number;
  onChange: (next: AdminTrackingFiltersState) => void;
  onClear: () => void;
}

const fieldClass =
  'h-9 w-full rounded-xl border border-white/60 bg-white/90 px-3 text-xs font-medium text-slate-700 shadow-sm outline-none backdrop-blur-sm transition-colors focus:border-orange-300 focus:ring-1 focus:ring-orange-100';

export function AdminTrackingFilters({
  filters,
  modalityOptions,
  schoolOptions,
  visibleCount,
  totalCount,
  onChange,
  onClear,
}: AdminTrackingFiltersProps) {
  const active = hasActiveAdminFilters(filters);

  return (
    <Card variant="roleGlass" className={cn('p-3 sm:p-4', surface.glassSubtle)}>
      <div className="flex flex-col gap-3">
        <label className="relative block min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Buscar programa, escuela, semestre, responsable…"
            className={cn(fieldClass, 'pl-9')}
          />
        </label>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={filters.owner}
            onChange={(e) =>
              onChange({ ...filters, owner: e.target.value as AdminTrackingFiltersState['owner'] })
            }
            className={fieldClass}
            aria-label="Filtrar por responsable"
          >
            {ADMIN_TRACKING_OWNER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                Responsable: {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.school}
            onChange={(e) => onChange({ ...filters, school: e.target.value })}
            className={fieldClass}
            aria-label="Filtrar por escuela"
          >
            <option value="all">Todas las escuelas</option>
            {schoolOptions.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>

          <select
            value={filters.modality}
            onChange={(e) => onChange({ ...filters, modality: e.target.value })}
            className={fieldClass}
            aria-label="Filtrar por modalidad"
          >
            <option value="all">Todas las modalidades</option>
            {modalityOptions.map((modality) => (
              <option key={modality} value={modality}>
                {modality}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-2 backdrop-blur-sm">
            <span className="text-[11px] font-semibold text-slate-500">
              {visibleCount} de {totalCount}
            </span>
            {active ? (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-white"
              >
                <X className="h-3 w-3" />
                Limpiar
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
