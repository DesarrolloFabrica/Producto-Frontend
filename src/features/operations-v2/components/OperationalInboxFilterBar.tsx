import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';
import type { InboxAdvancedFilters, InboxSlaFilter, InboxSortOption } from '../operationalInboxFilters';
import { hasActiveInboxAdvancedFilters } from '../operationalInboxFilters';

type Accent = 'planning' | 'lms';

const accentChipActive: Record<Accent, string> = {
  planning: 'bg-indigo-500 text-white shadow-sm ring-indigo-500',
  lms: 'bg-sky-500 text-white shadow-sm ring-sky-500',
};

interface CategoryOption<T extends string> {
  id: T;
  label: string;
  count: number;
}

interface OperationalInboxFilterBarProps<T extends string> {
  accent: Accent;
  categories: CategoryOption<T>[];
  activeCategory: T;
  onCategoryChange: (category: T) => void;
  advanced: InboxAdvancedFilters;
  onAdvancedChange: (next: InboxAdvancedFilters) => void;
  totalInCategory: number;
  visibleCount: number;
}

export function OperationalInboxFilterBar<T extends string>({
  accent,
  categories,
  activeCategory,
  onCategoryChange,
  advanced,
  onAdvancedChange,
  totalInCategory,
  visibleCount,
}: OperationalInboxFilterBarProps<T>) {
  const hasAdvanced = hasActiveInboxAdvancedFilters(advanced);

  const clearAdvanced = () => {
    onAdvancedChange({ query: '', sla: 'all', sort: 'dueAsc' });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Filtros de bandeja</span>
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
          {visibleCount} de {totalInCategory} en vista
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ring-1',
              activeCategory === category.id
                ? accentChipActive[accent]
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800',
            )}
          >
            {category.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums',
                activeCategory === category.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
              )}
            >
              {category.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={advanced.query}
            onChange={(e) => onAdvancedChange({ ...advanced, query: e.target.value })}
            placeholder="Buscar escuela, programa, asignatura o radicado…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <select
          value={advanced.sla}
          onChange={(e) => onAdvancedChange({ ...advanced, sla: e.target.value as InboxSlaFilter })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
            'inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
            hasAdvanced
              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400',
          )}
        >
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
