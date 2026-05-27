import { cn } from '../../../components/ui/tokens';
import type { PlanningDashboardFilter } from '../planningTypes';

const filters: Array<{ id: PlanningDashboardFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'initial', label: 'Validación inicial' },
  { id: 'production', label: 'Validación producción' },
  { id: 'lms', label: 'Validación LMS' },
  { id: 'radication', label: 'Radicación' },
  { id: 'returned', label: 'Devueltas' },
  { id: 'history', label: 'Finalizadas / Historial' },
];

export function PlanningFilterChips({
  active,
  onChange,
}: {
  active: PlanningDashboardFilter;
  onChange: (filter: PlanningDashboardFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all',
            active === f.id
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'bg-white/70 text-slate-500 ring-1 ring-slate-200/70 hover:bg-white hover:text-slate-700',
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
