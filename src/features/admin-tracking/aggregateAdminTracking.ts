import type { OperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { ApiProjectListItem } from '../../services/types/projectsApi.types';
import type { InstitutionalOperationalState, SlaStatus } from '../../types/domain';
import {
  institutionalPipelineStepIndex,
  isInstitutionalReturnedState,
} from '../institutional-workflow/components/OperationalPipelineInstitutional';
import type { AdminInstitutionalTrackingData, AdminProgramTrackingRow, AdminTrackingKpis } from './adminTrackingTypes';

function slaRank(status: SlaStatus): number {
  if (status === 'OVERDUE' || status === 'FINALIZED_OVERDUE') return 0;
  if (status === 'AT_RISK') return 1;
  return 2;
}

function computeSortPriority(params: {
  operationalState: InstitutionalOperationalState | null;
  slaStatus: SlaStatus | null;
  isReturned: boolean;
  isFinalized: boolean;
}): number {
  if (params.isFinalized) return 4;
  if (params.operationalState === 'FINALIZED') return 4;
  if (params.slaStatus === 'OVERDUE' || params.slaStatus === 'FINALIZED_OVERDUE') return 0;
  if (params.isReturned) return 1;
  if (params.slaStatus === 'AT_RISK') return 2;
  return 3;
}

function pickBottleneckSemester(items: OperationalWorkItemDto[]): OperationalWorkItemDto {
  return items.reduce((best, item) => {
    const bestIdx = institutionalPipelineStepIndex(best.operationalState);
    const itemIdx = institutionalPipelineStepIndex(item.operationalState);
    if (itemIdx < bestIdx) return item;
    if (itemIdx > bestIdx) return best;
    return slaRank(item.slaStatus) < slaRank(best.slaStatus) ? item : best;
  });
}

function formatModality(modality: ApiProjectListItem['modality']): string {
  if (!modality) return '—';
  return String(modality).replace(/_/g, ' ');
}

function resolveModalityLabel(modality: ApiProjectListItem['modality'] | undefined): string {
  return modality ? formatModality(modality) : '—';
}

function parseProjectCreatedAt(value: string | null | undefined): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : Number.NEGATIVE_INFINITY;
}

function compareAdminTrackingRows(a: AdminProgramTrackingRow, b: AdminProgramTrackingRow): number {
  const createdDiff = parseProjectCreatedAt(b.projectCreatedAt) - parseProjectCreatedAt(a.projectCreatedAt);
  if (createdDiff !== 0) return createdDiff;
  if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
  return a.program.localeCompare(b.program, 'es');
}

function buildFinalizedRow(project: ApiProjectListItem): AdminProgramTrackingRow {
  return {
    projectId: project.id,
    program: project.program,
    school: project.school,
    modality: resolveModalityLabel(project.modality),
    operationalState: null,
    currentResponsibleRole: null,
    slaStatus: 'FINALIZED_ON_TIME',
    stageDueAt: project.expectedDeliveryDate,
    lastReturnReason: null,
    semesterNumbers: [],
    subjectsTotal: project.subjectsSummary?.length ?? 0,
    subjectsReady: 0,
    openObservations: 0,
    isReturned: false,
    isFinalized: true,
    isLegacyOnly: false,
    showInstitutionalPipeline: false,
    simplifiedStatusLabel: 'Finalizado',
    projectStatus: project.status,
    projectCreatedAt: project.createdAt ?? null,
    sortPriority: 4,
  };
}

function buildLegacyRow(project: ApiProjectListItem): AdminProgramTrackingRow {
  return {
    projectId: project.id,
    program: project.program,
    school: project.school,
    modality: resolveModalityLabel(project.modality),
    operationalState: null,
    currentResponsibleRole: null,
    slaStatus: null,
    stageDueAt: project.expectedDeliveryDate,
    lastReturnReason: null,
    semesterNumbers: [],
    subjectsTotal: project.subjectsSummary?.length ?? 0,
    subjectsReady: 0,
    openObservations: 0,
    isReturned: false,
    isFinalized: false,
    isLegacyOnly: true,
    showInstitutionalPipeline: false,
    simplifiedStatusLabel: 'Pre-institutional',
    projectStatus: project.status,
    projectCreatedAt: project.createdAt ?? null,
    sortPriority: 3,
  };
}

export function aggregateAdminInstitutionalTracking(
  workItems: OperationalWorkItemDto[],
  projects: ApiProjectListItem[],
): AdminInstitutionalTrackingData {
  const projectMeta = new Map(projects.map((p) => [p.id, p]));
  const byProject = new Map<string, OperationalWorkItemDto[]>();

  for (const item of workItems) {
    const list = byProject.get(item.projectId) ?? [];
    list.push(item);
    byProject.set(item.projectId, list);
  }

  const activeRows: AdminProgramTrackingRow[] = [];
  const finalizedRows: AdminProgramTrackingRow[] = [];
  const representedProjectIds = new Set<string>();

  for (const [projectId, semesters] of byProject) {
    const meta = projectMeta.get(projectId);
    if (meta?.status === 'CLOSED') {
      finalizedRows.push(buildFinalizedRow(meta));
      representedProjectIds.add(projectId);
      continue;
    }

    const bottleneck = pickBottleneckSemester(semesters);
    const semesterNumbers = [...new Set(semesters.map((s) => s.semesterNumber))].sort((a, b) => a - b);
    const isReturned = isInstitutionalReturnedState(bottleneck.operationalState);
    const isFinalized = bottleneck.operationalState === 'FINALIZED';

    activeRows.push({
      projectId,
      program: bottleneck.program || meta?.program || 'Programa sin nombre',
      school: bottleneck.school || meta?.school || '—',
      modality: resolveModalityLabel(meta?.modality),
      operationalState: bottleneck.operationalState,
      currentResponsibleRole: bottleneck.currentResponsibleRole,
      slaStatus: bottleneck.slaStatus,
      stageDueAt: bottleneck.stageDueAt,
      lastReturnReason: bottleneck.lastReturnReason,
      semesterNumbers,
      subjectsTotal: semesters.reduce((sum, s) => sum + (s.subjectsTotal ?? 0), 0),
      subjectsReady: semesters.reduce((sum, s) => sum + (s.subjectsReady ?? 0), 0),
      openObservations: semesters.reduce((sum, s) => sum + (s.openObservations ?? 0), 0),
      isReturned,
      isFinalized,
      isLegacyOnly: false,
      showInstitutionalPipeline: true,
      simplifiedStatusLabel: null,
      projectStatus: meta?.status ?? null,
      projectCreatedAt: meta?.createdAt ?? null,
      sortPriority: computeSortPriority({
        operationalState: bottleneck.operationalState,
        slaStatus: bottleneck.slaStatus,
        isReturned,
        isFinalized,
      }),
    });
    representedProjectIds.add(projectId);
  }

  for (const project of projects) {
    if (representedProjectIds.has(project.id)) continue;

    if (project.status === 'CLOSED') {
      finalizedRows.push(buildFinalizedRow(project));
      representedProjectIds.add(project.id);
      continue;
    }

    activeRows.push(buildLegacyRow(project));
    representedProjectIds.add(project.id);
  }

  const rows = [...activeRows, ...finalizedRows];
  rows.sort(compareAdminTrackingRows);

  const kpis: AdminTrackingKpis = {
    active: activeRows.filter((r) => !r.isFinalized).length,
    overdue: activeRows.filter((r) => r.slaStatus === 'OVERDUE' || r.slaStatus === 'FINALIZED_OVERDUE').length,
    returned: activeRows.filter((r) => r.isReturned).length,
    finalized: finalizedRows.length,
  };

  return { rows, kpis };
}
