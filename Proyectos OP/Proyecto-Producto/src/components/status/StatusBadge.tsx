import type { ChecklistStatus, ProjectStatus } from '../../types/domain';
import { checklistStatusLabels, checklistStatusTone, projectStatusLabels, projectStatusTone } from '../../utils/status';
import { cn } from '../ui/tokens';

export function StatusBadge({ status, size = 'default' }: { status: ProjectStatus | ChecklistStatus; size?: 'default' | 'sm' }) {
  const label = status in projectStatusLabels ? projectStatusLabels[status as ProjectStatus] : checklistStatusLabels[status as ChecklistStatus];
  const tone = status in projectStatusTone ? projectStatusTone[status as ProjectStatus] : checklistStatusTone[status as ChecklistStatus];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center font-semibold uppercase tracking-[0.05em]',
        size === 'sm' ? 'rounded-[12px] px-2 py-0.5 text-[8px]' : 'rounded-[12px] px-3 py-1.5 text-[9px]',
        tone,
      )}
    >
      {label}
    </span>
  );
}
