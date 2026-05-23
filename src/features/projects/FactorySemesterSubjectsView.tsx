import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, MessageSquare, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/status/StatusBadge';
import { DeepLinkNotFound } from '../../components/feedback/DeepLinkNotFound';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { useEnsureProjectDetail } from '../operations/useEnsureProjectDetail';
import { formatDate } from '../../utils/formatters';
import {
  buildSubjectWorkItem,
  getOperationalCta,
  getOperationalStateLabel,
  normalizeSubjectOperationalState,
  resolveSubjectExpectedDeliveryDate,
} from '../../features/operations/subjectOperationalState';
import { analyzeFactorySemester } from '../../features/operations/factoryProjectState';
import { calculateSubjectProgress } from '../../features/operations/progress';

export function FactorySemesterSubjectsView() {
  const { projectId, semesterNumber } = useParams();
  const { projectObservations, refreshProjects } = useOperations();
  const { project, isLoading, error, notFound } = useEnsureProjectDetail(projectId);
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

  const semester = project.semesters.find((s) => s.semesterNumber === semesterNum);
  const subjects = project.subjects.filter((s) => s.semesterNumber === semesterNum);

  const semesterProgress = subjects.length > 0
    ? Math.round(subjects.reduce((acc, s) => acc + (s.progress ?? 0), 0) / subjects.length)
    : 0;

  const semesterInsight = analyzeFactorySemester(project, semesterNum, projectObservations);
  const openProductObs = projectObservations.filter(
    (o) => o.role === 'PRODUCT' && (o.status === 'ABIERTA' || o.status === 'EN_CORRECCION') && subjects.some((s) => s.id === o.subjectId)
  );

  const subjectsWithObs = subjects.filter((s) =>
    openProductObs.some((o) => o.subjectId === s.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#FF6B00]">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al proyecto
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#1E293B]">{project.program}</h1>
          <p className="mt-1 text-[0.9rem] text-[#64748B]">{project.school} · Semestre {semesterNum}</p>
        </div>
        <StatusBadge status={semesterInsight.displayStatus as any} />
      </div>

      <Card className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-5">
        <Info label="Entrega Fábrica">{semester ? formatDate(semester.factoryExpectedDate) : formatDate(project.expectedDeliveryDate)}</Info>
        <Info label="Asignaturas">{semesterInsight.totalSubjects}</Info>
        <Info label={semesterInsight.isComplete ? 'Completadas' : 'En revisión Product'}>
          {semesterInsight.isComplete
            ? `${semesterInsight.approvedCount} de ${semesterInsight.totalSubjects}`
            : `${semesterInsight.inReviewCount} de ${semesterInsight.totalSubjects}`}
        </Info>
        <Info label="Aprobadas">{semesterInsight.approvedCount} de {semesterInsight.totalSubjects}</Info>
      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Producción por asignatura</p>
            <h2 className="mt-1 text-sm font-black tracking-tight text-slate-950">
              {semesterInsight.isComplete ? 'Semestre completado' : 'Gestiona cada materia desde su detalle'}
            </h2>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              {semesterInsight.isComplete
                ? 'Todas las materias fueron aprobadas por Product. No queda trabajo pendiente de Fábrica en este semestre.'
                : 'Aquí no existen acciones globales de producción o entrega. El avance del semestre se calcula automáticamente según el estado de sus asignaturas.'}
            </p>
          </div>
          <div className="rounded-[14px] border border-slate-100 bg-slate-50 px-4 py-3 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avance real</p>
            <p className="mt-1 text-sm font-black text-slate-900">{semesterInsight.progressLabel}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{subjectsWithObs.length} con correcciones</p>
          </div>
        </div>
      </Card>

      {openProductObs.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-rose-500/10">
              <MessageSquare className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Correcciones solicitadas por Product</h2>
              <p className="text-[11px] font-medium text-[#64748B]">{openProductObs.length} observacion{openProductObs.length !== 1 ? 'es' : ''} pendiente{openProductObs.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="space-y-3">
            {openProductObs.slice(0, 5).map((obs) => {
              const subject = subjects.find((s) => s.id === obs.subjectId);
              return (
                <div key={obs.id} className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] border border-rose-100/50">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#1E293B]">{subject?.name ?? 'Asignatura'}</p>
                      <p className="mt-1 text-xs text-[#64748B] line-clamp-2">{obs.text}</p>
                    </div>
                      {subject && (
                        <Link
                          to={`/subjects/${subject.id}?focus=correction`}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-[12px] bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all"
                        >
                          Ir a asignatura <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#FFEDD5]">
          <BookOpen className="h-4 w-4 text-[#FF6B00]" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Asignaturas del semestre</h2>
          <p className="text-[11px] font-medium text-[#64748B]">{semesterInsight.headerLabel}</p>
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">Sin asignaturas registradas</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Las asignaturas aparecerán cuando Product las asigne.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => {
            const operationalState = normalizeSubjectOperationalState({
              subject,
              observations: openProductObs,
              projectStatus: project.status,
            });
            const workItem = buildSubjectWorkItem(project, subject, openProductObs);
            const subjectState = getOperationalStateLabel(operationalState);
            const subjectProgress = calculateSubjectProgress(subject);
            const subjectObservations = openProductObs.filter((o) => o.subjectId === subject.id);
            const topicCount = subject.contentTopics?.length ?? 0;
            const cta = getOperationalCta(operationalState);
            const subjectActionLabel =
              subjectObservations.length > 0 ? 'Ver correcciones' : cta.label;

            return (
              <div
                key={subject.id}
                className="rounded-[20px] bg-white p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Semestre {subject.semesterNumber}</p>
                    <h3 className="mt-1 text-base font-bold tracking-tight text-[#1E293B] truncate">{subject.name}</h3>
                  </div>
                  <StatusBadge status={subject.status} size="sm" />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={subjectProgress} showLabel={false} size="sm" />
                  </div>
                  <span className="text-xs font-black text-orange-600">{subjectProgress}%</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-orange-400" />
                    {topicCount} temas
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-orange-400" />
                    Entrega: {formatDate(resolveSubjectExpectedDeliveryDate(project, subject))}
                  </span>
                  <span>{subjectState}</span>
                  {subjectObservations.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-rose-600">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {subjectObservations.length} obs.
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <Link
                    to={workItem.actionUrl}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-[#FF6B00] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FF6B00]/20 transition-all duration-200 hover:scale-105 hover:bg-[#E66000]"
                  >
                    {subjectActionLabel} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
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
