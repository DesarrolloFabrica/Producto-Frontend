import { cn } from '../../../components/ui/tokens';
import type { LmsDashboardFilter } from '../lmsTypes';

const filters: Array<{ id: LmsDashboardFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'in-upload', label: 'En carga' },
  { id: 'returned', label: 'Devueltas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'history', label: 'Historial' },
];

export function LmsFilterChips({
  active,
  onChange,
}: {
  active: LmsDashboardFilter;
  onChange: (filter: LmsDashboardFilter) => void;
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
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white/70 text-slate-500 ring-1 ring-slate-200/70 hover:bg-white hover:text-slate-700',
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
