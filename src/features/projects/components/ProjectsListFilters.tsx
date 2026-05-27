import { Search, X } from 'lucide-react';
import type { ProjectStatus, VirtualizationProject } from '../../../types/domain';
import { projectStatusLabels } from '../../../utils/status';
import { cn } from '../../../components/ui/tokens';
import { filterInputClass, filterSelectClass } from '../../product-work/productWorkConstants';
import type { ProjectsListQuery } from '../projectsListFilters';
import { uniqueProjectSchools } from '../projectsListFilters';

const statusOptions: Array<{ value: ProjectStatus; label: string }> = (
  Object.entries(projectStatusLabels) as Array<[ProjectStatus, string]>
).map(([value, label]) => ({ value, label }));

export function ProjectsListFilters({
  projects,
  query,
  onChange,
  onClear,
}: {
  projects: VirtualizationProject[];
  query: ProjectsListQuery;
  onChange: (patch: Record<string, string | undefined>, opts?: { resetPage?: boolean }) => void;
  onClear: () => void;
}) {
  const schools = uniqueProjectSchools(projects);
  const hasFilters = Boolean(query.search?.trim() || query.school || query.status);

  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/90 px-3 py-3 shadow-sm sm:px-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query.search ?? ''}
            onChange={(e) => onChange({ search: e.target.value || undefined }, { resetPage: true })}
            placeholder="Buscar programa, escuela o modalidad…"
            className={cn(filterInputClass, 'h-9 pl-8 text-xs')}
            aria-label="Buscar solicitudes"
          />
        </div>

        <select
          value={query.school ?? ''}
          onChange={(e) => onChange({ school: e.target.value || undefined }, { resetPage: true })}
          className={cn(filterSelectClass, 'h-9 min-w-[160px] max-w-[220px] text-xs')}
          aria-label="Filtrar por escuela"
        >
          <option value="">Todas las escuelas</option>
          {schools.map((school) => (
            <option key={school} value={school}>
              {school}
            </option>
          ))}
        </select>

        <select
          value={query.status ?? ''}
          onChange={(e) => onChange({ status: e.target.value || undefined }, { resetPage: true })}
          className={cn(filterSelectClass, 'h-9 min-w-[150px] max-w-[200px] text-xs')}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 items-center gap-1 rounded-[10px] px-2.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Limpiar
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ProjectsListFilterSummary({
  filteredCount,
  totalCount,
  query,
  onRemoveFilter,
}: {
  filteredCount: number;
  totalCount: number;
  query: ProjectsListQuery;
  onRemoveFilter: (param: string) => void;
}) {
  const chips: Array<{ param: string; label: string }> = [];
  if (query.search?.trim()) chips.push({ param: 'search', label: `Buscar: ${query.search.trim()}` });
  if (query.school) chips.push({ param: 'school', label: `Escuela: ${query.school}` });
  if (query.status) chips.push({ param: 'status', label: `Estado: ${projectStatusLabels[query.status]}` });

  const countLabel =
    filteredCount === totalCount
      ? `${totalCount} solicitud${totalCount !== 1 ? 'es' : ''}`
      : `${filteredCount} de ${totalCount} solicitudes`;

  if (chips.length === 0) {
    return (
      <p className="text-[11px] font-medium text-slate-500">
        {countLabel} en el portafolio
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold text-slate-600">{countLabel}</span>
      {chips.map((chip) => (
        <button
          key={chip.param}
          type="button"
          onClick={() => onRemoveFilter(chip.param)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100"
        >
          {chip.label}
          <X className="h-2.5 w-2.5 opacity-60" aria-hidden />
        </button>
      ))}
    </div>
  );
}
