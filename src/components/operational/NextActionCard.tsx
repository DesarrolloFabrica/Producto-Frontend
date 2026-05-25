import { ContextLink } from '../../navigation/ContextLink';
import { ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import type { OperationalNextStep } from '../../features/operations/operationalTypes';
import { severityStyles, visualSeverityFromOperational } from '../../features/operations/severityStyles';
import { Card, type CardVariant } from '../ui/Card';
import { cn } from '../ui/tokens';
import { fadeUp, softScale } from '../motion/presets';

export function NextActionCard({ action, variant = 'subjectPanel', onContext }: { action: OperationalNextStep; variant?: CardVariant; onContext?: () => void }) {
  const visual = severityStyles[visualSeverityFromOperational(action.severity)];
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Cola inteligente</p>
          <h3 className="mt-1 text-sm font-black leading-5 text-slate-950">{action.title}</h3>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ring-1', visual.badge)}>{action.responsibleRole}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{action.description}</p>
      {action.targetRoute ? <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Entidad: {action.targetRoute.split('/').pop()}</p> : null}
      <p className="mt-3 flex items-start gap-2 rounded-2xl bg-orange-50/40 px-3 py-2 text-[11px] font-bold leading-5 text-slate-700"><Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" /> {action.impact}</p>
      {action.dependency ? <p className="mt-2 line-clamp-1 text-[11px] font-bold text-slate-500">Depende de: {action.dependency}</p> : null}
      <div className="mt-3 flex justify-end">
        {action.targetRoute ? (
          <ContextLink to={action.targetRoute} className="inline-flex items-center gap-1.5 rounded-2xl bg-orange-500 px-3 py-2 text-xs font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/30">
            {action.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
          </ContextLink>
        ) : onContext ? (
          <button type="button" onClick={onContext} className="inline-flex items-center gap-1.5 rounded-2xl bg-orange-500 px-3 py-2 text-xs font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/30">
            {action.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </>
  );

  return <motion.div {...fadeUp} {...softScale}><Card variant={variant} className={cn('relative overflow-hidden border p-4 shadow-sm transition-all', visual.card, visual.glow)}><span className={cn('absolute inset-x-5 top-0 h-0.5 rounded-b-full', visual.accent)} />{content}</Card></motion.div>;
}
