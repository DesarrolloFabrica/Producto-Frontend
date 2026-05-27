import type { ProductProgramTrayFilter } from './productProgramWork';

export const programStatusOptions: Array<{ label: string; value?: ProductProgramTrayFilter }> = [
  { label: 'Todos', value: undefined },
  { label: 'Solicitudes nuevas', value: 'NOT_STARTED' },
  { label: 'En producción (Fábrica)', value: 'IN_PRODUCTION' },
  { label: 'Revisión académica', value: 'IN_REVIEW' },
  { label: 'Devoluciones', value: 'CORRECTION_SENT' },
  { label: 'Correcciones abiertas', value: 'CHANGES_REQUESTED' },
  { label: 'Atrasados', value: 'OVERDUE' },
  { label: 'Finalizados', value: 'APPROVED' },
];

export const programSortOptions: Array<{ label: string; value?: 'dueDate' | 'updatedAt' | 'priority' }> = [
  { label: 'Plazo más cercano', value: undefined },
  { label: 'Fecha de entrega', value: 'dueDate' },
  { label: 'Recientes', value: 'updatedAt' },
  { label: 'Urgencia (SLA)', value: 'priority' },
];

export function getProgramStatusLabel(value?: ProductProgramTrayFilter) {
  const match = programStatusOptions.find((s) => s.value === value);
  return match?.value ? match.label : null;
}

export function getProgramSortLabel(value?: string) {
  const match = programSortOptions.find((s) => s.value === value);
  return match?.value ? match.label : null;
}

export function getProgramFilterChips(query: Record<string, unknown>) {
  const chips: Array<{ key: string; param: string; label: string }> = [];
  const add = (param: string, label: string) => {
    chips.push({ key: `${param}:${label}`, param, label });
  };

  if (typeof query.search === 'string' && query.search.trim()) add('search', `Buscar: ${query.search}`);
  if (typeof query.status === 'string' && query.status) {
    add('status', `Estado: ${getProgramStatusLabel(query.status as ProductProgramTrayFilter) ?? query.status}`);
  }
  if (typeof query.program === 'string' && query.program.trim()) add('program', `Programa: ${query.program}`);
  if (typeof query.school === 'string' && query.school.trim()) add('school', `Escuela: ${query.school}`);
  if (typeof query.dueFrom === 'string' && query.dueFrom) add('dueFrom', `Desde: ${query.dueFrom}`);
  if (typeof query.dueTo === 'string' && query.dueTo) add('dueTo', `Hasta: ${query.dueTo}`);
  if (typeof query.sort === 'string' && query.sort) add('sort', `Orden: ${getProgramSortLabel(query.sort) ?? query.sort}`);

  return chips;
}

export { filterInputClass, filterSelectClass } from './productWorkConstants';
