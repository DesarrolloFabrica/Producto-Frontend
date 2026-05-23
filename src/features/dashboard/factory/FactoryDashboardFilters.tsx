import { Search } from 'lucide-react';
import type { SubjectOperationalState } from '../../operations/subjectOperationalState';
import { cn } from '../../../components/ui/tokens';

export type DashboardTab = 'active' | 'corrections' | 'review' | 'completed' | 'all';

const tabs: { id: DashboardTab; label: string }[] = [
  { id: 'active', label: 'Activas' },
  { id: 'corrections', label: 'Correcciones' },
  { id: 'review', label: 'En revisión' },
  { id: 'completed', label: 'Completadas' },
  { id: 'all', label: 'Todas' },
];

const stateFilterOptions: { value: SubjectOperationalState | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'CHANGES_REQUESTED', label: 'Correcciones pendientes' },
  { value: 'IN_PRODUCTION', label: 'En producción' },
  { value: 'NOT_STARTED', label: 'Por iniciar' },
  { value: 'IN_REVIEW', label: 'En revisión Product' },
  { value: 'CORRECTION_SENT', label: 'Corrección enviada' },
  { value: 'APPROVED', label: 'Aprobadas' },
];

export function FactoryDashboardFilters({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
}: {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  stateFilter: SubjectOperationalState | 'ALL';
  onStateFilterChange: (value: SubjectOperationalState | 'ALL') => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'rounded-[12px] px-3 py-2 text-xs font-bold transition-all',
              activeTab === tab.id
                ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20'
                : 'bg-white text-[#64748B] ring-1 ring-slate-200/60 hover:bg-slate-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar materia o programa..."
            className="w-full rounded-[12px] border border-slate-200/80 bg-white py-2 pl-9 pr-3 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20"
          />
        </div>
        <select
          value={stateFilter}
          onChange={(e) => onStateFilterChange(e.target.value as SubjectOperationalState | 'ALL')}
          className="rounded-[12px] border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-[#64748B] focus:border-[#FF6B00] focus:outline-none"
        >
          {stateFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function filterWorkItemsByTab(
  items: import('../../operations/subjectOperationalState').SubjectWorkItem[],
  tab: DashboardTab,
): import('../../operations/subjectOperationalState').SubjectWorkItem[] {
  switch (tab) {
    case 'corrections':
      return items.filter(
        (i) =>
          i.operationalState === 'CHANGES_REQUESTED' ||
          i.operationalState === 'CORRECTION_SENT',
      );
    case 'review':
      return items.filter((i) => i.operationalState === 'IN_REVIEW');
    case 'completed':
      return items.filter((i) => i.operationalState === 'APPROVED');
    case 'active':
      return items.filter((i) => i.operationalState !== 'APPROVED');
    default:
      return items;
  }
}
