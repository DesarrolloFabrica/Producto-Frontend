import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn, radius, surface } from '../../../components/ui/tokens';
import type { InboxAdvancedFilters } from '../operationalInboxFilters';
import { hasActiveInboxAdvancedFilters } from '../operationalInboxFilters';
import { OperationalInboxAdvancedFiltersPanel } from './OperationalInboxAdvancedFiltersPanel';

interface SecondaryLink<T extends string> {
  id: T;
  label: string;
  count: number;
}

interface OperationalInboxContextBarProps<T extends string> {
  categoryLabel: string;
  activeCategory: T;
  defaultCategory: T;
  secondaryLinks?: SecondaryLink<T>[];
  onSecondarySelect: (category: T) => void;
  onClearCategory?: () => void;
  advanced: InboxAdvancedFilters;
  onAdvancedChange: (next: InboxAdvancedFilters) => void;
  totalInCategory: number;
  visibleCount: number;
}

const secondaryActiveClass =
  'bg-white/60 text-orange-700 ring-orange-200/70 backdrop-blur-sm shadow-sm';

export function OperationalInboxContextBar<T extends string>({
  categoryLabel,
  activeCategory,
  defaultCategory,
  secondaryLinks = [],
  onSecondarySelect,
  onClearCategory,
  advanced,
  onAdvancedChange,
  totalInCategory,
  visibleCount,
}: OperationalInboxContextBarProps<T>) {
  const hasAdvanced = hasActiveInboxAdvancedFilters(advanced);
  const [expanded, setExpanded] = useState(hasAdvanced);
  const hasCategoryFilter = activeCategory !== defaultCategory;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 px-4 py-3',
          surface.roleGlass,
          radius.control,
        )}
      >
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Vista activa</p>
          <p className="text-sm font-semibold text-slate-900">
            {categoryLabel}
            <span className="ml-2 font-normal text-slate-500">
              · {visibleCount} de {totalInCategory} en vista
            </span>
          </p>
          {secondaryLinks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {secondaryLinks.map((link) => {
                const active = activeCategory === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => onSecondarySelect(link.id)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition-colors',
                      active
                        ? secondaryActiveClass
                        : 'bg-white/35 text-slate-600 ring-white/50 backdrop-blur-sm hover:bg-white/55',
                    )}
                  >
                    {link.label}
                    <span className="tabular-nums text-slate-400">({link.count})</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {hasCategoryFilter && onClearCategory ? (
            <button
              type="button"
              onClick={onClearCategory}
              className="inline-flex items-center gap-1 rounded-lg border border-orange-200/70 bg-orange-50/80 px-3 py-2 text-xs font-semibold text-orange-700 backdrop-blur-sm transition hover:bg-orange-100/80"
            >
              Quitar filtro
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors backdrop-blur-sm',
              expanded || hasAdvanced
                ? 'border-orange-200/70 bg-white/55 text-orange-700 hover:bg-white/70'
                : 'border-white/50 bg-white/35 text-slate-600 hover:bg-white/55',
            )}
          >
            Filtros avanzados
            {hasAdvanced ? (
              <span className="rounded-full bg-orange-100/90 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                Activos
              </span>
            ) : null}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {expanded ? (
        <OperationalInboxAdvancedFiltersPanel advanced={advanced} onAdvancedChange={onAdvancedChange} />
      ) : null}
    </div>
  );
}
