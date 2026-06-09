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
  'text-violet-500': 'border-t-violet-500',
  'text-sky-500': 'border-t-sky-500',
  'text-[#1E293B]': 'border-t-slate-400',
};

const iconBgMap: Record<string, string> = {
  'text-red-500': 'bg-red-500/10 text-red-500',
  'text-rose-500': 'bg-rose-500/10 text-rose-600',
  'text-orange-500': 'bg-orange-500/10 text-orange-500',
  'text-orange-600': 'bg-orange-500/10 text-orange-600',
  'text-emerald-500': 'bg-emerald-500/10 text-emerald-500',
  'text-amber-500': 'bg-amber-500/10 text-amber-500',
  'text-indigo-500': 'bg-indigo-500/10 text-indigo-500',
  'text-violet-500': 'bg-violet-500/10 text-violet-600',
  'text-sky-500': 'bg-sky-500/10 text-sky-500',
  'text-[#1E293B]': 'bg-slate-500/8 text-slate-600',
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
  executive = false,
  featured = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: string;
  variant?: Extract<CardVariant, 'default' | 'subjectPanel'>;
  active?: boolean;
  onClick?: () => void;
  compact?: boolean;
  /** KPI denso estilo dashboard ejecutivo (Linear / Stripe) */
  executive?: boolean;
  /** KPI principal del dashboard — ligero énfasis visual */
  featured?: boolean;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  const cardVariant = variant === 'subjectPanel' ? 'subjectPanel' : 'default';
  const topAccent = accentMap[tone] || 'border-t-orange-500';
  const iconStyles = iconBgMap[tone] || 'bg-orange-500/10 text-orange-500';

  if (executive) {
    const isSecondary = !featured;

    return (
      <Wrapper
        onClick={onClick}
        className={cn(
          'group flex h-[96px] w-full flex-col overflow-hidden rounded-2xl border border-t-[3px] text-left backdrop-blur-[10px]',
          'transition-all duration-180 ease-out',
          featured
            ? 'border-slate-200/90 bg-white/95 shadow-[0_2px_4px_rgba(15,23,42,0.05),0_14px_36px_-10px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.95)]'
            : 'border-slate-200/55 bg-white/82 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_22px_-10px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.88)]',
          onClick &&
            'cursor-pointer hover:-translate-y-0.5',
          onClick &&
            (featured
              ? 'hover:shadow-[0_2px_6px_rgba(15,23,42,0.06),0_18px_44px_-12px_rgba(15,23,42,0.16)]'
              : 'hover:shadow-[0_2px_4px_rgba(15,23,42,0.04),0_12px_28px_-10px_rgba(15,23,42,0.1)]'),
          topAccent,
          active &&
            (featured
              ? 'ring-1 ring-orange-200/80 bg-orange-50/15'
              : 'ring-1 ring-slate-200/60 bg-slate-50/40'),
          tone,
        )}
      >
        <div className="flex h-full min-w-0 flex-1 items-stretch gap-3 px-4 py-3.5">
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
            <p
              className={cn(
                'pt-0.5 font-bold leading-none tracking-tight tabular-nums',
                featured ? 'text-[1.75rem] text-slate-950' : 'text-[1.5rem] font-semibold text-slate-800',
              )}
            >
              {value}
            </p>
            <p
              className={cn(
                'line-clamp-2 text-[10px] font-medium uppercase leading-[1.35] tracking-[0.05em]',
                featured ? 'text-slate-500' : 'text-slate-400',
              )}
            >
              {label}
            </p>
          </div>
          <div className="flex shrink-0 items-center self-center">
            <div
              className={cn(
                'flex items-center justify-center rounded-lg transition-all duration-180',
                featured ? 'h-9 w-9 shadow-sm' : 'h-8 w-8 shadow-none opacity-90',
                iconStyles,
                onClick && featured && 'group-hover:scale-[1.03] group-hover:shadow-md',
                onClick && isSecondary && 'group-hover:opacity-100',
              )}
            >
              <Icon className={featured ? 'h-4 w-4' : 'h-3.5 w-3.5'} strokeWidth={2} />
            </div>
          </div>
        </div>
      </Wrapper>
    );
  }

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
        <div className={cn('border-t-[3px]', topAccent)}>
          <div className={compact ? 'p-3' : 'p-5'}>
            <div className={cn('flex items-center', compact ? 'gap-2.5' : 'gap-4')}>
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-lg',
                  compact ? 'h-8 w-8' : 'h-11 w-11 rounded-xl',
                  iconStyles,
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
