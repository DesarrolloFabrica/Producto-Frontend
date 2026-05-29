import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Layers,
  MessageSquareWarning,
  User,
  Users,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn, surface, tableRow, text } from '../../components/ui/tokens';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { ADMIN_DASHBOARD_PATH, ADMIN_SEMESTER_DETAIL_PATH } from './adminNavigation';
import { formatDate } from '../../utils/formatters';
import type { ApiChecklistItem, ApiSubjectDetail } from '../../services/types/projectsApi.types';
import type { InstitutionalOperationalState } from '../../types/domain';
import { institutionalStateLabel } from '../institutional-workflow/institutionalCopy';
import {
  institutionalPipelineStepIndex,
  OperationalPipelineInstitutional,
} from '../institutional-workflow/components/OperationalPipelineInstitutional';
import { ProjectInstitutionalClosurePanel } from '../institutional-workflow/components/ProjectInstitutionalClosurePanel';
import { OperationalStateBadgeV2 } from '../operations-v2/components/OperationalStateBadgeV2';
import { ProgramActiveStageBadge } from '../operations-v2/components/ProgramActiveStageBadge';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import { OperationalInboxPagination } from '../operations-v2/components/OperationalInboxPagination';
import { AdminRadicationReadOnlyPanel } from './components/AdminRadicationReadOnlyPanel';
import type { SlaStatusV2 } from '../../types/operationalWorkflow';
import type {
  OperationalWorkItemDto,
  ProgramOperationalWorkItemDto,
} from '../../services/institutionalWorkflowApi';
import {
  ADMIN_DETAIL_CHECKLIST_PAGE_SIZE,
  ADMIN_DETAIL_SEMESTERS_PAGE_SIZE,
  ADMIN_DETAIL_SUBJECTS_PAGE_SIZE,
  adminDetailTotalPages,
  paginateAdminDetail,
} from './adminDetailPagination';
import { AdminDetailStatStrip } from './components/AdminDetailStatStrip';
import {
  AdminProgramDetailSectionTabs,
  type AdminProgramDetailTab,
} from './components/AdminProgramDetailSectionTabs';
import { useAdminProjectDetail } from './hooks/useAdminProjectDetail';

function pickDetailBottleneckState(
  semesters: OperationalWorkItemDto[],
): InstitutionalOperationalState | null {
  if (semesters.length === 0) return null;
  const bottleneck = semesters.reduce((best, item) => {
    const bestIdx = institutionalPipelineStepIndex(best.operationalState);
    const itemIdx = institutionalPipelineStepIndex(item.operationalState);
    return itemIdx < bestIdx ? item : best;
  });
  return bottleneck.operationalState;
}

const backLinkClassName =
  'inline-flex w-fit items-center gap-2 rounded-[12px] border border-white/60 bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm transition-colors hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700';

type ChecklistRow = ApiChecklistItem & {
  subjectName: string;
  semesterNumber: number;
  scope: 'Materia' | 'Tema';
  topicName?: string;
};

type SubjectRow = {
  semesterNumber: number;
  factoryExpectedDate: string | null;
  continuationDate: string | null;
  stageDueAt: string | null;
  subject: ApiSubjectDetail;
};

function normalizeDateValue(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim();
}

/** Entrega operativa: continuidad/plazo SLA, no el fallback de fábrica del API. */
function resolveSubjectEntregaDate(row: SubjectRow): string | null {
  const factoryDate = normalizeDateValue(row.factoryExpectedDate);
  const subjectDate = normalizeDateValue(row.subject.expectedDeliveryDate);

  if (subjectDate && factoryDate && subjectDate !== factoryDate) {
    return subjectDate;
  }

  return (
    normalizeDateValue(row.continuationDate) ??
    normalizeDateValue(row.stageDueAt) ??
    null
  );
}

function collectChecklistRows(project: {
  semesters: Array<{ semesterNumber: number; subjects: ApiSubjectDetail[] }>;
}): ChecklistRow[] {
  const rows: ChecklistRow[] = [];
  for (const semester of project.semesters) {
    for (const subject of semester.subjects) {
      for (const item of subject.checklist ?? []) {
        rows.push({
          ...item,
          subjectName: subject.name,
          semesterNumber: semester.semesterNumber,
          scope: 'Materia',
        });
      }
      for (const topic of subject.topics ?? []) {
        for (const item of topic.checklist ?? []) {
          rows.push({
            ...item,
            subjectName: subject.name,
            semesterNumber: semester.semesterNumber,
            scope: 'Tema',
            topicName: topic.name,
          });
        }
      }
    }
  }
  return rows;
}

function collectSubjectRows(
  project: {
    semesters: Array<{
      semesterNumber: number;
      factoryExpectedDate: string | null;
      continuationDate: string | null;
      subjects: ApiSubjectDetail[];
    }>;
  },
  programSemesters: OperationalWorkItemDto[] = [],
): SubjectRow[] {
  const stageDueBySemester = new Map(
    programSemesters.map((semester) => [semester.semesterNumber, semester.stageDueAt ?? null]),
  );

  return project.semesters.flatMap((semester) =>
    semester.subjects.map((subject) => ({
      semesterNumber: semester.semesterNumber,
      factoryExpectedDate: semester.factoryExpectedDate,
      continuationDate: semester.continuationDate,
      stageDueAt: stageDueBySemester.get(semester.semesterNumber) ?? null,
      subject,
    })),
  );
}

export function AdminProgramDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const locationState = (location.state ?? {}) as {
    from?: string;
    programWorkItem?: ProgramOperationalWorkItemDto;
  };
  const backTarget = locationState.from ?? ADMIN_DASHBOARD_PATH;

  const { program: programQuery, project, radication, isLoading, error } = useAdminProjectDetail(projectId);
  const program = programQuery ?? locationState.programWorkItem ?? null;

  const [activeTab, setActiveTab] = useState<AdminProgramDetailTab>('overview');
  const [semestersPage, setSemestersPage] = useState(1);
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [checklistPage, setChecklistPage] = useState(1);

  const pipelineState: InstitutionalOperationalState | null = program?.semesters?.length
    ? pickDetailBottleneckState(program.semesters)
    : project?.status === 'CLOSED'
      ? 'FINALIZED'
      : null;

  const isPlanningRadicationReview =
    radication?.projectInstitutionalState === 'PENDING_PLANNING_RADICATION_CHECK';
  const isInstitutionalFinalized = radication?.projectInstitutionalState === 'FINALIZED';

  const checklistRows = useMemo(() => (project ? collectChecklistRows(project) : []), [project]);
  const subjectRows = useMemo(
    () => (project ? collectSubjectRows(project, program?.semesters ?? []) : []),
    [project, program?.semesters],
  );
  const semesters = program?.semesters ?? [];

  const paginatedSemesters = useMemo(
    () => paginateAdminDetail(semesters, semestersPage, ADMIN_DETAIL_SEMESTERS_PAGE_SIZE),
    [semesters, semestersPage],
  );
  const paginatedSubjects = useMemo(
    () => paginateAdminDetail(subjectRows, subjectsPage, ADMIN_DETAIL_SUBJECTS_PAGE_SIZE),
    [subjectRows, subjectsPage],
  );
  const paginatedChecklist = useMemo(
    () => paginateAdminDetail(checklistRows, checklistPage, ADMIN_DETAIL_CHECKLIST_PAGE_SIZE),
    [checklistRows, checklistPage],
  );

  const semestersTotalPages = adminDetailTotalPages(semesters.length, ADMIN_DETAIL_SEMESTERS_PAGE_SIZE);
  const subjectsTotalPages = adminDetailTotalPages(subjectRows.length, ADMIN_DETAIL_SUBJECTS_PAGE_SIZE);
  const checklistTotalPages = adminDetailTotalPages(checklistRows.length, ADMIN_DETAIL_CHECKLIST_PAGE_SIZE);

  const hasInstitutional =
    isInstitutionalFinalized ||
    isPlanningRadicationReview ||
    Boolean(program && !isPlanningRadicationReview && !isInstitutionalFinalized);

  useEffect(() => {
    setSemestersPage(1);
    setSubjectsPage(1);
    setChecklistPage(1);
  }, [activeTab, projectId]);

  const summaryStats = useMemo(() => {
    if (program) {
      return [
        {
          label: 'Semestres',
          value: `${program.completedSemesters}/${program.totalSemesters}`,
          icon: GraduationCap,
        },
        {
          label: 'Materias',
          value: `${program.completedSubjects}/${program.totalSubjects}`,
          icon: BookOpen,
        },
        {
          label: 'Observaciones',
          value: String(program.openObservations),
          icon: MessageSquareWarning,
          tone: 'text-amber-500',
        },
        {
          label: 'Plazo',
          value: program.nearestDueDate ? formatDate(program.nearestDueDate) : '—',
          icon: CalendarDays,
        },
        {
          label: 'Product',
          value: project?.productOwner.name ?? '—',
          icon: User,
          tone: 'text-sky-500',
        },
        {
          label: 'Fábrica',
          value: project?.factoryOwner?.name ?? '—',
          icon: Users,
          tone: 'text-indigo-500',
        },
      ];
    }
    if (project) {
      return [
        { label: 'Progreso', value: `${project.progress}%`, icon: Activity },
        {
          label: 'Entrega',
          value: project.expectedDeliveryDate ? formatDate(project.expectedDeliveryDate) : '—',
          icon: CalendarDays,
        },
        { label: 'Product', value: project.productOwner.name, icon: User, tone: 'text-sky-500' },
        {
          label: 'Fábrica',
          value: project.factoryOwner?.name ?? '—',
          icon: Users,
          tone: 'text-indigo-500',
        },
      ];
    }
    return [];
  }, [program, project]);

  if (!projectId) {
    return (
      <DashboardShell>
        <p className="text-sm text-rose-700">Identificador de programa no válido.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell className="space-y-4">
      <ContextBackLink fallback={backTarget} className={backLinkClassName}>
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Volver al panel admin
      </ContextBackLink>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error && !project ? (
        <Card variant="roleGlass" className="p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">No se pudo cargar el programa</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </Card>
      ) : (
        <>
          <PageHeader
            eyebrow={project?.school ?? program?.school ?? 'Programa'}
            title={project?.program ?? program?.program ?? 'Detalle de solicitud'}
            description="Navega por sección para ver resumen, semestres, materias y checklist sin scroll infinito."
            roleAccent="product"
          />

          {summaryStats.length > 0 ? <AdminDetailStatStrip stats={summaryStats} /> : null}

          <AdminProgramDetailSectionTabs
            active={activeTab}
            onChange={setActiveTab}
            counts={{
              semesters: semesters.length,
              subjects: subjectRows.length,
              checklist: checklistRows.length,
              hasInstitutional,
            }}
          />

          {activeTab === 'overview' ? (
            <div className="space-y-3">
              {pipelineState ? (
                <Card variant="roleGlass" className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={text.label}>Pipeline institucional</p>
                      <p className="text-xs text-slate-500">Flujo end-to-end del programa</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {program?.slaStatus ? (
                        <SlaBadgeV2 status={program.slaStatus as SlaStatusV2} />
                      ) : null}
                      {program?.activeStageSummary?.length ? (
                        <ProgramActiveStageBadge stages={program.activeStageSummary} />
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3">
                    <OperationalPipelineInstitutional
                      state={pipelineState}
                      variant="compact"
                      showHeader={false}
                    />
                  </div>
                </Card>
              ) : null}

              {project ? (
                <Card variant="roleGlass" className="p-4 text-xs text-slate-600">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <span className="font-semibold text-slate-800">Modalidad:</span>{' '}
                      {String(project.modality).replace(/_/g, ' ')}
                    </span>
                    <span>
                      <span className="font-semibold text-slate-800">Prioridad:</span> {project.priority}
                    </span>
                    <span>
                      <span className="font-semibold text-slate-800">Tipo:</span> {project.requestType}
                    </span>
                    <span>
                      <span className="font-semibold text-slate-800">Estado proyecto:</span>{' '}
                      <StatusBadge status={project.status} size="sm" />
                    </span>
                  </div>
                  {project.observations ? (
                    <p className="mt-2 border-t border-white/50 pt-2 text-slate-500">
                      <span className="font-semibold text-slate-700">Observaciones:</span>{' '}
                      {project.observations}
                    </p>
                  ) : null}
                </Card>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-3">
                {semesters.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('semesters')}
                    className="rounded-xl border border-white/55 bg-white/50 p-3 text-left text-xs backdrop-blur-sm transition-colors hover:bg-white/70"
                  >
                    <Layers className="mb-1 h-4 w-4 text-orange-500" />
                    <p className="font-bold text-slate-900">{semesters.length} semestres</p>
                    <p className="text-slate-500">Ver detalle por semestre</p>
                  </button>
                ) : null}
                {subjectRows.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('subjects')}
                    className="rounded-xl border border-white/55 bg-white/50 p-3 text-left text-xs backdrop-blur-sm transition-colors hover:bg-white/70"
                  >
                    <BookOpen className="mb-1 h-4 w-4 text-orange-500" />
                    <p className="font-bold text-slate-900">{subjectRows.length} materias</p>
                    <p className="text-slate-500">Fechas y progreso</p>
                  </button>
                ) : null}
                {checklistRows.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('checklist')}
                    className="rounded-xl border border-white/55 bg-white/50 p-3 text-left text-xs backdrop-blur-sm transition-colors hover:bg-white/70"
                  >
                    <ClipboardList className="mb-1 h-4 w-4 text-orange-500" />
                    <p className="font-bold text-slate-900">{checklistRows.length} ítems checklist</p>
                    <p className="text-slate-500">Producción por materia/tema</p>
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeTab === 'semesters' ? (
            <div className="space-y-2">
              {semesters.length === 0 ? (
                <Card variant="roleGlass" className="p-6 text-center text-sm text-slate-500">
                  No hay semestres en seguimiento institucional.
                </Card>
              ) : (
                <>
                  <Card variant="roleGlass" className="overflow-hidden p-0">
                    <div className={cn('px-4 py-3', surface.roleGlassTableHead)}>
                      <h2 className="text-sm font-semibold text-slate-900">Semestres operacionales</h2>
                    </div>
                    <div className="divide-y divide-slate-100/80">
                      {paginatedSemesters.map((semester) => (
                        <div
                          key={semester.semesterId ?? semester.subjectId}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900">{semester.subjectName}</p>
                            <p className="text-[11px] text-slate-500">
                              {semester.subjectsReady ?? 0}/{semester.subjectsTotal ?? 0} materias ·{' '}
                              {institutionalStateLabel(semester.operationalState)}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <OperationalStateBadgeV2
                                state={semester.operationalState as InstitutionalOperationalState}
                              />
                              {semester.stageDueAt ? (
                                <span className="text-[11px] text-slate-500">
                                  {formatDate(semester.stageDueAt)}
                                </span>
                              ) : null}
                            </div>
                            {semester.lastReturnReason ? (
                              <p className="mt-1 text-[11px] font-medium text-rose-600">
                                {semester.lastReturnReason}
                              </p>
                            ) : null}
                          </div>
                          {semester.semesterId && program ? (
                            <Link
                              to={ADMIN_SEMESTER_DETAIL_PATH(program.projectId, semester.semesterId)}
                              state={{ from: location.pathname }}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/60 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-white"
                            >
                              Ver semestre
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </Card>
                  <OperationalInboxPagination
                    page={semestersPage}
                    totalPages={semestersTotalPages}
                    totalItems={semesters.length}
                    pageSize={ADMIN_DETAIL_SEMESTERS_PAGE_SIZE}
                    itemLabel={{ one: 'semestre', other: 'semestres' }}
                    onPageChange={setSemestersPage}
                  />
                </>
              )}
            </div>
          ) : null}

          {activeTab === 'subjects' ? (
            <div className="space-y-2">
              {subjectRows.length === 0 ? (
                <Card variant="roleGlass" className="p-6 text-center text-sm text-slate-500">
                  No hay materias registradas.
                </Card>
              ) : (
                <>
                  <Card variant="roleGlass" className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr
                            className={cn(
                              'text-[10px] font-bold uppercase text-slate-400',
                              surface.roleGlassTableHead,
                            )}
                          >
                            <th className="px-4 py-2.5">Sem.</th>
                            <th className="px-3 py-2.5">Materia</th>
                            <th className="px-3 py-2.5">Estado</th>
                            <th className="px-3 py-2.5">Plazo operativo</th>
                            <th className="px-3 py-2.5">Entrega fábrica</th>
                            <th className="px-3 py-2.5">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                          {paginatedSubjects.map((row) => {
                            const entregaDate = resolveSubjectEntregaDate(row);
                            return (
                            <tr key={row.subject.id} className={tableRow}>
                              <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                                {row.semesterNumber}
                              </td>
                              <td className="px-3 py-2.5 text-xs font-medium text-slate-900">
                                {row.subject.name}
                              </td>
                              <td className="px-3 py-2.5">
                                <StatusBadge status={row.subject.status} size="sm" />
                              </td>
                              <td className="px-3 py-2.5 text-xs text-slate-600">
                                {entregaDate ? formatDate(entregaDate) : '—'}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-slate-600">
                                {row.factoryExpectedDate ? formatDate(row.factoryExpectedDate) : '—'}
                              </td>
                              <td className="px-3 py-2.5 text-xs font-semibold text-slate-700">
                                {row.subject.progress}%
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  <OperationalInboxPagination
                    page={subjectsPage}
                    totalPages={subjectsTotalPages}
                    totalItems={subjectRows.length}
                    pageSize={ADMIN_DETAIL_SUBJECTS_PAGE_SIZE}
                    itemLabel={{ one: 'materia', other: 'materias' }}
                    onPageChange={setSubjectsPage}
                  />
                </>
              )}
            </div>
          ) : null}

          {activeTab === 'checklist' ? (
            <div className="space-y-2">
              {checklistRows.length === 0 ? (
                <Card variant="roleGlass" className="p-6 text-center text-sm text-slate-500">
                  No hay ítems de checklist de producción.
                </Card>
              ) : (
                <>
                  <Card variant="roleGlass" className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr
                            className={cn(
                              'text-[10px] font-bold uppercase text-slate-400',
                              surface.roleGlassTableHead,
                            )}
                          >
                            <th className="px-4 py-2.5">Sem.</th>
                            <th className="px-3 py-2.5">Materia</th>
                            <th className="px-3 py-2.5">Ámbito</th>
                            <th className="px-3 py-2.5">Ítem</th>
                            <th className="px-3 py-2.5">Estado</th>
                            <th className="px-3 py-2.5">Resp.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                          {paginatedChecklist.map((item) => (
                            <tr key={item.id} className={tableRow}>
                              <td className="px-4 py-2.5 text-xs text-slate-500">{item.semesterNumber}</td>
                              <td className="px-3 py-2.5 text-xs font-medium text-slate-800">
                                {item.subjectName}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-slate-500">
                                {item.scope}
                                {item.topicName ? `: ${item.topicName}` : ''}
                              </td>
                              <td className="max-w-[200px] truncate px-3 py-2.5 text-xs text-slate-800">
                                {item.label}
                              </td>
                              <td className="px-3 py-2.5">
                                <StatusBadge status={item.status} size="sm" />
                              </td>
                              <td className="px-3 py-2.5 text-xs text-slate-500">{item.ownerRole}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  <OperationalInboxPagination
                    page={checklistPage}
                    totalPages={checklistTotalPages}
                    totalItems={checklistRows.length}
                    pageSize={ADMIN_DETAIL_CHECKLIST_PAGE_SIZE}
                    itemLabel={{ one: 'ítem', other: 'ítems' }}
                    onPageChange={setChecklistPage}
                  />
                </>
              )}
            </div>
          ) : null}

          {activeTab === 'institutional' && hasInstitutional ? (
            <div className="space-y-3">
              {isInstitutionalFinalized && projectId ? (
                <ProjectInstitutionalClosurePanel projectId={projectId} />
              ) : null}
              {projectId && program && !isInstitutionalFinalized ? (
                <AdminRadicationReadOnlyPanel
                  projectId={projectId}
                  macroProgress={{
                    completedSemesters: program.completedSemesters,
                    totalSemesters: program.totalSemesters,
                    completedSubjects: program.completedSubjects,
                    totalSubjects: program.totalSubjects,
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </DashboardShell>
  );
}
