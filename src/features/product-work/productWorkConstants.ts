import type { SubjectOperationalState } from '../operations/subjectOperationalState';

export const filterInputClass =
  'h-10 w-full rounded-[12px] border border-slate-200/70 bg-white px-3 text-sm font-semibold text-[#1E293B] placeholder:text-[#94A3B8] shadow-sm outline-none transition focus:border-orange-200 focus:ring-4 focus:ring-orange-100/60';

export const filterSelectClass =
  'h-10 w-full rounded-[12px] border border-slate-200/70 bg-white px-3 text-sm font-semibold text-[#1E293B] shadow-sm outline-none transition focus:border-orange-200 focus:ring-4 focus:ring-orange-100/60';

export const statusOptions: Array<{ label: string; value?: SubjectOperationalState }> = [
  { label: 'Todos', value: undefined },
  { label: 'Pendientes por revisar', value: 'IN_REVIEW' },
  { label: 'Correcciones por validar', value: 'CORRECTION_SENT' },
  { label: 'Correcciones solicitadas', value: 'CHANGES_REQUESTED' },
  { label: 'Aprobadas', value: 'APPROVED' },
  { label: 'En producción', value: 'IN_PRODUCTION' },
  { label: 'Por iniciar', value: 'NOT_STARTED' },
];

export const priorityOptions: Array<{ label: string; value?: string }> = [
  { label: 'Todas', value: undefined },
  { label: 'Crítica', value: 'CRITICAL' },
  { label: 'Alta', value: 'HIGH' },
  { label: 'Media', value: 'MEDIUM' },
  { label: 'Baja', value: 'LOW' },
];

export const originOptions: Array<{ label: string; value?: 'all' | 'new' | 'original' }> = [
  { label: 'Todos', value: undefined },
  { label: 'Nuevas / agregadas', value: 'new' },
  { label: 'Originales', value: 'original' },
  { label: 'Todo', value: 'all' },
];

export const sortOptions: Array<{ label: string; value?: 'dueDate' | 'updatedAt' | 'priority' }> = [
  { label: 'Recientes (default)', value: undefined },
  { label: 'Fecha de entrega', value: 'dueDate' },
  { label: 'Ultima actividad', value: 'updatedAt' },
  { label: 'Prioridad', value: 'priority' },
];

export function getStatusLabel(value?: SubjectOperationalState) {
  const match = statusOptions.find((s) => s.value === value);
  return match?.value ? match.label : null;
}

export function getSortLabel(value?: string) {
  const match = sortOptions.find((s) => s.value === value);
  return match?.value ? match.label : null;
}

export function getActiveFilterChips(query: Record<string, unknown>) {
  const chips: Array<{ key: string; param: string; label: string }> = [];
  const add = (param: string, label: string) => {
    chips.push({ key: `${param}:${label}`, param, label });
  };

  if (typeof query.search === 'string' && query.search.trim()) add('search', `Buscar: ${query.search}`);
  if (typeof query.status === 'string' && query.status) add('status', `Estado: ${getStatusLabel(query.status as any) ?? query.status}`);
  if (typeof query.priority === 'string' && query.priority) add('priority', `Prioridad: ${query.priority}`);
  if (typeof query.program === 'string' && query.program.trim()) add('program', `Programa: ${query.program}`);
  if (typeof query.semester === 'number' && Number.isFinite(query.semester)) add('semester', `Sem: ${query.semester}`);
  if (typeof query.origin === 'string' && query.origin && query.origin !== 'all') add('origin', query.origin === 'new' ? 'Origen: nueva' : 'Origen: original');
  if (typeof query.dueFrom === 'string' && query.dueFrom) add('dueFrom', `Desde: ${query.dueFrom}`);
  if (typeof query.dueTo === 'string' && query.dueTo) add('dueTo', `Hasta: ${query.dueTo}`);
  if (typeof query.sort === 'string' && query.sort) add('sort', `Orden: ${getSortLabel(query.sort) ?? query.sort}`);

  return chips;
}

