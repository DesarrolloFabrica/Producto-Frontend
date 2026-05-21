import type { OperationalInsight } from '../../features/operations/operationalTypes';
import { severityStyles, visualSeverityFromOperational } from '../../features/operations/severityStyles';
import { Card, type CardVariant } from '../ui/Card';
import { cn } from '../ui/tokens';
import { motion } from 'motion/react';
import { fadeUp } from '../motion/presets';

export function OperationalSummary({ insight, title = 'Resumen operacional', variant = 'subjectPanel' }: { insight: OperationalInsight; title?: string; variant?: CardVariant }) {
  const visual = severityStyles[visualSeverityFromOperational(insight.severity)];
  return (
    <motion.div {...fadeUp}>
    <Card variant={variant} className={cn('relative overflow-hidden border p-4 shadow-sm transition-all sm:p-5', visual.card)}>
      <span className={cn('absolute inset-y-4 left-0 w-1 rounded-r-full', visual.accent)} />
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-orange-100/80 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">{title}</p>
          <h2 className="mt-1 text-sm font-black text-slate-950">{insight.title}</h2>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ring-1', visual.badge)}>{visual.label}</span>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">{insight.description}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SummaryItem label="Siguiente accion" value={insight.nextAction} />
        <SummaryItem label="Responsable" value={insight.responsibleRole} />
        <SummaryItem label="Impacto" value={insight.impact} />
      </div>
      {insight.dependency ? <p className="mt-3 rounded-2xl bg-orange-50/50 px-3 py-2 text-[11px] font-bold text-orange-800">Dependencia: {insight.dependency}</p> : null}
    </Card>
    </motion.div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50/80 p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-800">{value}</p>
    </div>
  );
}
