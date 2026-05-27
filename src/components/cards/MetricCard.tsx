import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import type { CardVariant } from '../ui/Card';
import { cn, motion, text } from '../ui/tokens';

const accentMap: Record<string, string> = {
  'text-red-500': 'border-t-red-500',
  'text-rose-500': 'border-t-rose-500',
  'text-orange-500': 'border-t-orange-500',
  'text-orange-600': 'border-t-orange-600',
  'text-emerald-500': 'border-t-emerald-500',
  'text-amber-500': 'border-t-amber-500',
  'text-indigo-500': 'border-t-indigo-500',
  'text-sky-500': 'border-t-sky-500',
};

const iconBgMap: Record<string, string> = {
  'text-red-500': 'bg-red-500/10 text-red-500',
  'text-rose-500': 'bg-rose-500/10 text-rose-600',
  'text-orange-500': 'bg-orange-500/10 text-orange-500',
  'text-orange-600': 'bg-orange-500/10 text-orange-600',
  'text-emerald-500': 'bg-emerald-500/10 text-emerald-500',
  'text-amber-500': 'bg-amber-500/10 text-amber-500',
  'text-indigo-500': 'bg-indigo-500/10 text-indigo-500',
  'text-sky-500': 'bg-sky-500/10 text-sky-500',
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'text-orange-500',
  variant = 'default',
  active = false,
  onClick,
  compact = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: string;
  variant?: Extract<CardVariant, 'default' | 'subjectPanel'>;
  active?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  const cardVariant = variant === 'subjectPanel' ? 'subjectPanel' : 'default';

  return (
    <Card variant={cardVariant === 'subjectPanel' ? 'subjectPanel' : 'roleGlass'} className="overflow-hidden p-0">
      <Wrapper
        onClick={onClick}
        className={cn(
          'w-full text-left',
          motion.default,
          onClick && motion.hoverLift,
          active && 'bg-orange-50/80 ring-1 ring-orange-200/50',
          tone,
        )}
      >
        <div className={cn('border-t-[3px]', accentMap[tone] || 'border-t-orange-500')}>
          <div className={compact ? 'p-3' : 'p-5'}>
            <div className={cn('flex items-center', compact ? 'gap-2.5' : 'gap-4')}>
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-lg',
                  compact ? 'h-8 w-8' : 'h-11 w-11 rounded-xl',
                  iconBgMap[tone] || 'bg-orange-500/10 text-orange-500',
                )}
              >
                <Icon className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
              </div>
              <div className="min-w-0">
                <p className={cn(text.label, compact && 'text-[9px] leading-tight')}>{label}</p>
                <p
                  className={cn(
                    'font-mono font-bold tracking-tight text-slate-900',
                    compact ? 'mt-0.5 text-lg' : 'mt-1 text-[1.65rem]',
                  )}
                >
                  {value}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    </Card>
  );
}
