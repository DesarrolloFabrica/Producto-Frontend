import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ClipboardList, FolderKanban, Plus, RefreshCw, Sparkles, Factory } from 'lucide-react';
import { buildFromLocation } from '../../navigation/contextNavigation';
import { DashboardKpiGrid, DashboardShell } from '../../components/layout/DashboardShell';
import { MetricCard } from '../../components/cards/MetricCard';
import { OperationalTray } from '../../components/operational/OperationalTray';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { CreateProjectModal } from '../../components/forms/CreateProjectModal';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { useInstitutionalWorkQuery } from '../../features/queries/useInstitutionalWorkQuery';
import { OperationalWorkTableV2 } from '../../features/operations-v2/OperationalWorkTableV2';
import type { OperationalWorkItemV2 } from '../../types/operationalWorkflow';
import { institutionalStateLabel } from '../institutional-workflow/institutionalCopy';
import { resolveInstitutionalWorkHref } from '../institutional-workflow/institutionalNavigation';
import {
  buildWorkItemsFromProjects,
  groupNewRequestItemsByProject,
} from '../../features/operations/subjectOperationalState';
import { isProjectLate } from '../../utils/status';
import { isPendingExternalSubjectMatterExpert } from '../../utils/projectSme';

function toTs(value?: string | null) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export function ProductDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, projectObservations, isLoadingProjects, projectsError, refreshProjects, backendEnabled } =
    useOperations();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // En flujo institucional, Product debe ver sus pendientes desde la bandeja operacional (no desde subject.status legacy).
  const institutionalWorkQuery = useInstitutionalWorkQuery('PRODUCT', backendEnabled);
  const institutionalPendingReview = useMemo(() => {
    return (institutionalWorkQuery.data ?? []).filter(
      (i) => i.operationalState === 'PENDING_PRODUCT_ACADEMIC_REVIEW' || i.operationalState === 'IN_PRODUCT_ACADEMIC_REVIEW',
    );
  }, [institutionalWorkQuery.data]);
  const useInstitutionalReviewTray = backendEnabled && institutionalPendingReview.length > 0;

  const openOperationalFlow = (item: OperationalWorkItemV2) => {
    navigate(resolveInstitutionalWorkHref(item), {
      state: { from: buildFromLocation(location) },
    });
  };
  const institutionalReviewItems: OperationalWorkItemV2[] = useMemo(() => {
    const seen = new Set<string>();
    return institutionalPendingReview
      .filter((item) => {
        const key = item.semesterId ?? item.subjectId;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((item) => ({
        kind: item.kind ?? 'semester',
        semesterId: item.semesterId,
        actionUrl: item.actionUrl,
        subjectId: item.subjectId,
        projectId: item.projectId,
        subjectName: item.subjectName,
        program: item.program,
        school: item.school,
        semesterNumber: item.semesterNumber,
        modality: '—',
        priority: 'MEDIUM',
        expectedDeliveryDate: item.stageDueAt ?? new Date().toISOString(),
        operationalState: item.operationalState,
        currentStageLabel: institutionalStateLabel(item.operationalState),
        currentResponsibleRole: item.currentResponsibleRole,
        slaStatus: item.slaStatus,
        stageDueAt: item.stageDueAt ?? new Date().toISOString(),
        lastActivityAt: item.stageDueAt ?? new Date().toISOString(),
        checksCompleted: 0,
        checksTotal: 7,
        subjectsTotal: item.subjectsTotal,
        subjectsReady: item.subjectsReady,
        primaryAction: 'VIEW_DETAIL',
        actions: ['VIEW_DETAIL'],
      }));
  }, [institutionalPendingReview]);

  const workItems = useMemo(
    () => buildWorkItemsFromProjects(projects, projectObservations),
    [projects, projectObservations],
  );

  const activeProjects = projects.filter((project) => !['CLOSED', 'DELIVERED_TO_LMS'].includes(project.status)).length;
  const deliveredProjects = projects.filter((project) => project.status === 'DELIVERED_TO_LMS' || project.status === 'CLOSED').length;
  const pendingSubjectMatterExpert = projects.filter(isPendingExternalSubjectMatterExpert).length;
  const lateProjects = projects.filter(
    (project) =>
      !isPendingExternalSubjectMatterExpert(project) &&
      isProjectLate(project.expectedDeliveryDate, project.status),
  ).length;

  const projectCreatedAt = useMemo(
    () => new Map(projects.map((project) => [project.id, toTs(project.createdAt)])),
    [projects],
  );

  const notStarted = useMemo(() => {
    const items = workItems
      .filter((i) => i.operationalState === 'NOT_STARTED')
      .sort(
        (a, b) =>
          (projectCreatedAt.get(b.projectId) ?? 0) - (projectCreatedAt.get(a.projectId) ?? 0),
      );
    return groupNewRequestItemsByProject(items);
  }, [workItems, projectCreatedAt]);

  const inProduction = useMemo(
    () => workItems.filter((i) => i.operationalState === 'IN_PRODUCTION'),
    [workItems],
  );

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
    <DashboardShell>
      <PageHeader
        roleAccent="product"
        eyebrow="Centro de control"
        title="Dashboard Product"
        description="Resumen operativo por materia: revisión, correcciones, cambios y atrasos."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => void refreshProjects()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refrescar
            </Button>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-3.5 w-3.5" /> Crear solicitud
            </Button>
          </div>
        }
      />

      {backendEnabled && (
        <ProjectsLoadNotice
          isLoading={isLoadingProjects && projects.length === 0}
          error={projectsError}
          onRefresh={() => void refreshProjects()}
        />
      )}

      <DashboardKpiGrid columns={6}>
        <MetricCard label="Solicitudes activas" value={activeProjects} icon={FolderKanban} />
        <MetricCard label="Pend. experto temático" value={pendingSubjectMatterExpert} icon={ClipboardList} />
        <MetricCard label="Solicitudes nuevas" value={notStarted.length} icon={Sparkles} />
        <MetricCard
          label="Materias por revisar"
          value={backendEnabled && institutionalPendingReview.length > 0 ? institutionalPendingReview.length : inReview.length}
          icon={ClipboardList}
        />
        <MetricCard label="Correcciones por validar" value={correctionSent.length} icon={AlertTriangle} tone="text-rose-500" />
        <MetricCard label="Proyectos atrasados" value={lateProjects} icon={AlertTriangle} tone="text-red-500" />
      </DashboardKpiGrid>

      <section className="grid gap-4 md:grid-cols-2">
        <OperationalTray
          title="Solicitudes nuevas"
          description="Solicitudes recién creadas con materias pendientes de iniciar producción en Fábrica."
          count={notStarted.length}
          items={notStarted}
          emptyMessage="Sin solicitudes nuevas pendientes."
          viewAllTo="/product/work?status=NOT_STARTED"
          icon={Sparkles}
          role="product"
        />
        <OperationalTray
          title="En producción (Fábrica)"
          description="Materias que Fábrica está produciendo actualmente."
          count={inProduction.length}
          items={inProduction}
          emptyMessage="Sin materias en producción."
          viewAllTo="/product/work?status=IN_PRODUCTION"
          icon={Factory}
          role="product"
        />
      </section>

      {!useInstitutionalReviewTray ? (
        <section className="grid gap-4 md:grid-cols-2">
          <OperationalTray
            title="Pendientes por revisar"
            description="Materias realmente en revisión Product."
            count={inReview.length}
            items={inReview}
            emptyMessage="Sin materias por revisar."
            viewAllTo="/product/work?status=IN_REVIEW"
            role="product"
          />
          <OperationalTray
            title="Correcciones por validar"
            description="Materias con correcciones aplicadas esperando validación."
            count={correctionSent.length}
            items={correctionSent}
            emptyMessage="Sin correcciones por validar."
            viewAllTo="/product/work?status=CORRECTION_SENT"
            role="product"
          />
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          <OperationalTray
            title="Correcciones por validar"
            description="Materias con correcciones aplicadas esperando validación."
            count={correctionSent.length}
            items={correctionSent}
            emptyMessage="Sin correcciones por validar."
            viewAllTo="/product/work?status=CORRECTION_SENT"
            role="product"
          />
        </section>
      )}

      {useInstitutionalReviewTray && (
        <section className="space-y-3">
          <PageHeader
            eyebrow="Flujo institucional"
            title="Revisión académica pendiente"
            description="Paquetes semestrales en fase Product. Entra al centro operacional del semestre, inicia la revisión y luego abre el checklist de cada asignatura."
          />
          <OperationalWorkTableV2
            role="PRODUCT"
            semesterFirst
            items={institutionalReviewItems}
            isLoading={institutionalWorkQuery.isLoading}
            error={
              institutionalWorkQuery.error
                ? institutionalWorkQuery.error instanceof Error
                  ? institutionalWorkQuery.error.message
                  : 'No se pudo cargar'
                : null
            }
            flowOnly
            onRefresh={() => void institutionalWorkQuery.refetch()}
            onOpenFlow={openOperationalFlow}
          />
        </section>
      )}

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
    </DashboardShell>
  );
}
