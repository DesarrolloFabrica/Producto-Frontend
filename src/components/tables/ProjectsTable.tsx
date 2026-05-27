import { ContextLink } from '../../navigation/ContextLink';
import { ArrowRight, CalendarDays, Eye } from 'lucide-react';
import type { VirtualizationProject } from '../../types/domain';
import { formatProjectExpectedDelivery } from '../../utils/projectSme';
import { projectStatusLabels } from '../../utils/status';
import { PriorityBadge } from '../status/PriorityBadge';
import { Card } from '../ui/Card';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';
import { cn } from '../ui/tokens';

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
  PENDING_SYLLABUS: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/70',
  PENDING_SUBJECT_MATTER_EXPERT: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/70',
  READY_FOR_PRODUCTION: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/70',
  IN_PRODUCTION: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200/70',
  IN_REVIEW: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/70',
  DELIVERED_TO_LMS: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70',
  FEEDBACK_PENDING: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/70',
  CLOSED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/70',
};

const ownerInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function OwnerAvatar({
  name,
  role,
  tone,
}: {
  name: string;
  role: string;
  tone: string;
}) {
  return (
    <span
      title={`${role}: ${name}`}
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ring-1 ring-white',
        tone,
      )}
    >
      {ownerInitials(name)}
    </span>
  );
}

export function ProjectsTable({
  projects,
  totalCount,
  portfolioTotal,
}: {
  projects: VirtualizationProject[];
  totalCount?: number;
  portfolioTotal?: number;
}) {
  const { openContextPanel } = useContextPanel();
  const activeTotal = totalCount ?? projects.length;
  const showFilteredHint = portfolioTotal != null && portfolioTotal !== activeTotal;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-2.5 sm:px-5">
        <div>
          <h2 className="text-xs font-semibold text-slate-900">Solicitudes</h2>
          <p className="text-[10px] text-slate-500">Programas en el portafolio</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
          {showFilteredHint ? `${activeTotal} filtradas` : `${activeTotal} activo${activeTotal !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="hidden border-b border-slate-100 bg-slate-50/80 lg:block">
        <table className="w-full text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <thead>
            <tr>
              <th className="px-4 py-2 sm:px-5">Proyecto</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Prioridad</th>
              <th className="px-3 py-2">Avance</th>
              <th className="px-3 py-2">Entrega</th>
              <th className="px-3 py-2">Equipo</th>
              <th className="px-4 py-2 text-right sm:px-5">Acción</th>
            </tr>
          </thead>
        </table>
      </div>

      {projects.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-slate-500 sm:px-5">No hay solicitudes en esta página.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} onQuickView={() => openContextPanel('project', project.id)} />
          ))}
        </div>
      )}
    </Card>
  );
}

function ProjectRow({
  project,
  onQuickView,
}: {
  project: VirtualizationProject;
  onQuickView: () => void;
}) {
  return (
    <>
      <div className="group relative hidden lg:grid lg:grid-cols-[minmax(0,2.2fr)_1fr_0.7fr_0.8fr_1fr_0.9fr_1fr] lg:items-center lg:gap-0 lg:px-0 lg:py-0">
        <div className={cn('absolute inset-y-0 left-0 w-0.5', statusAccent[project.status])} />
        <div className="min-w-0 py-2.5 pl-4 pr-3 sm:pl-5">
          <button
            type="button"
            onClick={onQuickView}
            className="max-w-full text-left transition-colors hover:text-orange-700"
          >
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-orange-700/90">
              {project.school}
            </p>
            <p className="truncate text-sm font-semibold text-slate-900">{project.program}</p>
            <p className="truncate text-[10px] text-slate-500">{project.modality}</p>
          </button>
        </div>
        <div className="px-3 py-2.5">
          <span
            className={cn(
              'inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-[9px] font-semibold capitalize',
              statusCardTone[project.status],
            )}
          >
            {projectStatusLabels[project.status].toLowerCase()}
          </span>
        </div>
        <div className="px-3 py-2.5">
          <PriorityBadge priority={project.priority} />
        </div>
        <div className="px-3 py-2.5">
          <div className="max-w-[88px]">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-orange-400 to-orange-500"
                style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
              />
            </div>
            <span className="mt-0.5 block text-[10px] font-semibold tabular-nums text-slate-600">{project.progress}%</span>
          </div>
        </div>
        <div className="px-3 py-2.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
            <CalendarDays className="h-3 w-3 text-slate-400" />
            {formatProjectExpectedDelivery(project)}
          </span>
        </div>
        <div className="flex items-center gap-1 px-3 py-2.5">
          <OwnerAvatar name={project.productOwner} role="Product" tone="bg-orange-100 text-orange-700" />
          <OwnerAvatar name={project.factoryOwner} role="Fábrica" tone="bg-indigo-100 text-indigo-700" />
        </div>
        <div className="flex items-center justify-end gap-1.5 px-4 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={onQuickView}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
            title="Vista rápida"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <ContextLink
            to={`/projects/${project.id}`}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-orange-200/80 bg-orange-50/50 px-2.5 text-[10px] font-semibold text-orange-800 transition-colors hover:bg-orange-100"
          >
            Gestionar
            <ArrowRight className="h-3 w-3" />
          </ContextLink>
        </div>
      </div>

      <div className="relative p-3 lg:hidden">
        <div className={cn('absolute inset-y-2 left-0 w-0.5 rounded-r', statusAccent[project.status])} />
        <div className="pl-2">
          <div className="flex items-start justify-between gap-2">
            <button type="button" onClick={onQuickView} className="min-w-0 flex-1 text-left">
              <p className="truncate text-[10px] font-medium uppercase text-orange-700">{project.school}</p>
              <p className="truncate text-sm font-semibold text-slate-900">{project.program}</p>
            </button>
            <span
              className={cn(
                'shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold capitalize',
                statusCardTone[project.status],
              )}
            >
              {projectStatusLabels[project.status].toLowerCase()}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
            <PriorityBadge priority={project.priority} />
            <span>{project.progress}% avance</span>
            <span>{formatProjectExpectedDelivery(project)}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <OwnerAvatar name={project.productOwner} role="Product" tone="bg-orange-100 text-orange-700" />
              <OwnerAvatar name={project.factoryOwner} role="Fábrica" tone="bg-indigo-100 text-indigo-700" />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onQuickView}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-medium text-slate-500 hover:bg-slate-100"
              >
                <Eye className="h-3.5 w-3.5" />
                Vista
              </button>
              <ContextLink
                to={`/projects/${project.id}`}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-orange-600 px-2.5 text-[10px] font-semibold text-white"
              >
                Gestionar
                <ArrowRight className="h-3 w-3" />
              </ContextLink>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
