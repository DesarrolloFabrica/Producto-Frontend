import type { ReactNode } from 'react';
import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../components/ui/tokens';
import type { SubjectOperationalState } from '../../operations/subjectOperationalState';
import {
  filterInputClass,
  filterSelectClass,
  originOptions,
  priorityOptions,
  sortOptions,
  statusOptions,
} from '../productWorkConstants';

export type ProductSubjectsOrigin = 'all' | 'new' | 'original';

export interface ProductWorkQuery {
  origin?: ProductSubjectsOrigin;
  status?: SubjectOperationalState;
  program?: string;
  semester?: number;
  priority?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  limit?: number;
  sort?: 'dueDate' | 'updatedAt' | 'priority';
}

function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <span className="block text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">{label}</span>
      {children}
    </div>
  );
}

export function ProductWorkFilters({
  query,
  onChange,
  onClear,
}: {
  query: ProductWorkQuery;
  onChange: (patch: Record<string, string | undefined>) => void;
  onClear: () => void;
}) {
  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-orange-50 text-orange-600">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-bold tracking-tight text-[#1E293B]">Filtros de revisión</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-[12px] px-3 py-2 text-xs font-bold text-[#64748B] ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50 hover:text-[#1E293B]"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Buscar materia o programa" className="sm:col-span-2 xl:col-span-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="search"
              value={query.search ?? ''}
              onChange={(e) => onChange({ search: e.target.value || undefined })}
              placeholder="Nombre de materia o programa"
              className={cn(filterInputClass, 'pl-9')}
            />
          </div>
        </FilterField>

        <FilterField label="Estado">
          <select
            value={query.status ?? ''}
            onChange={(e) => onChange({ status: e.target.value || undefined })}
            className={filterSelectClass}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value || 'ALL'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Prioridad">
          <select
            value={query.priority ?? ''}
            onChange={(e) => onChange({ priority: e.target.value || undefined })}
            className={filterSelectClass}
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value || 'ALL'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Orden">
          <select
            value={query.sort ?? ''}
            onChange={(e) => onChange({ sort: e.target.value || undefined })}
            className={filterSelectClass}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value || 'DEFAULT'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FilterField label="Origen">
          <select
            value={query.origin ?? ''}
            onChange={(e) => onChange({ origin: e.target.value || undefined })}
            className={filterSelectClass}
          >
            {originOptions.map((opt) => (
              <option key={opt.value || 'ALL'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Programa">
          <input
            type="text"
            value={query.program ?? ''}
            onChange={(e) => onChange({ program: e.target.value || undefined })}
            placeholder="Contiene texto"
            className={filterInputClass}
          />
        </FilterField>

        <FilterField label="Semestre">
          <input
            type="number"
            min={1}
            value={query.semester ?? ''}
            onChange={(e) => onChange({ semester: e.target.value ? String(e.target.value) : undefined })}
            placeholder="Ej. 1"
            className={filterInputClass}
          />
        </FilterField>

        <FilterField label="Fecha desde">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="date"
              value={query.dueFrom ?? ''}
              onChange={(e) => onChange({ dueFrom: e.target.value || undefined })}
              className={cn(filterInputClass, 'pl-9')}
            />
          </div>
        </FilterField>

        <FilterField label="Fecha hasta">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="date"
              value={query.dueTo ?? ''}
              onChange={(e) => onChange({ dueTo: e.target.value || undefined })}
              className={cn(filterInputClass, 'pl-9')}
            />
          </div>
        </FilterField>

        <FilterField label="Items por página">
          <select
            value={String(query.limit ?? 20)}
            onChange={(e) => onChange({ limit: e.target.value || undefined })}
            className={filterSelectClass}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={String(n)}>
                {n} por página
              </option>
            ))}
          </select>
        </FilterField>
      </div>
    </Card>
  );
}
