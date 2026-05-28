import type { LucideIcon } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { cn, text } from '../../../components/ui/tokens';

function StatCell({
  label,
  value,
  icon: Icon,
  tone = 'text-orange-500',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/50 bg-white/40 px-3 py-2.5 backdrop-blur-sm">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80',
          tone,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className={cn(text.label, 'text-[9px] leading-tight')}>{label}</p>
        <p className="truncate text-sm font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function AdminDetailStatStrip({
  stats,
}: {
  stats: Array<{ label: string; value: string; icon: LucideIcon; tone?: string }>;
}) {
  return (
    <Card variant="roleGlass" className="p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <StatCell key={stat.label} {...stat} />
        ))}
      </div>
    </Card>
  );
}
