import { Inbox, SlidersHorizontal } from 'lucide-react';
import { cn, radius, surface } from '../../../components/ui/tokens';
import type { InboxPanelMode } from '../operationalInboxPanel';

const tabActiveClass = 'bg-white/75 text-orange-700 ring-orange-200/80 backdrop-blur-sm shadow-sm';

interface OperationalInboxViewTabsProps {
  mode: InboxPanelMode;
  onChange: (mode: InboxPanelMode) => void;
  hasActiveAdvancedFilters?: boolean;
  hasExploreCategoryFilter?: boolean;
}

export function OperationalInboxViewTabs({
  mode,
  onChange,
  hasActiveAdvancedFilters = false,
  hasExploreCategoryFilter = false,
}: OperationalInboxViewTabsProps) {
  const exploreHasPendingFilters =
    hasActiveAdvancedFilters || hasExploreCategoryFilter;
  const tabs: Array<{ id: InboxPanelMode; label: string; icon: typeof Inbox }> = [
    { id: 'inbox', label: 'Bandeja de trabajo', icon: Inbox },
    { id: 'explore', label: 'Explorar y filtrar', icon: SlidersHorizontal },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={cn('inline-flex p-1', surface.roleGlassTab, radius.control)}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all',
                active
                  ? cn('ring-1', tabActiveClass)
                  : 'text-slate-600 hover:bg-white/45 hover:text-slate-800',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === 'explore' && exploreHasPendingFilters && !active ? (
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
