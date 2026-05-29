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
}: {
  view: FactoryDashboardView;
  search: string;
  onViewChange: (view: FactoryDashboardView) => void;
  onSearchChange: (search: string) => void;
}) {
  const trimmedSearch = search.trim();
  const fullSearchUrl = trimmedSearch
    ? `/factory/work?search=${encodeURIComponent(trimmedSearch)}`
    : '/factory/work';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FACTORY_DASHBOARD_VIEWS.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onViewChange(link.id)}
            className={cn(
              'rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200',
              view === link.id
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white/80 text-slate-600 ring-1 ring-slate-200/60 hover:bg-slate-50',
            )}
          >
            {link.label}
          </button>
        ))}
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
