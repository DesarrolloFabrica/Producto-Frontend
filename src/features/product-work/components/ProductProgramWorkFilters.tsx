import type { ReactNode } from 'react';
import { CalendarDays, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../components/ui/tokens';
import type { ProductProgramWorkQuery } from '../productProgramWork';
import {
  filterInputClass,
  filterLabelClass,
  filterSelectClass,
  programSortOptions,
  programStatusOptions,
} from '../productProgramWorkConstants';

function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <span className={filterLabelClass}>{label}</span>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(filterSelectClass, 'pr-8')}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
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
    <Card variant="roleGlass" className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.25} />
          <span className="text-xs font-semibold tracking-tight text-slate-700">Filtros de programas</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-400 transition-colors hover:bg-white/50 hover:text-slate-600"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Buscar programa o escuela" className="sm:col-span-2 xl:col-span-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query.search ?? ''}
              onChange={(e) => onChange({ search: e.target.value || undefined })}
              placeholder="Nombre de programa o escuela"
              className={cn(filterInputClass, 'pl-8')}
            />
          </div>
        </FilterField>

        <FilterField label="Estado">
          <SelectField value={query.status ?? ''} onChange={(v) => onChange({ status: v || undefined })}>
            {programStatusOptions.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </SelectField>
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
          <SelectField value={query.school ?? ''} onChange={(v) => onChange({ school: v || undefined })}>
            <option value="">Todas las escuelas</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </SelectField>
        </FilterField>

        <FilterField label="Orden">
          <SelectField value={query.sort ?? ''} onChange={(v) => onChange({ sort: v || undefined })}>
            {programSortOptions.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </SelectField>
        </FilterField>

        <FilterField label="Fecha desde">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={query.dueFrom ?? ''}
              onChange={(e) => onChange({ dueFrom: e.target.value || undefined })}
              className={cn(filterInputClass, 'pl-8')}
            />
          </div>
        </FilterField>

        <FilterField label="Fecha hasta">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={query.dueTo ?? ''}
              onChange={(e) => onChange({ dueTo: e.target.value || undefined })}
              className={cn(filterInputClass, 'pl-8')}
            />
          </div>
        </FilterField>

        <FilterField label="Items por página">
          <SelectField value={String(query.limit ?? 20)} onChange={(v) => onChange({ limit: v })}>
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={String(n)}>
                {n} por página
              </option>
            ))}
          </SelectField>
        </FilterField>
      </div>
    </Card>
  );
}
