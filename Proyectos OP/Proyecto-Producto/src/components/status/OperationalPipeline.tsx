import { CheckCircle2, ClipboardList, Factory, FileWarning, PackageCheck, RotateCcw, Send, TriangleAlert } from 'lucide-react';
import type { PipelineStageSummary } from '../../types/domain';
import { projectStatusLabels } from '../../utils/status';
import { Card } from '../ui/Card';
import { cn, surface, radius } from '../ui/tokens';

const stageMeta = {
  PENDING_SYLLABUS: { Icon: FileWarning, accent: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'bg-amber-50 text-amber-800' },
  READY_FOR_PRODUCTION: { Icon: Send, accent: 'bg-sky-400', bg: 'bg-sky-500/10', text: 'text-sky-600', label: 'bg-sky-50 text-sky-800' },
  IN_PRODUCTION: { Icon: Factory, accent: 'bg-[#FF6B00]', bg: 'bg-[#FF6B00]/10', text: 'text-[#FF6B00]', label: 'bg-[#FFEDD5] text-[#9A3412]' },
  IN_REVIEW: { Icon: ClipboardList, accent: 'bg-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-600', label: 'bg-violet-50 text-violet-800' },
  DELIVERED_TO_LMS: { Icon: PackageCheck, accent: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'bg-emerald-50 text-emerald-800' },
  FEEDBACK_PENDING: { Icon: RotateCcw, accent: 'bg-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-600', label: 'bg-rose-50 text-rose-800' },
  CLOSED: { Icon: CheckCircle2, accent: 'bg-slate-400', bg: 'bg-slate-500/10', text: 'text-slate-600', label: 'bg-slate-100 text-slate-700' },
};

export function OperationalPipeline({ stages }: { stages: PipelineStageSummary[] }) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <Card className={cn('overflow-hidden p-0', surface.elevated, radius.elevated)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] bg-white/60 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Operación</p>
          <h2 className="mt-0.5 text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Pipeline operacional</h2>
          <p className="mt-1 text-[11px] font-medium text-[#64748B]">Estado vivo del flujo Product a Fábrica</p>
        </div>
        <span className="rounded-[12px] bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#64748B] ring-1 ring-slate-200/50">{total} proyectos</span>
      </div>
      <div className="grid gap-3 bg-[#F8FAFC]/60 p-4 md:grid-cols-2 xl:grid-cols-7">
        {stages.map((stage, index) => (
          <StageCard key={stage.status} stage={stage} showConnector={index < stages.length - 1} />
        ))}
      </div>
    </Card>
  );
}

function StageCard({ stage, showConnector }: { stage: PipelineStageSummary; showConnector: boolean }) {
  const meta = stageMeta[stage.status];
  const Icon = meta.Icon;

  return (
    <div className="group relative overflow-hidden rounded-[16px] border border-[rgba(0,0,0,0.02)] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.01),0_1px_2px_0_rgba(0,0,0,0.006)] p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.08)]">
      {showConnector ? <div className="absolute left-[calc(100%-0.125rem)] top-1/2 z-0 hidden h-px w-4 bg-slate-200 xl:block" /> : null}
      <div className={cn('absolute inset-x-0 top-0 h-0.5 rounded-t-[16px]', meta.accent)} />
      <div className="flex items-start justify-between gap-2">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', meta.bg, meta.text)}>
          <Icon className="h-4 w-4" />
        </div>
        {stage.critical ? <TriangleAlert className="mt-1 h-4 w-4 shrink-0 text-[#EF4444]" /> : null}
      </div>
      <div className="mt-3">
        <span className={cn('inline-flex rounded-[12px] px-2.5 py-1 text-[9px] font-medium capitalize tracking-[0.05em] text-[#475569]', meta.label)}>
          {projectStatusLabels[stage.status].toLowerCase()}
        </span>
        <p className="mt-3 text-[2rem] font-bold leading-none tracking-[-0.05em] text-[#1E293B]">{stage.count}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-[10px] bg-[#F1F5F9]">
        <div className={cn('h-full rounded-[10px]', meta.accent)} style={{ width: `${stage.progress}%` }} />
      </div>
    </div>
  );
}
