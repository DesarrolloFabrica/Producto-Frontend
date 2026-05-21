import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock3, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import type { OperationalBlocker, OperationalInsight, OperationalNextStep } from '../../features/operations/operationalTypes';
import { severityStyles, visualSeverityFromOperational } from '../../features/operations/severityStyles';
import { Card } from '../ui/Card';
import { cn } from '../ui/tokens';
import { fadeUp, softScale, staggerContainer, staggerItem } from '../motion/presets';

export function AttentionRequiredPanel({ blockers, insights, nextActions }: { blockers: OperationalBlocker[]; insights: OperationalInsight[]; nextActions: OperationalNextStep[] }) {
  const allCriticalItems = blockers.filter((item) => item.severity === 'critical' || item.severity === 'blocking');
  const allUrgentInsights = insights.filter((item) => ['critical', 'blocking', 'urgent'].includes(item.severity));
  const criticalItems = allCriticalItems.slice(0, 3);
  const urgentInsights = allUrgentInsights.slice(0, 3);
  const primaryActions = nextActions.slice(0, 3);
  const extraCount = Math.max(0, allCriticalItems.length - criticalItems.length) + Math.max(0, allUrgentInsights.length - urgentInsights.length) + Math.max(0, nextActions.length - primaryActions.length);

  return (
    <motion.div {...fadeUp}>
    <Card variant="subjectPanel" className="p-4 shadow-[0_18px_50px_-34px_rgba(249,115,22,0.55)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-orange-100/90 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Atencion requerida</p>
          <h2 className="mt-1 text-base font-black tracking-tight text-slate-950">Bloqueantes, vencimientos y tareas criticas</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">Elementos que pueden frenar produccion, revision o entrega.</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100">
            <AlertTriangle className="h-4 w-4" /> {allCriticalItems.length + allUrgentInsights.length} alertas
          </div>
          {extraCount > 0 ? <p className="mt-1 text-[10px] font-bold text-slate-400">Mostrando las 3 mas criticas por columna. +{extraCount} pendientes adicionales.</p> : null}
        </div>
      </div>
      <motion.div className="mt-5 grid gap-4 xl:grid-cols-3" {...staggerContainer}>
        <PanelColumn title="Bloqueantes criticos">
          {criticalItems.length === 0 ? <EmptyLine text="Sin bloqueantes criticos." /> : criticalItems.map((item) => <BlockerRow key={item.id} blocker={item} />)}
        </PanelColumn>
        <PanelColumn title="Riesgos operacionales">
          {urgentInsights.length === 0 ? <EmptyLine text="Sin riesgos urgentes." /> : urgentInsights.map((item) => <InsightRow key={item.id} insight={item} />)}
        </PanelColumn>
        <PanelColumn title="Acciones sugeridas">
          {primaryActions.length === 0 ? <EmptyLine text="Sin acciones sugeridas." /> : primaryActions.map((item) => <ActionRow key={`${item.title}-${item.targetRoute}`} action={item} />)}
        </PanelColumn>
      </motion.div>
    </Card>
    </motion.div>
  );
}

function PanelColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50/70 p-3">
      <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BlockerRow({ blocker }: { blocker: OperationalBlocker }) {
  const visual = severityStyles[visualSeverityFromOperational(blocker.severity)];
  return (
    <motion.div variants={staggerItem.variants} {...softScale} className={cn('relative overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition-all', visual.card, visual.glow)}>
      <span className={cn('absolute inset-y-3 left-0 w-1 rounded-r-full', visual.accent)} />
      <div className="flex items-start justify-between gap-2">
        <p className="pl-2 text-xs font-black leading-5 text-slate-900">{blocker.title}</p>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase ring-1', visual.badge)}>{visual.label}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-slate-600">{blocker.requiredAction}</p>
      <ImpactHint text={inferImpactHint(blocker.impact)} icon={ShieldAlert} />
      {blocker.targetRoute ? <ActionLink to={blocker.targetRoute} label="Gestionar" /> : null}
    </motion.div>
  );
}

function InsightRow({ insight }: { insight: OperationalInsight }) {
  const visual = severityStyles[visualSeverityFromOperational(insight.severity)];
  return (
    <motion.div variants={staggerItem.variants} {...softScale} className="rounded-2xl border border-orange-100/70 bg-white p-3 shadow-sm transition-all hover:border-orange-200">
      <p className="text-xs font-black leading-5 text-slate-900">{insight.title}</p>
      <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-slate-600">{insight.nextAction}</p>
      <span className={cn('mt-2 inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wide ring-1', visual.badge)}>{visual.label}</span>
      {insight.targetRoute ? <ActionLink to={insight.targetRoute} label="Gestionar" /> : null}
    </motion.div>
  );
}

function ActionRow({ action }: { action: OperationalNextStep }) {
  const visual = severityStyles[visualSeverityFromOperational(action.severity)];
  return (
    <motion.div variants={staggerItem.variants} {...softScale} className="rounded-2xl border border-orange-100/70 bg-white p-3 shadow-sm transition-all hover:border-orange-200">
      <p className="text-xs font-black leading-5 text-slate-900">{action.title}</p>
      <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-slate-600">{action.impact}</p>
      <ImpactHint text={inferImpactHint(action.impact)} icon={action.severity === 'completed' ? CheckCircle2 : Clock3} tone={visual.badge} />
      {action.targetRoute ? <ActionLink to={action.targetRoute} label={action.actionLabel} /> : null}
    </motion.div>
  );
}

function ImpactHint({ text, icon: Icon, tone = 'bg-orange-50 text-orange-700 ring-orange-100' }: { text: string; icon: typeof Clock3; tone?: string }) {
  return (
    <span className={cn('mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ring-1', tone)}>
      <Icon className="h-3 w-3" /> {text}
    </span>
  );
}

function inferImpactHint(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('lms') || lower.includes('entrega')) return 'Impacta entrega';
  if (lower.includes('revision')) return 'Impacta revision';
  if (lower.includes('aprob')) return 'Bloquea aprobacion';
  if (lower.includes('riesgo') || lower.includes('retras')) return 'Riesgo de retraso';
  return 'Requiere seguimiento';
}

function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mt-2 inline-flex items-center gap-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700">
      {label} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">{text}</p>;
}
