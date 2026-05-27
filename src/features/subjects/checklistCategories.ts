/** Debe coincidir con Producto-Backend/src/checklist/checklist.constants.ts */
export const CHECKLIST_CATEGORY_LABELS: Record<string, readonly string[]> = {
  informacion_base: [
    'Presentación',
    'Foro presentación',
    'Syllabus',
    'Lecturas y bibliografía',
  ],
  evaluacion_competencias: [
    'Resultados de aprendizaje',
    'Evaluación diagnóstica entrada',
    'Evaluaciones',
    'Evaluación diagnóstica salida',
  ],
  actividades_recursos: ['ACA', 'Foro Taller', 'Taller RAE', 'Seminario Alemán'],
};

export const CHECKLIST_CATEGORIES = [
  { id: 'informacion_base', title: 'Información base' },
  { id: 'evaluacion_competencias', title: 'Evaluación y competencias' },
  { id: 'actividades_recursos', title: 'Actividades y recursos' },
] as const;

export function labelBelongsToChecklistCategory(label: string, categoryId: string): boolean {
  const labels = CHECKLIST_CATEGORY_LABELS[categoryId];
  if (!labels) return false;
  const normalized = label.trim().toLowerCase();
  return labels.some((entry) => entry.trim().toLowerCase() === normalized);
}

export function getCategoryForItem(itemLabel: string): string {
  for (const category of CHECKLIST_CATEGORIES) {
    if (labelBelongsToChecklistCategory(itemLabel, category.id)) {
      return category.id;
    }
  }
  return 'informacion_base';
}
