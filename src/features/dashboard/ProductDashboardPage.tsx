import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FolderKanban, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../../components/cards/MetricCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { CreateProjectModal } from '../../components/forms/CreateProjectModal';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { analyzeProductProjects } from '../../features/operations/productDashboardState';
import { formatDate } from '../../utils/formatters';
import { isProjectLate } from '../../utils/status';

export function ProductDashboardPage() {
  const { projects, projectObservations, isLoadingProjects, projectsError, refreshProjects, backendEnabled } =
    useOperations();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const dashboard = useMemo(
    () => analyzeProductProjects(projects, projectObservations),
    [projects, projectObservations],
  );

  const active = projects.filter((project) => !['CLOSED', 'DELIVERED_TO_LMS'].includes(project.status)).length;
  const pendingReviewCount = dashboard.needsReview.length;
  const completedCount = dashboard.fullyApproved.length;
  const delivered = projects.filter((project) => project.status === 'DELIVERED_TO_LMS' || project.status === 'CLOSED').length;
  const late = projects.filter((project) => isProjectLate(project.expectedDeliveryDate, project.status)).length;

  const nextSteps = dashboard.needsReview
    .concat(dashboard.inFactoryProduction)
    .slice(0, 5);

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow="Centro de control"
        title="Dashboard Product"
        description="Revisa materias pendientes, solicitudes en Fábrica y programas completados listos para cierre."
        action={
          <Button size="sm" onClick={() => setShowCreateModal(true)} className="shadow-lg shadow-orange-500/25">
            <Plus className="h-3.5 w-3.5" /> Crear solicitud
          </Button>
        }
      />

      {backendEnabled && (
        <ProjectsLoadNotice
          isLoading={isLoadingProjects && projects.length === 0}
          error={projectsError}
          onRefresh={() => void refreshProjects()}
        />
      )}

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard variant="subjectPanel" label="Solicitudes activas" value={active} icon={FolderKanban} />
        <MetricCard variant="subjectPanel" label="Pendientes por revisar" value={pendingReviewCount} icon={Clock3} />
        <MetricCard variant="subjectPanel" label="Completadas" value={completedCount} icon={CheckCircle2} />
        <MetricCard variant="subjectPanel" label="Atrasadas" value={late} icon={AlertTriangle} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card variant="subjectPanel" className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-orange-100/80 pb-3">
            <Clock3 className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-black text-slate-950">Pendientes por revisar</h2>
            <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-800 ring-1 ring-amber-200/80">
              {pendingReviewCount}
            </span>
          </div>
          <p className="mb-3 text-[11px] font-medium text-slate-500">
            Solo programas con materias realmente en revisión o correcciones por validar.
          </p>
          <div className="space-y-2">
            {dashboard.needsReview.slice(0, 5).map((insight) => (
              <Link
                key={insight.project.id}
                to={insight.actionRoute}
                className="flex w-full items-center justify-between rounded-2xl border border-orange-100/60 bg-orange-50/20 p-3 text-left transition-all hover:border-orange-200 hover:bg-orange-50/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{insight.project.program}</p>
                  <p className="text-[10px] font-semibold text-amber-700">{insight.reviewLabel}</p>
                  <p className="text-[10px] font-medium text-slate-400">{insight.project.school}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange-400" />
              </Link>
            ))}
            {pendingReviewCount === 0 && (
              <p className="text-xs font-semibold text-slate-500">Sin pendientes por revisar.</p>
            )}
          </div>
        </Card>

        <Card variant="subjectPanel" className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-orange-100/80 pb-3">
            <FolderKanban className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-black text-slate-950">En producción Fábrica</h2>
            <span className="ml-auto rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-black text-orange-800 ring-1 ring-orange-200/80">
              {dashboard.inFactoryProduction.length}
            </span>
          </div>
          <div className="space-y-2">
            {dashboard.inFactoryProduction.slice(0, 5).map((insight) => (
              <Link
                key={insight.project.id}
                to={`/projects/${insight.project.id}`}
                className="flex w-full items-center justify-between rounded-2xl border border-orange-100/60 bg-orange-50/20 p-3 text-left transition-all hover:border-orange-200 hover:bg-orange-50/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{insight.project.program}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{insight.reviewLabel}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange-400" />
              </Link>
            ))}
            {dashboard.inFactoryProduction.length === 0 && (
              <p className="text-xs font-semibold text-slate-500">Sin solicitudes en producción.</p>
            )}
          </div>
        </Card>
      </section>

      <Card variant="subjectPanel" className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-emerald-100/80 pb-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-black text-slate-950">Completadas recientes</h2>
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 ring-1 ring-emerald-200/80">
            {completedCount}
          </span>
        </div>
        <p className="mb-3 text-[11px] font-medium text-slate-500">
          Todas las materias aprobadas. Ya no requieren revisión; puedes cerrar la entrega al LMS desde el proyecto.
        </p>
        <div className="space-y-2">
          {dashboard.fullyApproved.slice(0, 5).map((insight) => (
            <Link
              key={insight.project.id}
              to={`/projects/${insight.project.id}`}
              className="flex w-full items-center justify-between rounded-2xl border border-emerald-100/60 bg-emerald-50/20 p-3 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">{insight.project.program}</p>
                <p className="text-[10px] font-semibold text-emerald-700">
                  {insight.totalSubjects} materia{insight.totalSubjects !== 1 ? 's' : ''} aprobada{insight.totalSubjects !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] font-medium text-slate-400">{insight.project.school}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-emerald-700">
                Ver completado <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
          {completedCount === 0 && (
            <p className="text-xs font-semibold text-slate-500">Aún no hay programas con todas las materias aprobadas.</p>
          )}
        </div>
        {delivered > 0 && (
          <p className="mt-3 text-[11px] font-medium text-slate-500">
            {delivered} solicitud{delivered !== 1 ? 'es' : ''} ya entregada{delivered !== 1 ? 's' : ''} al LMS.
          </p>
        )}
      </Card>

      {nextSteps.length > 0 && (
        <Card variant="subjectPanel" className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-orange-100/80 pb-3">
            <ArrowRight className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-black text-slate-950">Próximos pasos</h2>
          </div>
          <div className="space-y-2">
            {nextSteps.map((insight) => (
              <Link
                key={insight.project.id}
                to={`/projects/${insight.project.id}`}
                className="flex items-center justify-between rounded-2xl border border-orange-100/60 bg-orange-50/20 p-3 transition-all hover:border-orange-200 hover:bg-orange-50/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{insight.project.school}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{insight.project.program}</p>
                  <p className="text-[10px] font-medium text-slate-400">{insight.reviewLabel}</p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Entrega: {formatDate(insight.project.expectedDeliveryDate)}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange-400" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
