import type { FactoryProductionStatus } from '../../types/domain';

export function isSubjectFactoryProductionComplete(subject: {
  factoryProductionStatus?: FactoryProductionStatus;
  progress?: number;
}): boolean {
  return subject.factoryProductionStatus === 'COMPLETED' || (subject.progress ?? 0) >= 100;
}
