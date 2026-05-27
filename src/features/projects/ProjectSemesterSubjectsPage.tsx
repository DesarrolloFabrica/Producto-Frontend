import { Link, useLocation, useParams } from 'react-router-dom';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { ContextLink } from '../../navigation/ContextLink';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/status/StatusBadge';
import { DeepLinkNotFound } from '../../components/feedback/DeepLinkNotFound';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { useEnsureProjectDetail } from '../operations/useEnsureProjectDetail';
import { useAuth } from '../auth/AuthContext';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../components/ui/tokens';
import { FactorySemesterSubjectsView } from './FactorySemesterSubjectsView';
import { useDismissNotificationsOnVisit } from '../notifications/useDismissNotificationsOnVisit';
import { ChangeOriginBadge, ChangeOriginCardAccent, ChangeOriginHint } from '../../components/change-tracking/ChangeOriginBadge';
import { semesterOperationsPath } from '../institutional-workflow/institutionalNavigation';

export function ProjectSemesterSubjectsPage() {
  const { projectId, semesterNumber } = useParams();
  const location = useLocation();
  const { projectObservations, refreshProjects } = useOperations();
  const { role } = useAuth();
  const reviewJustStarted = Boolean(
    (location.state as { reviewStarted?: boolean } | null)?.reviewStarted,
  );
  const { project, isLoading, error, notFound } = useEnsureProjectDetail(projectId);
  useDismissNotificationsOnVisit({ projectId: project?.id });
  const semesterNum = parseInt(semesterNumber ?? '0', 10);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice isLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice error={error} onRefresh={() => void refreshProjects()} />
      </div>
    );
  }

  if (isNaN(semesterNum)) {
    return (
      <DeepLinkNotFound
        title="Semestre no válido"
        description="La URL no contiene un número de semestre válido."
        backTo={projectId ? `/projects/${projectId}` : '/projects'}
        backLabel="Volver al proyecto"
      />
    );
  }

  if (notFound || !project) {
    return (
      <DeepLinkNotFound
        title="Proyecto no encontrado"
        description={error ?? 'No pudimos cargar el proyecto de esta URL.'}
        backTo="/projects"
        onRetry={() => void refreshProjects()}
      />
    );
  }

  if (role === 'FABRICA') {
    return <FactorySemesterSubjectsView />;
  }

  const semester = project.semesters.find((s) => s.semesterNumber === semesterNum);
  const subjects = project.subjects.filter((s) => s.semesterNumber === semesterNum);

  const semesterProgress = subjects.length > 0
    ? Math.round(subjects.reduce((acc, s) => acc + (s.progress ?? 0), 0) / subjects.length)
    : 0;
  const openObservations = projectObservations.filter(
    (o) => o.projectId === project.id && o.status === 'ABIERTA' && subjects.some((s) => s.id === o.subjectId)
  ).length;
  const semesterOpsUrl =
    semester && project ? semesterOperationsPath(project.id, semester.id) : null;

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow={`${project.school} · ${project.program}`}
        title={`Semestre ${semesterNum}`}
        description={`${project.modality} · Responsable Product: ${project.productOwner}`}
        action={
          <ContextBackLink
            fallback={`/projects/${project.id}?tab=semesters`}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-orange-300 hover:text-orange-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al proyecto
          </ContextBackLink>
        }
      />

      <Card variant="subjectPanel" className="p-0 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="grid min-w-0 flex-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Estado del proyecto">
                <StatusBadge status={project.status} />
              </Info>
              <Info label="Entrega esperada por Fábrica">{semester ? formatDate(semester.factoryExpectedDate) : formatDate(project.expectedDeliveryDate)}</Info>
              <Info label="Asignaturas">{subjects.length}</Info>
              <Info label="Observaciones abiertas">{openObservations}</Info>
            </div>
            <div className="flex min-w-[220px] flex-col gap-3">
              <div className="relative h-2.5 overflow-hidden rounded-[10px] bg-[#E2E8F0]">
                <div className="relative h-full rounded-[10px] bg-linear-to-r from-[#FF7E5F] to-[#FEB47B] progress-glass" style={{ width: `${semesterProgress}%` }} />
              </div>
              <p className="text-right text-xs font-black text-orange-600">{semesterProgress}% avance</p>
            </div>
          </div>
        </div>
      </Card>

      <Card
        variant="subjectPanel"
        className={reviewJustStarted ? 'border-emerald-200 bg-emerald-50/60 p-4 sm:p-5' : 'p-4 sm:p-5'}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <CheckCircle2
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                reviewJustStarted ? 'text-emerald-600' : 'text-orange-500',
              )}
            />
            <div>
              <p className="text-sm font-bold text-slate-900">
                {reviewJustStarted ? 'Revisión académica en curso' : 'Revisión de asignaturas'}
              </p>
              <p className="text-xs font-medium text-slate-600">
                {reviewJustStarted
                  ? 'El checklist ya está habilitado. Elija una asignatura abajo para definir temas, validar entregables y aprobar.'
                  : 'Revisa las asignaturas de este semestre y valida el checklist de entregables. Las asignaturas de un semestre quedan definidas al crearlo; para agregar más materias, crea un nuevo semestre desde el detalle del proyecto.'}
              </p>
            </div>
          </div>
          {semesterOpsUrl && (role === 'PRODUCT' || role === 'ADMIN') ? (
            <Link
              to={semesterOpsUrl}
              className="shrink-0 text-xs font-semibold text-slate-600 underline-offset-2 hover:text-orange-600 hover:underline"
            >
              Centro operacional del semestre
            </Link>
          ) : null}
        </div>
      </Card>

      {subjects.length === 0 ? (
        <Card variant="subjectPanel" className="p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">Sin asignaturas en este semestre</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Este semestre no tiene materias registradas. Para incluir materias nuevas, agrega un semestre desde el detalle
            del proyecto.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => {
            const subjectChecklist = subject.checklist.length;
            const subjectProgress = subject.progress ?? 0;
            const subjectObservations = projectObservations.filter(
              (o) => o.subjectId === subject.id && o.status === 'ABIERTA'
            ).length;
            const topicCount = subject.contentTopics?.length ?? 0;

            return (
              <Card key={subject.id} variant="subjectPanel" className="relative overflow-hidden p-5 pl-6 transition-all hover:shadow-md">
                <ChangeOriginCardAccent isNew={Boolean(subject.createdFromChange)} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Semestre {subject.semesterNumber}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight text-slate-950">{subject.name}</h3>
                      {subject.createdFromChange && <ChangeOriginBadge kind="subject" />}
                    </div>
                    {subject.createdFromChange && <ChangeOriginHint kind="subject" />}
                  </div>
                  <StatusBadge status={subject.status} size="sm" />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={subjectProgress} showLabel={false} size="sm" />
                  </div>
                  <span className="text-xs font-black text-orange-600">{subjectProgress}%</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                    {subjectChecklist} entregables
                  </span>
                  {topicCount > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-orange-400" />
                      {topicCount} temas
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-orange-400" />
                    Entrega: {subject.expectedDeliveryDate ? formatDate(subject.expectedDeliveryDate) : 'no definida'}
                  </span>
                  {subjectObservations > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                      {subjectObservations} observaciones
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <ContextLink
                    to={`/subjects/${subject.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-700"
                  >
                    Gestionar revisión
                  </ContextLink>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">{label}</p>
      <div className="text-sm font-medium text-[#1E293B]">{children}</div>
    </div>
  );
}
