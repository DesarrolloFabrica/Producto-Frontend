import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import { ProgramOperationalWorkTable } from '../operations-v2/ProgramOperationalWorkTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { useInstitutionalProgramsWorkQuery } from '../queries/useInstitutionalProgramsWorkQuery';
import { buildFromLocation } from '../../navigation/contextNavigation';

export function InstitutionalWorkPage({ title }: { title: string }) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const workQuery = useInstitutionalProgramsWorkQuery(role);

  const loading = workQuery.isLoading;
  const error = workQuery.error
    ? workQuery.error instanceof Error
      ? workQuery.error.message
      : 'No se pudo cargar la bandeja'
    : null;

  const openProgram = (item: ProgramOperationalWorkItemDto) => {
    navigate(item.actionUrl, {
      state: { from: buildFromLocation(location) },
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-6">
      <PageHeader
        eyebrow="Operaciones"
        title={title}
        description="Revise el centro operacional de cada programa antes de ejecutar validaciones o revisiones."
      />
      <ProgramOperationalWorkTable
        items={workQuery.data ?? []}
        isLoading={loading}
        error={error}
        onRefresh={() => void workQuery.refetch()}
        onOpenProgram={openProgram}
        sectionTitle="Programas en bandeja"
        actionLabel="Ver programa"
        queueLabel="Acciones en el centro operacional"
      />
    </div>
  );
}
