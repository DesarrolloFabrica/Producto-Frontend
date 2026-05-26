import { ContextLink } from '../../navigation/ContextLink';
import { ArrowRight, CalendarDays, Eye } from 'lucide-react';
import type { VirtualizationProject } from '../../types/domain';
import { formatProjectExpectedDelivery } from '../../utils/projectSme';
import { projectStatusLabels } from '../../utils/status';
import { PriorityBadge } from '../status/PriorityBadge';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';
import { cn, surface, radius } from '../ui/tokens';

const statusAccent: Record<VirtualizationProject['status'], string> = {
  PENDING_SYLLABUS: 'bg-amber-400',
  PENDING_SUBJECT_MATTER_EXPERT: 'bg-violet-400',
  READY_FOR_PRODUCTION: 'bg-sky-400',
  IN_PRODUCTION: 'bg-[#FF6B00]',
  IN_REVIEW: 'bg-violet-500',
  DELIVERED_TO_LMS: 'bg-emerald-500',
  FEEDBACK_PENDING: 'bg-rose-500',
  CLOSED: 'bg-slate-400',
};

const statusCardTone: Record<VirtualizationProject['status'], string> = {
  PENDING_SYLLABUS: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  PENDING_SUBJECT_MATTER_EXPERT: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80',
  READY_FOR_PRODUCTION: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80',
  IN_PRODUCTION: 'bg-[#FFEDD5] text-[#9A3412] ring-1 ring-[#FED7AA]',
  IN_REVIEW: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80',
  DELIVERED_TO_LMS: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  FEEDBACK_PENDING: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
  CLOSED: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
};

const ownerInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function ProjectCard({ project }: { project: VirtualizationProject }) {
  const { openContextPanel } = useContextPanel();

  return (
    <Card className={cn('group relative overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)]', surface.elevated, radius.elevated)}>
      <div className={cn('absolute inset-x-0 top-0 h-1', statusAccent[project.status])} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <button onClick={() => openContextPanel('project', project.id)} className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">{project.school}</p>
            <h3 className="mt-1 text-lg font-bold tracking-[-0.02em] text-[#1E293B]">{project.program}</h3>
            <p className="mt-1 text-xs font-medium text-[#64748B]">{project.modality}</p>
          </button>
          <PriorityBadge priority={project.priority} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={cn('inline-flex rounded-[12px] border px-2.5 py-1 text-[9px] font-semibold capitalize tracking-[0.05em]', statusCardTone[project.status])}>
            {projectStatusLabels[project.status].toLowerCase()}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#F8FAFC] px-2.5 py-1 text-[9px] font-medium text-[#64748B]">
            <CalendarDays className="h-3 w-3 text-[#94A3B8]" />
            {formatProjectExpectedDelivery(project)}
          </span>
        </div>
        <ProgressBar value={project.progress} size="sm" className="mt-4" />
      </div>
      <div className="border-t border-[#F1F5F9] bg-[#F8FAFC]/50 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 rounded-[8px] bg-[#F8FAFC] px-2.5 py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[9px] font-bold text-[#FF6B00]">
              {ownerInitials(project.productOwner)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[#1E293B]">{project.productOwner}</p>
              <p className="text-[8px] font-normal text-[#64748B]">Product</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-[8px] bg-[#F8FAFC] px-2.5 py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10 text-[9px] font-bold text-[#6366F1]">
              {ownerInitials(project.factoryOwner)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[#1E293B]">{project.factoryOwner}</p>
              <p className="text-[8px] font-normal text-[#64748B]">Fábrica</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => openContextPanel('project', project.id)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-medium text-[#64748B] transition-all duration-200 hover:bg-[#EEF2FF] hover:text-[#6366F1]"
          >
            <Eye className="h-3.5 w-3.5" /> Contexto
          </button>
          <ContextLink
            to={`/projects/${project.id}`}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#FF6B00] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-[#FF6B00]/20 transition-all duration-200 hover:scale-105 hover:bg-[#E66000]"
          >
            Detalle <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </ContextLink>
        </div>
      </div>
    </Card>
  );
}
