import { Search } from 'lucide-react';
import { ContextLink } from '../../../navigation/ContextLink';
import { cn } from '../../../components/ui/tokens';
import {
  FACTORY_DASHBOARD_VIEWS,
  type FactoryDashboardView,
} from './factoryDashboardViews';

export function FactoryDashboardQuickNav({
  view,
  search,
  onViewChange,
  onSearchChange,
  viewCounts,
}: {
  view: FactoryDashboardView;
  search: string;
  onViewChange: (view: FactoryDashboardView) => void;
  onSearchChange: (search: string) => void;
  viewCounts: Record<FactoryDashboardView, number>;
}) {
  const trimmedSearch = search.trim();
  const fullSearchUrl = trimmedSearch
    ? `/factory/work?search=${encodeURIComponent(trimmedSearch)}`
    : '/factory/work';

  return (
    <div className="space-y-3">
      <div
        className="inline-flex max-w-full flex-wrap gap-0.5 border-b border-slate-200/70"
        role="tablist"
        aria-label="Filtrar bandejas"
      >
        {FACTORY_DASHBOARD_VIEWS.map((link) => {
          const isActive = view === link.id;
          const count = viewCounts[link.id];

          return (
            <button
              key={link.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onViewChange(link.id)}
              className={cn(
                'relative inline-flex items-center gap-1.5 px-3 py-2 text-[11px] transition-colors duration-180',
                isActive
                  ? 'font-semibold text-slate-900 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--fac-primary)]/75'
                  : 'font-medium text-slate-500 hover:text-slate-800',
              )}
            >
              <span>{link.label}</span>
              <span
                className={cn(
                  'tabular-nums text-[10px] font-medium',
                  isActive ? 'text-slate-600' : 'text-slate-400',
                )}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar programa o escuela..."
            className="w-full rounded-[12px] border border-slate-200/80 bg-white py-2 pl-9 pr-3 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20"
          />
        </div>
        {trimmedSearch ? (
          <ContextLink
            to={fullSearchUrl}
            className="shrink-0 text-xs font-bold text-orange-700 hover:text-orange-800"
          >
            Ver resultados completos
          </ContextLink>
        ) : null}
      </div>
    </div>
  );
}
