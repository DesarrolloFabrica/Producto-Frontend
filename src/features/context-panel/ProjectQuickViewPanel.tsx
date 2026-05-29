import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  GitBranch,
  User,
} from 'lucide-react';
import { useMemo } from 'react';
import { StatusBadge } from '../../components/status/StatusBadge';
import { ModificationBadge } from '../../components/project/ModificationBadge';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../components/ui/tokens';
import type { Notification, OperationalObservation, Role, VirtualizationProject } from '../../types/domain';
import { getProjectModificationLabel } from '../operations/modificationBadges';
import { analyzeProductProject } from '../operations/productDashboardState';
import {
  formatProgramProgress,
  institutionalStateLabel,
  isSemesterProductAcademicReviewPhase,
} from '../institutional-workflow/institutionalCopy';
import {
  isProjectCompleted,
  projectListProgressLabel,
  resolveProjectListProgress,
  resolveProjectResponsibleRole,
} from '../projects/projectListDisplay';
import { useAuth } from '../auth/AuthContext';
import { useOperations } from '../operations/OperationsContext';
import { useProjectOperationalProgramQuery } from '../queries/useInstitutionalProgramsWorkQuery';
import { AdminResponsibleRoleBadge } from '../admin-tracking/components/AdminResponsibleRoleBadge';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import { ProgramActiveStageBadge } from '../operations-v2/components/ProgramActiveStageBadge';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { InstitutionalOperationalState } from '../../types/domain';
import type { SlaStatusV2 } from '../../types/operationalWorkflow';
import { institutionalPipelineStepIndex } from '../institutional-workflow/components/OperationalPipelineInstitutional';
import { roleLabelV2 } from '../operations-v2/rules/workflowRulesV2';
import type { OperationalRoleV2 } from '../../types/operationalWorkflow';

function pickBottleneckSemester(program: ProgramOperationalWorkItemDto) {
  const semesters = program.semesters ?? [];
  if (semesters.length === 0) return null;
  return semesters.reduce((best, item) => {
    const bestIdx = institutionalPipelineStepIndex(best.operationalState);
    const itemIdx = institutionalPipelineStepIndex(item.operationalState);
    if (itemIdx < bestIdx) return item;
    if (itemIdx > bestIdx) return best;
    return item;
  });
}

function resolveOperationalActionCopy(params: {
  operationalState: InstitutionalOperationalState | null;
  responsibleRole: Role | null;
  viewerRole: Role | null;
  openObservations: number;
  academicReviewPending: number;
}): { title: string; detail: string } {
  if (params.openObservations > 0) {
    return {
      title: 'Validación de correcciones',
      detail: `Revise y valide ${params.openObservations} observación(es) abierta(s) antes de avanzar en el flujo institucional.`,
    };
  }

  if (params.academicReviewPending > 0 && params.viewerRole === 'PRODUCT') {
    return {
      title: 'Revisión académica pendiente',
      detail: `${params.academicReviewPending} semestre(s) requieren validación de checklist, temas y cierre de asignaturas (Fase 7).`,
    };
  }

  if (!params.operationalState) {
    return {
      title: 'Seguimiento del programa',
      detail: 'Consulte el detalle del proyecto para revisar el avance por semestre y asignatura.',
    };
  }

  const stateLabel = institutionalStateLabel(params.operationalState);
  const isViewerResponsible = Boolean(
    params.viewerRole && params.responsibleRole && params.viewerRole === params.responsibleRole,
  );

  if (isViewerResponsible) {
    if (isSemesterProductAcademicReviewPhase(params.operationalState)) {
      return {
        title: 'Acción pendiente de su equipo',
        detail: 'Inicie o continúe la revisión académica: valide entregables, defina gránulos y apruebe las asignaturas del semestre.',
      };
    }
    return {
      title: 'Acción pendiente de su equipo',
      detail: `Etapa actual: ${stateLabel}. Ingrese al centro operacional para ejecutar la validación o entrega correspondiente.`,
    };
  }

  return {
    title: 'En espera de otro equipo',
    detail: `La etapa «${stateLabel}» está a cargo de ${
      params.responsibleRole ? roleLabelV2(params.responsibleRole as OperationalRoleV2) : 'otro equipo'
    }. No requiere intervención de su equipo en este momento.`,
  };
}

function MetricTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] font-medium text-slate-500">{hint}</p> : null}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-400">{label}</p>
        <p className="truncate text-xs font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

export function ProjectQuickViewPanel({
  project,
  observations,
  notifications,
  onNavigate,
}: {
  project: VirtualizationProject;
  observations: OperationalObservation[];
  notifications: Notification[];
  onNavigate: () => void;
}) {
  const { role } = useAuth();
  const { backendEnabled } = useOperations();
  const programQuery = useProjectOperationalProgramQuery(project.id, backendEnabled);
  const program = programQuery.data;

  const openObservations = observations.filter((o) => o.status === 'ABIERTA' || o.status === 'EN_CORRECCION');
  const hasSparseDetail = project.semesters.length === 0 && project.subjects.length === 0 && project.links.length === 0;
  const modificationLabel = getProjectModificationLabel(notifications, project.id);
  const insight = analyzeProductProject(project, observations);
  const progress = resolveProjectListProgress(project);
  const progressLabel = projectListProgressLabel(project, progress);
  const responsibleRole = resolveProjectResponsibleRole(
    project,
    program ? new Map([[project.id, program.currentResponsibleRole]]) : undefined,
  );
  const bottleneck = program ? pickBottleneckSemester(program) : null;
  const operationalState = bottleneck?.operationalState ?? null;

  const productChecklistStats = useMemo(() => {
    if (!hasSparseDetail) {
      let total = 0;
      let approved = 0;
      for (const subject of project.subjects) {
        const productItems = subject.checklist.filter((item) => item.ownerRole === 'PRODUCT');
        total += productItems.length;
        approved += productItems.filter((item) => item.status === 'APROBADO').length;
      }
      return { total, approved, pending: Math.max(0, total - approved) };
    }
    if (program) {
      return {
        total: program.totalSubjects,
        approved: program.completedSubjects,
        pending: Math.max(0, program.totalSubjects - program.completedSubjects),
      };
    }
    return { total: 0, approved: 0, pending: 0 };
  }, [hasSparseDetail, project.subjects, program]);

  const actionCopy = resolveOperationalActionCopy({
    operationalState,
    responsibleRole,
    viewerRole: role,
    openObservations: openObservations.length,
    academicReviewPending: program?.academicReviewPendingCount ?? 0,
  });

  const isViewerResponsible = Boolean(role && responsibleRole && role === responsibleRole && !isProjectCompleted(project));

  return (
    <div className="space-y-5 pb-2">
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">{project.school}</p>
        <h2 className="text-lg font-bold leading-tight text-slate-950">{project.program}</h2>
        <p className="text-xs font-medium text-slate-500">
          {project.requestType} · {project.modality}
        </p>
        {modificationLabel ? (
          <div className="pt-1">
            <ModificationBadge label={modificationLabel} />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <StatusBadge status={project.status} />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-600">
            {project.priority}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estado operacional</p>
            {operationalState ? (
              <p className="mt-1 text-sm font-semibold text-slate-900">{institutionalStateLabel(operationalState)}</p>
            ) : (
              <p className="mt-1 text-sm font-semibold text-slate-700">{insight.statusLabel}</p>
            )}
          </div>
          {program ? <SlaBadgeV2 status={program.slaStatus as SlaStatusV2} /> : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {responsibleRole ? <AdminResponsibleRoleBadge role={responsibleRole} compact /> : null}
          {isViewerResponsible ? (
            <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Acción pendiente
            </span>
          ) : null}
        </div>

        {program?.nearestDueDate ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            Plazo más próximo: <span className="font-semibold text-slate-800">{formatDate(program.nearestDueDate)}</span>
          </p>
        ) : (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            Entrega programada:{' '}
            <span className="font-semibold text-slate-800">{formatDate(project.expectedDeliveryDate)}</span>
          </p>
        )}

        {program && program.activeStageSummary.length > 0 ? (
          <div className="mt-3">
            <ProgramActiveStageBadge stages={program.activeStageSummary} />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avance del programa</p>
          <span className="text-sm font-black text-orange-600">{progressLabel}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-linear-to-r from-orange-400 to-orange-500 transition-all"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        {program ? (
          <p className="mt-2 text-xs font-medium text-slate-600">
            {formatProgramProgress({
              completedSemesters: program.completedSemesters,
              totalSemesters: program.totalSemesters,
              completedSubjects: program.completedSubjects,
              totalSubjects: program.totalSubjects,
            })}
          </p>
        ) : (
          <p className="mt-2 text-xs font-medium text-slate-600">{insight.reviewLabel}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <MetricTile label="Observaciones" value={String(openObservations.length)} hint="Abiertas o en corrección" />
        <MetricTile
          label="Materias"
          value={hasSparseDetail ? '…' : String(program?.totalSubjects ?? insight.totalSubjects)}
          hint={
            program
              ? `${program.completedSubjects} completadas`
              : `${insight.subjectsApproved} aprobadas`
          }
        />
        <MetricTile
          label="Checklist"
          value={productChecklistStats.total > 0 ? `${productChecklistStats.approved}/${productChecklistStats.total}` : '—'}
          hint={
            productChecklistStats.pending > 0
              ? `${productChecklistStats.pending} entregables por validar`
              : 'Entregables de Product'
          }
        />
        <MetricTile
          label="Semestres"
          value={hasSparseDetail ? '…' : String(program?.totalSemesters ?? project.semesters.length)}
          hint={
            program?.academicReviewPendingCount
              ? `${program.academicReviewPendingCount} en revisión académica`
              : undefined
          }
        />
      </div>

      <div
        className={cn(
          'rounded-2xl border p-4',
          isViewerResponsible ? 'border-emerald-200 bg-emerald-50/70' : 'border-orange-200/80 bg-orange-50/60',
        )}
      >
        <div className="flex items-start gap-3">
          <AlertCircle
            className={cn('mt-0.5 h-4 w-4 shrink-0', isViewerResponsible ? 'text-emerald-700' : 'text-orange-600')}
          />
          <div>
            <p
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                isViewerResponsible ? 'text-emerald-800' : 'text-orange-800',
              )}
            >
              {actionCopy.title}
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-800">{actionCopy.detail}</p>
          </div>
        </div>
      </div>

      {program && program.semesters.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Semestres</h3>
            <GitBranch className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="space-y-2">
            {program.semesters.slice(0, 4).map((semester) => (
              <div
                key={semester.semesterId ?? semester.subjectId}
                className="rounded-xl border border-slate-100 bg-white px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{semester.subjectName}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                      {institutionalStateLabel(semester.operationalState)}
                    </p>
                  </div>
                  <AdminResponsibleRoleBadge role={semester.currentResponsibleRole} compact />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-medium text-slate-500">
                  <span>
                    {semester.subjectsReady ?? 0}/{semester.subjectsTotal ?? 0} producidas
                  </span>
                  {semester.stageDueAt ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {formatDate(semester.stageDueAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
            {program.semesters.length > 4 ? (
              <p className="text-center text-[10px] font-medium text-slate-400">
                +{program.semesters.length - 4} semestre(s) adicionales
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Observaciones abiertas</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {openObservations.length}
          </span>
        </div>
        {openObservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-6">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <p className="mt-2 text-sm font-medium text-slate-500">Sin observaciones pendientes</p>
          </div>
        ) : (
          openObservations.slice(0, 3).map((obs) => (
            <div
              key={obs.id}
              className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {obs.relatedEntity || 'General'}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                    obs.status === 'ABIERTA' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
                  )}
                >
                  {obs.status}
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                {obs.text.length > 120 ? `${obs.text.substring(0, 120)}…` : obs.text}
              </p>
              <p className="mt-2 text-[10px] font-medium text-slate-400">
                {obs.author} · {formatDate(obs.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Información general</h3>
        <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
          <InfoRow icon={User} label="Producto" value={project.productOwner} />
          <InfoRow icon={User} label="Fábrica" value={project.factoryOwner} />
          <InfoRow icon={Clock3} label="Entrega" value={formatDate(project.expectedDeliveryDate)} />
          <InfoRow
            icon={FileText}
            label="Enlaces"
            value={hasSparseDetail ? 'Cargando…' : `${project.links.length} disponibles`}
          />
          <InfoRow
            icon={BookOpen}
            label="Semestres"
            value={
              hasSparseDetail
                ? 'Cargando…'
                : project.semesters.map((s) => s.semesterNumber).join(', ') || '—'
            }
          />
          <InfoRow
            icon={BookOpen}
            label="Materias"
            value={hasSparseDetail ? 'Cargando…' : `${project.subjects.length || project.subjectsSummary?.length || 0} registradas`}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNavigate}
        className="sticky bottom-0 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-700"
      >
        <ExternalLink className="h-4 w-4" />
        Gestionar solicitud
      </button>
    </div>
  );
}
