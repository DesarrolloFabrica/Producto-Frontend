import type { OperationalObservation, VirtualizationProject } from '../../types/domain';
import type { OperationalHealthSummary, OperationalInsight, OperationalNextStep } from './operationalTypes';
import { dedupeNextActions, getHealthFromSeverity, getProjectBlockers, getProjectNextActions, getProjectOperationalInsight, getSubjectBlockers, getSubjectOperationalInsight, getSubjectNextAction, sortByOperationalPriority } from './operationalRules';

export function getFactoryDashboardInsights(projects: VirtualizationProject[] = [], observations: OperationalObservation[] = []) {
  const productionProjects = projects.filter((project) => ['READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'IN_REVIEW', 'FEEDBACK_PENDING'].includes(project.status));
  const blockers = productionProjects.flatMap((project) => getProjectBlockers(project, project.subjects, observations, project.links));
  const projectInsights: OperationalInsight[] = productionProjects.map((project) => getProjectOperationalInsight(project, observations));
  const subjectInsights: OperationalInsight[] = productionProjects.flatMap((project) =>
    project.subjects.map((subject) => getSubjectOperationalInsight(project, subject, observations)),
  );
  const nextActions: OperationalNextStep[] = productionProjects.flatMap((project) => getProjectNextActions(project, project.subjects, observations, project.links));
  const sortedBlockers = sortByOperationalPriority(blockers);
  const sortedInsights = sortByOperationalPriority([...projectInsights, ...subjectInsights]);
  const dedupedActions = dedupeNextActions(nextActions, 6);
  const worstSeverity = sortedBlockers[0]?.severity ?? sortedInsights[0]?.severity ?? 'info';

  return {
    blockers: sortedBlockers,
    insights: sortedInsights,
    nextActions: dedupedActions,
    health: buildHealthSummary({
      title: 'Salud operacional general',
      severity: worstSeverity,
      blockersCount: sortedBlockers.length,
      nextAction: dedupedActions[0]?.title ?? 'Mantener seguimiento operativo',
      healthyDescription: 'La operacion no presenta bloqueantes criticos visibles.',
    }),
  };
}

export function getProjectOperationalPackage(project: VirtualizationProject, observations: OperationalObservation[] = []) {
  const blockers = getProjectBlockers(project, project.subjects, observations, project.links);
  const nextActions = dedupeNextActions(getProjectNextActions(project, project.subjects, observations, project.links));
  const summary = getProjectOperationalInsight(project, observations);
  const health = buildHealthSummary({
    title: 'Salud del proyecto',
    severity: blockers[0]?.severity ?? summary.severity,
    blockersCount: blockers.length,
    nextAction: nextActions[0]?.title ?? summary.nextAction,
    healthyDescription: `${project.program} no presenta bloqueantes criticos visibles.`,
  });
  return { blockers, nextActions, summary, health };
}

export function getSubjectOperationalPackage(project: VirtualizationProject, subjectId: string, observations: OperationalObservation[] = []) {
  const subject = project.subjects.find((item) => item.id === subjectId);
  if (!subject) return null;
  const nextAction = getSubjectNextAction(project, subject, observations, project.links);
  const summary = getSubjectOperationalInsight(project, subject, observations);
  const blockers = getSubjectBlockers(project, subject, observations, project.links);
  const health = buildHealthSummary({
    title: 'Salud de la materia',
    severity: blockers[0]?.severity ?? summary.severity,
    blockersCount: blockers.length,
    nextAction: nextAction.title,
    healthyDescription: `${subject.name} no presenta bloqueantes criticos visibles.`,
  });
  return { subject, nextAction, summary, blockers, health };
}

function buildHealthSummary({ title, severity, blockersCount, nextAction, healthyDescription }: { title: string; severity: OperationalHealthSummary['severity']; blockersCount: number; nextAction: string; healthyDescription: string }): OperationalHealthSummary {
  const healthStatus = getHealthFromSeverity(severity);
  const descriptions: Record<OperationalHealthSummary['healthStatus'], string> = {
    saludable: healthyDescription,
    en_riesgo: 'Hay riesgos operacionales que conviene atender antes de que bloqueen el flujo.',
    bloqueado: 'Existen dependencias que impiden avanzar con normalidad.',
    critico: 'Hay elementos criticos que requieren priorizacion inmediata.',
  };

  return {
    healthStatus,
    title,
    description: descriptions[healthStatus],
    reason: blockersCount > 0 ? `${blockersCount} bloqueantes o riesgos detectados.` : 'Sin bloqueantes activos detectados.',
    nextAction,
    severity,
  };
}
