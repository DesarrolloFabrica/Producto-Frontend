import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import type { CardVariant } from '../ui/Card';
import { cn } from '../ui/tokens';

const accentMap: Record<string, string> = {
  'text-red-500': 'border-t-red-500',
  'text-rose-500': 'border-t-rose-500',
  'text-orange-500': 'border-t-orange-500',
  'text-emerald-500': 'border-t-emerald-500',
  'text-amber-500': 'border-t-amber-500',
};

const iconBgMap: Record<string, string> = {
  'text-red-500': 'bg-red-500/10 text-red-500',
  'text-rose-500': 'bg-rose-500/10 text-rose-600',
  'text-orange-500': 'bg-orange-500/10 text-orange-500',
  'text-emerald-500': 'bg-emerald-500/10 text-emerald-500',
  'text-amber-500': 'bg-amber-500/10 text-amber-500',
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'text-orange-500',
  variant = 'default',
  active = false,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: string;
  variant?: Extract<CardVariant, 'default' | 'subjectPanel'>;
  active?: boolean;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  const activeBorder = active ? 'border-b-[3px] border-b-current' : '';

  if (variant === 'subjectPanel') {
    return (
      <Card variant="subjectPanel" className="overflow-hidden p-0">
        <Wrapper
          onClick={onClick}
          className={cn(
            'w-full text-left transition-all duration-200',
            active && 'bg-[#FFF7ED]',
            activeBorder,
            tone,
          )}
        >
          <div className={cn('border-t-4', accentMap[tone] || 'border-t-orange-500')}>
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', iconBgMap[tone] || 'bg-orange-500/10 text-orange-500')}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">{label}</p>
                  <p className="mt-1 font-mono text-[1.8rem] font-extrabold tracking-tight text-[#1E293B]">{value}</p>
                </div>
              </div>
            </div>
          </div>
        </Wrapper>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <Wrapper
        onClick={onClick}
        className={cn(
          'w-full text-left transition-all duration-200',
          active && 'bg-[#FFF7ED]',
          activeBorder,
          tone,
        )}
      >
        <div className={cn('border-t-4', accentMap[tone] || 'border-t-orange-500')}>
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', iconBgMap[tone] || 'bg-orange-500/10 text-orange-500')}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">{label}</p>
                <p className="mt-1 font-mono text-[1.8rem] font-extrabold tracking-tight text-[#1E293B]">{value}</p>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    </Card>
  );
}
