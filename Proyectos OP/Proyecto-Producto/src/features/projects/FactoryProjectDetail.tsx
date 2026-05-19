import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Tabs } from '../../components/ui/Tabs';
import { useOperations } from '../../features/operations/OperationsContext';
import { formatDate } from '../../utils/formatters';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, FileText, MessageSquare, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { priorityLabels } from '../../utils/status';
import { cn } from '../../components/ui/tokens';

const tabs = [
  { id: 'summary', label: 'Resumen' },
  { id: 'semesters', label: 'Semestres' },
];

const nextStepMessages: Record<string, string> = {
  READY_FOR_PRODUCTION: 'Inicia producción cuando el equipo tome la solicitud.',
  IN_PRODUCTION: 'Completa entregables y entrega a Product.',
  FEEDBACK_PENDING: 'Aplica correcciones solicitadas por Product.',
  IN_REVIEW: 'Espera validación de Product.',
  CLOSED: 'La solicitud fue cerrada.',
};

export function FactoryProjectDetail() {
  const { projectId } = useParams();
  const { projects, projectObservations, startProjectProduction, deliverProjectToProduct } = useOperations();
  const project = projects.find((item) => item.id === projectId);
  const [activeTab, setActiveTab] = useState('summary');

  if (!project) return <Navigate to="/projects" replace />;

  const openProductObs = projectObservations.filter(
    (obs) => obs.authorRole === 'PRODUCT' && (obs.status === 'ABIERTA' || obs.status === 'OPEN') && obs.relatedEntity?.includes(project.id)
  );

  const statusAction = () => {
    switch (project.status) {
      case 'READY_FOR_PRODUCTION':
        return (
          <Button onClick={() => startProjectProduction(project.id)} className="w-full py-3 text-sm font-bold">
            <Package className="h-4 w-4" /> Marcar en producción
          </Button>
        );
      case 'IN_PRODUCTION':
        return (
          <Button onClick={() => deliverProjectToProduct(project.id)} className="w-full py-3 text-sm font-bold">
            <CheckCircle2 className="h-4 w-4" /> Entregar a Product
          </Button>
        );
      case 'FEEDBACK_PENDING':
        return (
          <div className="space-y-3">
            <div className="rounded-[12px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              Product solicitó correcciones. Revisa las observaciones abiertas.
            </div>
            <Button variant="secondary" className="w-full py-3 text-sm font-bold" asChild>
              <Link to={`/projects/${project.id}/semesters/${project.semesters[0]?.semesterNumber ?? 1}`}>
                <MessageSquare className="h-4 w-4" /> Ver correcciones
              </Link>
            </Button>
          </div>
        );
      case 'IN_REVIEW':
        return (
          <div className="rounded-[12px] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Entregado a Product. Esperando validación.
          </div>
        );
      case 'CLOSED':
        return (
          <div className="rounded-[12px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            Solicitud cerrada por Product.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#FF6B00]">
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Volver a Solicitudes
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#1E293B]">{project.program}</h1>
          <p className="mt-1 text-[0.9rem] text-[#64748B]">{project.school} · {project.modality}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <Card className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-5">
        <Info label="Responsable Product">{project.productOwner}</Info>
        <Info label="Entrega esperada Fábrica">{formatDate(project.expectedDeliveryDate)}</Info>
        <Info label="Prioridad">{priorityLabels[project.priority]}</Info>
        <Info label="Semestres">{project.semesters.length}</Info>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'summary' && (
        <SummaryTab project={project} openProductObs={openProductObs} statusAction={statusAction} />
      )}
      {activeTab === 'semesters' && <SemestersTab project={project} openProductObs={openProductObs} />}
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

function SummaryTab({
  project,
  openProductObs,
  statusAction,
}: {
  project: ReturnType<typeof useOperations>['projects'][number];
  openProductObs: ReturnType<typeof useOperations>['projectObservations'];
  statusAction: () => React.ReactNode;
}) {
  const hasSyllabus = project.links.some((l) => l.type === 'SYLLABUS');
  const syllabusLink = project.links.find((l) => l.type === 'SYLLABUS');

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
                  {obs.content}
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
        <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">Estado de producción</h2>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar value={project.progress} showLabel={false} size="md" />
          </div>
          <span className="text-sm font-black text-orange-600">{project.progress}%</span>
        </div>

        <div className="mt-4">
          <StatusBadge status={project.status} />
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Siguiente paso</p>
        <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">Qué hacer ahora</h2>

        <div className="mt-6 space-y-4">
          <div className="rounded-[16px] border border-orange-100/60 bg-white p-4 shadow-[0_4px_16px_-8px_rgba(249,115,22,0.2)]">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-sm">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{nextStepMessages[project.status] ?? 'Sin pasos pendientes.'}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">{statusAction()}</div>
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
        const totalChecklist = subjects.reduce((acc, s) => acc + s.checklist.length, 0);
        const approvedChecklist = subjects.reduce((acc, s) => acc + s.checklist.filter((c) => c.status === 'APROBADO').length, 0);
        const semesterProgress = totalChecklist > 0 ? Math.round((approvedChecklist / totalChecklist) * 100) : 0;
        const semObs = openProductObs.filter((o) => o.relatedEntity?.includes(semester.id));

        return (
          <Card key={semester.id} className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Semestre</p>
                <h3 className="mt-0.5 text-xl font-black tracking-tight text-slate-950">Semestre {semester.semesterNumber}</h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={semester.factoryStatus} />
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <CalendarDays className="h-3 w-3" /> Entrega: {formatDate(semester.factoryExpectedDate)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={semesterProgress} showLabel={false} size="sm" />
              </div>
              <span className="text-xs font-black text-orange-600">{semesterProgress}%</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                {subjects.length} asignatura{subjects.length !== 1 ? 's' : ''}
              </span>
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
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-700"
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
