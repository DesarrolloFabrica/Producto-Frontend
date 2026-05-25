import { useMemo, useState } from 'react';
import { AlertTriangle, ClipboardList, FolderKanban, Plus } from 'lucide-react';
import { MetricCard } from '../../components/cards/MetricCard';
import { OperationalTray } from '../../components/operational/OperationalTray';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { CreateProjectModal } from '../../components/forms/CreateProjectModal';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { buildWorkItemsFromProjects } from '../../features/operations/subjectOperationalState';
import { isProjectLate } from '../../utils/status';

function toTs(value?: string | null) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export function ProductDashboardPage() {
  const { projects, projectObservations, isLoadingProjects, projectsError, refreshProjects, backendEnabled } =
    useOperations();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const workItems = useMemo(
    () => buildWorkItemsFromProjects(projects, projectObservations),
    [projects, projectObservations],
  );

  const activeProjects = projects.filter((project) => !['CLOSED', 'DELIVERED_TO_LMS'].includes(project.status)).length;
  const deliveredProjects = projects.filter((project) => project.status === 'DELIVERED_TO_LMS' || project.status === 'CLOSED').length;
  const lateProjects = projects.filter((project) => isProjectLate(project.expectedDeliveryDate, project.status)).length;

  const inReview = useMemo(() => workItems.filter((i) => i.operationalState === 'IN_REVIEW'), [workItems]);
  const correctionSent = useMemo(() => workItems.filter((i) => i.operationalState === 'CORRECTION_SENT'), [workItems]);
  const changesRequested = useMemo(() => workItems.filter((i) => i.operationalState === 'CHANGES_REQUESTED'), [workItems]);
  const approved = useMemo(() => workItems.filter((i) => i.operationalState === 'APPROVED'), [workItems]);
  const newlyAdded = useMemo(() => workItems.filter((i) => Boolean(i.createdFromChange)), [workItems]);

  const overdue = useMemo(() => {
    const now = Date.now();
    return workItems
      .filter((item) => {
        if (item.operationalState === 'APPROVED') return false;
        const due = toTs(item.expectedDeliveryDate);
        return due > 0 && due < now;
      })
      .sort((a, b) => toTs(a.expectedDeliveryDate) - toTs(b.expectedDeliveryDate));
  }, [workItems]);

  const approvedRecent = useMemo(
    () => [...approved].sort((a, b) => toTs(b.lastActivity) - toTs(a.lastActivity)),
    [approved],
  );

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow="Centro de control"
        title="Dashboard Product"
        description="Resumen operativo por materia: revision, correcciones, cambios y atrasos."
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
        <MetricCard variant="subjectPanel" label="Solicitudes activas" value={activeProjects} icon={FolderKanban} />
        <MetricCard variant="subjectPanel" label="Materias por revisar" value={inReview.length} icon={ClipboardList} />
        <MetricCard variant="subjectPanel" label="Correcciones por validar" value={correctionSent.length} icon={AlertTriangle} />
        <MetricCard variant="subjectPanel" label="Proyectos atrasados" value={lateProjects} icon={AlertTriangle} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <OperationalTray
          title="Pendientes por revisar"
          description="Materias realmente en revision Product."
          count={inReview.length}
          items={inReview}
          emptyMessage="Sin materias por revisar."
          viewAllTo="/product/work?status=IN_REVIEW"
          role="product"
        />
        <OperationalTray
          title="Correcciones por validar"
          description="Materias con correcciones aplicadas esperando validacion."
          count={correctionSent.length}
          items={correctionSent}
          emptyMessage="Sin correcciones por validar."
          viewAllTo="/product/work?status=CORRECTION_SENT"
          role="product"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <OperationalTray
          title="Correcciones solicitadas"
          description="Seguimiento a materias con observaciones abiertas."
          count={changesRequested.length}
          items={changesRequested}
          emptyMessage="Sin correcciones abiertas."
          viewAllTo="/product/work?status=CHANGES_REQUESTED"
          role="product"
        />
        <OperationalTray
          title="Nuevas agregadas"
          description="Materias agregadas despues de la solicitud inicial."
          count={newlyAdded.length}
          items={newlyAdded}
          emptyMessage="Sin materias nuevas."
          viewAllTo="/product/work?origin=new"
          role="product"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <OperationalTray
          title="Atrasadas"
          description="Materias vencidas segun fecha de entrega."
          count={overdue.length}
          items={overdue}
          emptyMessage="Sin materias atrasadas."
          viewAllTo="/product/work?sort=dueDate"
          role="product"
        />
        <OperationalTray
          title="Aprobadas recientes"
          description="Materias aprobadas, ordenadas por ultima actividad."
          count={approved.length}
          items={approvedRecent}
          emptyMessage="Sin materias aprobadas recientemente."
          viewAllTo="/product/work?status=APPROVED&sort=updatedAt"
          role="product"
        />
      </section>

      {deliveredProjects > 0 && (
        <p className="text-[11px] font-medium text-slate-500">
          {deliveredProjects} solicitud{deliveredProjects !== 1 ? 'es' : ''} ya entregada{deliveredProjects !== 1 ? 's' : ''} al LMS.
        </p>
      )}

      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
