import type { OperationalCheckKeyV2 } from '../../types/operationalWorkflow';

export const INSTITUTIONAL_CLOSURE_CHECKS: Array<{
  key: OperationalCheckKeyV2;
  label: string;
  responsibleRole: 'PLANEACION' | 'FABRICA' | 'PRODUCT' | 'LMS';
}> = [
  { key: 'PLANNING_INITIAL_VALIDATED', label: 'Solicitud validada por Planeación', responsibleRole: 'PLANEACION' },
  { key: 'FACTORY_CONTENT_DELIVERED', label: 'Contenido entregado por Fábrica', responsibleRole: 'FABRICA' },
  { key: 'PLANNING_PRODUCTION_VALIDATED', label: 'Producción validada por Planeación', responsibleRole: 'PLANEACION' },
  { key: 'LMS_UPLOAD_COMPLETED', label: 'Carga LMS completada', responsibleRole: 'LMS' },
  { key: 'PLANNING_LMS_VALIDATED', label: 'LMS validado por Planeación', responsibleRole: 'PLANEACION' },
  { key: 'PRODUCT_ACADEMIC_APPROVED', label: 'Revisión académica aprobada por Product', responsibleRole: 'PRODUCT' },
  { key: 'PLANNING_FINAL_RADICATED', label: 'Radicación final por Planeación', responsibleRole: 'PLANEACION' },
];
