import type { FactorySubjectsQuery } from '../../services/factoryApi';
import type { Priority } from '../../types/domain';
import type { SubjectOperationalState } from '../operations/subjectOperationalState';
import { priorityLabels } from '../../utils/status';

export const statusOptions: Array<{ value: SubjectOperationalState | ''; label: string }> = [
  { value: '', label: 'Todos los estados' },
  { value: 'CHANGES_REQUESTED', label: 'Correcciones pendientes' },
  { value: 'IN_PRODUCTION', label: 'En producción' },
  { value: 'NOT_STARTED', label: 'Por iniciar' },
  { value: 'IN_REVIEW', label: 'En seguimiento' },
  { value: 'CORRECTION_SENT', label: 'Corrección enviada' },
  { value: 'APPROVED', label: 'Aprobadas' },
];

export const sortOptions: Array<{ value: NonNullable<FactorySubjectsQuery['sort']> | ''; label: string }> = [
  { value: '', label: 'Orden por defecto' },
  { value: 'dueDate', label: 'Fecha entrega' },
  { value: 'updatedAt', label: 'Última actividad' },
  { value: 'priority', label: 'Prioridad' },
];

export const originOptions: Array<{ value: NonNullable<FactorySubjectsQuery['origin']> | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'new', label: 'Nuevas' },
  { value: 'original', label: 'Originales' },
];

export const priorityOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'CRITICAL', label: 'Crítica' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Baja' },
];

const statusLabelByValue = Object.fromEntries(
  statusOptions.filter((o) => o.value).map((o) => [o.value, o.label]),
) as Record<SubjectOperationalState, string>;

const sortLabelByValue = Object.fromEntries(
  sortOptions.filter((o) => o.value).map((o) => [o.value, o.label]),
) as Record<NonNullable<FactorySubjectsQuery['sort']>, string>;

export function getStatusLabel(status?: SubjectOperationalState) {
  if (!status) return undefined;
  return statusLabelByValue[status];
}

export function getSortLabel(sort?: FactorySubjectsQuery['sort']) {
  if (!sort) return undefined;
  return sortLabelByValue[sort];
}

export function getPriorityLabel(priority?: string) {
  if (!priority) return undefined;
  return priorityLabels[priority as Priority] ?? priority;
}

export type ActiveFilterChip = {
  key: string;
  param: string;
  label: string;
};

export function getActiveFilterChips(query: FactorySubjectsQuery): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (query.origin) {
    const originLabel = originOptions.find((o) => o.value === query.origin)?.label ?? query.origin;
    chips.push({ key: 'origin', param: 'origin', label: `Origen: ${originLabel}` });
  }
  if (query.status) {
    chips.push({
      key: 'status',
      param: 'status',
      label: `Estado: ${getStatusLabel(query.status) ?? query.status}`,
    });
  }
  if (query.priority) {
    chips.push({
      key: 'priority',
      param: 'priority',
      label: `Prioridad: ${getPriorityLabel(query.priority) ?? query.priority}`,
    });
  }
  if (query.program) {
    chips.push({ key: 'program', param: 'program', label: `Programa: ${query.program}` });
  }
  if (query.semester != null) {
    chips.push({ key: 'semester', param: 'semester', label: `Semestre: ${query.semester}` });
  }
  if (query.search) {
    chips.push({ key: 'search', param: 'search', label: `Búsqueda: ${query.search}` });
  }
  if (query.dueFrom) {
    chips.push({ key: 'dueFrom', param: 'dueFrom', label: `Desde: ${query.dueFrom}` });
  }
  if (query.dueTo) {
    chips.push({ key: 'dueTo', param: 'dueTo', label: `Hasta: ${query.dueTo}` });
  }

  return chips;
}

export function hasActiveFilters(query: FactorySubjectsQuery) {
  return getActiveFilterChips(query).length > 0 || Boolean(query.sort);
}

export const filterInputClass =
  'h-9 w-full rounded-[12px] border border-slate-200/70 bg-white px-3 text-sm text-[#1E293B] placeholder:text-[#94A3B8] transition-colors focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/15';

export const filterSelectClass =
  'h-9 w-full rounded-[12px] border border-slate-200/70 bg-white px-3 text-sm font-medium text-[#475569] transition-colors focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/15';
