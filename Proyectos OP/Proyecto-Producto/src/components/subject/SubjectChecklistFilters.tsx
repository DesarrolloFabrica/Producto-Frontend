import type { ChecklistItem, ChecklistStatus } from '../../types/domain';
import { checklistStatusLabels } from '../../utils/status';
import { cn } from '../ui/tokens';

export type SubjectChecklistFilter = 'TODOS' | ChecklistStatus;

const statusOrder: ChecklistStatus[] = ['PENDIENTE', 'EN_PRODUCCION', 'ENTREGADO', 'APROBADO', 'NO_EXISTE'];

const activeTint: Record<SubjectChecklistFilter, string> = {
  TODOS: 'border-orange-200 bg-white text-slate-900 shadow-md shadow-orange-500/10 ring-2 ring-orange-100/80',
  PENDIENTE: 'border-amber-200 bg-amber-50 text-amber-950 shadow-md ring-2 ring-amber-100/80',
  EN_PRODUCCION: 'border-orange-200 bg-orange-50 text-orange-950 shadow-md ring-2 ring-orange-100/90',
  ENTREGADO: 'border-blue-200 bg-blue-50 text-blue-950 shadow-md ring-2 ring-blue-100/80',
  APROBADO: 'border-emerald-200 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-100/80',
  NO_EXISTE: 'border-slate-200 bg-slate-50 text-slate-900 shadow-md ring-2 ring-slate-100',
};

export function SubjectChecklistFilters({
  checklist,
  activeFilter,
  onFilterChange,
}: {
  checklist: ChecklistItem[];
  activeFilter: SubjectChecklistFilter;
  onFilterChange: (f: SubjectChecklistFilter) => void;
}) {
  const count = (status: SubjectChecklistFilter) =>
    status === 'TODOS' ? checklist.length : checklist.filter((i) => i.status === status).length;

  const segments: Array<{ id: SubjectChecklistFilter; label: string }> = [
    { id: 'TODOS', label: 'Todos' },
    ...statusOrder.map((id) => ({ id, label: checklistStatusLabels[id] })),
  ];

  return (
    <div className="rounded-[28px] border border-orange-100/90 bg-white/90 p-1.5 shadow-[inset_0_2px_8px_rgba(249,115,22,0.06),0_8px_28px_rgba(249,115,22,0.08)]">
      <div className="flex flex-wrap gap-1.5">
        {segments.map(({ id, label }) => {
          const active = activeFilter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              className={cn(
                'inline-flex min-h-10 items-center gap-2 rounded-[22px] border border-transparent px-3.5 py-2 text-left text-xs font-bold text-slate-600 transition-all',
                'hover:border-orange-100 hover:bg-orange-50/50 hover:text-slate-900',
                active && activeTint[id],
              )}
            >
              <span>{label}</span>
              <span
                className={cn(
                  'inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums',
                  active ? 'bg-slate-900/10 text-current' : 'bg-orange-50/80 text-orange-700/80 ring-1 ring-orange-100/80',
                )}
              >
                {count(id)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
