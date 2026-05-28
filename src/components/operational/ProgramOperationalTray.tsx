import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { ContextLink } from '../../navigation/ContextLink';
import { Card } from '../ui/Card';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import { formatProgramProgress } from '../../features/institutional-workflow/institutionalCopy';
import { ProgramActiveStageBadge } from '../../features/operations-v2/components/ProgramActiveStageBadge';
import { formatDate } from '../../utils/formatters';
import { OperationalRequestItemHeading } from './OperationalRequestItemHeading';

const TRAY_LIMIT = 4;

export function ProgramOperationalTray({
  title,
  description,
  count,
  items,
  emptyMessage,
  viewAllTo,
  onOpenProgram,
  icon: Icon = ClipboardList,
}: {
  title: string;
  description: string;
  count: number;
  items: ProgramOperationalWorkItemDto[];
  emptyMessage: string;
  viewAllTo: string;
  onOpenProgram: (item: ProgramOperationalWorkItemDto) => void;
  icon?: LucideIcon;
}) {
  const visible = items.slice(0, TRAY_LIMIT);
  const showEmpty = count === 0 || items.length === 0;

  return (
    <Card variant="subjectPanel" glass className="p-3 sm:p-3.5">
      <div className="mb-2.5 flex items-start gap-2 border-b border-slate-200/70 pb-2.5">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500/80" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">Bandeja</p>
            <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
              {count}
            </span>
          </div>
          <h2 className="truncate text-sm font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-slate-500">{description}</p>
        </div>
      </div>

      {showEmpty ? (
        <div className="flex items-center justify-between gap-2 py-1.5">
          <p className="text-[11px] text-slate-400">{emptyMessage}</p>
          {viewAllTo ? (
            <ContextLink
              to={viewAllTo}
              className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-orange-600 hover:text-orange-700"
            >
              Bandeja <ArrowRight className="h-3 w-3" />
            </ContextLink>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <li key={item.projectId}>
              <button
                type="button"
                onClick={() => onOpenProgram(item)}
                className="group w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-2.5 py-2.5 text-left shadow-sm transition-all hover:border-orange-200/90 hover:bg-orange-50/50 hover:shadow-md"
              >
                <div className="flex items-start gap-2">
                  <OperationalRequestItemHeading program={item.program} showIcon className="min-w-0 flex-1" />
                  <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                    <ProgramActiveStageBadge stages={item.activeStageSummary} variant="compact" />
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-orange-500" />
                  </div>
                </div>
                <p className="mt-1.5 truncate pl-9 text-[10px] text-slate-500">
                  {item.school}
                  <span className="mx-1 text-slate-300">·</span>
                  {formatProgramProgress({
                    completedSemesters: item.completedSemesters,
                    totalSemesters: item.totalSemesters,
                    completedSubjects: item.completedSubjects,
                    totalSubjects: item.totalSubjects,
                  })}
                  {item.nearestDueDate ? (
                    <>
                      <span className="mx-1 text-slate-300">·</span>
                      {formatDate(item.nearestDueDate)}
                    </>
                  ) : null}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {count > visible.length && (
        <div className="mt-1 border-t border-slate-100 pt-1.5">
          <ContextLink
            to={viewAllTo}
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-600 hover:text-orange-700"
          >
            Ver todos ({count}) <ArrowRight className="h-3 w-3" />
          </ContextLink>
        </div>
      )}
    </Card>
  );
}
