import { SlidersHorizontal, X } from 'lucide-react';
import { cn, radius, surface } from '../../../components/ui/tokens';
import type { InboxAdvancedFilters } from '../operationalInboxFilters';
import { OperationalInboxAdvancedFiltersPanel } from './OperationalInboxAdvancedFiltersPanel';

const chipActiveClass = 'bg-orange-500 text-white shadow-sm ring-orange-400/40';

interface CategoryOption<T extends string> {
  id: T;
  label: string;
  count: number;
}

interface OperationalInboxFilterBarProps<T extends string> {
  categories: CategoryOption<T>[];
  activeCategory: T;
  defaultCategory: T;
  onCategoryChange: (category: T) => void;
  onClearCategory?: () => void;
  advanced: InboxAdvancedFilters;
  onAdvancedChange: (next: InboxAdvancedFilters) => void;
  totalInCategory: number;
  visibleCount: number;
}

export function OperationalInboxFilterBar<T extends string>({
  categories,
  activeCategory,
  defaultCategory,
  onCategoryChange,
  onClearCategory,
  advanced,
  onAdvancedChange,
  totalInCategory,
  visibleCount,
}: OperationalInboxFilterBarProps<T>) {
  const hasCategoryFilter = activeCategory !== defaultCategory;
  return (
    <div className={cn('space-y-4 p-4', surface.roleGlass, radius.card)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <SlidersHorizontal className="h-4 w-4 text-orange-500" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Explorar bandeja
            </span>
            <p className="text-[11px] text-slate-500">
              Elija categoría, búsqueda y orden para refinar la lista.
            </p>
          </div>
        </div>
        <span className="rounded-lg bg-white/50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 ring-1 ring-white/60 backdrop-blur-sm">
          {visibleCount} de {totalInCategory} en vista
        </span>
        {hasCategoryFilter && onClearCategory ? (
          <button
            type="button"
            onClick={onClearCategory}
            className="inline-flex items-center gap-1 rounded-lg border border-orange-200/70 bg-orange-50/80 px-3 py-1.5 text-[11px] font-bold text-orange-700 backdrop-blur-sm transition hover:bg-orange-100/80"
          >
            <X className="h-3 w-3" />
            Quitar categoría
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ring-1 backdrop-blur-sm',
              activeCategory === category.id
                ? chipActiveClass
                : 'bg-white/45 text-slate-600 ring-white/50 hover:bg-white/65 hover:text-slate-800',
            )}
          >
            {category.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums',
                activeCategory === category.id ? 'bg-white/20 text-white' : 'bg-white/50 text-slate-500',
              )}
            >
              {category.count}
            </span>
          </button>
        ))}
      </div>

      <OperationalInboxAdvancedFiltersPanel advanced={advanced} onAdvancedChange={onAdvancedChange} />
    </div>
  );
}
