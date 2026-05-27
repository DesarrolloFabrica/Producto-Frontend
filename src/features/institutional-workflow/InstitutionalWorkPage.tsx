import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { OperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import { OperationalWorkTableV2 } from '../operations-v2/OperationalWorkTableV2';
import type { OperationalWorkItemV2 } from '../../types/operationalWorkflow';
import { PageHeader } from '../../components/ui/PageHeader';
import { useInstitutionalWorkQuery } from '../queries/useInstitutionalWorkQuery';
import { institutionalStateLabel } from './institutionalCopy';
import { buildFromLocation } from '../../navigation/contextNavigation';

function mapItem(item: OperationalWorkItemDto): OperationalWorkItemV2 {
  return {
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
    primaryAction: 'VIEW_DETAIL',
    actions: ['VIEW_DETAIL'],
  };
}

function dedupeBySubjectId(items: OperationalWorkItemV2[]): OperationalWorkItemV2[] {
  const seen = new Map<string, OperationalWorkItemV2>();
  for (const item of items) {
    if (!seen.has(item.subjectId)) {
      seen.set(item.subjectId, item);
    }
  }
  return Array.from(seen.values());
}

export function InstitutionalWorkPage({ title }: { title: string }) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const workQuery = useInstitutionalWorkQuery(role);

  const items = dedupeBySubjectId((workQuery.data ?? []).map(mapItem));
  const loading = workQuery.isLoading;
  const error = workQuery.error
    ? workQuery.error instanceof Error
      ? workQuery.error.message
      : 'No se pudo cargar la bandeja'
    : null;

  const openOperationalFlow = (subjectId: string) => {
    navigate(`/subjects/${subjectId}/operations`, {
      state: { from: buildFromLocation(location) },
    });
  };

  const displayRole = (role === 'ADMIN' ? 'PLANEACION' : role) as OperationalWorkItemV2['currentResponsibleRole'];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-6">
      <PageHeader
        eyebrow="Operaciones"
        title={title}
        description="Revise el detalle de cada asignatura en el centro operacional antes de ejecutar validaciones."
      />
      <OperationalWorkTableV2
        role={displayRole ?? 'PLANEACION'}
        items={items}
        isLoading={loading}
        error={error}
        flowOnly
        onRefresh={() => void workQuery.refetch()}
        onOpenFlow={openOperationalFlow}
      />
    </div>
  );
}
