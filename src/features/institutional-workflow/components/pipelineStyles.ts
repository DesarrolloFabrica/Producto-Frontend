import { cn } from '../../../components/ui/tokens';

export const pipelineContainer = cn(
  'glass-surface rounded-2xl border border-slate-200/40 p-6',
  'shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]',
);

export const pipelineHeaderEyebrow = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500';
export const pipelineHeaderTitle = 'mt-1 text-sm font-semibold text-slate-900';

export function pipelineNodeClass(status: 'done' | 'active' | 'upcoming', returned?: boolean) {
  if (status === 'done') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm';
  }
  if (status === 'active') {
    return returned
      ? 'border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 shadow-[0_0_0_4px_rgba(251,113,133,0.08)]'
      : 'border-orange-200 bg-orange-50 text-orange-700 ring-1 ring-orange-200/60 shadow-[0_0_0_4px_rgba(249,115,22,0.08)]';
  }
  return 'border-slate-200 bg-slate-50 text-slate-400';
}

export function pipelineConnectorClass(status: 'done' | 'active' | 'upcoming') {
  if (status === 'done') return 'bg-emerald-300';
  if (status === 'active') return 'bg-gradient-to-r from-orange-300 to-slate-200';
  return 'bg-slate-200';
}

export const pipelineNodeTransition = 'transition-all duration-300 ease-out';
