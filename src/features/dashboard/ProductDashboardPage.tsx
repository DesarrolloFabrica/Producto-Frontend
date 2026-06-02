import { useMemo, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { AlertTriangle, ClipboardList, FolderKanban, Plus, RefreshCw, Sparkles, Factory } from 'lucide-react';

import { buildFromLocation } from '../../navigation/contextNavigation';

import { DashboardKpiGrid, DashboardShell } from '../../components/layout/DashboardShell';

import { MetricCard } from '../../components/cards/MetricCard';

import { ProgramOperationalTray } from '../../components/operational/ProgramOperationalTray';

import { ProgramRadicationTray } from '../../components/operational/ProgramRadicationTray';

import { projectRadicationApi } from '../../services/projectRadicationApi';

import { projectRadicationKeys } from '../project-radication/ProjectRadicationPanel';

import { projectRadicationUrl } from '../project-radication/ProjectRadicationBanner';

import { Button } from '../../components/ui/Button';

import { PageHeader } from '../../components/ui/PageHeader';

import { CreateProjectModal } from '../../components/forms/CreateProjectModal';

import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';

import { useOperations } from '../../features/operations/OperationsContext';

import { useProductProgramsTrackingQuery } from '../../features/queries/useInstitutionalProgramsWorkQuery';

import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';

import {

  buildLegacyProgramWorkItems,

  groupProgramsByTray,

  mergeProductProgramSources,

} from '../../features/product-work/productProgramWork';

import { isProjectLate } from '../../utils/status';

import { isPendingExternalSubjectMatterExpert } from '../../utils/projectSme';
import { isReducedInstitutionalFlow } from '../../config/env';



export function ProductDashboardPage() {

  const navigate = useNavigate();

  const location = useLocation();

  const { projects, projectObservations, isLoadingProjects, projectsError, refreshProjects, backendEnabled } =

    useOperations();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const reducedFlow = isReducedInstitutionalFlow();



  const trackingQuery = useProductProgramsTrackingQuery(backendEnabled);

  const legacyPrograms = useMemo(

    () => buildLegacyProgramWorkItems(projects, projectObservations),

    [projects, projectObservations],

  );



  const allPrograms = useMemo(() => {

    if (!backendEnabled) return legacyPrograms;

    return mergeProductProgramSources(trackingQuery.data ?? [], legacyPrograms);

  }, [backendEnabled, trackingQuery.data, legacyPrograms]);



  const trays = useMemo(() => groupProgramsByTray(allPrograms), [allPrograms]);

  const radicationWorkQuery = useQuery({
    queryKey: projectRadicationKeys.productWork(),
    queryFn: () => projectRadicationApi.productWork(),
    enabled: backendEnabled,
  });

  const readyForRadication = useMemo(() => {
    const items = radicationWorkQuery.data ?? [];
    return items.filter(
      (item) =>
        item.institutionalState === 'READY_FOR_PRODUCT_RADICATION' ||
        item.institutionalState === 'RADICATION_RETURNED_TO_PRODUCT',
    );
  }, [radicationWorkQuery.data]);

  const radicationReadyProjectIds = useMemo(
    () => new Set(readyForRadication.map((item) => item.projectId)),
    [readyForRadication],
  );

  const openRadication = (projectId: string) => {
    navigate(projectRadicationUrl(projectId), {
      state: { from: buildFromLocation(location) },
    });
  };

  const openProgramOperations = (item: ProgramOperationalWorkItemDto) => {
    if (radicationReadyProjectIds.has(item.projectId)) {
      openRadication(item.projectId);
      return;
    }

    navigate(item.actionUrl, {
      state: { from: buildFromLocation(location), programWorkItem: item },
    });
  };



  const activeProjects = projects.filter((project) => !['CLOSED', 'DELIVERED_TO_LMS'].includes(project.status)).length;

  const deliveredProjects = projects.filter((project) => project.status === 'DELIVERED_TO_LMS' || project.status === 'CLOSED').length;

  const pendingSubjectMatterExpert = projects.filter(isPendingExternalSubjectMatterExpert).length;

  const lateProjects = projects.filter(

    (project) =>

      !isPendingExternalSubjectMatterExpert(project) &&

      isProjectLate(project.expectedDeliveryDate, project.status),

  ).length;



  const refreshAll = () => {

    void refreshProjects();

    if (backendEnabled) {
      void trackingQuery.refetch();
      void radicationWorkQuery.refetch();
    }

  };



  const isLoading = backendEnabled ? trackingQuery.isLoading && allPrograms.length === 0 : isLoadingProjects && projects.length === 0;



  return (

    <DashboardShell className="space-y-4">

      <PageHeader

        roleAccent="product"

        eyebrow="Centro de control"

        title="Dashboard Product"

        description="Resumen operativo por programa: revisión, producción, correcciones y atrasos."

        action={

          <div className="flex flex-wrap gap-2">

            <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={refreshAll}>

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

          isLoading={isLoading}

          error={projectsError ?? (trackingQuery.error instanceof Error ? trackingQuery.error.message : null)}

          onRefresh={refreshAll}

        />

      )}



      <DashboardKpiGrid columns={6}>

        <MetricCard compact label="Solicitudes activas" value={activeProjects} icon={FolderKanban} />

        <MetricCard compact label="Pend. experto temático" value={pendingSubjectMatterExpert} icon={ClipboardList} />

        <MetricCard compact label="Solicitudes nuevas" value={trays.NOT_STARTED.length} icon={Sparkles} />

        <MetricCard compact label="Programas por revisar" value={trays.IN_REVIEW.length} icon={ClipboardList} />

        <MetricCard compact label="Correcciones por validar" value={trays.CORRECTION_SENT.length} icon={AlertTriangle} tone="text-rose-500" />

        <MetricCard compact label="Proyectos atrasados" value={lateProjects} icon={AlertTriangle} tone="text-red-500" />

      </DashboardKpiGrid>

      {backendEnabled && readyForRadication.length > 0 ? (
        <ProgramRadicationTray items={readyForRadication} onOpenRadication={openRadication} />
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">

        <ProgramOperationalTray

          title="Solicitudes nuevas"

          description="Programas recién creados pendientes de iniciar producción en Fábrica."

          count={trays.NOT_STARTED.length}

          items={trays.NOT_STARTED}

          emptyMessage="Sin solicitudes nuevas pendientes."

          viewAllTo="/product/work?status=NOT_STARTED"

          onOpenProgram={openProgramOperations}

          icon={Sparkles}

        />

        <ProgramOperationalTray

          title="En producción (Fábrica)"

          description="Programas con semestres en producción de contenido."

          count={trays.IN_PRODUCTION.length}

          items={trays.IN_PRODUCTION}

          emptyMessage="Sin programas en producción."

          viewAllTo="/product/work?status=IN_PRODUCTION"

          onOpenProgram={openProgramOperations}

          icon={Factory}

        />

      </section>



      <section className="grid gap-3 md:grid-cols-2">

        <ProgramOperationalTray

          title="Revisión académica"

          description="Programas en fase Product. Entra al centro operacional y revisa el avance por semestre."

          count={trays.IN_REVIEW.length}

          items={trays.IN_REVIEW}

          emptyMessage="Sin programas por revisar."

          viewAllTo="/product/work?status=IN_REVIEW"

          onOpenProgram={openProgramOperations}

          icon={ClipboardList}

        />

        <ProgramOperationalTray

          title="Devoluciones"

          description={
            reducedFlow
              ? 'Programas devueltos a Product para ajustar y reenviar a Fábrica.'
              : 'Programas devueltos a Product desde Planeación.'
          }

          count={trays.CORRECTION_SENT.length}

          items={trays.CORRECTION_SENT}

          emptyMessage="Sin devoluciones pendientes."

          viewAllTo="/product/work?status=CORRECTION_SENT"

          onOpenProgram={openProgramOperations}

          icon={AlertTriangle}

        />

      </section>



      <section className="grid gap-3 md:grid-cols-2">

        <ProgramOperationalTray

          title="Correcciones abiertas"

          description="Programas con observaciones abiertas de Product."

          count={trays.CHANGES_REQUESTED.length}

          items={trays.CHANGES_REQUESTED}

          emptyMessage="Sin correcciones abiertas."

          viewAllTo="/product/work?status=CHANGES_REQUESTED"

          onOpenProgram={openProgramOperations}

        />

        <ProgramOperationalTray

          title="Atrasados"

          description="Programas con plazo vencido o en riesgo según SLA."

          count={trays.OVERDUE.length}

          items={trays.OVERDUE}

          emptyMessage="Sin programas atrasados."

          viewAllTo="/product/work?status=OVERDUE"

          onOpenProgram={openProgramOperations}

          icon={AlertTriangle}

        />

      </section>



      {deliveredProjects > 0 && (

        <p className="text-[11px] font-medium text-slate-500">

          {deliveredProjects} solicitud{deliveredProjects !== 1 ? 'es' : ''}{' '}
          {reducedFlow
            ? `finalizada${deliveredProjects !== 1 ? 's' : ''}.`
            : `ya entregada${deliveredProjects !== 1 ? 's' : ''} al LMS.`}

        </p>

      )}



      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

    </DashboardShell>

  );

}
