import { CheckSquare, ClipboardCheck, Layers3 } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';

export type ProductReviewPanel = 'checklist' | 'topics' | 'cierre';

const PANELS: Array<{
  id: ProductReviewPanel;
  label: string;
  shortLabel: string;
  icon: typeof CheckSquare;
}> = [
  { id: 'checklist', label: 'Entregables', shortLabel: 'Checklist', icon: CheckSquare },
  { id: 'topics', label: 'Temas / gránulos', shortLabel: 'Temas', icon: Layers3 },
  { id: 'cierre', label: 'Cierre', shortLabel: 'Cierre', icon: ClipboardCheck },
];

export function ProductSubjectReviewPanelTabs({
  activePanel,
  onChange,
  checklistPending,
  topicsPending,
  closurePending,
}: {
  activePanel: ProductReviewPanel;
  onChange: (panel: ProductReviewPanel) => void;
  checklistPending: number;
  topicsPending: boolean;
  closurePending: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
      <div className="grid grid-cols-3 gap-1">
        {PANELS.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = activePanel === id;
          const pending =
            id === 'checklist' ? checklistPending > 0 : id === 'topics' ? topicsPending : closurePending;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center transition-all sm:flex-row sm:justify-center sm:gap-2 sm:px-3',
                isActive
                  ? 'bg-orange-50 text-orange-800 ring-1 ring-orange-200/80'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-orange-600' : 'text-slate-400')} />
              <span className="text-[11px] font-bold sm:text-xs">
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </span>
              {pending ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                    isActive ? 'bg-orange-600 text-white' : 'bg-amber-100 text-amber-800',
                  )}
                >
                  {id === 'checklist' ? checklistPending : 'Pend.'}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
