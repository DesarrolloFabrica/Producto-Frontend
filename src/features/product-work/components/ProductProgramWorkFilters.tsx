import type { ReactNode } from 'react';
import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../components/ui/tokens';
import type { ProductProgramWorkQuery } from '../productProgramWork';
import {
  filterInputClass,
  filterSelectClass,
  programSortOptions,
  programStatusOptions,
} from '../productProgramWorkConstants';

function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <span className="block text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">{label}</span>
      {children}
    </div>
  );
}

export function ProductProgramWorkFilters({
  query,
  schools,
  onChange,
  onClear,
}: {
  query: ProductProgramWorkQuery;
  schools: string[];
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
          <h2 className="text-sm font-bold tracking-tight text-[#1E293B]">Filtros de programas</h2>
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
        <FilterField label="Buscar programa o escuela" className="sm:col-span-2 xl:col-span-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="search"
              value={query.search ?? ''}
              onChange={(e) => onChange({ search: e.target.value || undefined })}
              placeholder="Nombre de programa o escuela"
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
            {programStatusOptions.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
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

        <FilterField label="Escuela">
          <select
            value={query.school ?? ''}
            onChange={(e) => onChange({ school: e.target.value || undefined })}
            className={filterSelectClass}
          >
            <option value="">Todas las escuelas</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
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
            {programSortOptions.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
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
            onChange={(e) => onChange({ limit: e.target.value })}
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
