import type { Priority } from '../../types/domain';
import type {
  ApiFactoryDashboardSummary,
  ApiFactorySubjectWorkItem,
  ApiSubjectOperationalState,
} from '../../services/factoryApi';
import type { SubjectOperationalState, SubjectWorkItem } from './subjectOperationalState';

export function mapApiOperationalState(state: ApiSubjectOperationalState): SubjectOperationalState {
  return state;
}

export function mapFactoryWorkItemFromApi(api: ApiFactorySubjectWorkItem): SubjectWorkItem {
  const ctaLabels: Record<SubjectOperationalState, string> = {
    NOT_STARTED: 'Iniciar producción',
    IN_PRODUCTION: 'Continuar producción',
    IN_REVIEW: 'Esperando Product',
    CHANGES_REQUESTED: 'Ver correcciones',
    CORRECTION_SENT: 'Esperando validación',
    APPROVED: 'Ver aprobado',
  };
  const operationalLabels: Record<SubjectOperationalState, string> = {
    NOT_STARTED: 'Por iniciar',
    IN_PRODUCTION: 'En producción',
    IN_REVIEW: 'En revisión Product',
    CHANGES_REQUESTED: 'Correcciones pendientes',
    CORRECTION_SENT: 'Corrección enviada',
    APPROVED: 'Aprobada',
  };
  const state = mapApiOperationalState(api.operationalState);
  return {
    subjectId: api.subjectId,
    subjectName: api.subjectName,
    projectId: api.projectId,
    program: api.program,
    school: api.school,
    semesterNumber: api.semesterNumber,
    expectedDeliveryDate: api.expectedDeliveryDate ?? '',
    priority: api.priority as Priority,
    operationalState: state,
    openObservationsCount: api.openObservationsCount,
    correctionSentCount: api.correctionSentCount,
    lastActivity: api.lastActivity ?? undefined,
    actionUrl: api.actionUrl,
    actionLabel: ctaLabels[state],
    operationalLabel: operationalLabels[state],
  };
}

export function mapFactorySummaryFromApi(api: ApiFactoryDashboardSummary) {
  return {
    countsByState: api.countsByState,
    pendingCorrections: api.pendingCorrections.map(mapFactoryWorkItemFromApi),
    upcomingDeliveries: api.upcomingDeliveries.map(mapFactoryWorkItemFromApi),
    recentlyCompleted: api.recentlyCompleted.map(mapFactoryWorkItemFromApi),
  };
}

export function workItemsFromSummary(summary: ReturnType<typeof mapFactorySummaryFromApi>): SubjectWorkItem[] {
  const seen = new Set<string>();
  const items: SubjectWorkItem[] = [];
  for (const list of [
    summary.pendingCorrections,
    summary.upcomingDeliveries,
    summary.recentlyCompleted,
  ]) {
    for (const item of list) {
      if (!seen.has(item.subjectId)) {
        seen.add(item.subjectId);
        items.push(item);
      }
    }
  }
  return items;
}
