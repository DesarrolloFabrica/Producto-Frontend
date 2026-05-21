import type { Priority } from '../../types/domain';
import { priorityLabels, priorityTone } from '../../utils/status';
import { cn } from '../ui/tokens';

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cn('inline-flex rounded-[12px] border px-2.5 py-1 text-[0.7rem] font-semibold capitalize tracking-[0.05em]', priorityTone[priority])}>{priorityLabels[priority]}</span>;
}
