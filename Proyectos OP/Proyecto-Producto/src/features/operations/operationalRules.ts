import type {
  ActivityEvent,
  AuditLog,
  ChecklistItem,
  ChecklistStatus,
  LinkResource,
  Notification,
  OperationalObservation,
  SubjectVirtualization,
  VirtualizationProject,
} from '../../types/domain';
import { checklistStatusLabels, projectStatusLabels } from '../../utils/status';
import type {
  ActivityOperationalImpact,
  AuditOperationalImpact,
  NotificationOperationalState,
  NotificationRequiredAction,
  OperationalBlocker,
  OperationalHealthSummary,
  OperationalInsight,
  OperationalNextStep,
  OperationalSeverity,
} from './operationalTypes';

const referenceDate = new Date('2026-05-12T00:00:00');
const sourceDocumentTypes = new Set(['SYLLABUS', 'CURRICULUM', 'BRIEF', 'DRIVE_FOLDER']);

const safeDate = (value?: string) => {
  const date = value ? new Date(value) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
};

const daysUntil = (value?: string) => {
  const date = safeDate(value);
  if (!date) return Number.POSITIVE_INFINITY;
  return Math.ceil((date.getTime() - referenceDate.getTime()) / 86_400_000);
};

const isOpenObservation = (observation: OperationalObservation) => observation.status === 'ABIERTA' || observation.status === 'EN_CORRECCION';

const hasSourceDocuments = (links: LinkResource[] = []) => links.some((link) => sourceDocumentTypes.has(link.type));

const statusRank: Record<OperationalSeverity, number> = {
  critical: 0,
  blocking: 1,
  urgent: 2,
  attention: 3,
  info: 4,
  completed: 5,
};

export const sortByOperationalPriority = <T extends { severity?: OperationalSeverity }>(items: T[]) =>
  [...items].sort((a, b) => statusRank[a.severity ?? 'info'] - statusRank[b.severity ?? 'info']);

export function dedupeNextActions(actions: OperationalNextStep[], limit?: number): OperationalNextStep[] {
  const grouped = sortByOperationalPriority(actions).reduce<Map<string, OperationalNextStep & { count?: number }>>((acc, action) => {
    const key = normalizeActionTitle(action.title);
    const existing = acc.get(key);
    if (!existing) {
      acc.set(key, { ...action, count: 1 });
      return acc;
    }
    existing.count = (existing.count ?? 1) + 1;
    if (statusRank[action.severity ?? 'info'] < statusRank[existing.severity ?? 'info']) {
      acc.set(key, { ...action, count: existing.count });
    } else {
      acc.set(key, {
        ...existing,
        description: `${existing.count} elementos requieren esta accion.`,
      });
    }
    return acc;
  }, new Map());

  const deduped = Array.from(grouped.values()).map((action) => {
    if (!action.count || action.count <= 1) return action;
    const title = action.title.includes(String(action.count)) ? action.title : `${action.title} (${action.count})`;
    return { ...action, title, description: `${action.count} elementos requieren atencion similar.` };
  });

  const sorted = sortByOperationalPriority(deduped);
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}

function normalizeActionTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/ de .+$/i, '')
    .replace(/ en .+$/i, '')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

export function getHealthFromSeverity(severity: OperationalSeverity): OperationalHealthSummary['healthStatus'] {
  if (severity === 'critical') return 'critico';
  if (severity === 'blocking') return 'bloqueado';
  if (severity === 'urgent' || severity === 'attention') return 'en_riesgo';
  return 'saludable';
}

export function getProjectBlockers(
  project: VirtualizationProject,
  subjects: SubjectVirtualization[] = project.subjects ?? [],
  observations: OperationalObservation[] = [],
  links: LinkResource[] = project.links ?? [],
): OperationalBlocker[] {
  if (!project) return [];

  const blockers: OperationalBlocker[] = [];
  const projectObservations = observations.filter((observation) => observation.projectId === project.id && isOpenObservation(observation));
  const remainingDays = daysUntil(project.expectedDeliveryDate);

  projectObservations.forEach((observation) => {
    blockers.push({
      id: `obs-${observation.id}`,
      title: `Observacion abierta en ${observation.relatedEntity}`,
      reason: observation.text,
      impact: 'Impide cerrar la revision hasta que el responsable valide la correccion.',
      requiredAction: 'Resolver o actualizar la observacion pendiente.',
      blockedEntityType: observation.subjectId ? 'subject' : 'project',
      blockedEntityId: observation.subjectId ?? project.id,
      responsibleRole: observation.role === 'FABRICA' ? 'PRODUCT' : 'FABRICA',
      severity: project.status === 'FEEDBACK_PENDING' ? 'blocking' : 'urgent',
      projectId: project.id,
      subjectId: observation.subjectId,
      targetRoute: observation.subjectId ? `/subjects/${observation.subjectId}` : `/projects/${project.id}`,
      targetContext: observation.subjectId ? { type: 'subject', id: observation.subjectId } : { type: 'project', id: project.id },
    });
  });

  subjects.forEach((subject) => {
    const missing = subject.checklist.filter((item) => item.status === 'NO_EXISTE');
    const pending = subject.checklist.filter((item) => item.status === 'PENDIENTE');
    if (missing.length > 0) {
      blockers.push({
        id: `missing-${subject.id}`,
        title: `${subject.name}: ${missing.length} entregables no existen`,
        reason: 'Hay insumos o entregables sin registrar en el checklist.',
        impact: 'La materia no puede considerarse lista para revision ni entrega.',
        requiredAction: 'Crear o completar los entregables faltantes.',
        blockedEntityType: 'subject',
        blockedEntityId: subject.id,
        responsibleRole: 'FABRICA',
        severity: 'blocking',
        projectId: project.id,
        subjectId: subject.id,
        targetRoute: `/subjects/${subject.id}`,
        targetContext: { type: 'subject', id: subject.id },
      });
    }
    if (pending.length > 0) {
      blockers.push({
        id: `pending-${subject.id}`,
        title: `${subject.name}: ${pending.length} checklist pendientes`,
        reason: 'Existen entregables abiertos que requieren avance operativo.',
        impact: 'Retrasa produccion, revision y eventual entrega a LMS.',
        requiredAction: 'Actualizar o completar checklist pendiente.',
        blockedEntityType: 'subject',
        blockedEntityId: subject.id,
        responsibleRole: 'FABRICA',
        severity: remainingDays <= 3 ? 'critical' : 'urgent',
        projectId: project.id,
        subjectId: subject.id,
        targetRoute: `/subjects/${subject.id}`,
        targetContext: { type: 'subject', id: subject.id },
      });
    }
  });

  if (project.status === 'FEEDBACK_PENDING') {
    blockers.push({
      id: `feedback-${project.id}`,
      title: 'Proyecto con observaciones pendientes',
      reason: 'El proyecto fue devuelto y requiere correccion antes de avanzar.',
      impact: 'Bloquea revision final y entrega a LMS.',
      requiredAction: 'Atender observaciones abiertas y confirmar correccion.',
      blockedEntityType: 'project',
      blockedEntityId: project.id,
      responsibleRole: 'PRODUCT',
      severity: 'blocking',
      projectId: project.id,
      targetRoute: `/projects/${project.id}`,
      targetContext: { type: 'project', id: project.id },
    });
  }

  if (!['DELIVERED_TO_LMS', 'CLOSED'].includes(project.status) && remainingDays <= 3) {
    blockers.push({
      id: `due-${project.id}`,
      title: remainingDays < 0 ? 'Proyecto vencido' : 'Entrega proxima a vencer',
      reason: remainingDays < 0 ? 'La fecha esperada ya paso.' : `Faltan ${remainingDays} dias para la entrega esperada.`,
      impact: 'Aumenta el riesgo de incumplir la entrega institucional.',
      requiredAction: 'Priorizar checklist y observaciones que impiden avanzar.',
      blockedEntityType: 'project',
      blockedEntityId: project.id,
      responsibleRole: 'FABRICA',
      severity: remainingDays < 0 ? 'critical' : 'urgent',
      projectId: project.id,
      targetRoute: `/projects/${project.id}`,
      targetContext: { type: 'project', id: project.id },
    });
  }

  if (!hasSourceDocuments(links) && ['PENDING_SYLLABUS', 'READY_FOR_PRODUCTION', 'IN_PRODUCTION'].includes(project.status)) {
    blockers.push({
      id: `docs-${project.id}`,
      title: 'Documentos fuente insuficientes',
      reason: 'No hay syllabus, brief, curriculo o carpeta de produccion asociados.',
      impact: 'Fabrica puede avanzar con informacion incompleta o bloquear produccion.',
      requiredAction: 'Solicitar o agregar documentos fuente antes de continuar.',
      blockedEntityType: 'project',
      blockedEntityId: project.id,
      responsibleRole: 'PRODUCT',
      severity: 'blocking',
      projectId: project.id,
      targetRoute: `/projects/${project.id}`,
      targetContext: { type: 'project', id: project.id },
    });
  }

  return sortByOperationalPriority(blockers);
}

export function getProjectNextActions(
  project: VirtualizationProject,
  subjects: SubjectVirtualization[] = project.subjects ?? [],
  observations: OperationalObservation[] = [],
  links: LinkResource[] = project.links ?? [],
): OperationalNextStep[] {
  if (!project) return [];

  const actions: OperationalNextStep[] = [];
  const openObservations = observations.filter((observation) => observation.projectId === project.id && isOpenObservation(observation));
  const pendingSubjects = subjects.filter((subject) => subject.checklist.some((item) => ['NO_EXISTE', 'PENDIENTE'].includes(item.status)));
  const deliveredSubjects = subjects.filter((subject) => subject.checklist.some((item) => item.status === 'ENTREGADO'));

  if (openObservations.length > 0 || project.status === 'FEEDBACK_PENDING') {
    actions.push({
      title: 'Resolver observaciones abiertas',
      description: `${openObservations.length || 1} observaciones requieren respuesta antes de continuar.`,
      actionLabel: 'Revisar observaciones',
      responsibleRole: 'PRODUCT',
      impact: 'Desbloquea revision y entrega posterior.',
      dependency: 'Correccion o validacion Product.',
      severity: 'blocking',
      targetRoute: `/projects/${project.id}`,
      targetContext: { type: 'project', id: project.id },
    });
  }

  if (pendingSubjects.length > 0) {
    const subject = pendingSubjects[0];
    actions.push({
      title: `Completar checklist de ${subject.name}`,
      description: 'Hay entregables pendientes o inexistentes en la materia.',
      actionLabel: 'Gestionar materia',
      responsibleRole: 'FABRICA',
      impact: 'Permite mover la materia hacia revision.',
      dependency: 'Checklist operativo de la materia.',
      severity: 'urgent',
      targetRoute: `/subjects/${subject.id}`,
      targetContext: { type: 'subject', id: subject.id },
    });
  }

  if (!hasSourceDocuments(links)) {
    actions.push({
      title: 'Agregar documentos fuente',
      description: 'Faltan insumos documentales para sostener la produccion.',
      actionLabel: 'Gestionar documentos',
      responsibleRole: 'PRODUCT',
      impact: 'Evita reprocesos y decisiones sin soporte academico.',
      dependency: 'Syllabus, curriculo, brief o carpeta Drive.',
      severity: 'blocking',
      targetRoute: `/projects/${project.id}`,
      targetContext: { type: 'project', id: project.id },
    });
  }

  if (deliveredSubjects.length > 0) {
    const subject = deliveredSubjects[0];
    actions.push({
      title: `Validar entregables de ${subject.name}`,
      description: 'Hay entregables marcados como entregados que esperan revision.',
      actionLabel: 'Revisar entregables',
      responsibleRole: 'FABRICA',
      impact: 'Permite aprobar o devolver con observaciones claras.',
      severity: 'attention',
      targetRoute: `/subjects/${subject.id}`,
      targetContext: { type: 'subject', id: subject.id },
    });
  }

  if (project.status === 'DELIVERED_TO_LMS') {
    actions.push({
      title: 'Confirmar cierre operacional',
      description: 'El proyecto fue entregado a LMS y requiere cierre de trazabilidad.',
      actionLabel: 'Revisar auditoria',
      responsibleRole: 'FABRICA',
      impact: 'Deja constancia institucional del cierre.',
      severity: 'completed',
      targetRoute: `/projects/${project.id}`,
      targetContext: { type: 'project', id: project.id },
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: 'Mantener seguimiento operativo',
      description: `El proyecto esta en estado ${projectStatusLabels[project.status]}.`,
      actionLabel: 'Ver proyecto',
      responsibleRole: 'FABRICA',
      impact: 'Conserva trazabilidad y previene bloqueos tardios.',
      severity: 'info',
      targetRoute: `/projects/${project.id}`,
      targetContext: { type: 'project', id: project.id },
    });
  }

  return sortByOperationalPriority(actions);
}

export function getSubjectBlockers(
  project: VirtualizationProject,
  subject: SubjectVirtualization,
  observations: OperationalObservation[] = [],
  links: LinkResource[] = project.links ?? [],
): OperationalBlocker[] {
  if (!project || !subject) return [];

  const blockers: OperationalBlocker[] = [];
  const subjectObservations = observations.filter(
    (observation) => (observation.subjectId === subject.id || observation.relatedEntity === subject.name) && isOpenObservation(observation),
  );
  const remainingDays = daysUntil(project.expectedDeliveryDate);

  const missing = subject.checklist.filter((item) => item.status === 'NO_EXISTE');
  const pending = subject.checklist.filter((item) => item.status === 'PENDIENTE');

  if (missing.length > 0) {
    blockers.push({
      id: `subject-missing-${subject.id}`,
      title: `${missing.length} entregables no existen`,
      reason: 'El checklist tiene items sin insumo o sin produccion registrada.',
      impact: 'Bloquea revision integral de la materia.',
      requiredAction: 'Crear, cargar o producir los entregables faltantes.',
      blockedEntityType: 'subject',
      blockedEntityId: subject.id,
      responsibleRole: 'FABRICA',
      severity: 'blocking',
      projectId: project.id,
      subjectId: subject.id,
      targetRoute: `/subjects/${subject.id}`,
      targetContext: { type: 'subject', id: subject.id },
    });
  }

  if (pending.length > 0) {
    blockers.push({
      id: `subject-pending-${subject.id}`,
      title: `${pending.length} entregables pendientes`,
      reason: 'Hay actividades abiertas dentro del checklist.',
      impact: 'Retrasa aprobacion de la materia y entrega del proyecto.',
      requiredAction: 'Actualizar el estado de los entregables pendientes.',
      blockedEntityType: 'subject',
      blockedEntityId: subject.id,
      responsibleRole: 'FABRICA',
      severity: remainingDays <= 3 ? 'critical' : 'urgent',
      projectId: project.id,
      subjectId: subject.id,
      targetRoute: `/subjects/${subject.id}`,
      targetContext: { type: 'subject', id: subject.id },
    });
  }

  subjectObservations.forEach((observation) => {
    blockers.push({
      id: `subject-observation-${observation.id}`,
      title: 'Observacion abierta relacionada',
      reason: observation.text,
      impact: 'La materia puede requerir correccion antes de aprobarse.',
      requiredAction: 'Resolver la observacion o dejar seguimiento claro.',
      blockedEntityType: 'subject',
      blockedEntityId: subject.id,
      responsibleRole: observation.role === 'FABRICA' ? 'PRODUCT' : 'FABRICA',
      severity: 'blocking',
      projectId: project.id,
      subjectId: subject.id,
      targetRoute: `/subjects/${subject.id}`,
      targetContext: { type: 'subject', id: subject.id },
    });
  });

  if (!hasSourceDocuments(links)) {
    blockers.push({
      id: `subject-docs-${subject.id}`,
      title: 'Materia sin documentos fuente suficientes',
      reason: 'No hay insumos documentales asociados al proyecto.',
      impact: 'Puede generar reproceso o contenido sin soporte academico.',
      requiredAction: 'Solicitar syllabus, brief o carpeta fuente.',
      blockedEntityType: 'subject',
      blockedEntityId: subject.id,
      responsibleRole: 'PRODUCT',
      severity: 'blocking',
      projectId: project.id,
      subjectId: subject.id,
      targetRoute: `/projects/${project.id}`,
      targetContext: { type: 'project', id: project.id },
    });
  }

  if (!['APROBADO'].includes(subject.status) && remainingDays <= 3) {
    blockers.push({
      id: `subject-due-${subject.id}`,
      title: remainingDays < 0 ? 'Materia en proyecto vencido' : 'Materia con entrega cercana',
      reason: remainingDays < 0 ? 'La entrega del proyecto ya vencio.' : `Quedan ${remainingDays} dias para la entrega del proyecto.`,
      impact: 'Aumenta el riesgo de incumplimiento del programa.',
      requiredAction: 'Priorizar entregables pendientes y observaciones abiertas.',
      blockedEntityType: 'subject',
      blockedEntityId: subject.id,
      responsibleRole: 'FABRICA',
      severity: remainingDays < 0 ? 'critical' : 'urgent',
      projectId: project.id,
      subjectId: subject.id,
      targetRoute: `/subjects/${subject.id}`,
      targetContext: { type: 'subject', id: subject.id },
    });
  }

  return sortByOperationalPriority(blockers);
}

export function getSubjectNextAction(
  project: VirtualizationProject,
  subject: SubjectVirtualization,
  observations: OperationalObservation[] = [],
  links: LinkResource[] = project.links ?? [],
): OperationalNextStep {
  const subjectObservations = observations.filter(
    (observation) => (observation.subjectId === subject.id || observation.relatedEntity === subject.name) && isOpenObservation(observation),
  );
  const missingOrPending = subject.checklist.filter((item) => ['NO_EXISTE', 'PENDIENTE'].includes(item.status));
  const delivered = subject.checklist.filter((item) => item.status === 'ENTREGADO');

  if (subjectObservations.length > 0) {
    return {
      title: 'Resolver observacion abierta',
      description: `Hay ${subjectObservations.length} observaciones relacionadas con la materia.`,
      actionLabel: 'Revisar observacion',
      responsibleRole: subjectObservations[0].role === 'FABRICA' ? 'PRODUCT' : 'FABRICA',
      impact: 'Evita avanzar a aprobacion con inconsistencias abiertas.',
      dependency: 'Correccion o validacion de la observacion.',
      severity: 'blocking',
      targetRoute: `/subjects/${subject.id}`,
      targetContext: { type: 'subject', id: subject.id },
    };
  }

  if (missingOrPending.length > 0) {
    return {
      title: 'Completar entregables pendientes',
      description: `${missingOrPending.length} items requieren produccion o actualizacion.`,
      actionLabel: 'Actualizar checklist',
      responsibleRole: 'FABRICA',
      impact: 'Permite llevar la materia hacia entrega y revision.',
      dependency: hasSourceDocuments(links) ? 'Checklist de materia.' : 'Documentos fuente pendientes.',
      severity: 'urgent',
      targetRoute: `/subjects/${subject.id}`,
      targetContext: { type: 'subject', id: subject.id },
    };
  }

  if (delivered.length > 0) {
    return {
      title: 'Revisar entregables entregados',
      description: `${delivered.length} items esperan validacion.`,
      actionLabel: 'Validar entregables',
      responsibleRole: 'FABRICA',
      impact: 'Permite aprobar o devolver con observaciones.',
      severity: 'attention',
      targetRoute: `/subjects/${subject.id}`,
      targetContext: { type: 'subject', id: subject.id },
    };
  }

  return {
    title: subject.status === 'APROBADO' ? 'Materia aprobada' : 'Validar si esta lista para aprobacion',
    description: subject.status === 'APROBADO' ? 'No hay acciones criticas pendientes.' : 'El checklist no tiene pendientes criticos visibles.',
    actionLabel: subject.status === 'APROBADO' ? 'Ver trazabilidad' : 'Revisar materia',
    responsibleRole: 'FABRICA',
    impact: subject.status === 'APROBADO' ? 'Aporta al avance de entrega del proyecto.' : 'Confirma si puede avanzar a revision o aprobacion.',
    severity: subject.status === 'APROBADO' ? 'completed' : 'info',
    targetRoute: `/subjects/${subject.id}`,
    targetContext: { type: 'subject', id: subject.id },
  };
}

export function getChecklistItemInsight(item: ChecklistItem, project: VirtualizationProject, subject: SubjectVirtualization): OperationalInsight {
  const base = {
    id: `checklist-${item.id}`,
    entityType: 'checklist' as const,
    entityId: item.id,
    projectId: project.id,
    subjectId: subject.id,
    responsibleRole: item.ownerRole,
    targetRoute: `/subjects/${subject.id}`,
    targetContext: { type: 'checklist' as const, id: item.id },
  };

  const byStatus: Record<ChecklistStatus, Omit<OperationalInsight, keyof typeof base>> = {
    NO_EXISTE: {
      title: 'Falta insumo o entregable',
      description: `${item.label} aun no existe en la materia.`,
      severity: 'blocking',
      nextAction: 'Crear o cargar el entregable faltante.',
      impact: 'Bloquea revision y cierre de la materia.',
      dependency: 'Insumo documental o produccion de Fabrica.',
    },
    PENDIENTE: {
      title: 'Tarea abierta',
      description: `${item.label} requiere trabajo operativo.`,
      severity: 'urgent',
      nextAction: 'Completar o mover a produccion.',
      impact: 'Retrasa avance de materia si no se atiende.',
      dependency: 'Responsable del checklist.',
    },
    EN_PRODUCCION: {
      title: 'Trabajo activo',
      description: `${item.label} esta en produccion.`,
      severity: 'attention',
      nextAction: 'Finalizar y entregar para revision.',
      impact: 'Habilita revision cuando se marque como entregado.',
      dependency: 'Equipo de produccion.',
    },
    ENTREGADO: {
      title: 'Espera revision',
      description: `${item.label} fue entregado y espera validacion.`,
      severity: 'attention',
      nextAction: 'Revisar y aprobar o devolver con observacion.',
      impact: 'Define si el entregable queda listo para cierre.',
      dependency: 'Revisor academico u operativo.',
    },
    APROBADO: {
      title: 'Entregable completado',
      description: `${item.label} esta aprobado.`,
      severity: 'completed',
      nextAction: 'Mantener trazabilidad.',
      impact: 'Aporta al cierre de la materia.',
    },
  };

  return { ...base, ...byStatus[item.status] };
}

export function getNotificationOperationalState(notification: Notification, projects: VirtualizationProject[] = []): NotificationOperationalState {
  const project = notification.projectId ? projects.find((item) => item.id === notification.projectId) : undefined;
  if (project && ['DELIVERED_TO_LMS', 'CLOSED'].includes(project.status)) return 'resuelta';
  if (notification.type === 'ACTION' || notification.type === 'CRITICAL') return notification.read ? 'en_proceso' : 'nueva';
  return notification.read ? 'vista' : 'nueva';
}

export function getNotificationRequiredAction(notification: Notification, projects: VirtualizationProject[] = []): NotificationRequiredAction {
  const project = notification.projectId ? projects.find((item) => item.id === notification.projectId) : undefined;
  const affectedEntity = project?.program ?? notification.projectId ?? 'Operacion general';
  const message = `${notification.title} ${notification.message}`.toLowerCase();

  if (message.includes('observ')) {
    return {
      action: 'Revisar y resolver observaciones abiertas.',
      impact: 'Mientras siga abierto, puede bloquear revision o entrega.',
      affectedEntity,
    };
  }
  if (message.includes('link') || message.includes('document')) {
    return {
      action: 'Validar documentos fuente disponibles.',
      impact: 'Documentos incompletos generan reproceso en produccion.',
      affectedEntity,
    };
  }
  if (message.includes('vence') || message.includes('vencer') || notification.type === 'DEADLINE' || notification.type === 'CRITICAL') {
    return {
      action: 'Priorizar tareas que bloquean la entrega.',
      impact: 'Puede incumplirse la fecha operacional prevista.',
      affectedEntity,
    };
  }
  if (project?.status === 'READY_FOR_PRODUCTION') {
    return {
      action: 'Iniciar produccion y revisar checklist por materia.',
      impact: 'Habilita avance de Fabrica sobre entregables.',
      affectedEntity,
    };
  }

  return {
    action: 'Revisar el contexto y definir seguimiento.',
    impact: 'Evita que novedades operativas queden sin responsable.',
    affectedEntity,
  };
}

export function getAuditOperationalImpact(log: AuditLog): AuditOperationalImpact {
  const action = log.action.toLowerCase();
  const entity = log.entityType || 'Entidad';

  if (action.includes('estado')) {
    return {
      change: `${log.previousValue} -> ${log.newValue}`,
      importance: 'El cambio de estado modifica la etapa operacional del flujo.',
      consequence: inferStatusConsequence(log.newValue),
    };
  }

  if (entity === 'Link') {
    return {
      change: `${log.action}: ${log.entityName}`,
      importance: 'Los documentos fuente habilitan o corrigen produccion academica.',
      consequence: 'Fabrica debe revisar si el nuevo enlace cambia entregables o checklist.',
    };
  }

  if (entity === 'Checklist') {
    return {
      change: `${log.previousValue} -> ${log.newValue}`,
      importance: 'El checklist define avance real de la materia.',
      consequence: 'Puede habilitar revision, aprobacion o identificar trabajo pendiente.',
    };
  }

  if (action.includes('observ')) {
    return {
      change: `${log.action}: ${log.entityName}`,
      importance: 'Una observacion puede bloquear revision hasta resolverse.',
      consequence: 'Requiere seguimiento del responsable indicado.',
    };
  }

  return {
    change: `${log.previousValue} -> ${log.newValue}`,
    importance: 'Este registro deja evidencia institucional del cambio.',
    consequence: 'Mantiene trazabilidad para auditoria y seguimiento.',
  };
}

export function getActivityOperationalImpact(event: ActivityEvent): ActivityOperationalImpact {
  if (event.eventType === 'STATUS') {
    return { label: 'Cambio de estado', impact: 'Revisa si este movimiento habilita la siguiente etapa.', severity: 'attention' };
  }
  if (event.eventType === 'OBSERVATION') {
    return { label: 'Requiere seguimiento', impact: 'Puede representar un bloqueo operativo hasta cerrarse.', severity: 'urgent' };
  }
  if (event.eventType === 'LINK' || event.eventType === 'DOCUMENT') {
    return { label: 'Documento disponible', impact: 'Puede habilitar produccion o ajuste de contenidos.', severity: 'info' };
  }
  if (event.eventType === 'APPROVAL') {
    return { label: 'Desbloqueo posible', impact: 'Puede permitir avanzar a la siguiente etapa del flujo.', severity: 'completed' };
  }
  return { label: 'Actividad registrada', impact: 'Informa un movimiento del flujo.', severity: 'info' };
}

function inferStatusConsequence(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('produccion') || normalized.includes('fabrica')) return 'Habilita trabajo operativo de Fabrica.';
  if (normalized.includes('revision')) return 'Habilita validacion de entregables.';
  if (normalized.includes('observ')) return 'Bloquea avance hasta resolver feedback.';
  if (normalized.includes('lms')) return 'Marca entrega institucional y prepara cierre.';
  if (normalized.includes('cerrado')) return 'Cierra el flujo y conserva trazabilidad.';
  return 'Debe revisarse el siguiente paso correspondiente.';
}

export function getProjectOperationalInsight(
  project: VirtualizationProject,
  observations: OperationalObservation[] = [],
): OperationalInsight {
  const openObservations = observations.filter((observation) => observation.projectId === project.id && isOpenObservation(observation)).length;
  const pendingChecklist = (project.subjects ?? []).flatMap((subject) => subject.checklist).filter((item) => ['NO_EXISTE', 'PENDIENTE'].includes(item.status)).length;
  const nextAction = openObservations > 0 ? 'Resolver observaciones abiertas.' : pendingChecklist > 0 ? 'Completar checklist pendiente.' : 'Mantener seguimiento del estado.';
  const severity: OperationalSeverity = openObservations > 0 ? 'blocking' : pendingChecklist > 0 ? 'urgent' : project.status === 'CLOSED' ? 'completed' : 'info';

  return {
    id: `project-insight-${project.id}`,
    entityType: 'project',
    entityId: project.id,
    title: `Estado operacional: ${projectStatusLabels[project.status]}`,
    description: `${project.program} tiene ${pendingChecklist} entregables pendientes y ${openObservations} observaciones abiertas.`,
    severity,
    nextAction,
    responsibleRole: severity === 'blocking' && project.status === 'FEEDBACK_PENDING' ? 'PRODUCT' : 'FABRICA',
    impact: 'Define si Fabrica puede avanzar hacia revision, entrega LMS o cierre.',
    dependency: openObservations > 0 ? 'Correccion de observaciones.' : pendingChecklist > 0 ? 'Checklist de materias.' : undefined,
    projectId: project.id,
    targetRoute: `/projects/${project.id}`,
    targetContext: { type: 'project', id: project.id },
  };
}

export function getSubjectOperationalInsight(
  project: VirtualizationProject,
  subject: SubjectVirtualization,
  observations: OperationalObservation[] = [],
): OperationalInsight {
  const nextStep = getSubjectNextAction(project, subject, observations, project.links);
  return {
    id: `subject-insight-${subject.id}`,
    entityType: 'subject',
    entityId: subject.id,
    title: `Materia: ${checklistStatusLabels[subject.status]}`,
    description: `${subject.name} tiene ${subject.checklist.length} entregables y ${subject.progress}% de avance.`,
    severity: nextStep.severity ?? 'info',
    nextAction: nextStep.title,
    responsibleRole: nextStep.responsibleRole,
    impact: nextStep.impact,
    dependency: nextStep.dependency,
    projectId: project.id,
    subjectId: subject.id,
    targetRoute: `/subjects/${subject.id}`,
    targetContext: { type: 'subject', id: subject.id },
  };
}
