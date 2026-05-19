import { ProjectsTable } from '../../components/tables/ProjectsTable';
import { OperationalPipeline } from '../../components/status/OperationalPipeline';
import { PageHeader } from '../../components/ui/PageHeader';
import { useOperations } from '../../features/operations/OperationsContext';
import { useAuth } from '../auth/AuthContext';
import { FactoryProjectsList } from './FactoryProjectsList';

export function ProjectsPage() {
  const { projects } = useOperations();
  const { role } = useAuth();

  const pipelineSummary = [
    { status: 'PENDING_SYLLABUS' as const, count: projects.filter((p) => p.status === 'PENDING_SYLLABUS').length, progress: 12, critical: true },
    { status: 'READY_FOR_PRODUCTION' as const, count: projects.filter((p) => p.status === 'READY_FOR_PRODUCTION').length, progress: 28, critical: false },
    { status: 'IN_PRODUCTION' as const, count: projects.filter((p) => p.status === 'IN_PRODUCTION').length, progress: 64, critical: false },
    { status: 'IN_REVIEW' as const, count: projects.filter((p) => p.status === 'IN_REVIEW').length, progress: 76, critical: false },
    { status: 'DELIVERED_TO_LMS' as const, count: projects.filter((p) => p.status === 'DELIVERED_TO_LMS').length, progress: 88, critical: false },
    { status: 'FEEDBACK_PENDING' as const, count: projects.filter((p) => p.status === 'FEEDBACK_PENDING').length, progress: 55, critical: true },
    { status: 'CLOSED' as const, count: projects.filter((p) => p.status === 'CLOSED').length, progress: 100, critical: false },
  ];

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
      <OperationalPipeline stages={pipelineSummary} />
      <ProjectsTable projects={projects} />
    </div>
  );
}
