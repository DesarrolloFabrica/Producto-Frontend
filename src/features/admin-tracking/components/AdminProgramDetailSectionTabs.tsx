import { cn, radius, surface } from '../../../components/ui/tokens';

export type AdminProgramDetailTab =
  | 'overview'
  | 'semesters'
  | 'subjects'
  | 'checklist'
  | 'institutional';

const tabActiveClass = 'bg-white/75 text-orange-700 ring-orange-200/80 backdrop-blur-sm shadow-sm';

export function AdminProgramDetailSectionTabs({
  active,
  onChange,
  counts,
}: {
  active: AdminProgramDetailTab;
  onChange: (tab: AdminProgramDetailTab) => void;
  counts: {
    semesters: number;
    subjects: number;
    checklist: number;
    hasInstitutional: boolean;
  };
}) {
  const tabs: Array<{ id: AdminProgramDetailTab; label: string; count?: number }> = [
    { id: 'overview', label: 'Resumen' },
    { id: 'semesters', label: 'Semestres', count: counts.semesters },
    { id: 'subjects', label: 'Materias', count: counts.subjects },
    { id: 'checklist', label: 'Checklist', count: counts.checklist },
  ];

  if (counts.hasInstitutional) {
    tabs.push({ id: 'institutional', label: 'Radicación y cierre' });
  }

  return (
    <div className={cn('inline-flex max-w-full flex-wrap gap-1 p-1', surface.roleGlassTab, radius.control)}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all',
              isActive
                ? cn('ring-1', tabActiveClass)
                : 'text-slate-600 hover:bg-white/45 hover:text-slate-800',
            )}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 ? (
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                  isActive ? 'bg-orange-100/80 text-orange-800' : 'bg-white/50 text-slate-500',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
