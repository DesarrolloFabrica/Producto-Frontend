import type { ProgramOperationalWorkItemDto, OperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { ApiProjectListItem, ApiSubjectSummary } from '../../services/types/projectsApi.types';
import type { InstitutionalOperationalState, SlaStatus } from '../../types/domain';
import {
  institutionalPipelineStepIndex,
  isInstitutionalReturnedState,
} from '../institutional-workflow/components/OperationalPipelineInstitutional';
import type { AdminInstitutionalTrackingData, AdminProgramTrackingRow, AdminTrackingKpis } from './adminTrackingTypes';
import { ADMIN_PROGRAM_DETAIL_PATH } from './adminNavigation';

export { ADMIN_PROGRAM_DETAIL_PATH };

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

function averageProductionProgress(project: ApiProjectListItem): number | null {
  const subjects = project.subjectsSummary ?? [];
  if (subjects.length === 0) return null;
  const sum = subjects.reduce((acc, s) => acc + (s.progress ?? 0), 0);
  return Math.round(sum / subjects.length);
}

function countSubjectsReadyFromSummary(subjects: ApiSubjectSummary[] | undefined): number {
  if (!subjects?.length) return 0;
  return subjects.filter(
    (s) =>
      s.progress >= 100 ||
      s.status === 'DELIVERED' ||
      s.status === 'APPROVED' ||
      s.operationalState === 'APPROVED',
  ).length;
}

function resolveSemesterCountFromSummary(subjects: ApiSubjectSummary[] | undefined): number {
  if (!subjects?.length) return 0;
  return new Set(subjects.map((s) => s.semesterNumber)).size;
}

function buildFinalizedRow(project: ApiProjectListItem): AdminProgramTrackingRow {
  const subjects = project.subjectsSummary ?? [];
  const semesterNumbers = [...new Set(subjects.map((s) => s.semesterNumber))].sort((a, b) => a - b);
  const subjectsTotal = subjects.length;
  const subjectsReady = subjectsTotal > 0 ? subjectsTotal : countSubjectsReadyFromSummary(subjects);
  const totalSemesters = semesterNumbers.length;

  return {
    projectId: project.id,
    program: project.program,
    school: project.school,
    modality: resolveModalityLabel(project.modality),
    operationalState: 'FINALIZED',
    currentResponsibleRole: null,
    slaStatus: 'FINALIZED_ON_TIME',
    stageDueAt: project.expectedDeliveryDate,
    nearestDueAt: project.expectedDeliveryDate,
    lastReturnReason: null,
    semesterNumbers,
    subjectsTotal,
    subjectsReady,
    completedSubjects: subjectsReady,
    completedSemesters: totalSemesters,
    totalSemesters,
    openObservations: 0,
    isReturned: false,
    isFinalized: true,
    isLegacyOnly: false,
    simplifiedStatusLabel: 'Finalizado',
    projectStatus: project.status,
    projectCreatedAt: project.createdAt ?? null,
    sortPriority: 4,
    activeStageSummary: [],
    programWorkItem: null,
    productionProgressPercent: 100,
    detailPath: ADMIN_PROGRAM_DETAIL_PATH(project.id),
    productOwnerName: project.productOwner?.name ?? null,
    factoryOwnerName: project.factoryOwner?.name ?? null,
  };
}

function buildLegacyRow(project: ApiProjectListItem): AdminProgramTrackingRow {
  const subjects = project.subjectsSummary ?? [];
  const semesterNumbers = [...new Set(subjects.map((s) => s.semesterNumber))].sort((a, b) => a - b);

  return {
    projectId: project.id,
    program: project.program,
    school: project.school,
    modality: resolveModalityLabel(project.modality),
    operationalState: null,
    currentResponsibleRole: project.productOwner?.role === 'PRODUCT' ? 'PRODUCT' : null,
    slaStatus: null,
    stageDueAt: project.expectedDeliveryDate,
    nearestDueAt: project.expectedDeliveryDate,
    lastReturnReason: null,
    semesterNumbers,
    subjectsTotal: subjects.length,
    subjectsReady: subjects.filter((s) => s.progress >= 100).length,
    completedSubjects: subjects.filter((s) => s.status === 'DELIVERED' || s.status === 'APPROVED').length,
    completedSemesters: 0,
    totalSemesters: semesterNumbers.length,
    openObservations: subjects.reduce((sum, s) => sum + (s.openObservationsCount ?? 0), 0),
    isReturned: false,
    isFinalized: false,
    isLegacyOnly: true,
    simplifiedStatusLabel: 'Pre-institutional',
    projectStatus: project.status,
    projectCreatedAt: project.createdAt ?? null,
    sortPriority: 3,
    activeStageSummary: [],
    programWorkItem: null,
    productionProgressPercent: averageProductionProgress(project),
    detailPath: ADMIN_PROGRAM_DETAIL_PATH(project.id),
    productOwnerName: project.productOwner?.name ?? null,
    factoryOwnerName: project.factoryOwner?.name ?? null,
  };
}

function buildRowFromProgram(
  program: ProgramOperationalWorkItemDto,
  meta: ApiProjectListItem | undefined,
): AdminProgramTrackingRow {
  const semesters = program.semesters ?? [];
  const bottleneck = semesters.length > 0 ? pickBottleneckSemester(semesters) : null;
  const semesterNumbers = [...new Set(semesters.map((s) => s.semesterNumber))].sort((a, b) => a - b);
  const operationalState = bottleneck?.operationalState ?? null;
  const isReturned = operationalState ? isInstitutionalReturnedState(operationalState) : false;
  const isFinalized = meta?.status === 'CLOSED' || operationalState === 'FINALIZED';
  const metaSubjects = meta?.subjectsSummary ?? [];
  const metaSubjectsReady = countSubjectsReadyFromSummary(metaSubjects);
  const metaSemesterCount = resolveSemesterCountFromSummary(metaSubjects);
  const subjectsTotal = Math.max(program.totalSubjects, metaSubjects.length);
  const completedSubjects = isFinalized
    ? Math.max(program.completedSubjects, metaSubjectsReady, subjectsTotal)
    : program.completedSubjects;
  const totalSemesters = Math.max(program.totalSemesters, metaSemesterCount, semesterNumbers.length);
  const completedSemesters = isFinalized
    ? Math.max(program.completedSemesters, totalSemesters)
    : program.completedSemesters;

  return {
    projectId: program.projectId,
    program: program.program || meta?.program || 'Programa sin nombre',
    school: program.school || meta?.school || '—',
    modality: resolveModalityLabel(meta?.modality),
    operationalState: isFinalized ? 'FINALIZED' : operationalState,
    currentResponsibleRole: program.currentResponsibleRole ?? bottleneck?.currentResponsibleRole ?? null,
    slaStatus: program.slaStatus,
    stageDueAt: bottleneck?.stageDueAt ?? program.nearestDueDate,
    nearestDueAt: program.nearestDueDate,
    lastReturnReason: bottleneck?.lastReturnReason ?? null,
    semesterNumbers,
    subjectsTotal,
    subjectsReady: isFinalized ? completedSubjects : program.completedSubjects,
    completedSubjects,
    completedSemesters,
    totalSemesters,
    openObservations: program.openObservations,
    isReturned,
    isFinalized,
    isLegacyOnly: false,
    simplifiedStatusLabel: isFinalized ? 'Finalizado' : null,
    projectStatus: meta?.status ?? null,
    projectCreatedAt: meta?.createdAt ?? null,
    sortPriority: computeSortPriority({
      operationalState: isFinalized ? 'FINALIZED' : operationalState,
      slaStatus: program.slaStatus,
      isReturned,
      isFinalized,
    }),
    activeStageSummary: program.activeStageSummary ?? [],
    programWorkItem: program,
    productionProgressPercent: null,
    detailPath: ADMIN_PROGRAM_DETAIL_PATH(program.projectId),
    productOwnerName: meta?.productOwner?.name ?? null,
    factoryOwnerName: meta?.factoryOwner?.name ?? null,
  };
}

export function aggregateAdminInstitutionalTracking(
  trackingPrograms: ProgramOperationalWorkItemDto[],
  projects: ApiProjectListItem[],
): AdminInstitutionalTrackingData {
  const projectMeta = new Map(projects.map((p) => [p.id, p]));
  const representedProjectIds = new Set<string>();
  const activeRows: AdminProgramTrackingRow[] = [];
  const finalizedRows: AdminProgramTrackingRow[] = [];

  for (const program of trackingPrograms) {
    const meta = projectMeta.get(program.projectId);
    if (meta?.status === 'CLOSED') {
      finalizedRows.push(buildFinalizedRow(meta));
      representedProjectIds.add(program.projectId);
      continue;
    }

    const row = buildRowFromProgram(program, meta);
    if (row.isFinalized) {
      finalizedRows.push(row);
    } else {
      activeRows.push(row);
    }
    representedProjectIds.add(program.projectId);
  }

  for (const project of projects) {
    if (representedProjectIds.has(project.id)) continue;

    if (project.status === 'CLOSED') {
      finalizedRows.push(buildFinalizedRow(project));
    } else {
      activeRows.push(buildLegacyRow(project));
    }
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
