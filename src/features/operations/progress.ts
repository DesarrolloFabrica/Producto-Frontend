import type { ChecklistStatus, OperationalObservation, ProjectSemester, SemesterStatus, SubjectStatus, SubjectVirtualization, VirtualizationProject } from '../../types/domain';

type ObservationStatus = OperationalObservation['status'];

export function isBlockingObservationStatus(status: ObservationStatus) {
  return status === 'ABIERTA' || status === 'EN_CORRECCION';
}

export function checklistCompletionValue(status: ChecklistStatus): number {
  switch (status) {
    case 'APROBADO':
    case 'ENTREGADO':
      return 1;
    case 'EN_PRODUCCION':
      return 0.5;
    case 'PENDIENTE':
    case 'NO_EXISTE':
    case 'RECHAZADO':
    default:
      return 0;
  }
}

export function calculateChecklistProgress(items: { status: ChecklistStatus }[]): number {
  if (!items.length) return 0;
  const total = items.reduce((acc, item) => acc + checklistCompletionValue(item.status), 0);
  return total / items.length;
}

export function calculateSubjectProgress(subject: SubjectVirtualization): number {
  const main = calculateChecklistProgress(subject.checklist);
  const topicItems = subject.topicChecklists.flatMap((tc) => tc.items);
  const topics = calculateChecklistProgress(topicItems);
  const score = 0.7 * main + 0.3 * topics;
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export function deriveSubjectStatus(params: {
  subject: SubjectVirtualization;
  observations: OperationalObservation[];
}): SubjectStatus {
  const { subject, observations } = params;

  const blockingObs = observations.some((o) => isBlockingObservationStatus(o.status));
  const anyRejected = subject.checklist.some((i) => i.status === 'RECHAZADO');
  const anyInProduction = subject.checklist.some((i) => i.status === 'EN_PRODUCCION');

  const mainAllApproved = subject.checklist.length > 0 && subject.checklist.every((i) => i.status === 'APROBADO');
  const topicAllApproved = subject.topicChecklists.every((tc) => tc.items.length > 0 && tc.items.every((i) => i.status === 'APROBADO'));

  const mainAllSubmitted = subject.checklist.length > 0 && subject.checklist.every((i) => i.status === 'ENTREGADO' || i.status === 'APROBADO');
  const topicAllSubmitted = subject.topicChecklists.every((tc) => tc.items.every((i) => i.status === 'ENTREGADO' || i.status === 'APROBADO'));

  // Product rejection always forces changes requested.
  if (anyRejected) return 'CHANGES_REQUESTED';

  // Approved only if no blocking observations remain.
  if (mainAllApproved && topicAllApproved && !blockingObs) return 'APPROVED';

  // Keep in review if already there and not approved/changes requested.
  if (subject.status === 'IN_REVIEW') return 'IN_REVIEW';

  // Submitted means factory completed deliverables but product hasn't reviewed yet.
  if (mainAllSubmitted && topicAllSubmitted) return 'SUBMITTED';

  if (anyInProduction) return 'IN_PRODUCTION';

  return 'PENDING';
}

export function deriveSemesterStatus(params: {
  semester: ProjectSemester;
  subjects: SubjectVirtualization[];
}): SemesterStatus {
  const { subjects } = params;
  if (!subjects.length) return 'PENDING';

  const statuses = subjects.map((s) => s.status);
  if (statuses.every((s) => s === 'PENDING')) return 'PENDING';
  if (statuses.some((s) => s === 'CHANGES_REQUESTED')) return 'CHANGES_REQUESTED';
  if (statuses.every((s) => s === 'APPROVED')) return 'APPROVED';
  if (statuses.every((s) => s === 'DELIVERED')) return 'DELIVERED';

  if (statuses.some((s) => s === 'IN_REVIEW')) return 'PARTIAL_REVIEW';
  return 'IN_PRODUCTION';
}

export function calculateSemesterProgress(subjects: SubjectVirtualization[]): number {
  if (!subjects.length) return 0;
  const avg = subjects.reduce((acc, s) => acc + (s.progress ?? 0), 0) / subjects.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

export function calculateProjectProgress(project: VirtualizationProject): number {
  if (!project.subjects.length) return 0;
  const avg = project.subjects.reduce((acc, s) => acc + (s.progress ?? 0), 0) / project.subjects.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

export function getProjectBlockingSignals(project: VirtualizationProject, observations: OperationalObservation[]) {
  const blockingObs = observations.some((o) => o.projectId === project.id && isBlockingObservationStatus(o.status));
  const anyRejected = project.subjects.some((s) => s.checklist.some((i) => i.status === 'RECHAZADO'));
  return { blockingObs, anyRejected };
}
