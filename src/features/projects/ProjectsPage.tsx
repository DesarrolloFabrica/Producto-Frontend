import { ProjectsTable } from '../../components/tables/ProjectsTable';
import { ProjectsSummary } from '../../components/summary/ProjectsSummary';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { useAuth } from '../auth/AuthContext';
import { FactoryProjectsList } from './FactoryProjectsList';

export function ProjectsPage() {
  const { projects, isLoadingProjects, projectsError, refreshProjects, backendEnabled } = useOperations();
  const { role } = useAuth();

  if (role === 'FABRICA') {
    return <FactoryProjectsList />;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow="Portafolio académico"
        title="Proyectos de virtualización"
        description="Listado general de escuelas, programas, modalidades, responsables, prioridades, fechas y avance operacional."
      />
      {backendEnabled && (
        <ProjectsLoadNotice
          isLoading={isLoadingProjects && projects.length === 0}
          error={projectsError}
          isEmpty={!isLoadingProjects && !projectsError && projects.length === 0}
          onRefresh={() => void refreshProjects()}
        />
      )}
      <ProjectsSummary />
      {!projectsError && <ProjectsTable projects={projects} />}
    </div>
  );
}
