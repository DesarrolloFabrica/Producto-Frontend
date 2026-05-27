import { Activity, AlertTriangle, CheckCircle2, CornerDownLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';
import type { AdminTrackingKpis } from '../adminTrackingTypes';

const KPI_CONFIG: Array<{
  key: keyof AdminTrackingKpis;
  label: string;
  icon: LucideIcon;
  tone: string;
}> = [
  { key: 'active', label: 'Activos', icon: Activity, tone: 'text-sky-600 bg-sky-50 ring-sky-100' },
  { key: 'overdue', label: 'Vencidos', icon: AlertTriangle, tone: 'text-rose-600 bg-rose-50 ring-rose-100' },
  {
    key: 'returned',
    label: 'Devolución',
    icon: CornerDownLeft,
    tone: 'text-amber-600 bg-amber-50 ring-amber-100',
  },
  {
    key: 'finalized',
    label: 'Finalizados',
    icon: CheckCircle2,
    tone: 'text-emerald-600 bg-emerald-50 ring-emerald-100',
  },
];

export function AdminExecutiveKpiStrip({ kpis }: { kpis: AdminTrackingKpis }) {
  return (
    <div className="flex flex-wrap gap-2">
      {KPI_CONFIG.map(({ key, label, icon: Icon, tone }) => (
        <div
          key={key}
          className={cn(
            'inline-flex min-w-[7.5rem] flex-1 items-center gap-2 rounded-lg px-3 py-2 ring-1 sm:min-w-0 sm:flex-none',
            tone,
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</p>
            <p className="font-mono text-base font-black tabular-nums leading-none">{kpis[key]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
