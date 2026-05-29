import type { FactoryProductionStatus, SubjectStatus } from '../../types/domain';

type FactorySubjectProgressSource = {
  factoryProductionStatus?: FactoryProductionStatus;
  factoryProductionCompletedAt?: string | null;
  progress?: number;
  status?: SubjectStatus | string;
};

export function isSubjectFactoryProductionComplete(subject: FactorySubjectProgressSource): boolean {
  if (subject.factoryProductionStatus === 'COMPLETED') return true;
  if (subject.factoryProductionCompletedAt) return true;
  return (subject.progress ?? 0) >= 100;
}

/** Avance visual para Fábrica: basado en producción interna, no en entregables del checklist. */
export function resolveFactorySubjectDisplayProgress(subject: FactorySubjectProgressSource): number {
  if (isSubjectFactoryProductionComplete(subject)) return 100;
  if (
    subject.factoryProductionStatus === 'IN_PROGRESS' ||
    subject.status === 'IN_PRODUCTION' ||
    subject.status === 'CHANGES_REQUESTED'
  ) {
    return 50;
  }
  return 0;
}

export function resolveFactorySubjectProductionLabel(subject: FactorySubjectProgressSource): string {
  if (isSubjectFactoryProductionComplete(subject)) return 'Producción interna completa';
  if (
    subject.factoryProductionStatus === 'IN_PROGRESS' ||
    subject.status === 'IN_PRODUCTION' ||
    subject.status === 'CHANGES_REQUESTED'
  ) {
    return 'En producción';
  }
  return 'Por iniciar';
}

/** Etiqueta corta para badge en tarjetas del hub de Fábrica. */
export function resolveFactorySubjectStatusBadgeLabel(subject: FactorySubjectProgressSource): string {
  if (isSubjectFactoryProductionComplete(subject)) return 'Completa';
  if (
    subject.factoryProductionStatus === 'IN_PROGRESS' ||
    subject.status === 'IN_PRODUCTION' ||
    subject.status === 'CHANGES_REQUESTED'
  ) {
    return 'En producción';
  }
  return 'Por iniciar';
}

export function factorySubjectStatusBadgeTone(subject: FactorySubjectProgressSource): string {
  if (isSubjectFactoryProductionComplete(subject)) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  }
  if (
    subject.factoryProductionStatus === 'IN_PROGRESS' ||
    subject.status === 'IN_PRODUCTION' ||
    subject.status === 'CHANGES_REQUESTED'
  ) {
    return 'bg-orange-50 text-orange-700 ring-orange-100';
  }
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}
