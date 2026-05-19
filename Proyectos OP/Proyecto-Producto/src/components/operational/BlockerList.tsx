import { AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import type { OperationalBlocker } from '../../features/operations/operationalTypes';
import { severityStyles, visualSeverityFromOperational } from '../../features/operations/severityStyles';
import { Card, type CardVariant } from '../ui/Card';
import { cn } from '../ui/tokens';
import { fadeUp, softScale } from '../motion/presets';

export function BlockerList({ blockers, title = 'Bloqueantes', variant = 'subjectPanel', limit }: { blockers: OperationalBlocker[]; title?: string; variant?: CardVariant; limit?: number }) {
  const visible = typeof limit === 'number' ? blockers.slice(0, limit) : blockers;
  const hiddenCount = typeof limit === 'number' ? Math.max(0, blockers.length - visible.length) : 0;
  return (
    <Card variant={variant} className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-orange-100/80 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-black text-slate-950">{title}</h2>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-orange-100">{blockers.length}</span>
      </div>
      {visible.length === 0 ? (
        <p className="rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-bold text-emerald-700">Sin bloqueantes operacionales detectados.</p>
      ) : (
        <div className="space-y-2.5">
          {visible.map((blocker) => {
            const visual = severityStyles[visualSeverityFromOperational(blocker.severity)];
            return (
            <motion.div key={blocker.id} {...fadeUp} {...softScale} className={cn('relative overflow-hidden rounded-2xl border bg-white/85 p-3 shadow-sm transition-all', visual.card, visual.glow)}>
              <span className={cn('absolute inset-y-3 left-0 w-1 rounded-r-full', visual.accent)} />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="pl-2 text-xs font-black leading-5 text-slate-950">{blocker.title}</h3>
                <span className={cn('rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wide ring-1', visual.badge)}>{visual.label}</span>
              </div>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-600">Motivo: {blocker.reason}</p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-600">Impacto: {blocker.impact}</p>
              <p className="mt-1 text-[11px] font-black leading-5 text-orange-700">Accion requerida: {blocker.requiredAction}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Responsable: {blocker.responsibleRole}</p>
            </motion.div>
          );})}
          {hiddenCount > 0 ? <p className="rounded-xl bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100">+{hiddenCount} bloqueantes adicionales.</p> : null}
        </div>
      )}
    </Card>
  );
}
