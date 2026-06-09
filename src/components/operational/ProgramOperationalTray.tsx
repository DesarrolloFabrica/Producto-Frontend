import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { ContextLink } from '../../navigation/ContextLink';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import { formatProgramProgress } from '../../features/institutional-workflow/institutionalCopy';
import { ProgramActiveStageBadge } from '../../features/operations-v2/components/ProgramActiveStageBadge';
import { formatDate } from '../../utils/formatters';
import { cn } from '../ui/tokens';
import {
  OperationalTrayCard,
  operationalTrayVariantStyles,
  type OperationalTrayVariant,
} from '../ui/OperationalTrayCard';
import { OperationalRequestItemHeading } from './OperationalRequestItemHeading';

const TRAY_LIMIT = 5;

export function ProgramOperationalTray({
  title,
  description,
  count,
  items,
  emptyMessage,
  viewAllTo,
  onOpenProgram,
  icon: Icon = ClipboardList,
  folderVariant = 'pending',
}: {
  title: string;
  description: string;
  count: number;
  items: ProgramOperationalWorkItemDto[];
  emptyMessage: string;
  viewAllTo: string;
  onOpenProgram: (item: ProgramOperationalWorkItemDto) => void;
  icon?: LucideIcon;
  folderVariant?: OperationalTrayVariant;
}) {
  const visible = items.slice(0, TRAY_LIMIT);
  const showEmpty = count === 0 || items.length === 0;
  const styles = operationalTrayVariantStyles[folderVariant];

  const trayLink = viewAllTo ? (
    <ContextLink
      to={viewAllTo}
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-semibold transition-colors duration-180',
        styles.link,
        '[&_svg]:transition-transform [&_svg]:duration-180 hover:[&_svg]:translate-x-0.5',
      )}
    >
      Bandeja <ArrowRight className="h-3 w-3" />
    </ContextLink>
  ) : null;

  return (
    <OperationalTrayCard variant={folderVariant} compact={showEmpty}>
      <header className="relative mb-2.5 shrink-0">
        <span
          className={cn(
            'absolute right-0 top-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
            styles.kpi,
          )}
        >
          {count}
        </span>
        <div className="flex items-start gap-2.5 pr-9">
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              styles.iconBg,
            )}
          >
            <Icon className={cn('h-4 w-4', styles.icon)} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{description}</p>
          </div>
        </div>
      </header>

      <div className="flex-1">
        {showEmpty ? (
          <div className="py-1">
            <p className="text-[12px] font-medium text-slate-600">{emptyMessage}</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {visible.map((item) => (
              <li key={item.projectId}>
                <button
                  type="button"
                  onClick={() => onOpenProgram(item)}
                  className={cn(
                    'group w-full rounded-xl border border-slate-200/70 bg-white/80 px-2.5 py-2 text-left shadow-sm transition-all duration-180',
                    styles.previewHover,
                  )}
                >
                  <div className="flex items-start gap-2">
                    <OperationalRequestItemHeading program={item.program} showIcon className="min-w-0 flex-1" />
                    <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                      <ProgramActiveStageBadge stages={item.activeStageSummary} variant="compact" />
                      <ArrowRight
                        className={cn(
                          'h-3.5 w-3.5 text-slate-300 transition-colors duration-180',
                          styles.arrowHover,
                        )}
                      />
                    </div>
                  </div>
                  <p className="mt-1 truncate pl-9 text-[10px] text-slate-500">
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
      </div>

      {viewAllTo && (showEmpty || count > visible.length) && (
        <footer className="mt-auto shrink-0 border-t border-slate-100/90 pt-2.5">
          <div className="flex items-center justify-end">{trayLink}</div>
        </footer>
      )}
    </OperationalTrayCard>
  );
}
