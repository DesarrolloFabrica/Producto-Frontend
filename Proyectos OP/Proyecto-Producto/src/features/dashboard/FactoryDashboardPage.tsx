import { Clock3, AlertTriangle, CheckCircle2, ArrowRight, MessageSquare, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MetricCard } from '../../components/cards/MetricCard';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useOperations } from '../../features/operations/OperationsContext';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../components/ui/tokens';

export function FactoryDashboardPage() {
  const { projects, projectObservations } = useOperations();
  const navigate = useNavigate();

  const readyForProduction = projects.filter((p) => p.status === 'READY_FOR_PRODUCTION');
  const inProduction = projects.filter((p) => p.status === 'IN_PRODUCTION');
  const inReview = projects.filter((p) => p.status === 'IN_REVIEW');
  const feedbackPending = projects.filter((p) => p.status === 'FEEDBACK_PENDING');

  const openProductObservations = projectObservations.filter(
    (obs) => obs.authorRole === 'PRODUCT' && (obs.status === 'ABIERTA' || obs.status === 'OPEN')
  );

  const projectsWithOpenObs = projects.filter((p) =>
    openProductObservations.some((obs) => obs.relatedEntity?.includes(p.id))
  );

  const readyCount = readyForProduction.length;
  const productionCount = inProduction.length;
  const obsCount = openProductObservations.length;
  const deliveredCount = inReview.length;

  const now = new Date();
  const upcoming = [...readyForProduction, ...inProduction]
    .map((p) => ({
      project: p,
      daysLeft: Math.ceil((new Date(p.expectedDeliveryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bandeja de trabajo" title="Solicitudes de producción" description="Revisa qué debes producir, qué tiene correcciones y qué está listo para entregar." />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Listas para producción" value={readyCount} icon={Package} tone="text-[#FF6B00]" />
        <MetricCard label="En producción" value={productionCount} icon={ArrowRight} tone="text-[#FF6B00]" />
        <MetricCard label="Observaciones abiertas" value={obsCount} icon={MessageSquare} tone="text-rose-500" />
        <MetricCard label="Entregadas a Product" value={deliveredCount} icon={CheckCircle2} tone="text-emerald-500" />
      </section>

      <section className="space-y-6">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] bg-white/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#FFEDD5]">
                <Package className="h-4 w-4 text-[#FF6B00]" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Solicitudes listas para producir</h2>
                <p className="text-[11px] font-medium text-[#64748B]">Listas para comenzar producción</p>
              </div>
            </div>
            <span className="rounded-[12px] bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#64748B] ring-1 ring-slate-200/50">{readyCount}</span>
          </div>
          <div className="space-y-3 bg-[#F8FAFC]/60 p-4 sm:p-5">
            {readyCount === 0 ? (
              <p className="py-6 text-center text-sm text-[#94A3B8]">No hay solicitudes pendientes de producción.</p>
            ) : (
              readyForProduction.map((project) => (
                <ProjectCard key={project.id} project={project} actionLabel="Trabajar solicitud" actionRoute={`/projects/${project.id}`} />
              ))
            )}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] bg-white/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-rose-500/10">
                <MessageSquare className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Correcciones solicitadas por Product</h2>
                <p className="text-[11px] font-medium text-[#64748B]">Requieren ajustes antes de reentrega</p>
              </div>
            </div>
            <span className="rounded-[12px] bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#64748B] ring-1 ring-slate-200/50">{projectsWithOpenObs.length}</span>
          </div>
          <div className="space-y-3 bg-[#F8FAFC]/60 p-4 sm:p-5">
            {projectsWithOpenObs.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#94A3B8]">No hay correcciones pendientes.</p>
            ) : (
              projectsWithOpenObs.map((project) => {
                const obs = openProductObservations.filter((o) => o.relatedEntity?.includes(project.id));
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    actionLabel="Revisar correcciones"
                    actionRoute={`/projects/${project.id}`}
                    extraInfo={`${obs.length} observaciones abiertas`}
                    lastNote={obs[0]?.content}
                  />
                );
              })
            )}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] bg-white/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-amber-500/10">
                <Clock3 className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Próximos vencimientos</h2>
                <p className="text-[11px] font-medium text-[#64748B]">Ordenados por fecha más cercana</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 bg-[#F8FAFC]/60 p-4 sm:p-5">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#94A3B8]">No hay vencimientos próximos.</p>
            ) : (
              upcoming.map(({ project, daysLeft }) => (
                <div key={project.id} className="rounded-[20px] bg-white/80 p-4 sm:p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold tracking-[-0.02em] text-[#1E293B]">{project.program}</h3>
                      <p className="mt-1 text-[0.85rem] font-medium text-[#64748B]">{project.school}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={project.status as any} />
                      <span className={cn('rounded-[12px] px-2.5 py-1 text-[11px] font-medium', daysLeft <= 0 ? 'bg-rose-50 text-rose-600' : daysLeft <= 7 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500')}>
                        {daysLeft <= 0 ? 'Vencido' : `${daysLeft} días restantes`}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[#94A3B8]">Entrega Fábrica: {formatDate(project.expectedDeliveryDate)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] bg-white/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Entregas recientes</h2>
                <p className="text-[11px] font-medium text-[#64748B]">Esperando validación de Product</p>
              </div>
            </div>
            <span className="rounded-[12px] bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#64748B] ring-1 ring-slate-200/50">{deliveredCount}</span>
          </div>
          <div className="space-y-3 bg-[#F8FAFC]/60 p-4 sm:p-5">
            {inReview.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#94A3B8]">No hay entregas pendientes de revisión.</p>
            ) : (
              inReview.map((project) => (
                <div key={project.id} className="rounded-[20px] bg-white/80 p-4 sm:p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold tracking-[-0.02em] text-[#1E293B]">{project.program}</h3>
                      <p className="mt-1 text-[0.85rem] font-medium text-[#64748B]">{project.school} · {project.modality}</p>
                    </div>
                    <StatusBadge status={project.status as any} />
                  </div>
                  <p className="mt-2 text-xs text-emerald-600 font-medium">Esperando validación de Product</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function ProjectCard({
  project,
  actionLabel,
  actionRoute,
  extraInfo,
  lastNote,
}: {
  project: { id: string; program: string; school: string; modality: string; expectedDeliveryDate: string; status: string; progress: number; subjects: { length: number }; semesters?: { length: number } };
  actionLabel: string;
  actionRoute: string;
  extraInfo?: string;
  lastNote?: string;
}) {
  return (
    <div className="rounded-[20px] bg-white/80 p-4 sm:p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold tracking-[-0.02em] text-[#1E293B]">{project.program}</h3>
          <p className="mt-1 text-[0.85rem] font-medium text-[#64748B]">
            {project.school} · {project.modality}
          </p>
          {extraInfo && <p className="mt-1 text-xs text-rose-600 font-medium">{extraInfo}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={project.status as any} />
          <span className="rounded-[12px] bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">{formatDate(project.expectedDeliveryDate)}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#64748B]">
        <span>{project.semesters?.length ?? 1} semestre{project.semesters?.length !== 1 ? 's' : ''}</span>
        <span>{project.subjects.length} asignatura{project.subjects.length !== 1 ? 's' : ''}</span>
      </div>
      {lastNote && <p className="mt-2 text-xs text-[#94A3B8] line-clamp-2">Última: {lastNote}</p>}
      <div className="mt-4 flex justify-end">
        <Link to={actionRoute} className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#FF6B00] px-3 py-2 text-xs font-bold text-white shadow-lg shadow-[#FF6B00]/20 transition-all duration-200 hover:scale-105 hover:bg-[#E66000]">
          {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
