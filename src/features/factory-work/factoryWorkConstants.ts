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
  'h-8 w-full rounded-lg border-0 bg-white/55 px-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 shadow-none ring-1 ring-slate-200/50 backdrop-blur-sm transition-[box-shadow,background-color,ring-color] focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-orange-400/25';

export const filterSelectClass =
  'h-8 w-full cursor-pointer appearance-none rounded-lg border-0 bg-white/55 px-2.5 text-[13px] font-medium text-slate-700 shadow-none ring-1 ring-slate-200/50 backdrop-blur-sm transition-[box-shadow,background-color,ring-color] focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-orange-400/25';

export const filterLabelClass =
  'block text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400/90';
