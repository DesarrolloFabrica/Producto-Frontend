import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FolderKanban, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../../components/cards/MetricCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { CreateProjectModal } from '../../components/forms/CreateProjectModal';
import { useOperations } from '../../features/operations/OperationsContext';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';
import { formatDate } from '../../utils/formatters';
import { isProjectLate, projectStatusLabels } from '../../utils/status';

export function ProductDashboardPage() {
  const { projects } = useOperations();
  const { openContextPanel } = useContextPanel();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const active = projects.filter((project) => !['CLOSED', 'DELIVERED_TO_LMS'].includes(project.status)).length;
  const pending = projects.filter((project) => project.status === 'PENDING_SYLLABUS' || project.status === 'FEEDBACK_PENDING').length;
  const delivered = projects.filter((project) => project.status === 'DELIVERED_TO_LMS' || project.status === 'CLOSED').length;
  const late = projects.filter((project) => isProjectLate(project.expectedDeliveryDate, project.status)).length;

  const pendingReview = projects.filter((p) => p.status === 'FEEDBACK_PENDING' || p.status === 'IN_REVIEW');
  const pendingFactory = projects.filter((p) => p.status === 'READY_FOR_PRODUCTION' || p.status === 'IN_PRODUCTION');
  const nextSteps = projects.filter((p) => !['CLOSED', 'DELIVERED_TO_LMS'].includes(p.status)).slice(0, 5);

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow="Centro de control"
        title="Dashboard Product"
        description="Solicitudes activas, revisiones pendientes y entregas por cerrar."
        action={
          <Button size="sm" onClick={() => setShowCreateModal(true)} className="shadow-lg shadow-orange-500/25">
            <Plus className="h-3.5 w-3.5" /> Crear solicitud
          </Button>
        }
      />

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard variant="subjectPanel" label="Solicitudes activas" value={active} icon={FolderKanban} />
        <MetricCard variant="subjectPanel" label="Pendientes por revisar" value={pending} icon={Clock3} />
        <MetricCard variant="subjectPanel" label="Entregadas por Fábrica" value={delivered} icon={CheckCircle2} />
        <MetricCard variant="subjectPanel" label="Atrasadas" value={late} icon={AlertTriangle} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card variant="subjectPanel" className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-orange-100/80 pb-3">
            <Clock3 className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-black text-slate-950">Pendientes por revisar</h2>
            <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-800 ring-1 ring-amber-200/80">{pendingReview.length}</span>
          </div>
          <div className="space-y-2">
            {pendingReview.slice(0, 5).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openContextPanel('project', p.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-orange-100/60 bg-orange-50/20 p-3 text-left transition-all hover:border-orange-200 hover:bg-orange-50/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{p.program}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{projectStatusLabels[p.status]}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange-400" />
              </button>
            ))}
            {pendingReview.length === 0 && <p className="text-xs font-semibold text-slate-500">Sin pendientes por revisar</p>}
          </div>
        </Card>

        <Card variant="subjectPanel" className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-orange-100/80 pb-3">
            <FolderKanban className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-black text-slate-950">En producción Fábrica</h2>
            <span className="ml-auto rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-black text-orange-800 ring-1 ring-orange-200/80">{pendingFactory.length}</span>
          </div>
          <div className="space-y-2">
            {pendingFactory.slice(0, 5).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openContextPanel('project', p.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-orange-100/60 bg-orange-50/20 p-3 text-left transition-all hover:border-orange-200 hover:bg-orange-50/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{p.program}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{projectStatusLabels[p.status]}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange-400" />
              </button>
            ))}
            {pendingFactory.length === 0 && <p className="text-xs font-semibold text-slate-500">Sin solicitudes en producción</p>}
          </div>
        </Card>
      </section>

      {nextSteps.length > 0 && (
        <Card variant="subjectPanel" className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-orange-100/80 pb-3">
            <ArrowRight className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-black text-slate-950">Próximos pasos</h2>
          </div>
          <div className="space-y-2">
            {nextSteps.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-2xl border border-orange-100/60 bg-orange-50/20 p-3 transition-all hover:border-orange-200 hover:bg-orange-50/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{p.school}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{p.program}</p>
                  <p className="text-[10px] font-medium text-slate-400">Entrega: {formatDate(p.expectedDeliveryDate)}</p>
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
