import { ContextLink } from '../../navigation/ContextLink';
import { OperationalRequestItemHeading } from '../operational/OperationalRequestItemHeading';
import { UserAvatar } from '../ui/UserAvatar';
import { ArrowRight, CalendarDays, CheckCircle2, Eye } from 'lucide-react';
import {
  isProjectCompleted,
  projectListProgressLabel,
  resolveProjectListProgress,
} from '../../features/projects/projectListDisplay';
import type { VirtualizationProject } from '../../types/domain';
import { formatProjectExpectedDelivery } from '../../utils/projectSme';
import { projectStatusLabels } from '../../utils/status';
import { Card } from '../ui/Card';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';
import { cn, surface, tableRow } from '../ui/tokens';

const statusAccent: Record<VirtualizationProject['status'], string> = {
  PENDING_SYLLABUS: 'bg-amber-400',
  PENDING_SUBJECT_MATTER_EXPERT: 'bg-violet-400',
  READY_FOR_PRODUCTION: 'bg-sky-400',
  IN_PRODUCTION: 'bg-[#FF6B00]',
  IN_REVIEW: 'bg-violet-500',
  DELIVERED_TO_LMS: 'bg-emerald-500',
  FEEDBACK_PENDING: 'bg-rose-500',
  CLOSED: 'bg-emerald-500',
};

const statusCardTone: Record<VirtualizationProject['status'], string> = {
  PENDING_SYLLABUS: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/70',
  PENDING_SUBJECT_MATTER_EXPERT: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/70',
  READY_FOR_PRODUCTION: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/70',
  IN_PRODUCTION: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200/70',
  IN_REVIEW: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/70',
  DELIVERED_TO_LMS: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70',
  FEEDBACK_PENDING: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/70',
  CLOSED: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
};

function ProjectStatusPill({ project }: { project: VirtualizationProject }) {
  const completed = isProjectCompleted(project);
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-[9px] font-semibold',
        completed ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80' : statusCardTone[project.status],
        !completed && 'capitalize',
      )}
    >
      {completed ? <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden /> : null}
      {projectStatusLabels[project.status].toLowerCase()}
    </span>
  );
}

function ProjectProgressCell({ project }: { project: VirtualizationProject }) {
  const progress = resolveProjectListProgress(project);
  const complete = progress >= 100 || isProjectCompleted(project);
  const label = projectListProgressLabel(project, progress);

  return (
    <div className="min-w-[88px] max-w-[120px]">
      <div
        className={cn(
          'relative h-1.5 overflow-hidden rounded-full',
          complete ? 'bg-emerald-100' : 'bg-slate-100',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            complete
              ? 'bg-linear-to-r from-emerald-500 to-emerald-400'
              : 'bg-linear-to-r from-orange-400 to-orange-500',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span
        className={cn(
          'mt-0.5 block text-[10px] font-semibold tabular-nums',
          complete ? 'text-emerald-700' : 'text-slate-600',
        )}
      >
        {label}
      </span>
    </div>
  );
}

function OwnerAvatar({ name, role }: { name: string; role: string }) {
  return (
    <UserAvatar
      seed={`${role}:${name}`}
      alt={`${role}: ${name}`}
      title={`${role}: ${name}`}
      className="h-6 w-6 shrink-0 ring-2 ring-white"
      imageSize={48}
      shape="circle"
    />
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

      {projects.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-slate-500 sm:px-5">No hay solicitudes en esta página.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider text-slate-400',
                    surface.roleGlassTableHead,
                  )}
                >
                  <th className="px-5 py-3 sm:px-6">Solicitud</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Avance</th>
                  <th className="px-3 py-3">Entrega</th>
                  <th className="px-3 py-3">Equipo</th>
                  <th className="px-5 py-3 text-right sm:px-6">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {projects.map((project) => (
                  <ProjectTableRow
                    key={project.id}
                    project={project}
                    onQuickView={() => openContextPanel('project', project.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {projects.map((project) => (
              <ProjectMobileRow
                key={project.id}
                project={project}
                onQuickView={() => openContextPanel('project', project.id)}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function ProjectTableRow({
  project,
  onQuickView,
}: {
  project: VirtualizationProject;
  onQuickView: () => void;
}) {
  return (
    <tr className={cn('relative', tableRow)}>
      <td className="relative px-5 py-3.5 sm:px-6">
        <span
          className={cn('absolute inset-y-2 left-0 w-0.5 rounded-r', statusAccent[project.status])}
          aria-hidden
        />
        <button
          type="button"
          onClick={onQuickView}
          className="max-w-full pl-2 text-left transition-colors hover:text-orange-700"
        >
          <OperationalRequestItemHeading program={project.program} size="table" />
          <p className="mt-1 truncate text-[10px] text-slate-500">
            {project.school}
            <span className="mx-1 text-slate-300">·</span>
            {project.modality}
          </p>
        </button>
      </td>
      <td className="px-3 py-3.5 align-middle">
        <ProjectStatusPill project={project} />
      </td>
      <td className="px-3 py-3.5 align-middle">
        <ProjectProgressCell project={project} />
      </td>
      <td className="px-3 py-3.5 align-middle">
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-600">
          <CalendarDays className="h-3 w-3 shrink-0 text-slate-400" />
          {formatProjectExpectedDelivery(project)}
        </span>
      </td>
      <td className="px-3 py-3.5 align-middle">
        <div className="flex items-center gap-1">
          <OwnerAvatar name={project.productOwner} role="Product" />
          <OwnerAvatar name={project.factoryOwner} role="Fábrica" />
        </div>
      </td>
      <td className="px-5 py-3.5 text-right align-middle sm:px-6">
        <div className="flex items-center justify-end gap-1.5">
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
      </td>
    </tr>
  );
}

function ProjectMobileRow({
  project,
  onQuickView,
}: {
  project: VirtualizationProject;
  onQuickView: () => void;
}) {
  return (
    <div className="relative p-3">
      <div className={cn('absolute inset-y-2 left-0 w-0.5 rounded-r', statusAccent[project.status])} />
      <div className="pl-2">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={onQuickView} className="min-w-0 flex-1 text-left">
            <OperationalRequestItemHeading program={project.program} size="table" />
            <p className="mt-1 truncate text-[10px] text-slate-500">{project.school}</p>
          </button>
          <ProjectStatusPill project={project} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
          <span
            className={cn(
              isProjectCompleted(project) || resolveProjectListProgress(project) >= 100
                ? 'font-semibold text-emerald-700'
                : undefined,
            )}
          >
            {projectListProgressLabel(project, resolveProjectListProgress(project))} avance
          </span>
          <span>{formatProjectExpectedDelivery(project)}</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <OwnerAvatar name={project.productOwner} role="Product" />
            <OwnerAvatar name={project.factoryOwner} role="Fábrica" />
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
  );
}
