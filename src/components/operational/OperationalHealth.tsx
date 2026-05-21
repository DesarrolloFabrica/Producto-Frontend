import type { OperationalHealthSummary } from '../../features/operations/operationalTypes';
import { severityStyles, visualSeverityFromHealth } from '../../features/operations/severityStyles';
import { Card, type CardVariant } from '../ui/Card';
import { cn } from '../ui/tokens';
import { motion } from 'motion/react';
import { fadeUp } from '../motion/presets';

export function OperationalHealth({ health, variant = 'subjectPanel', compact = false }: { health: OperationalHealthSummary; variant?: CardVariant; compact?: boolean }) {
  const visual = severityStyles[visualSeverityFromHealth(health.healthStatus)];
  return (
    <motion.div {...fadeUp}>
    <Card variant={variant} className={cn('relative overflow-hidden border shadow-sm transition-all duration-200', visual.card, visual.glow, compact ? 'p-4 sm:p-4' : 'p-4 sm:p-5')}>
      <span className={cn('absolute inset-y-4 left-0 w-1 rounded-r-full', visual.accent)} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/90">Salud operacional</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-black text-slate-950">{health.title}</h2>
            <span className={cn('rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ring-1', visual.badge)}>{visual.label}</span>
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{health.description}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <HealthItem label="Motivo" value={health.reason} />
        <HealthItem label="Siguiente accion" value={health.nextAction} />
      </div>
    </Card>
    </motion.div>
  );
}

function HealthItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50/80 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-[11px] font-bold leading-5 text-slate-700">{value}</p>
    </div>
  );
}
