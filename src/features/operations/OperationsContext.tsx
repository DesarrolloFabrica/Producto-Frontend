import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type {
  ActivityEvent,
  AuditLog,
  ChecklistStatus,
  LinkResource,
  Notification,
  OperationalObservation,
  OperationalComment,
  CommentEntityType,
  Priority,
  ProjectStatus,
  Role,
  VirtualizationProject,
} from '../../types/domain';
import { projects as initialProjects, auditLogs as initialAuditLogs, activityEvents as initialActivityEvents, notifications as initialNotifications, projectObservations as initialProjectObservations } from '../../data/mockData';
import { projectStatusLabels } from '../../utils/status';
import { calculateProjectProgress, calculateSubjectProgress, deriveSemesterStatus, deriveSubjectStatus, getProjectBlockingSignals, isBlockingObservationStatus } from './progress';

interface OperationsState {
  projects: VirtualizationProject[];
  auditLogs: AuditLog[];
  activityEvents: ActivityEvent[];
  notifications: Notification[];
  projectObservations: OperationalObservation[];
  comments: OperationalComment[];
  recentlyUpdated: string[];
}

type OperationsAction =
  | { type: 'CREATE_PROJECT'; payload: VirtualizationProject }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<VirtualizationProject> } }
  | { type: 'UPDATE_PROJECT_STATUS'; payload: { id: string; newStatus: ProjectStatus; oldStatus: ProjectStatus; project: VirtualizationProject } }
  | { type: 'ADD_PROJECT_LINK'; payload: { projectId: string; link: LinkResource; project: VirtualizationProject } }
  | { type: 'ADD_OBSERVATION'; payload: { projectId: string; observation: OperationalObservation; project: VirtualizationProject } }
  | { type: 'UPDATE_CHECKLIST_ITEM'; payload: { projectId: string; subjectId: string; checklistItemId: string; newStatus: ChecklistStatus; project: VirtualizationProject } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { notificationId: string } }
  | { type: 'ADD_AUDIT_LOG'; payload: AuditLog }
  | { type: 'ADD_ACTIVITY_EVENT'; payload: ActivityEvent }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'ADD_COMMENT'; payload: OperationalComment }
  | { type: 'RESOLVE_COMMENT'; payload: { commentId: string } }
  | { type: 'MARK_RECENTLY_UPDATED'; payload: { entityId: string } }
  | { type: 'CLEAR_RECENTLY_UPDATED'; payload: { entityId: string } }
  | { type: 'ADD_SEMESTER_TO_PROJECT'; payload: { projectId: string; semester: VirtualizationProject['semesters'][0]; subjects: VirtualizationProject['subjects'] } }
  | { type: 'ADD_SUBJECT_TO_SEMESTER'; payload: { projectId: string; subject: VirtualizationProject['subjects'][0] } }
  | { type: 'ADD_TOPIC_TO_SUBJECT'; payload: { projectId: string; subjectId: string; topicName: string; checklist: VirtualizationProject['subjects'][0]['checklist']; topicChecklistItems: VirtualizationProject['subjects'][0]['checklist'] } }
  | { type: 'RESOLVE_OBSERVATION'; payload: { projectId: string; observationId: string; observation: OperationalObservation } }
  | { type: 'MARK_OBSERVATION_CORRECTION_APPLIED'; payload: { projectId: string; observationId: string; observation: OperationalObservation } }
  | { type: 'UPDATE_TOPIC_CHECKLIST_ITEM'; payload: { projectId: string; subjectId: string; topicName: string; checklistItemId: string; newStatus: ChecklistStatus } }
  | { type: 'MARK_SUBJECT_DELIVERED'; payload: { projectId: string; subjectId: string } };

const initialState: OperationsState = {
  projects: initialProjects,
  auditLogs: initialAuditLogs,
  activityEvents: initialActivityEvents,
  notifications: initialNotifications,
  projectObservations: initialProjectObservations,
  comments: [],
  recentlyUpdated: [],
};

function operationsReducer(state: OperationsState, action: OperationsAction): OperationsState {
  const recalcProject = (project: VirtualizationProject, observations = state.projectObservations): VirtualizationProject => {
    const subjects = project.subjects.map((subject) => {
      const subjectObs = observations.filter((o) => o.projectId === project.id && o.subjectId === subject.id && isBlockingObservationStatus(o.status));
      const progress = calculateSubjectProgress(subject);
      const status = deriveSubjectStatus({ subject: { ...subject, progress }, observations: subjectObs });
      return { ...subject, progress, status };
    });

    const semesters = project.semesters.map((semester) => {
      const semesterSubjects = subjects.filter((s) => s.semesterNumber === semester.semesterNumber);
      const status = deriveSemesterStatus({ semester, subjects: semesterSubjects });
      return { ...semester, status };
    });

    const updated: VirtualizationProject = {
      ...project,
      subjects,
      semesters,
    };

    const projectProgress = calculateProjectProgress(updated);
    return { ...updated, progress: projectProgress };
  };

  const recalcProjects = (projects: VirtualizationProject[], observations = state.projectObservations) =>
    projects.map((p) => recalcProject(p, observations));

  switch (action.type) {
    case 'CREATE_PROJECT':
      return { ...state, projects: [recalcProject(action.payload), ...state.projects.map((p) => recalcProject(p))] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.payload.id ? recalcProject({ ...p, ...action.payload.updates }) : p)),
      };
    case 'UPDATE_PROJECT_STATUS':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.payload.id ? { ...p, status: action.payload.newStatus } : p)),
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Proyecto',
            entityName: action.payload.project.program,
            action: 'Cambio de estado',
            userName: 'Usuario activo',
            role: 'PRODUCT',
            previousValue: projectStatusLabels[action.payload.oldStatus],
            newValue: projectStatusLabels[action.payload.newStatus],
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
        activityEvents: [
          {
            id: `act-${Date.now()}`,
            userName: 'Usuario activo',
            role: 'PRODUCT',
            action: 'cambio estado a',
            entityType: 'Proyecto',
            entityName: action.payload.project.program,
            eventType: 'STATUS',
            projectId: action.payload.id,
            createdAt: new Date().toISOString(),
          },
          ...state.activityEvents,
        ],
      };
    case 'ADD_PROJECT_LINK':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.payload.projectId ? { ...p, links: [...p.links, action.payload.link] } : p)),
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Link',
            entityName: action.payload.link.title,
            action: 'Link agregado',
            userName: 'Usuario activo',
            role: 'PRODUCT',
            previousValue: 'Sin enlace',
            newValue: action.payload.link.url,
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
        activityEvents: [
          {
            id: `act-${Date.now()}`,
            userName: 'Usuario activo',
            role: 'PRODUCT',
            action: 'agrego link',
            entityType: 'Link',
            entityName: action.payload.link.title,
            eventType: 'LINK',
            projectId: action.payload.projectId,
            createdAt: new Date().toISOString(),
          },
          ...state.activityEvents,
        ],
        notifications: [
          {
            id: `not-${Date.now()}`,
            title: 'Nuevo link agregado',
            message: `${action.payload.project.program} tiene un nuevo documento fuente disponible.`,
            roleTarget: 'FABRICA',
            type: 'ACTION',
            createdAt: new Date().toISOString(),
            read: false,
            projectId: action.payload.projectId,
          },
          ...state.notifications,
        ],
      };
    case 'ADD_OBSERVATION':
      {
        const nextObservations = [action.payload.observation, ...state.projectObservations];
        const projects = state.projects.map((project) => {
          if (project.id !== action.payload.projectId) return project;
          if (action.payload.observation.role !== 'PRODUCT') return recalcProject(project, nextObservations);
          // Product observations require factory feedback loop.
          const nextProject = project.status === 'CLOSED' ? project : { ...project, status: 'FEEDBACK_PENDING' as const };
          return recalcProject(nextProject, nextObservations);
        });

        return {
          ...state,
          projects,
          projectObservations: nextObservations,
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Observacion',
            entityName: action.payload.observation.relatedEntity,
            action: 'Observacion registrada',
            userName: action.payload.observation.author,
            role: action.payload.observation.role,
            previousValue: 'Sin observaciones',
            newValue: action.payload.observation.text.substring(0, 50),
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
        activityEvents: [
          {
            id: `act-${Date.now()}`,
            userName: action.payload.observation.author,
            role: action.payload.observation.role,
            action: 'agrego observacion',
            entityType: 'Observacion',
            entityName: action.payload.observation.relatedEntity,
            eventType: 'OBSERVATION',
            projectId: action.payload.projectId,
            createdAt: new Date().toISOString(),
          },
          ...state.activityEvents,
        ],
        notifications: [
          {
            id: `not-${Date.now()}`,
            title: 'Product dejo una observacion',
            message: `Product dejo una observacion para Fabrica en ${action.payload.observation.relatedEntity}.`,
            roleTarget: 'FABRICA',
            type: 'ACTION',
            createdAt: new Date().toISOString(),
            read: false,
            projectId: action.payload.projectId,
          },
          ...state.notifications,
        ],
        };
      }
    case 'UPDATE_CHECKLIST_ITEM':
      {
        const updatedProjects = state.projects.map((project) => {
          if (project.id !== action.payload.projectId) return project;
          const updatedProject: VirtualizationProject = {
            ...project,
            subjects: project.subjects.map((subject) => {
              if (subject.id !== action.payload.subjectId) return subject;
              return {
                ...subject,
                checklist: subject.checklist.map((item) =>
                  item.id === action.payload.checklistItemId
                    ? { ...item, status: action.payload.newStatus, updatedAt: new Date().toISOString() }
                    : item,
                ),
              };
            }),
          };

          // If Product rejects something, the project must move to feedback pending.
          const shouldFeedbackPending = updatedProject.subjects.some((s) => s.checklist.some((i) => i.status === 'RECHAZADO'));
          const nextProject = shouldFeedbackPending && updatedProject.status !== 'FEEDBACK_PENDING'
            ? { ...updatedProject, status: 'FEEDBACK_PENDING' as const }
            : updatedProject;
          return recalcProject(nextProject);
        });

        return {
          ...state,
          projects: updatedProjects,
          auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Checklist',
            entityName: action.payload.projectId,
            action: 'Checklist actualizado',
            userName: 'Usuario activo',
            role: 'FABRICA',
            previousValue: 'Estado anterior',
            newValue: action.payload.newStatus,
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
          ],
          activityEvents: [
          {
            id: `act-${Date.now()}`,
            userName: 'Usuario activo',
            role: 'FABRICA',
            action: 'actualizo checklist',
            entityType: 'Checklist',
            entityName: action.payload.projectId,
            eventType: 'STATUS',
            projectId: action.payload.projectId,
            subjectId: action.payload.subjectId,
            createdAt: new Date().toISOString(),
          },
          ...state.activityEvents,
          ],
        };
      }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.payload.notificationId ? { ...n, read: true } : n)),
      };
    case 'ADD_AUDIT_LOG':
      return { ...state, auditLogs: [action.payload, ...state.auditLogs] };
    case 'ADD_ACTIVITY_EVENT':
      return { ...state, activityEvents: [action.payload, ...state.activityEvents] };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [action.payload, ...state.comments],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Comentario',
            entityName: `${action.payload.entityType}:${action.payload.entityId}`,
            action: 'Comentario agregado',
            userName: action.payload.authorName,
            role: action.payload.authorRole,
            previousValue: 'Sin comentario',
            newValue: action.payload.message.substring(0, 50),
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
        activityEvents: [
          {
            id: `act-${Date.now()}`,
            userName: action.payload.authorName,
            role: action.payload.authorRole,
            action: 'agrego comentario',
            entityType: 'Comentario',
            entityName: `${action.payload.entityType}:${action.payload.entityId}`,
            eventType: 'OBSERVATION',
            projectId: action.payload.entityType === 'project' ? action.payload.entityId : undefined,
            createdAt: new Date().toISOString(),
          },
          ...state.activityEvents,
        ],
      };
    case 'RESOLVE_COMMENT':
      return {
        ...state,
        comments: state.comments.map((c) => (c.id === action.payload.commentId ? { ...c, resolved: true } : c)),
      };
    case 'MARK_RECENTLY_UPDATED':
      return {
        ...state,
        recentlyUpdated: [...new Set([action.payload.entityId, ...state.recentlyUpdated])],
      };
    case 'CLEAR_RECENTLY_UPDATED':
      return {
        ...state,
        recentlyUpdated: state.recentlyUpdated.filter((id) => id !== action.payload.entityId),
      };
    case 'ADD_SEMESTER_TO_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.id !== action.payload.projectId) return p;
          return recalcProject({
            ...p,
            semesters: [...p.semesters, action.payload.semester],
            subjects: [...p.subjects, ...action.payload.subjects],
          });
        }),
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Semestre',
            entityName: `Semestre ${action.payload.semester.semesterNumber}`,
            action: 'Semestre agregado',
            userName: 'Usuario activo',
            role: 'PRODUCT',
            previousValue: 'No existia',
            newValue: `Agregado con ${action.payload.subjects.length} asignatura(s)`,
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
      };
    case 'ADD_SUBJECT_TO_SEMESTER':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? recalcProject({ ...p, subjects: [...p.subjects, action.payload.subject] })
            : p,
        ),
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Materia',
            entityName: action.payload.subject.name,
            action: 'Asignatura agregada',
            userName: 'Usuario activo',
            role: 'PRODUCT',
            previousValue: 'No existia',
            newValue: 'Agregada',
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
      };
    case 'ADD_TOPIC_TO_SUBJECT':
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.id !== action.payload.projectId) return p;
          const updatedProject: VirtualizationProject = {
            ...p,
            subjects: p.subjects.map((s) => {
              if (s.id !== action.payload.subjectId) return s;
              const topicOrder = s.topicChecklists.length + 1;
              return {
                ...s,
                contentTopics: [...s.contentTopics, action.payload.topicName],
                checklist: [...s.checklist, ...action.payload.checklist],
                topicChecklists: [
                  ...s.topicChecklists,
                  {
                    topicName: action.payload.topicName,
                    topicOrder,
                    items: action.payload.topicChecklistItems,
                  },
                ],
              };
            }),
          };

          return recalcProject(updatedProject);
        }),
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Tema',
            entityName: action.payload.topicName,
            action: 'Tema agregado',
            userName: 'Usuario activo',
            role: 'PRODUCT',
            previousValue: 'No existia',
            newValue: 'Agregado',
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
      };
    case 'RESOLVE_OBSERVATION':
      {
        const nextObservations = state.projectObservations.map((o) =>
          o.id === action.payload.observationId ? { ...o, status: 'RESUELTA' as const } : o,
        );
        return {
          ...state,
          projects: recalcProjects(state.projects, nextObservations),
          projectObservations: nextObservations,
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Observacion',
            entityName: action.payload.observation.relatedEntity,
            action: 'Observacion resuelta',
            userName: 'Usuario activo',
            role: 'PRODUCT',
            previousValue: 'En correccion',
            newValue: 'Resuelta',
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
        notifications: [
          {
            id: `not-${Date.now()}`,
            title: 'Product valido observacion resuelta',
            message: `Product valido como resuelta una observacion en ${action.payload.observation.relatedEntity}.`,
            roleTarget: 'FABRICA',
            type: 'INFO',
            createdAt: new Date().toISOString(),
            read: false,
            projectId: action.payload.projectId,
          },
          ...state.notifications,
        ],
        };
      }
    case 'MARK_OBSERVATION_CORRECTION_APPLIED':
      {
        const nextObservations = state.projectObservations.map((o) =>
          o.id === action.payload.observationId ? { ...o, status: 'EN_CORRECCION' as const } : o,
        );
        return {
          ...state,
          projects: recalcProjects(state.projects, nextObservations),
          projectObservations: nextObservations,
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Observacion',
            entityName: action.payload.observation.relatedEntity,
            action: 'Correccion aplicada por Fabrica',
            userName: 'Usuario activo',
            role: 'FABRICA',
            previousValue: 'Abierta',
            newValue: 'En correccion',
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
        notifications: [
          {
            id: `not-${Date.now()}`,
            title: 'Fabrica aplico correccion',
            message: `Fabrica aplico correccion en ${action.payload.observation.relatedEntity}. Pendiente validacion de Product.`,
            roleTarget: 'PRODUCT',
            type: 'ACTION',
            createdAt: new Date().toISOString(),
            read: false,
            projectId: action.payload.projectId,
          },
          ...state.notifications,
        ],
        };
      }
    case 'MARK_SUBJECT_DELIVERED':
      return {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id !== action.payload.projectId) return project;
          const updatedProject: VirtualizationProject = {
            ...project,
            status: 'IN_REVIEW',
            subjects: project.subjects.map((subject) =>
              subject.id === action.payload.subjectId ? { ...subject, status: 'IN_REVIEW' } : subject,
            ),
          };
          return recalcProject(updatedProject);
        }),
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Materia',
            entityName: action.payload.subjectId,
            action: 'Asignatura entregada por Fabrica',
            userName: 'Usuario activo',
            role: 'FABRICA',
            previousValue: 'En produccion',
            newValue: 'En revision',
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
      };
    case 'UPDATE_TOPIC_CHECKLIST_ITEM':
      {
        const updatedProjects = state.projects.map((project) => {
          if (project.id !== action.payload.projectId) return project;
          const updatedProject: VirtualizationProject = {
            ...project,
            subjects: project.subjects.map((subject) => {
              if (subject.id !== action.payload.subjectId) return subject;
              return {
                ...subject,
                topicChecklists: subject.topicChecklists.map((tc) => {
                  if (tc.topicName !== action.payload.topicName) return tc;
                  return {
                    ...tc,
                    items: tc.items.map((item) =>
                      item.id === action.payload.checklistItemId
                        ? { ...item, status: action.payload.newStatus, updatedAt: new Date().toISOString() }
                        : item,
                    ),
                  };
                }),
              };
            }),
          };

          return recalcProject(updatedProject);
        });

        return {
          ...state,
          projects: updatedProjects,
          auditLogs: [
          {
            id: `aud-${Date.now()}`,
            entityType: 'Checklist tema',
            entityName: `${action.payload.topicName}`,
            action: 'Checklist de tema actualizado',
            userName: 'Usuario activo',
            role: 'FABRICA',
            previousValue: 'Estado anterior',
            newValue: action.payload.newStatus,
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
          ],
        };
      }
    default:
      return state;
  }
}

interface OperationsContextValue extends OperationsState {
  createProject: (project: VirtualizationProject) => void;
  updateProject: (id: string, updates: Partial<VirtualizationProject>) => void;
  updateProjectStatus: (id: string, newStatus: ProjectStatus) => void;
  addProjectLink: (projectId: string, link: LinkResource) => void;
  addObservation: (projectId: string, observation: OperationalObservation) => void;
  resolveObservation: (projectId: string, observationId: string, observation: OperationalObservation) => void;
  updateChecklistItem: (projectId: string, subjectId: string, checklistItemId: string, newStatus: ChecklistStatus) => void;
  markNotificationRead: (notificationId: string) => void;
  addComment: (comment: Omit<OperationalComment, 'id' | 'createdAt'>) => void;
  replyComment: (parentId: string, message: string, authorName: string, authorRole: Role) => void;
  resolveComment: (commentId: string) => void;
  markRecentlyUpdated: (entityId: string) => void;
  clearRecentlyUpdated: (entityId: string) => void;
  addSemesterToProject: (projectId: string, semester: VirtualizationProject['semesters'][0], subjects: VirtualizationProject['subjects']) => void;
  addSubjectToSemester: (projectId: string, subject: VirtualizationProject['subjects'][0]) => void;
  addTopicToSubject: (projectId: string, subjectId: string, topicName: string, checklist: VirtualizationProject['subjects'][0]['checklist'], topicChecklistItems: VirtualizationProject['subjects'][0]['checklist']) => void;
  startProjectProduction: (projectId: string) => void;
  deliverProjectToProduct: (projectId: string) => void;
  updateFactoryChecklistItem: (projectId: string, subjectId: string, checklistItemId: string, newStatus: ChecklistStatus) => void;
  updateFactoryTopicChecklistItem: (projectId: string, subjectId: string, topicName: string, checklistItemId: string, newStatus: ChecklistStatus) => void;
  markObservationCorrectionApplied: (projectId: string, observationId: string, observation: OperationalObservation) => void;
  markSubjectDelivered: (projectId: string, subjectId: string, subjectName: string) => void;
  markProjectFeedbackPending: (projectId: string) => void;
  markProjectDeliveredToLms: (projectId: string) => void;
  closeProject: (projectId: string) => void;
}

const OperationsContext = createContext<OperationsContextValue | null>(null);

export function OperationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    operationsReducer,
    initialState,
    (base) => ({
      ...base,
      // Ensure derived fields (progress/status) are coherent from mock data.
      projects: base.projects.map((project) => {
        const subjects = project.subjects.map((subject) => {
          const progress = calculateSubjectProgress(subject);
          const status = deriveSubjectStatus({ subject: { ...subject, progress }, observations: base.projectObservations.filter((o) => o.projectId === project.id && o.subjectId === subject.id && isBlockingObservationStatus(o.status)) });
          return { ...subject, progress, status };
        });
        const semesters = project.semesters.map((semester) => ({
          ...semester,
          status: deriveSemesterStatus({ semester, subjects: subjects.filter((s) => s.semesterNumber === semester.semesterNumber) }),
        }));
        const updatedProject = { ...project, subjects, semesters };
        return { ...updatedProject, progress: calculateProjectProgress(updatedProject) };
      }),
    }),
  );

  const createProject = useCallback((project: VirtualizationProject) => {
    dispatch({ type: 'CREATE_PROJECT', payload: project });
    dispatch({
      type: 'ADD_AUDIT_LOG',
      payload: {
        id: `aud-${Date.now()}`,
        entityType: 'Proyecto',
        entityName: project.program,
        action: 'Proyecto creado',
        userName: project.productOwner,
        role: 'PRODUCT',
        previousValue: 'No existia',
        newValue: 'Creado',
        createdAt: new Date().toISOString(),
      },
    });
    dispatch({
      type: 'ADD_ACTIVITY_EVENT',
      payload: {
        id: `act-${Date.now()}`,
        userName: project.productOwner,
        role: 'PRODUCT',
        action: 'creo solicitud',
        entityType: 'Proyecto',
        entityName: project.program,
        eventType: 'STATUS',
        projectId: project.id,
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<VirtualizationProject>) => {
    const project = state.projects.find((p) => p.id === id);
    if (!project) return;
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
    dispatch({
      type: 'ADD_AUDIT_LOG',
      payload: {
        id: `aud-${Date.now()}`,
        entityType: 'Proyecto',
        entityName: project.program,
        action: 'Proyecto actualizado',
        userName: 'Usuario activo',
        role: 'PRODUCT',
        previousValue: 'Datos anteriores',
        newValue: 'Datos actualizados',
        createdAt: new Date().toISOString(),
      },
    });
    dispatch({
      type: 'ADD_ACTIVITY_EVENT',
      payload: {
        id: `act-${Date.now()}`,
        userName: 'Usuario activo',
        role: 'PRODUCT',
        action: 'actualizo proyecto',
        entityType: 'Proyecto',
        entityName: project.program,
        eventType: 'STATUS',
        projectId: id,
        createdAt: new Date().toISOString(),
      },
    });
  }, [state.projects]);

  const updateProjectStatus = useCallback((id: string, newStatus: ProjectStatus) => {
    const project = state.projects.find((p) => p.id === id);
    if (!project) return;
    const oldStatus = project.status;
    dispatch({ type: 'UPDATE_PROJECT_STATUS', payload: { id, newStatus, oldStatus, project } });
    if (newStatus === 'READY_FOR_PRODUCTION') {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `not-${Date.now()}`,
          title: 'Proyecto listo para produccion',
          message: `${project.program} esta listo para que Fabrica inicie la produccion.`,
          roleTarget: 'FABRICA',
          type: 'ACTION',
          createdAt: new Date().toISOString(),
          read: false,
          projectId: id,
        },
      });
    }
    if (newStatus === 'FEEDBACK_PENDING') {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `not-${Date.now()}`,
          title: 'Observaciones pendientes',
          message: `${project.program} requiere atencion de Product.`,
          roleTarget: 'PRODUCT',
          type: 'ACTION',
          createdAt: new Date().toISOString(),
          read: false,
          projectId: id,
        },
      });
    }
  }, [state.projects]);

  const addProjectLink = useCallback((projectId: string, link: LinkResource) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({ type: 'ADD_PROJECT_LINK', payload: { projectId, link, project } });
  }, [state.projects]);

  const addObservation = useCallback((projectId: string, observation: OperationalObservation) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({ type: 'ADD_OBSERVATION', payload: { projectId, observation, project } });
  }, [state.projects]);

  const resolveObservation = useCallback((projectId: string, observationId: string, observation: OperationalObservation) => {
    dispatch({ type: 'RESOLVE_OBSERVATION', payload: { projectId, observationId, observation } });
  }, []);

  const updateChecklistItem = useCallback((projectId: string, subjectId: string, checklistItemId: string, newStatus: ChecklistStatus) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({ type: 'UPDATE_CHECKLIST_ITEM', payload: { projectId, subjectId, checklistItemId, newStatus, project } });
  }, [state.projects]);

  const markNotificationRead = useCallback((notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { notificationId } });
  }, []);

  const addComment = useCallback((comment: Omit<OperationalComment, 'id' | 'createdAt'>) => {
    dispatch({
      type: 'ADD_COMMENT',
      payload: {
        ...comment,
        id: `com-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  const replyComment = useCallback((parentId: string, message: string, authorName: string, authorRole: Role) => {
    const parent = state.comments.find((c) => c.id === parentId);
    if (!parent) return;
    dispatch({
      type: 'ADD_COMMENT',
      payload: {
        id: `com-${Date.now()}`,
        entityType: parent.entityType,
        entityId: parent.entityId,
        authorName,
        authorRole,
        message,
        createdAt: new Date().toISOString(),
        parentId,
      },
    });
  }, [state.comments]);

  const resolveComment = useCallback((commentId: string) => {
    dispatch({ type: 'RESOLVE_COMMENT', payload: { commentId } });
  }, []);

  const markRecentlyUpdated = useCallback((entityId: string) => {
    dispatch({ type: 'MARK_RECENTLY_UPDATED', payload: { entityId } });
    setTimeout(() => {
      dispatch({ type: 'CLEAR_RECENTLY_UPDATED', payload: { entityId } });
    }, 3000);
  }, []);

  const clearRecentlyUpdated = useCallback((entityId: string) => {
    dispatch({ type: 'CLEAR_RECENTLY_UPDATED', payload: { entityId } });
  }, []);

  const addSemesterToProject = useCallback((projectId: string, semester: VirtualizationProject['semesters'][0], subjects: VirtualizationProject['subjects']) => {
    dispatch({ type: 'ADD_SEMESTER_TO_PROJECT', payload: { projectId, semester, subjects } });
  }, []);

  const addSubjectToSemester = useCallback((projectId: string, subject: VirtualizationProject['subjects'][0]) => {
    dispatch({ type: 'ADD_SUBJECT_TO_SEMESTER', payload: { projectId, subject } });
  }, []);

  const addTopicToSubject = useCallback((projectId: string, subjectId: string, topicName: string, checklist: VirtualizationProject['subjects'][0]['checklist'], topicChecklistItems: VirtualizationProject['subjects'][0]['checklist']) => {
    dispatch({ type: 'ADD_TOPIC_TO_SUBJECT', payload: { projectId, subjectId, topicName, checklist, topicChecklistItems } });
  }, []);

  const startProjectProduction = useCallback((projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({ type: 'UPDATE_PROJECT_STATUS', payload: { id: projectId, newStatus: 'IN_PRODUCTION', oldStatus: project.status, project } });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: `not-${Date.now()}`,
        title: 'Fábrica inició producción',
        message: `Fábrica inició producción en ${project.program}.`,
        roleTarget: 'PRODUCT',
        type: 'INFO',
        createdAt: new Date().toISOString(),
        read: false,
        projectId,
      },
    });
  }, [state.projects]);

  const deliverProjectToProduct = useCallback((projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({ type: 'UPDATE_PROJECT_STATUS', payload: { id: projectId, newStatus: 'IN_REVIEW', oldStatus: project.status, project } });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: `not-${Date.now()}`,
        title: 'Fábrica entregó contenido',
        message: `Fábrica entregó contenido para revisión en ${project.program}.`,
        roleTarget: 'PRODUCT',
        type: 'ACTION',
        createdAt: new Date().toISOString(),
        read: false,
        projectId,
      },
    });
  }, [state.projects]);

  const updateFactoryChecklistItem = useCallback((projectId: string, subjectId: string, checklistItemId: string, newStatus: ChecklistStatus) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({ type: 'UPDATE_CHECKLIST_ITEM', payload: { projectId, subjectId, checklistItemId, newStatus, project } });
  }, [state.projects]);

  const updateFactoryTopicChecklistItem = useCallback((projectId: string, subjectId: string, topicName: string, checklistItemId: string, newStatus: ChecklistStatus) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    const subject = project.subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    dispatch({
      type: 'UPDATE_TOPIC_CHECKLIST_ITEM',
      payload: { projectId, subjectId, topicName, checklistItemId, newStatus },
    });
  }, [state.projects]);

  const markObservationCorrectionApplied = useCallback((projectId: string, observationId: string, observation: OperationalObservation) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({
      type: 'MARK_OBSERVATION_CORRECTION_APPLIED',
      payload: { projectId, observationId, observation },
    });
  }, [state.projects]);

  const markSubjectDelivered = useCallback((projectId: string, subjectId: string, subjectName: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({ type: 'MARK_SUBJECT_DELIVERED', payload: { projectId, subjectId } });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: `not-${Date.now()}`,
        title: 'Fábrica entregó asignatura',
        message: `Fábrica marcó como entregada la asignatura ${subjectName}.`,
        roleTarget: 'PRODUCT',
        type: 'ACTION',
        createdAt: new Date().toISOString(),
        read: false,
        projectId,
        subjectId,
      },
    });
  }, [state.projects]);

  const markProjectFeedbackPending = useCallback((projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    updateProjectStatus(projectId, 'FEEDBACK_PENDING');
  }, [state.projects, updateProjectStatus]);

  const markProjectDeliveredToLms = useCallback((projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    const allApproved = project.subjects.length > 0 && project.subjects.every((s) => s.status === 'APPROVED');
    const { blockingObs, anyRejected } = getProjectBlockingSignals(project, state.projectObservations);
    if (!allApproved || blockingObs || anyRejected) return;
    updateProjectStatus(projectId, 'DELIVERED_TO_LMS');
  }, [state.projects, state.projectObservations, updateProjectStatus]);

  const closeProject = useCallback((projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    if (project.status !== 'DELIVERED_TO_LMS') return;
    updateProjectStatus(projectId, 'CLOSED');
  }, [state.projects, updateProjectStatus]);

  const value: OperationsContextValue = {
    ...state,
    createProject,
    updateProject,
    updateProjectStatus,
    addProjectLink,
    addObservation,
    resolveObservation,
    updateChecklistItem,
    markNotificationRead,
    addComment,
    replyComment,
    resolveComment,
    markRecentlyUpdated,
    clearRecentlyUpdated,
    addSemesterToProject,
    addSubjectToSemester,
    addTopicToSubject,
    startProjectProduction,
    deliverProjectToProduct,
    updateFactoryChecklistItem,
    updateFactoryTopicChecklistItem,
    markObservationCorrectionApplied,
    markSubjectDelivered,
    markProjectFeedbackPending,
    markProjectDeliveredToLms,
    closeProject,
  };

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperations() {
  const context = useContext(OperationsContext);
  if (!context) throw new Error('useOperations must be used within OperationsProvider');
  return context;
}
