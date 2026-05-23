import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { DeepLinkNotFound } from '../../components/feedback/DeepLinkNotFound';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { useEnsureProjectDetail } from '../operations/useEnsureProjectDetail';
import { formatDate } from '../../utils/formatters';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, FileText, MessageSquare, Package } from 'lucide-react';
import { priorityLabels } from '../../utils/status';
import { getProjectModificationLabel } from '../../features/operations/modificationBadges';
import {
  getOperationalStateLabel,
  normalizeSubjectOperationalState,
} from '../../features/operations/subjectOperationalState';
import { analyzeFactoryProject } from '../../features/operations/factoryProjectState';
import { ModificationBadge } from '../../components/project/ModificationBadge';
import { useDismissNotificationsOnVisit } from '../notifications/useDismissNotificationsOnVisit';

const tabs = [
  { id: 'summary', label: 'Resumen' },
  { id: 'semesters', label: 'Semestres' },
];

export function FactoryProjectDetail() {
  const { projectId } = useParams();
  const { projectObservations, notifications, refreshProjects } = useOperations();
  const { project, isLoading, error, notFound } = useEnsureProjectDetail(projectId);
  useDismissNotificationsOnVisit({ projectId: project?.id });
  const [activeTab, setActiveTab] = useState('summary');

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

  const openProductObs = projectObservations.filter(
    (obs) => obs.role === 'PRODUCT' && (obs.status === 'ABIERTA' || obs.status === 'EN_CORRECCION') && obs.projectId === project.id,
  );
  const projectInsight = analyzeFactoryProject(project, openProductObs);
  const modificationLabel = getProjectModificationLabel(notifications, project.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#FF6B00]">
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Volver a Solicitudes
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#1E293B]">{project.program}</h1>
          <p className="mt-1 text-[0.9rem] text-[#64748B]">{project.school} · {project.modality}</p>
          {modificationLabel && <div className="mt-3"><ModificationBadge label={modificationLabel} /></div>}
        </div>
        <StatusBadge status={projectInsight.displayStatus as any} />
      </div>

      <Card className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Responsable Product">{project.productOwner}</Info>
        <Info label="Entrega esperada Fábrica">{formatDate(project.expectedDeliveryDate)}</Info>
        <Info label="Prioridad">{priorityLabels[project.priority]}</Info>
        <Info label="Semestres">{project.semesters.length}</Info>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'summary' && (
        <SummaryTab project={project} openProductObs={openProductObs} projectInsight={projectInsight} />
      )}
      {activeTab === 'semesters' && <SemestersTab project={project} openProductObs={openProductObs} />}
    </div>
  );
}

function SummaryTab({
  project,
  openProductObs,
  projectInsight,
}: {
  project: ReturnType<typeof useOperations>['projects'][number];
  openProductObs: ReturnType<typeof useOperations>['projectObservations'];
  projectInsight: ReturnType<typeof analyzeFactoryProject>;
}) {
  const hasSyllabus = project.links.some((l) => l.type === 'SYLLABUS');
  const syllabusLink = project.links.find((l) => l.type === 'SYLLABUS');
  const totalSubjects = project.subjects.length;
  const subjectsInProduction = project.subjects.filter(
    (subject) =>
      normalizeSubjectOperationalState({ subject, observations: openProductObs, projectStatus: project.status }) ===
      'IN_PRODUCTION',
  ).length;
  const subjectsInReview = project.subjects.filter(
    (subject) =>
      normalizeSubjectOperationalState({ subject, observations: openProductObs, projectStatus: project.status }) ===
      'IN_REVIEW',
  ).length;
  const approvedSubjects = project.subjects.filter(
    (subject) =>
      normalizeSubjectOperationalState({ subject, observations: openProductObs, projectStatus: project.status }) ===
      'APPROVED',
  ).length;
  const correctionSubjects = project.subjects.filter(
    (subject) =>
      normalizeSubjectOperationalState({ subject, observations: openProductObs, projectStatus: project.status }) ===
      'CHANGES_REQUESTED',
  ).length;
  const firstSemesterRoute = `/projects/${project.id}/semesters/${project.semesters[0]?.semesterNumber ?? 1}`;

  return (
    <section className="tab-content-active space-y-6">
      <Card className="p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Orden de trabajo</p>
        <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">Información de producción</h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Escuela">{project.school}</Info>
          <Info label="Programa">{project.program}</Info>
          <Info label="Modalidad">{project.modality}</Info>
          <Info label="Prioridad">{priorityLabels[project.priority]}</Info>
          <Info label="Fecha entrega Fábrica">{formatDate(project.expectedDeliveryDate)}</Info>
          <Info label="Responsable Product">{project.productOwner}</Info>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Syllabus</p>
            <div className="flex items-center gap-2">
              {hasSyllabus ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-800">Sí</span>
                  {syllabusLink && (
                    <a href={syllabusLink.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700">
                      <FileText className="h-3.5 w-3.5" /> Abrir link
                    </a>
                  )}
                </>
              ) : (
                <span className="text-sm font-medium text-slate-500">Sin syllabus registrado</span>
              )}
            </div>
          </div>
          <Info label="Semestres solicitados">{project.semesters.map((s) => `Semestre ${s.semesterNumber}`).join(', ')}</Info>
        </div>

        <div className="mt-6">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Observaciones abiertas de Product</p>
          {openProductObs.length > 0 ? (
            <div className="space-y-2">
              {openProductObs.slice(0, 3).map((obs) => (
                <div key={obs.id} className="rounded-[12px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {obs.text}
                </div>
              ))}
              {openProductObs.length > 3 && (
                <p className="text-xs font-medium text-[#94A3B8]">+ {openProductObs.length - 3} observaciones más</p>
              )}
            </div>
          ) : (
            <p className="rounded-[12px] bg-[#F8FAFC] p-4 text-sm font-medium text-[#64748B]">Sin observaciones abiertas.</p>
          )}
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Avance</p>
        <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">Avance por asignaturas</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric label="En producción" value={`${subjectsInProduction} de ${totalSubjects}`} helper="materias activas" />
          <SummaryMetric label="En revisión Product" value={`${subjectsInReview} de ${totalSubjects}`} helper="enviadas a Product" />
          <SummaryMetric label="Aprobadas" value={`${approvedSubjects} de ${totalSubjects}`} helper="validadas por Product" />
          <SummaryMetric label="Con correcciones" value={`${correctionSubjects}`} helper="materias con observaciones" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-[16px] border border-slate-100 bg-slate-50/70 px-4 py-4">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {projectInsight.isFactoryWorkComplete
                ? 'Producción completada'
                : 'El estado general se calcula automaticamente'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {projectInsight.isFactoryWorkComplete
                ? 'Todas las materias fueron aprobadas por Product. Ya no requiere trabajo de Fábrica.'
                : 'Gestiona cada materia desde su detalle. El avance general se calcula automáticamente.'}
            </p>
          </div>
          <StatusBadge status={projectInsight.displayStatus as any} />
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Producción por asignatura</p>
        <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">Gestiona cada materia desde su detalle</h2>

        <div className="mt-6 space-y-4">
          <div className="rounded-[16px] border border-orange-100/60 bg-white p-5 shadow-[0_4px_16px_-8px_rgba(249,115,22,0.2)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Cada materia debe gestionarse individualmente.</p>
                <p className="mt-1 text-sm text-slate-600">Entra a una asignatura para iniciar producción, marcarla como completada o aplicar correcciones.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-start">
            <Link to={firstSemesterRoute} className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FF6B00] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[#FF6B00]/20 transition-all duration-200 hover:bg-[#E66000]">
              Ver asignaturas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </Card>
    </section>
  );
}

function SemestersTab({
  project,
  openProductObs,
}: {
  project: ReturnType<typeof useOperations>['projects'][number];
  openProductObs: ReturnType<typeof useOperations>['projectObservations'];
}) {
  const subjectsBySemester = project.semesters.map((semester) => {
    const subjects = project.subjects.filter((s) => s.semesterNumber === semester.semesterNumber);
    return { semester, subjects };
  });

  return (
    <div className="tab-content-active space-y-6">
      {subjectsBySemester.map(({ semester, subjects }) => {
        const semObs = openProductObs.filter((o) => subjects.some((subject) => subject.id === o.subjectId));
        const reviewSubjects = subjects.filter(
          (subject) =>
            normalizeSubjectOperationalState({
              subject,
              observations: openProductObs,
              projectStatus: project.status,
            }) === 'IN_REVIEW',
        ).length;
        const approvedSubjects = subjects.filter(
          (subject) =>
            normalizeSubjectOperationalState({
              subject,
              observations: openProductObs,
              projectStatus: project.status,
            }) === 'APPROVED',
        ).length;

        return (
          <Card key={semester.id} className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Semestre</p>
                <h3 className="mt-0.5 text-xl font-black tracking-tight text-slate-950">Semestre {semester.semesterNumber}</h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={semester.status} />
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <CalendarDays className="h-3 w-3" /> Entrega: {formatDate(semester.factoryExpectedDate)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniMetric label="Asignaturas" value={`${subjects.length}`} />
              <MiniMetric label="En revisión" value={`${reviewSubjects} de ${subjects.length}`} />
              <MiniMetric label="Aprobadas" value={`${approvedSubjects} de ${subjects.length}`} />
              <MiniMetric label="Correcciones" value={`${semObs.length}`} />
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                Producción por materia
              </span>
              <span>{reviewSubjects} de {subjects.length} materias enviadas</span>
              <span>{approvedSubjects} de {subjects.length} aprobadas</span>
              {semObs.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-rose-600">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {semObs.length} observacion{semObs.length !== 1 ? 'es' : ''}
                </span>
              )}
            </div>

            {semester.observations && (
              <p className="mt-4 rounded-[12px] bg-[#F8FAFC] p-3 text-xs font-medium text-[#64748B]">{semester.observations}</p>
            )}

            {subjects.length > 0 && (
              <div className="mt-5">
                <Link
                  to={`/projects/${project.id}/semesters/${semester.semesterNumber}`}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-700"
                >
                  Ver asignaturas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </Card>
        );
      })}

      {project.semesters.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm font-bold text-slate-700">No hay semestres registrados</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Los semestres aparecerán cuando Product los asigne.</p>
        </Card>
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

function SummaryMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[18px] border border-slate-100 bg-white px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-100 bg-slate-50/70 px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
