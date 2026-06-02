import { OFFICIAL_SCHOOL_NAMES } from '../constants/officialSchools';
import type { ActivityEvent, AuditLog, ChecklistItem, ChecklistStatus, Notification, OperationalObservation, PipelineStageSummary, SubjectVirtualization, TopicChecklist, VirtualizationProject } from '../types/domain';

const checklistLabels = [
  'Presentacion de la asignatura',
  'Foro de presentacion',
  'Resultados de aprendizaje y competencias',
  'Evaluacion diagnostica de entrada',
  'Syllabus',
  'Lecturas y bibliografia',
  'Evaluaciones',
  'ACA',
  'Foro taller',
  'Taller RAE',
  'Evaluacion diagnostica de salida',
  'Seminario Aleman',
  'Observaciones generales',
  'Contenido de la asignatura',
];

const topicChecklistLabels = [
  'Material descargable',
  'Podcast',
  'Videos',
  'Infografias interactivas',
];

const buildChecklist = (seed: number): ChecklistItem[] => {
  const statuses: ChecklistStatus[] = ['APROBADO', 'ENTREGADO', 'EN_PRODUCCION', 'PENDIENTE', 'NO_EXISTE'];
  return checklistLabels.map((label, index) => ({
    id: `chk-${seed}-${index + 1}`,
    label,
    status: statuses[(index + seed) % statuses.length],
    ownerRole: index % 3 === 0 ? 'PRODUCT' : 'FABRICA',
    updatedAt: `2026-05-${String(Math.max(1, 10 - (index % 6))).padStart(2, '0')}`,
    observations: index % 4 === 0 ? 'Requiere validacion del enfoque academico antes de cierre.' : 'Avance registrado sin novedad critica.',
  }));
};

const buildTopicChecklist = (seed: number, topicName: string, topicOrder: number): TopicChecklist => ({
  topicName,
  topicOrder,
  items: topicChecklistLabels.map((label, index) => ({
    id: `chk-topic-${seed}-${topicOrder}-${index}`,
    label,
    status: 'PENDIENTE' as ChecklistStatus,
    ownerRole: 'FABRICA' as const,
    updatedAt: `2026-05-${String(Math.max(1, 10 - (index % 6))).padStart(2, '0')}`,
    observations: '',
  })),
});

const subjectsFor = (projectId: string, semester: number, names: string[]): SubjectVirtualization[] =>
  names.map((name, index) => {
    const checklist = buildChecklist(semester + index);
    const approved = checklist.filter((item) => item.status === 'APROBADO').length;
    const contentTopics = ['Contexto disciplinar', 'Marco conceptual', 'Actividades aplicadas', 'Evaluacion y cierre'];
    const topicChecklists: TopicChecklist[] = contentTopics.map((topic, tIdx) =>
      buildTopicChecklist(semester + index, topic, tIdx + 1),
    );
    return {
      id: `${projectId}-s${semester}-${index + 1}`,
      projectId,
      semesterNumber: semester,
      name,
      status: 'PENDING',
      progress: Math.round((approved / checklist.length) * 100 + index * 8),
      checklist,
      generalObservations: 'Materia priorizada para virtualizacion con seguimiento semanal de fabrica.',
      contentTopics,
      topicChecklists,
    };
  });

export const projects: VirtualizationProject[] = [
  {
    id: 'vp-001',
    school: OFFICIAL_SCHOOL_NAMES[4],
    program: 'Ingenieria de Sistemas',
    modality: 'Virtual',
    requestType: 'Virtualizacion completa',
    priority: 'CRITICAL',
    status: 'IN_PRODUCTION',
    progress: 68,
    createdAt: '2026-04-15',
    expectedDeliveryDate: '2026-05-20',
    subjectMatterExpertType: 'INTERNAL',
    subjectMatterExpertStatus: 'READY',
    productOwner: 'Laura Mendoza',
    factoryOwner: 'Carlos Rojas',
    observations: 'Producto actualizo syllabus y matriz curricular. Fabrica avanza en tercer semestre.',
    semesters: [
      { id: 'vp-001-sem-1', semesterNumber: 1, status: 'PENDING', curriculumStatus: 'APROBADO', factoryStatus: 'ENTREGADO', factoryExpectedDate: '2026-05-16', continuationDate: '2026-05-22', observations: 'Semestre listo para revision academica.' },
      { id: 'vp-001-sem-2', semesterNumber: 2, status: 'PENDING', curriculumStatus: 'ENTREGADO', factoryStatus: 'EN_PRODUCCION', factoryExpectedDate: '2026-05-24', continuationDate: '2026-05-29', observations: 'Faltan evaluaciones y lecturas.' },
      { id: 'vp-001-sem-3', semesterNumber: 3, status: 'PENDING', curriculumStatus: 'PENDIENTE', factoryStatus: 'PENDIENTE', factoryExpectedDate: '2026-06-03', continuationDate: '2026-06-07', observations: 'Pendiente confirmacion de syllabus.' },
    ],
    subjects: [
      ...subjectsFor('vp-001', 1, ['Pensamiento Algoritmico', 'Matematicas Discretas']),
      ...subjectsFor('vp-001', 2, ['Bases de Datos', 'Arquitectura de Software']),
      ...subjectsFor('vp-001', 3, ['Ingenieria de Requisitos']),
    ],
    links: [
      { id: 'lnk-001', title: 'Syllabus consolidado semestres 1-3', url: 'https://drive.google.com/', type: 'SYLLABUS', uploadedBy: 'PRODUCT', createdAt: '2026-05-08' },
      { id: 'lnk-002', title: 'Documento maestro del programa', url: 'https://docs.google.com/', type: 'CURRICULUM', uploadedBy: 'PRODUCT', createdAt: '2026-05-09' },
      { id: 'lnk-003', title: 'Repositorio de produccion Fabrica', url: 'https://drive.google.com/', type: 'DRIVE_FOLDER', uploadedBy: 'FABRICA', createdAt: '2026-05-10' },
    ],
  },
  {
    id: 'vp-002',
    school: OFFICIAL_SCHOOL_NAMES[5],
    program: 'Administracion de Empresas',
    modality: 'Distancia',
    requestType: 'Actualizacion curricular',
    priority: 'HIGH',
    status: 'READY_FOR_PRODUCTION',
    progress: 34,
    createdAt: '2026-04-28',
    expectedDeliveryDate: '2026-05-28',
    subjectMatterExpertType: 'INTERNAL',
    subjectMatterExpertStatus: 'READY',
    productOwner: 'Miguel Arias',
    factoryOwner: 'Paula Torres',
    observations: 'Solicitud lista para que fabrica inicie revision de documentos fuente.',
    semesters: [
      { id: 'vp-002-sem-4', semesterNumber: 4, status: 'PENDING', curriculumStatus: 'APROBADO', factoryStatus: 'PENDIENTE', factoryExpectedDate: '2026-05-28', continuationDate: '2026-06-02', observations: 'Priorizado por calendario academico.' },
      { id: 'vp-002-sem-5', semesterNumber: 5, status: 'PENDING', curriculumStatus: 'ENTREGADO', factoryStatus: 'PENDIENTE', factoryExpectedDate: '2026-06-05', continuationDate: '2026-06-12', observations: 'Revisar bibliografia base.' },
    ],
    subjects: [
      ...subjectsFor('vp-002', 4, ['Gestion Financiera', 'Mercadeo Estrategico']),
      ...subjectsFor('vp-002', 5, ['Analitica Empresarial']),
    ],
    links: [
      { id: 'lnk-004', title: 'Syllabus Gestion Financiera', url: 'https://drive.google.com/', type: 'SYLLABUS', uploadedBy: 'PRODUCT', createdAt: '2026-05-10' },
      { id: 'lnk-005', title: 'Brief de actualizacion curricular', url: 'https://docs.google.com/', type: 'BRIEF', uploadedBy: 'PRODUCT', createdAt: '2026-05-10' },
    ],
  },
  {
    id: 'vp-003',
    school: OFFICIAL_SCHOOL_NAMES[0],
    program: 'Diseno Grafico',
    modality: 'Virtual',
    requestType: 'Nueva oferta virtual',
    priority: 'MEDIUM',
    status: 'FEEDBACK_PENDING',
    progress: 82,
    createdAt: '2026-03-30',
    expectedDeliveryDate: '2026-05-10',
    subjectMatterExpertType: 'INTERNAL',
    subjectMatterExpertStatus: 'READY',
    productOwner: 'Sofia Carvajal',
    factoryOwner: 'Daniel Mejia',
    observations: 'Fabrica devolvio observaciones por inconsistencias entre syllabus y contenidos.',
    semesters: [
      { id: 'vp-003-sem-1', semesterNumber: 1, status: 'PENDING', curriculumStatus: 'ENTREGADO', factoryStatus: 'EN_PRODUCCION', factoryExpectedDate: '2026-05-10', continuationDate: '2026-05-15', observations: 'Atrasado por validacion de recursos visuales.' },
      { id: 'vp-003-sem-2', semesterNumber: 2, status: 'PENDING', curriculumStatus: 'APROBADO', factoryStatus: 'ENTREGADO', factoryExpectedDate: '2026-05-12', continuationDate: '2026-05-18', observations: 'Entregables principales cerrados.' },
    ],
    subjects: [
      ...subjectsFor('vp-003', 1, ['Fundamentos de Diseno', 'Narrativas Visuales']),
      ...subjectsFor('vp-003', 2, ['Tipografia Digital']),
    ],
    links: [
      { id: 'lnk-006', title: 'Syllabus Fundamentos de Diseno', url: 'https://drive.google.com/', type: 'SYLLABUS', uploadedBy: 'PRODUCT', createdAt: '2026-05-05' },
      { id: 'lnk-007', title: 'Carpeta de referentes visuales', url: 'https://drive.google.com/', type: 'REFERENCE', uploadedBy: 'PRODUCT', createdAt: '2026-05-06' },
    ],
  },
];

export const notifications: Notification[] = [
  { id: 'not-001', title: 'Product actualizo links de syllabus', message: 'Ingenieria de Sistemas tiene nuevos documentos fuente disponibles.', roleTarget: 'FABRICA', type: 'ACTION', createdAt: '2026-05-11T09:30:00', read: false, projectId: 'vp-001' },
  { id: 'not-002', title: 'Nueva solicitud lista para fabrica', message: 'Administracion de Empresas paso a listo para produccion.', roleTarget: 'FABRICA', type: 'INFO', createdAt: '2026-05-10T15:12:00', read: false, projectId: 'vp-002' },
  { id: 'not-003', title: 'Materia pendiente por produccion', message: 'Ingenieria de Requisitos requiere inicio de checklist.', roleTarget: 'PRODUCT', type: 'ACTION', createdAt: '2026-05-10T11:00:00', read: true, projectId: 'vp-001' },
  { id: 'not-004', title: 'Entrega proxima a vencer', message: 'Diseno Grafico esta vencido y requiere respuesta de Product.', roleTarget: 'PRODUCT', type: 'CRITICAL', createdAt: '2026-05-09T16:45:00', read: false, projectId: 'vp-003' },
  { id: 'not-005', title: 'Entrega de fabrica en 72 horas', message: 'Bases de Datos requiere validacion de evaluaciones antes del viernes.', roleTarget: 'FABRICA', type: 'DEADLINE', createdAt: '2026-05-11T17:20:00', read: false, projectId: 'vp-001' },
];

export const auditLogs: AuditLog[] = [
  { id: 'aud-001', entityType: 'Proyecto', entityName: 'Ingenieria de Sistemas', action: 'Cambio de estado', userName: 'Laura Mendoza', role: 'PRODUCT', previousValue: 'Pendiente syllabus', newValue: 'En produccion', createdAt: '2026-05-11T10:10:00' },
  { id: 'aud-002', entityType: 'Link', entityName: 'Syllabus consolidado semestres 1-3', action: 'Actualizacion de enlace', userName: 'Laura Mendoza', role: 'PRODUCT', previousValue: 'Sin enlace', newValue: 'Drive syllabus actualizado', createdAt: '2026-05-10T14:20:00' },
  { id: 'aud-003', entityType: 'Materia', entityName: 'Fundamentos de Diseno', action: 'Observacion registrada', userName: 'Daniel Mejia', role: 'FABRICA', previousValue: 'Sin observaciones', newValue: 'Inconsistencia en contenidos', createdAt: '2026-05-09T08:42:00' },
  { id: 'aud-004', entityType: 'Checklist', entityName: 'Syllabus Gestion Financiera', action: 'Entrega parcial', userName: 'Paula Torres', role: 'FABRICA', previousValue: 'Pendiente', newValue: 'En produccion', createdAt: '2026-05-08T17:30:00' },
];

export const pipelineSummary: PipelineStageSummary[] = [
  { status: 'PENDING_SYLLABUS', count: 1, progress: 12, critical: true },
  { status: 'READY_FOR_PRODUCTION', count: 1, progress: 28, critical: false },
  { status: 'IN_PRODUCTION', count: 1, progress: 64, critical: false },
  { status: 'IN_REVIEW', count: 2, progress: 76, critical: false },
  { status: 'DELIVERED_TO_LMS', count: 0, progress: 88, critical: false },
  { status: 'FEEDBACK_PENDING', count: 1, progress: 55, critical: true },
  { status: 'CLOSED', count: 0, progress: 100, critical: false },
];

export const activityEvents: ActivityEvent[] = [
  { id: 'act-001', userName: 'Laura Mendoza', role: 'PRODUCT', action: 'subio link de syllabus', entityType: 'Link', entityName: 'Ingenieria de Sistemas', eventType: 'LINK', projectId: 'vp-001', createdAt: '2026-05-12T08:35:00' },
  { id: 'act-002', userName: 'Carlos Rojas', role: 'FABRICA', action: 'cambio a En produccion', entityType: 'Materia', entityName: 'Matematicas Discretas', eventType: 'STATUS', projectId: 'vp-001', subjectId: 'vp-001-s1-2', createdAt: '2026-05-12T07:50:00' },
  { id: 'act-003', userName: 'Paula Torres', role: 'FABRICA', action: 'agrego observacion', entityType: 'Materia', entityName: 'Gestion Financiera', eventType: 'OBSERVATION', projectId: 'vp-002', subjectId: 'vp-002-s4-1', createdAt: '2026-05-11T16:45:00' },
  { id: 'act-004', userName: 'Product', role: 'PRODUCT', action: 'marco como aprobado', entityType: 'Semestre', entityName: 'Semestre 1', eventType: 'APPROVAL', projectId: 'vp-001', createdAt: '2026-05-11T14:10:00' },
  { id: 'act-005', userName: 'Fabrica', role: 'FABRICA', action: 'abrio documento maestro', entityType: 'Documento', entityName: 'Documento maestro del programa', eventType: 'DOCUMENT', projectId: 'vp-001', createdAt: '2026-05-11T10:15:00' },
  { id: 'act-006', userName: 'Daniel Mejia', role: 'FABRICA', action: 'devolvio observaciones', entityType: 'Proyecto', entityName: 'Diseno Grafico', eventType: 'OBSERVATION', projectId: 'vp-003', createdAt: '2026-05-10T18:05:00' },
];

export const projectObservations: OperationalObservation[] = [
  { id: 'obs-001', projectId: 'vp-001', author: 'Carlos Rojas', role: 'FABRICA', text: 'Faltan recursos de evaluacion para Matematicas Discretas.', status: 'ABIERTA', relatedEntity: 'Matematicas Discretas', createdAt: '2026-05-12T07:40:00' },
  { id: 'obs-002', projectId: 'vp-001', author: 'Laura Mendoza', role: 'PRODUCT', text: 'Syllabus consolidado actualizado con ajustes de competencias.', status: 'RESUELTA', relatedEntity: 'Syllabus', createdAt: '2026-05-11T09:20:00' },
  { id: 'obs-003', projectId: 'vp-002', subjectId: 'vp-002-s4-1', author: 'Paula Torres', role: 'FABRICA', text: 'Gestion Financiera requiere bibliografia complementaria.', status: 'EN_CORRECCION', relatedEntity: 'Gestion Financiera', createdAt: '2026-05-10T15:30:00' },
  { id: 'obs-004', projectId: 'vp-003', subjectId: 'vp-003-s1-1', author: 'Daniel Mejia', role: 'FABRICA', text: 'Inconsistencia entre resultados de aprendizaje y contenido visual.', status: 'ABIERTA', relatedEntity: 'Fundamentos de Diseno', createdAt: '2026-05-09T08:42:00' },
];
