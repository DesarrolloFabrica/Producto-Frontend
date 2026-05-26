import { ContextLink } from '../../navigation/ContextLink';
import { ArrowRight, CalendarDays, Eye, GraduationCap, UserRound } from 'lucide-react';
import type { VirtualizationProject } from '../../types/domain';
import { formatDate } from '../../utils/formatters';
import { formatProjectExpectedDelivery } from '../../utils/projectSme';
import { projectStatusLabels } from '../../utils/status';
import { PriorityBadge } from '../status/PriorityBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { Card } from '../ui/Card';
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

export function ProjectsTable({ projects }: { projects: VirtualizationProject[] }) {
  const { openContextPanel } = useContextPanel();

  return (
    <Card className={cn('overflow-hidden p-0', surface.elevated, radius.elevated)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] bg-white/60 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Listado</p>
          <h2 className="mt-0.5 text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Proyectos</h2>
          <p className="mt-1 text-[11px] font-medium text-[#64748B]">Escuelas, programas y seguimiento de entregas</p>
        </div>
        <span className="rounded-[12px] bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#64748B] ring-1 ring-slate-200/50">{projects.length} activos</span>
      </div>

      <div className="hidden grid-cols-12 gap-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#94A3B8] lg:grid">
        <span className="col-span-3">Proyecto</span>
        <span className="col-span-2">Estado</span>
        <span className="col-span-1">Prioridad</span>
        <span className="col-span-2">Avance</span>
        <span className="col-span-1">Entrega</span>
        <span className="col-span-3">Responsables</span>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative grid grid-cols-1 gap-4 px-5 py-6 transition-colors hover:bg-[#F8FAFC] lg:grid-cols-12 lg:items-start lg:px-6"
          >
            <div className={cn('absolute inset-y-4 left-0 w-0.5 rounded-r-full opacity-70', statusAccent[project.status])} />
            <div className="lg:col-span-3 lg:pl-1">
              <button type="button" onClick={() => openContextPanel('project', project.id)} className="text-left transition-colors hover:text-[#FF6B00]">
                <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#FFEDD5] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.05em] text-[#9A3412]">
                  <GraduationCap className="h-3 w-3 text-[#9A3412]" /> {project.school}
                </span>
                <p className="mt-3 text-base font-bold leading-5 tracking-[-0.02em] text-[#1E293B]">{project.program}</p>
                <p className="mt-1 text-xs font-medium text-[#64748B]">{project.modality}</p>
              </button>
            </div>
            <div className="flex items-center lg:col-span-2 lg:pt-2">
              <span className={cn('inline-flex rounded-[12px] px-2.5 py-1 text-[9px] font-semibold capitalize tracking-[0.05em]', statusCardTone[project.status])}>
                {projectStatusLabels[project.status].toLowerCase()}
              </span>
            </div>
            <div className="flex items-center lg:col-span-1 lg:pt-2">
              <PriorityBadge priority={project.priority} />
            </div>
            <div className="lg:col-span-2 lg:pt-1.5">
              <ProgressBar value={project.progress} size="sm" />
            </div>
            <div className="flex items-center gap-2 rounded-[12px] bg-[#F8FAFC] px-3 py-2 text-xs font-medium text-[#64748B] lg:col-span-1">
              <CalendarDays className="h-4 w-4 text-[#94A3B8] lg:hidden" />
              {formatProjectExpectedDelivery(project)}
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-2.5 rounded-[8px] bg-[#F8FAFC] px-3 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[9px] font-bold text-[#FF6B00]">
                      {ownerInitials(project.productOwner)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[#1E293B]">{project.productOwner}</p>
                      <p className="text-[9px] font-normal text-[#64748B]">Product</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-[8px] bg-[#F8FAFC] px-3 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10 text-[9px] font-bold text-[#6366F1]">
                      {ownerInitials(project.factoryOwner)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[#1E293B]">{project.factoryOwner}</p>
                      <p className="text-[9px] font-normal text-[#64748B]">Fábrica</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openContextPanel('project', project.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2.5 text-xs font-medium text-[#64748B] transition-all duration-200 hover:bg-[#EEF2FF] hover:text-[#6366F1]"
                  >
                    <Eye className="h-3.5 w-3.5" /> Vista rápida
                  </button>
                  <ContextLink
                    to={`/projects/${project.id}`}
                    className="group/btn inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#FF6B00] px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#FF6B00]/20 transition-all duration-200 hover:scale-105 hover:bg-[#E66000]"
                  >
                    Gestionar proyecto <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                  </ContextLink>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
