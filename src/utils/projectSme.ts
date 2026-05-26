import type { SubjectMatterExpertStatus, SubjectMatterExpertType, VirtualizationProject } from '../types/domain';
import { formatDate } from './formatters';

export function isPendingExternalSubjectMatterExpert(
  project: Pick<VirtualizationProject, 'subjectMatterExpertType' | 'subjectMatterExpertStatus'>,
): boolean {
  return (
    project.subjectMatterExpertType === 'EXTERNAL' &&
    project.subjectMatterExpertStatus === 'PENDING'
  );
}

export function isProjectActiveForFactory(
  project: Pick<VirtualizationProject, 'subjectMatterExpertStatus'>,
): boolean {
  return project.subjectMatterExpertStatus === 'READY';
}

export function formatProjectExpectedDelivery(
  project: Pick<
    VirtualizationProject,
    'expectedDeliveryDate' | 'subjectMatterExpertType' | 'subjectMatterExpertStatus'
  >,
): string {
  if (isPendingExternalSubjectMatterExpert(project)) {
    return 'Pendiente por experto temático';
  }
  if (!project.expectedDeliveryDate?.trim()) {
    return 'Pendiente de activación';
  }
  return formatDate(project.expectedDeliveryDate);
}

export function mapSubjectMatterExpertTypeToApi(
  value: SubjectMatterExpertType | 'Interno' | 'Externo',
): SubjectMatterExpertType {
  if (value === 'EXTERNAL' || value === 'Externo') return 'EXTERNAL';
  return 'INTERNAL';
}

export function mapSubjectMatterExpertTypeFromApi(value: SubjectMatterExpertType): 'Interno' | 'Externo' {
  return value === 'EXTERNAL' ? 'Externo' : 'Interno';
}

export function mapSubjectMatterExpertStatusFromApi(
  value: SubjectMatterExpertStatus,
): 'Listo' | 'Pendiente' {
  return value === 'READY' ? 'Listo' : 'Pendiente';
}
