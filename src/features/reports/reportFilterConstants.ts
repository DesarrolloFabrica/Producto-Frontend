import type { ReportFilterOption } from '../../services/types/reportingApi.types';

export const USER_ROLE_FILTER_OPTIONS: ReportFilterOption[] = [
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'FABRICA', label: 'Fábrica' },
  { value: 'PLANEACION', label: 'Planeación' },
  { value: 'LMS', label: 'LMS' },
  { value: 'ADMIN', label: 'Administración' },
];

export const ENTITY_TYPE_FILTER_OPTIONS: ReportFilterOption[] = [
  { value: 'PROJECT', label: 'Proyecto' },
  { value: 'SUBJECT', label: 'Materia' },
  { value: 'SEMESTER', label: 'Semestre' },
  { value: 'OBSERVATION', label: 'Observación' },
  { value: 'OBSERVATION_BATCH', label: 'Lote de observaciones' },
  { value: 'CHECKLIST_ITEM', label: 'Checklist' },
  { value: 'TOPIC', label: 'Tema académico' },
];

const USER_ROLE_VALUES = new Set(USER_ROLE_FILTER_OPTIONS.map((o) => o.value));

export function sanitizeUserRole(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return USER_ROLE_VALUES.has(value) ? value : undefined;
}

export function sanitizeSemesterNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return undefined;
  return n;
}

export function labelForUserRole(value: string): string {
  return USER_ROLE_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function labelForEntityType(value: string): string {
  return ENTITY_TYPE_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
