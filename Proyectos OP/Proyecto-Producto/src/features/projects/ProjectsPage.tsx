import { ProjectsTable } from '../../components/tables/ProjectsTable';
import { ProjectsSummary } from '../../components/summary/ProjectsSummary';
import { PageHeader } from '../../components/ui/PageHeader';
import { useOperations } from '../../features/operations/OperationsContext';
import { useAuth } from '../auth/AuthContext';
import { FactoryProjectsList } from './FactoryProjectsList';

export function ProjectsPage() {
  const { projects } = useOperations();
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
      <ProjectsSummary />
      <ProjectsTable projects={projects} />
    </div>
  );
}
