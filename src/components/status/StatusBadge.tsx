import type { ChecklistStatus, ProjectStatus, SemesterStatus, SubjectStatus } from '../../types/domain';
import {
  checklistStatusLabels,
  checklistStatusTone,
  projectStatusLabels,
  projectStatusTone,
  semesterStatusLabels,
  semesterStatusTone,
  subjectStatusLabels,
  subjectStatusTone,
} from '../../utils/status';
import { cn } from '../ui/tokens';

export function StatusBadge({
  status,
  size = 'default',
}: {
  status: ProjectStatus | ChecklistStatus | SubjectStatus | SemesterStatus;
  size?: 'default' | 'sm';
}) {
  const label =
    status in projectStatusLabels
      ? projectStatusLabels[status as ProjectStatus]
      : status in subjectStatusLabels
        ? subjectStatusLabels[status as SubjectStatus]
        : status in semesterStatusLabels
          ? semesterStatusLabels[status as SemesterStatus]
          : checklistStatusLabels[status as ChecklistStatus];

  const tone =
    status in projectStatusTone
      ? projectStatusTone[status as ProjectStatus]
      : status in subjectStatusTone
        ? subjectStatusTone[status as SubjectStatus]
        : status in semesterStatusTone
          ? semesterStatusTone[status as SemesterStatus]
          : checklistStatusTone[status as ChecklistStatus];

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
