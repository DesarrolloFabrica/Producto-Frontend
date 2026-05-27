import type {
  OperationalActionV2,
  OperationalCheckKeyV2,
  OperationalCheckStatusV2,
  OperationalCheckV2,
  OperationalEvidenceV2,
  OperationalRoleV2,
  OperationalStateV2,
  OperationalSubjectV2,
  OperationalTransitionV2,
  OperationalUserRefV2,
} from '../types/operationalWorkflow';

function iso(d: Date): string {
  return d.toISOString();
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

const USERS: Record<OperationalRoleV2, OperationalUserRefV2> = {
  PRODUCT: { id: 'u_product', name: 'Product Operador', role: 'PRODUCT' },
  FABRICA: { id: 'u_fabrica', name: 'Fabrica Operador', role: 'FABRICA' },
  LMS: { id: 'u_lms', name: 'LMS Operador', role: 'LMS' },
  PLANEACION: { id: 'u_planeacion', name: 'Planeacion', role: 'PLANEACION' },
  ADMIN: { id: 'u_admin', name: 'Admin', role: 'ADMIN' },
};

export const OP_CHECKS: Array<{
  key: OperationalCheckKeyV2;
  label: string;
  responsibleRole: OperationalRoleV2;
}> = [
  { key: 'PLANNING_INITIAL_VALIDATED', label: 'Solicitud validada por Planeacion', responsibleRole: 'PLANEACION' },
  { key: 'FACTORY_CONTENT_DELIVERED', label: 'Contenido entregado por Fabrica', responsibleRole: 'FABRICA' },
  { key: 'PLANNING_PRODUCTION_VALIDATED', label: 'Produccion validada por Planeacion', responsibleRole: 'PLANEACION' },
  { key: 'LMS_UPLOAD_COMPLETED', label: 'Carga LMS completada', responsibleRole: 'LMS' },
  { key: 'PLANNING_LMS_VALIDATED', label: 'LMS validado por Planeacion', responsibleRole: 'PLANEACION' },
  { key: 'PRODUCT_ACADEMIC_APPROVED', label: 'Revision academica aprobada por Product', responsibleRole: 'PRODUCT' },
  { key: 'PLANNING_FINAL_RADICATED', label: 'Radicacion final Planeacion', responsibleRole: 'PLANEACION' },
];

export function buildInitialChecks(now = new Date()): OperationalCheckV2[] {
  return OP_CHECKS.map((c, idx) => ({
    key: c.key,
    label: c.label,
    responsibleRole: c.responsibleRole,
    status: 'PENDING' as OperationalCheckStatusV2,
    checkedAt: null,
    checkedBy: null,
    comment: null,
    evidenceUrl: null,
    dueAt: iso(addDays(now, 2 + idx)),
  }));
}

function baseTimeline(params: {
  to: OperationalStateV2;
  actorRole: OperationalRoleV2;
  comment?: string | null;
}): OperationalTransitionV2[] {
  return [
    {
      id: uid('t'),
      occurredAt: iso(new Date()),
      from: null,
      to: params.to,
      action: 'VIEW_DETAIL' as OperationalActionV2,
      actor: USERS[params.actorRole],
      comment: params.comment ?? 'Solicitud creada',
      returnReason: null,
      durationLabel: null,
    },
  ];
}

function sampleEvidences(now = new Date()): OperationalEvidenceV2[] {
  return [
    {
      id: uid('e'),
      label: 'Carpeta Drive (mock)',
      url: 'https://drive.google.com/',
      kind: 'DRIVE',
      addedAt: iso(now),
      addedBy: USERS.FABRICA,
    },
    {
      id: uid('e'),
      label: 'Publicacion LMS (mock)',
      url: 'https://example.com/lms',
      kind: 'LMS',
      addedAt: iso(now),
      addedBy: USERS.LMS,
    },
  ];
}

export function createMockSubjects(count = 18): OperationalSubjectV2[] {
  const now = new Date();
  const states: OperationalStateV2[] = [
    'PENDING_PLANNING_INITIAL_VALIDATION',
    'RETURNED_TO_PRODUCT_FROM_PLANNING',
    'PENDING_FACTORY',
    'IN_FACTORY_PRODUCTION',
    'PENDING_PLANNING_PRODUCTION_VALIDATION',
    'RETURNED_TO_FACTORY_FROM_PLANNING',
    'PENDING_LMS_UPLOAD',
    'IN_LMS_UPLOAD',
    'PENDING_PLANNING_LMS_VALIDATION',
    'RETURNED_TO_LMS_FROM_PLANNING',
    'PENDING_PRODUCT_ACADEMIC_REVIEW',
    'IN_PRODUCT_ACADEMIC_REVIEW',
    'CHANGES_REQUESTED_BY_PRODUCT',
    'PENDING_PROJECT_RADICATION',
    'FINALIZED',
  ];

  const items: OperationalSubjectV2[] = [];
  for (let i = 0; i < count; i += 1) {
    const operationalState = states[i % states.length];
    const createdAt = addDays(now, -10 - i);
    const expected = addDays(now, 7 + (i % 5));
    const stageEnteredAt = addDays(now, -2 - (i % 4));
    const stageDueAt = addDays(now, (i % 3) - 1);
    const finalizedAt = operationalState === 'FINALIZED' ? iso(addDays(now, -1)) : null;

    const checks = buildInitialChecks(now);
    const timeline = baseTimeline({ to: operationalState, actorRole: 'PRODUCT' });

    // Give some variability
    if (operationalState === 'RETURNED_TO_PRODUCT_FROM_PLANNING') {
      timeline.push({
        id: uid('t'),
        occurredAt: iso(addDays(now, -1)),
        from: 'PENDING_PLANNING_INITIAL_VALIDATION',
        to: 'RETURNED_TO_PRODUCT_FROM_PLANNING',
        action: 'PLANNING_RETURN_INITIAL',
        actor: USERS.PLANEACION,
        comment: 'Faltan datos de modalidad y fecha esperada.',
        returnReason: 'Datos incompletos',
        durationLabel: '1d',
      });
    }
    if (operationalState === 'RETURNED_TO_FACTORY_FROM_PLANNING') {
      timeline.push({
        id: uid('t'),
        occurredAt: iso(addDays(now, -1)),
        from: 'PENDING_PLANNING_PRODUCTION_VALIDATION',
        to: 'RETURNED_TO_FACTORY_FROM_PLANNING',
        action: 'PLANNING_RETURN_PRODUCTION',
        actor: USERS.PLANEACION,
        comment: 'La estructura de Drive no cumple el estandar.',
        returnReason: 'Estructura incorrecta',
        durationLabel: '2d',
      });
    }
    if (operationalState === 'RETURNED_TO_LMS_FROM_PLANNING') {
      timeline.push({
        id: uid('t'),
        occurredAt: iso(addDays(now, -1)),
        from: 'PENDING_PLANNING_LMS_VALIDATION',
        to: 'RETURNED_TO_LMS_FROM_PLANNING',
        action: 'PLANNING_RETURN_LMS',
        actor: USERS.PLANEACION,
        comment: 'Enlace de publicacion invalido / credencial pendiente.',
        returnReason: 'Validacion LMS fallida',
        durationLabel: '1d',
      });
    }

    // Mark some checks as completed depending on stage
    const mark = (key: OperationalCheckKeyV2, role: OperationalRoleV2, comment: string) => {
      const c = checks.find((x) => x.key === key);
      if (!c) return;
      c.status = 'CHECKED';
      c.checkedAt = iso(addDays(now, -1));
      c.checkedBy = USERS[role];
      c.comment = comment;
    };

    if (['PENDING_FACTORY', 'IN_FACTORY_PRODUCTION', 'PENDING_PLANNING_PRODUCTION_VALIDATION', 'RETURNED_TO_FACTORY_FROM_PLANNING', 'PENDING_LMS_UPLOAD', 'IN_LMS_UPLOAD', 'PENDING_PLANNING_LMS_VALIDATION', 'RETURNED_TO_LMS_FROM_PLANNING', 'PENDING_PRODUCT_ACADEMIC_REVIEW', 'IN_PRODUCT_ACADEMIC_REVIEW', 'CHANGES_REQUESTED_BY_PRODUCT', 'PENDING_PROJECT_RADICATION', 'FINALIZED'].includes(operationalState)) {
      mark('PLANNING_INITIAL_VALIDATED', 'PLANEACION', 'Validacion inicial OK.');
    }
    if (['PENDING_PLANNING_PRODUCTION_VALIDATION', 'RETURNED_TO_FACTORY_FROM_PLANNING', 'PENDING_LMS_UPLOAD', 'IN_LMS_UPLOAD', 'PENDING_PLANNING_LMS_VALIDATION', 'RETURNED_TO_LMS_FROM_PLANNING', 'PENDING_PRODUCT_ACADEMIC_REVIEW', 'IN_PRODUCT_ACADEMIC_REVIEW', 'CHANGES_REQUESTED_BY_PRODUCT', 'PENDING_PROJECT_RADICATION', 'FINALIZED'].includes(operationalState)) {
      mark('FACTORY_CONTENT_DELIVERED', 'FABRICA', 'Contenido entregado en Drive.');
    }
    if (['PENDING_LMS_UPLOAD', 'IN_LMS_UPLOAD', 'PENDING_PLANNING_LMS_VALIDATION', 'RETURNED_TO_LMS_FROM_PLANNING', 'PENDING_PRODUCT_ACADEMIC_REVIEW', 'IN_PRODUCT_ACADEMIC_REVIEW', 'CHANGES_REQUESTED_BY_PRODUCT', 'PENDING_PROJECT_RADICATION', 'FINALIZED'].includes(operationalState)) {
      mark('PLANNING_PRODUCTION_VALIDATED', 'PLANEACION', 'Produccion validada.');
    }
    if (['PENDING_PLANNING_LMS_VALIDATION', 'RETURNED_TO_LMS_FROM_PLANNING', 'PENDING_PRODUCT_ACADEMIC_REVIEW', 'IN_PRODUCT_ACADEMIC_REVIEW', 'CHANGES_REQUESTED_BY_PRODUCT', 'PENDING_PROJECT_RADICATION', 'FINALIZED'].includes(operationalState)) {
      mark('LMS_UPLOAD_COMPLETED', 'LMS', 'Carga y publicacion completada.');
    }
    if (['PENDING_PRODUCT_ACADEMIC_REVIEW', 'IN_PRODUCT_ACADEMIC_REVIEW', 'CHANGES_REQUESTED_BY_PRODUCT', 'PENDING_PROJECT_RADICATION', 'FINALIZED'].includes(operationalState)) {
      mark('PLANNING_LMS_VALIDATED', 'PLANEACION', 'Validacion LMS OK.');
    }
    if (['PENDING_PROJECT_RADICATION', 'FINALIZED'].includes(operationalState)) {
      mark('PRODUCT_ACADEMIC_APPROVED', 'PRODUCT', 'Revision academica aprobada.');
    }
    if (['FINALIZED'].includes(operationalState)) {
      mark('PLANNING_FINAL_RADICATED', 'PLANEACION', 'Proceso radicado y cerrado.');
    }

    const responsibleRole: OperationalRoleV2 =
      operationalState === 'PENDING_PLANNING_INITIAL_VALIDATION' || operationalState === 'PENDING_PLANNING_PRODUCTION_VALIDATION' || operationalState === 'PENDING_PLANNING_LMS_VALIDATION' || operationalState === 'PENDING_PROJECT_RADICATION'
        ? 'PLANEACION'
        : operationalState === 'PENDING_FACTORY' || operationalState === 'IN_FACTORY_PRODUCTION' || operationalState === 'RETURNED_TO_FACTORY_FROM_PLANNING' || operationalState === 'CHANGES_REQUESTED_BY_PRODUCT'
          ? 'FABRICA'
          : operationalState === 'PENDING_LMS_UPLOAD' || operationalState === 'IN_LMS_UPLOAD' || operationalState === 'RETURNED_TO_LMS_FROM_PLANNING'
            ? 'LMS'
            : operationalState === 'PENDING_PRODUCT_ACADEMIC_REVIEW' || operationalState === 'IN_PRODUCT_ACADEMIC_REVIEW' || operationalState === 'RETURNED_TO_PRODUCT_FROM_PLANNING'
              ? 'PRODUCT'
              : 'PLANEACION';

    items.push({
      subjectId: uid('sub'),
      projectId: uid('proj'),
      subjectName: `Asignatura ${i + 1}`,
      program: ['Administracion', 'Ingenieria', 'Contaduria', 'Derecho'][i % 4],
      school: ['Ciencias', 'Negocios', 'Sociales'][i % 3],
      semesterNumber: (i % 10) + 1,
      modality: ['Virtual', 'Presencial', 'Hibrida'][i % 3],
      priority: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const)[i % 4],
      expectedDeliveryDate: iso(expected),
      operationalState,
      currentStageLabel: 'Pipeline institucional',
      currentResponsibleRole: responsibleRole,
      createdAt: iso(createdAt),
      lastActivityAt: iso(addDays(now, -(i % 3))),
      stageEnteredAt: iso(stageEnteredAt),
      stageDueAt: iso(stageDueAt),
      finalizedAt,
      checks,
      timeline,
      evidences: sampleEvidences(now),
      returnContext:
        operationalState === 'RETURNED_TO_PRODUCT_FROM_PLANNING'
          ? { returnedFromRole: 'PLANEACION', comment: 'Completar datos de solicitud.', returnedAt: iso(addDays(now, -1)) }
          : operationalState === 'RETURNED_TO_FACTORY_FROM_PLANNING'
            ? { returnedFromRole: 'PLANEACION', comment: 'Ajustar estructura en Drive.', returnedAt: iso(addDays(now, -1)) }
            : operationalState === 'RETURNED_TO_LMS_FROM_PLANNING'
              ? { returnedFromRole: 'PLANEACION', comment: 'Revisar publicacion y credenciales.', returnedAt: iso(addDays(now, -1)) }
              : null,
    });
  }
  return items;
}

export const OP_USERS = USERS;

