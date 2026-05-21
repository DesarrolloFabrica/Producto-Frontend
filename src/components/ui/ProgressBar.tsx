import { formatPercent } from '../../utils/formatters';
import { cn } from './tokens';

export function ProgressBar({ value, className, showLabel = true, size = 'md' }: { value: number; className?: string; showLabel?: boolean; size?: 'sm' | 'md' }) {
  const safeValue = Math.min(100, Math.max(0, value));
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';

  if (!showLabel) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className={cn('relative min-w-0 flex-1 overflow-hidden rounded-[10px] bg-[#F1F5F9]', barHeight)}>
          <div className={cn('relative h-full rounded-[10px] bg-linear-to-r from-[#FF7E5F] to-[#FEB47B] progress-glow')} style={{ width: `${safeValue}%` }} />
        </div>
        <span className="shrink-0 text-xs font-bold tabular-nums text-[#64748B]">{formatPercent(safeValue)}</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
        <span>Avance</span>
        <span>{formatPercent(safeValue)}</span>
      </div>
      <div className={cn('relative overflow-hidden rounded-[10px] bg-[#F1F5F9]', barHeight)}>
        <div className="relative h-full rounded-[10px] bg-linear-to-r from-[#FF7E5F] to-[#FEB47B] progress-glow" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
