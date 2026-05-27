import { Search, X } from 'lucide-react';
import { cn, radius, surface } from '../../../components/ui/tokens';
import type { InboxAdvancedFilters, InboxSlaFilter, InboxSortOption } from '../operationalInboxFilters';
import { hasActiveInboxAdvancedFilters } from '../operationalInboxFilters';

interface OperationalInboxAdvancedFiltersPanelProps {
  advanced: InboxAdvancedFilters;
  onAdvancedChange: (next: InboxAdvancedFilters) => void;
  className?: string;
}

const inputClass =
  'rounded-xl border border-white/55 bg-white/55 px-3 py-2.5 text-sm font-medium text-slate-700 backdrop-blur-sm focus:border-orange-300 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-orange-100/80';

export function OperationalInboxAdvancedFiltersPanel({
  advanced,
  onAdvancedChange,
  className,
}: OperationalInboxAdvancedFiltersPanelProps) {
  const hasAdvanced = hasActiveInboxAdvancedFilters(advanced);

  const clearAdvanced = () => {
    onAdvancedChange({ query: '', sla: 'all', sort: 'dueAsc' });
  };

  return (
    <div
      className={cn(
        'grid gap-3 p-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]',
        surface.roleGlassInset,
        radius.control,
        className,
      )}
    >
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={advanced.query}
          onChange={(e) => onAdvancedChange({ ...advanced, query: e.target.value })}
          placeholder="Buscar escuela, programa, asignatura o radicado…"
          className={cn(inputClass, 'w-full py-2.5 pl-10 pr-3 text-slate-800 placeholder:text-slate-400')}
        />
      </label>

      <select
        value={advanced.sla}
        onChange={(e) => onAdvancedChange({ ...advanced, sla: e.target.value as InboxSlaFilter })}
        className={inputClass}
        aria-label="Filtrar por plazo SLA"
      >
        <option value="all">Todos los plazos</option>
        <option value="on-time">A tiempo</option>
        <option value="at-risk">En riesgo</option>
        <option value="overdue">Vencidos</option>
      </select>

      <select
        value={advanced.sort}
        onChange={(e) => onAdvancedChange({ ...advanced, sort: e.target.value as InboxSortOption })}
        className={inputClass}
        aria-label="Ordenar resultados"
      >
        <option value="dueAsc">Plazo: más próximo</option>
        <option value="dueDesc">Plazo: más lejano</option>
        <option value="schoolAsc">Escuela A–Z</option>
        <option value="programAsc">Programa A–Z</option>
        <option value="stageAsc">Etapa A–Z</option>
      </select>

      <button
        type="button"
        onClick={clearAdvanced}
        disabled={!hasAdvanced}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors backdrop-blur-sm',
          hasAdvanced
            ? 'border-white/55 bg-white/55 text-slate-700 hover:bg-white/75'
            : 'cursor-not-allowed border-white/35 bg-white/25 text-slate-400',
        )}
      >
        <X className="h-3.5 w-3.5" />
        Limpiar filtros
      </button>
    </div>
  );
}
