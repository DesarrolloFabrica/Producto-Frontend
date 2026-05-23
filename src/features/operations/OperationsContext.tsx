import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { env } from '../../config/env';
import { checklistApi } from '../../services/checklistApi';
import { notificationsApi } from '../../services/notificationsApi';
import { observationsApi } from '../../services/observationsApi';
import { projectsApi } from '../../services/projectsApi';
import { subjectsApi } from '../../services/subjectsApi';
import { topicsApi } from '../../services/topicsApi';
import {
  getApiErrorMessage,
  mapCreateObservationToApi,
  mapCreateProjectToApi,
  mapNotificationsFromApi,
  mapObservationsFromApi,
  mapProjectDetailFromApi,
  mapProjectsFromApi,
  type CreateObservationInput,
  type CreateProjectFormInput,
} from './apiMappers';
import type { NotificationSummary } from './notificationInbox';
import { ProjectsBootstrap } from './ProjectsBootstrap';
import type {
  ActivityEvent,
  AuditLog,
  ChecklistItem,
  ChecklistStatus,
  LinkResource,
  Notification,
  OperationalObservation,
  OperationalComment,
  CommentEntityType,
  Priority,
  ProjectStatus,
  Role,
  SubjectStatus,
  VirtualizationProject,
} from '../../types/domain';
import { projects as initialProjects, auditLogs as initialAuditLogs, activityEvents as initialActivityEvents, notifications as initialNotifications, projectObservations as initialProjectObservations } from '../../data/mockData';
import { projectStatusLabels } from '../../utils/status';
import { calculateProjectProgress, calculateSubjectProgress, deriveSemesterStatus, deriveSubjectStatus, getProjectBlockingSignals, isBlockingObservationStatus } from './progress';

function mapProductionInputToSubjectStatus(
  status: 'PENDIENTE' | 'EN_PRODUCCION' | 'COMPLETADA',
): SubjectStatus {
  if (status === 'EN_PRODUCCION') return 'IN_PRODUCTION';
  if (status === 'COMPLETADA') return 'IN_REVIEW';
  return 'PENDING';
}

const subjectChecklistLabels = [
  'Presentacion de la asignatura',
  'Foro de presentacion',
  'Resultados de aprendizaje y competencias',
  'Evaluacion diagnostica de entrada',
  'Syllabus',
  'Lecturas y bibliografia',
  'Evaluaciones',
  'ACA Actividad de Conocimiento Aplicado',
  'Foro Taller',
  'Taller RAE',
  'Evaluacion diagnostica de salida',
  'Seminario Aleman',
];

const topicChecklistLabels = ['Material descargable', 'Podcast', 'Videos', 'Infografias interactivas'];

function buildSubjectChecklist(): ChecklistItem[] {
  const now = new Date().toISOString();
  return subjectChecklistLabels.map((label, index) => ({
    id: `chk-${Date.now()}-${index}`,
    label,
    status: 'PENDIENTE' as ChecklistStatus,
    ownerRole: 'PRODUCT' as Role,
    updatedAt: now,
    observations: '',
  }));
}

function buildTopicChecklist(): ChecklistItem[] {
  const now = new Date().toISOString();
  return topicChecklistLabels.map((label, index) => ({
    id: `chk-topic-${Date.now()}-${index}`,
    label,
    status: 'PENDIENTE' as ChecklistStatus,
    ownerRole: 'FABRICA' as Role,
    updatedAt: now,
    observations: '',
  }));
}

interface OperationsState {
  projects: VirtualizationProject[];
  auditLogs: AuditLog[];
  activityEvents: ActivityEvent[];
  notifications: Notification[];
  notificationSummary: NotificationSummary | null;
  hasMoreNotifications: boolean;
  projectObservations: OperationalObservation[];
  observationsByProject: Record<string, OperationalObservation[]>;
  comments: OperationalComment[];
  recentlyUpdated: string[];
  isLoadingProjects: boolean;
  isLoadingProjectDetail: boolean;
  isLoadingObservations: boolean;
  isLoadingNotifications: boolean;
  isMutating: boolean;
  projectsError: string | null;
  selectedProjectError: string | null;
  observationsError: string | null;
  notificationsError: string | null;
  backendEnabled: boolean;
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
  | { type: 'REOPEN_OBSERVATION'; payload: { projectId: string; observationId: string; observation: OperationalObservation; reason: string } }
  | { type: 'UPDATE_TOPIC_CHECKLIST_ITEM'; payload: { projectId: string; subjectId: string; topicName: string; checklistItemId: string; newStatus: ChecklistStatus } }
  | { type: 'MARK_SUBJECT_DELIVERED'; payload: { projectId: string; subjectId: string } }
  | { type: 'UPDATE_SUBJECT_PRODUCTION_STATUS'; payload: { projectId: string; subjectId: string; status: SubjectStatus } }
  | { type: 'SET_MUTATING'; payload: boolean }
  | { type: 'LOAD_PROJECTS_START' }
  | { type: 'LOAD_PROJECTS_SUCCESS'; payload: VirtualizationProject[] }
  | { type: 'LOAD_PROJECTS_ERROR'; payload: string }
  | { type: 'LOAD_PROJECT_DETAIL_START' }
  | { type: 'LOAD_PROJECT_DETAIL_SUCCESS'; payload: VirtualizationProject }
  | { type: 'LOAD_PROJECT_DETAIL_ERROR'; payload: string }
  | { type: 'LOAD_OBSERVATIONS_START' }
  | { type: 'LOAD_PROJECT_OBSERVATIONS_SUCCESS'; payload: { projectId: string; observations: OperationalObservation[] } }
  | { type: 'LOAD_SUBJECT_OBSERVATIONS_SUCCESS'; payload: { observations: OperationalObservation[] } }
  | { type: 'LOAD_OBSERVATIONS_ERROR'; payload: string }
  | { type: 'LOAD_NOTIFICATIONS_START' }
  | {
      type: 'LOAD_NOTIFICATIONS_SUCCESS';
      payload: {
        notifications: Notification[];
        summary: NotificationSummary;
        hasMore: boolean;
        append?: boolean;
      };
    }
  | { type: 'LOAD_NOTIFICATIONS_ERROR'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' };

const useMocks = env.useMocks;

const initialState: OperationsState = {
  projects: useMocks ? initialProjects : [],
  auditLogs: useMocks ? initialAuditLogs : [],
  activityEvents: useMocks ? initialActivityEvents : [],
  notifications: useMocks ? initialNotifications : [],
  notificationSummary: null,
  hasMoreNotifications: false,
  projectObservations: useMocks ? initialProjectObservations : [],
  observationsByProject: useMocks ? initialProjectObservations.reduce<Record<string, OperationalObservation[]>>((acc, observation) => {
    acc[observation.projectId] = [observation, ...(acc[observation.projectId] ?? [])];
    return acc;
  }, {}) : {},
  comments: [],
  recentlyUpdated: [],
  isLoadingProjects: false,
  isLoadingProjectDetail: false,
  isLoadingObservations: false,
  isLoadingNotifications: false,
  isMutating: false,
  projectsError: null,
  selectedProjectError: null,
  observationsError: null,
  notificationsError: null,
  backendEnabled: !useMocks,
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
    case 'SET_MUTATING':
      return { ...state, isMutating: action.payload };
    case 'LOAD_PROJECTS_START':
      return { ...state, isLoadingProjects: true, projectsError: null };
    case 'LOAD_PROJECTS_SUCCESS':
      return {
        ...state,
        projects: recalcProjects(action.payload),
        isLoadingProjects: false,
        projectsError: null,
      };
    case 'LOAD_PROJECTS_ERROR':
      return { ...state, isLoadingProjects: false, projectsError: action.payload };
    case 'LOAD_PROJECT_DETAIL_START':
      return { ...state, isLoadingProjectDetail: true, selectedProjectError: null };
    case 'LOAD_PROJECT_DETAIL_SUCCESS': {
      const detail = recalcProject(action.payload);
      const exists = state.projects.some((p) => p.id === detail.id);
      return {
        ...state,
        projects: exists
          ? state.projects.map((p) => (p.id === detail.id ? detail : recalcProject(p)))
          : [detail, ...state.projects.map((p) => recalcProject(p))],
        isLoadingProjectDetail: false,
        selectedProjectError: null,
      };
    }
    case 'LOAD_PROJECT_DETAIL_ERROR':
      return { ...state, isLoadingProjectDetail: false, selectedProjectError: action.payload };
    case 'LOAD_OBSERVATIONS_START':
      return { ...state, isLoadingObservations: true, observationsError: null };
    case 'LOAD_PROJECT_OBSERVATIONS_SUCCESS': {
      const otherObservations = state.projectObservations.filter((item) => item.projectId !== action.payload.projectId);
      const nextObservations = [...action.payload.observations, ...otherObservations];
      return {
        ...state,
        projectObservations: nextObservations,
        observationsByProject: { ...state.observationsByProject, [action.payload.projectId]: action.payload.observations },
        projects: recalcProjects(state.projects, nextObservations),
        isLoadingObservations: false,
        observationsError: null,
      };
    }
    case 'LOAD_SUBJECT_OBSERVATIONS_SUCCESS': {
      const ids = new Set(action.payload.observations.map((item) => item.id));
      const nextObservations = [
        ...action.payload.observations,
        ...state.projectObservations.filter((item) => !ids.has(item.id)),
      ];
      const observationsByProject = action.payload.observations.reduce<Record<string, OperationalObservation[]>>(
        (acc, observation) => {
          const current = acc[observation.projectId] ?? state.observationsByProject[observation.projectId] ?? [];
          acc[observation.projectId] = [observation, ...current.filter((item) => item.id !== observation.id)];
          return acc;
        },
        { ...state.observationsByProject },
      );
      return {
        ...state,
        projectObservations: nextObservations,
        observationsByProject,
        projects: recalcProjects(state.projects, nextObservations),
        isLoadingObservations: false,
        observationsError: null,
      };
    }
    case 'LOAD_OBSERVATIONS_ERROR':
      return { ...state, isLoadingObservations: false, observationsError: action.payload };
    case 'LOAD_NOTIFICATIONS_START':
      return { ...state, isLoadingNotifications: true, notificationsError: null };
    case 'LOAD_NOTIFICATIONS_SUCCESS':
      return {
        ...state,
        notifications: action.payload.append
          ? [...state.notifications, ...action.payload.notifications]
          : action.payload.notifications,
        notificationSummary: action.payload.summary,
        hasMoreNotifications: action.payload.hasMore,
        isLoadingNotifications: false,
        notificationsError: null,
      };
    case 'LOAD_NOTIFICATIONS_ERROR':
      return { ...state, isLoadingNotifications: false, notificationsError: action.payload };
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map((notification) => ({ ...notification, read: true })) };
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
          observationsByProject: {
            ...state.observationsByProject,
            [action.payload.projectId]: [
              action.payload.observation,
              ...(state.observationsByProject[action.payload.projectId] ?? []),
            ],
          },
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
          observationsByProject: {
            ...state.observationsByProject,
            [action.payload.projectId]: (state.observationsByProject[action.payload.projectId] ?? []).map((o) =>
              o.id === action.payload.observationId ? { ...o, status: 'RESUELTA' as const } : o,
            ),
          },
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
          observationsByProject: {
            ...state.observationsByProject,
            [action.payload.projectId]: (state.observationsByProject[action.payload.projectId] ?? []).map((o) =>
              o.id === action.payload.observationId ? { ...o, status: 'EN_CORRECCION' as const } : o,
            ),
          },
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
    case 'REOPEN_OBSERVATION':
      {
        const now = new Date().toISOString();
        const nextObservations = state.projectObservations.map((o) =>
          o.id === action.payload.observationId
            ? { ...o, status: 'ABIERTA' as const, text: action.payload.reason, updatedAt: now }
            : o,
        );
        return {
          ...state,
          projects: recalcProjects(state.projects, nextObservations),
          projectObservations: nextObservations,
          observationsByProject: {
            ...state.observationsByProject,
            [action.payload.projectId]: (state.observationsByProject[action.payload.projectId] ?? []).map((o) =>
              o.id === action.payload.observationId
                ? { ...o, status: 'ABIERTA' as const, text: action.payload.reason, updatedAt: now }
                : o,
            ),
          },
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
    case 'UPDATE_SUBJECT_PRODUCTION_STATUS':
      return {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id !== action.payload.projectId) return project;
          const updatedProject: VirtualizationProject = {
            ...project,
            subjects: project.subjects.map((subject) =>
              subject.id === action.payload.subjectId
                ? { ...subject, status: action.payload.status }
                : subject,
            ),
          };
          return recalcProject(updatedProject);
        }),
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
  loadProjects: () => Promise<void>;
  loadProjectDetail: (projectId: string) => Promise<void>;
  loadProjectObservations: (projectId: string) => Promise<void>;
  loadSubjectObservations: (subjectId: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProjectFromApi: (input: CreateProjectFormInput) => Promise<void>;
  createObservationFromApi: (input: CreateObservationInput) => Promise<void>;
  markObservationCorrectionAppliedFromApi: (observationId: string, projectId?: string) => Promise<void>;
  validateObservationFromApi: (observationId: string, projectId?: string) => Promise<void>;
  reopenObservationFromApi: (observationId: string, reason: string, projectId?: string) => Promise<void>;
  submitSubjectFromApi: (subjectId: string, projectId: string) => Promise<void>;
  approveSubjectFromApi: (subjectId: string, projectId: string) => Promise<void>;
  rejectSubjectFromApi: (subjectId: string, projectId: string, reason?: string) => Promise<void>;
  requestSubjectCorrectionFromApi: (subjectId: string, projectId: string, reason: string) => Promise<void>;
  updateSubjectProductionStatusFromApi: (
    subjectId: string,
    projectId: string,
    status: 'PENDIENTE' | 'EN_PRODUCCION' | 'COMPLETADA',
  ) => Promise<void>;
  createProject: (project: VirtualizationProject) => void;
  updateProject: (id: string, updates: Partial<VirtualizationProject>) => void;
  updateProjectStatus: (id: string, newStatus: ProjectStatus) => void;
  addProjectLink: (projectId: string, link: LinkResource) => void;
  addObservation: (projectId: string, observation: OperationalObservation) => Promise<void>;
  resolveObservation: (projectId: string, observationId: string, observation: OperationalObservation) => Promise<void>;
  updateChecklistItem: (
    projectId: string,
    subjectId: string,
    checklistItemId: string,
    newStatus: ChecklistStatus,
  ) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsReadFromApi: () => Promise<void>;
  markNotificationsReadByResource: (params: { projectId?: string; subjectId?: string }) => Promise<void>;
  dismissNotifications: (params: {
    ids?: string[];
    projectId?: string;
    subjectId?: string;
  }) => Promise<void>;
  addComment: (comment: Omit<OperationalComment, 'id' | 'createdAt'>) => void;
  replyComment: (parentId: string, message: string, authorName: string, authorRole: Role) => void;
  resolveComment: (commentId: string) => void;
  markRecentlyUpdated: (entityId: string) => void;
  clearRecentlyUpdated: (entityId: string) => void;
  addSemesterToProject: (projectId: string, payload: { semesterNumber: number; factoryExpectedDate: string; subjects: { name: string; topics: string[] }[]; changeReason?: string }) => Promise<void>;
  addSubjectToSemester: (projectId: string, payload: { semesterNumber: number; name: string; topics: string[]; expectedDeliveryDate: string; changeReason?: string }) => Promise<void>;
  addTopicToSubject: (projectId: string, subjectId: string, payload: { topics: string[]; changeReason?: string }) => Promise<void>;
  startProjectProduction: (projectId: string) => Promise<void>;
  deliverProjectToProduct: (projectId: string) => void;
  updateFactoryChecklistItem: (
    projectId: string,
    subjectId: string,
    checklistItemId: string,
    newStatus: ChecklistStatus,
  ) => Promise<void>;
  updateFactoryTopicChecklistItem: (
    projectId: string,
    subjectId: string,
    topicName: string,
    checklistItemId: string,
    newStatus: ChecklistStatus,
  ) => Promise<void>;
  markObservationCorrectionApplied: (projectId: string, observationId: string, observation: OperationalObservation) => Promise<void>;
  reopenObservation: (projectId: string, observationId: string, observation: OperationalObservation, reason: string) => Promise<void>;
  markSubjectDelivered: (projectId: string, subjectId: string, subjectName: string) => Promise<void>;
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

  const loadProjects = useCallback(async () => {
    if (!state.backendEnabled) return;
    dispatch({ type: 'LOAD_PROJECTS_START' });
    try {
      const apiProjects = await projectsApi.getProjects();
      dispatch({ type: 'LOAD_PROJECTS_SUCCESS', payload: mapProjectsFromApi(apiProjects) });
    } catch (error) {
      dispatch({ type: 'LOAD_PROJECTS_ERROR', payload: getApiErrorMessage(error) });
    }
  }, [state.backendEnabled]);

  const loadProjectDetail = useCallback(
    async (projectId: string) => {
      if (!state.backendEnabled) return;
      dispatch({ type: 'LOAD_PROJECT_DETAIL_START' });
      try {
        const apiProject = await projectsApi.getProjectById(projectId);
        dispatch({ type: 'LOAD_PROJECT_DETAIL_SUCCESS', payload: mapProjectDetailFromApi(apiProject) });
      } catch (error) {
        dispatch({ type: 'LOAD_PROJECT_DETAIL_ERROR', payload: getApiErrorMessage(error) });
      }
    },
    [state.backendEnabled],
  );

  const loadProjectObservations = useCallback(
    async (projectId: string) => {
      if (!state.backendEnabled) return;
      dispatch({ type: 'LOAD_OBSERVATIONS_START' });
      try {
        const apiObservations = await observationsApi.getProjectObservations(projectId);
        dispatch({
          type: 'LOAD_PROJECT_OBSERVATIONS_SUCCESS',
          payload: { projectId, observations: mapObservationsFromApi(apiObservations) },
        });
      } catch (error) {
        dispatch({ type: 'LOAD_OBSERVATIONS_ERROR', payload: getApiErrorMessage(error) });
      }
    },
    [state.backendEnabled],
  );

  const loadSubjectObservations = useCallback(
    async (subjectId: string) => {
      if (!state.backendEnabled) return;
      dispatch({ type: 'LOAD_OBSERVATIONS_START' });
      try {
        const apiObservations = await observationsApi.getSubjectObservations(subjectId);
        dispatch({
          type: 'LOAD_SUBJECT_OBSERVATIONS_SUCCESS',
          payload: { observations: mapObservationsFromApi(apiObservations) },
        });
      } catch (error) {
        dispatch({ type: 'LOAD_OBSERVATIONS_ERROR', payload: getApiErrorMessage(error) });
      }
    },
    [state.backendEnabled],
  );

  const loadNotifications = useCallback(async (options?: { offset?: number; append?: boolean }) => {
    if (!state.backendEnabled) return;
    dispatch({ type: 'LOAD_NOTIFICATIONS_START' });
    try {
      const inbox = await notificationsApi.getInbox({
        limit: 40,
        offset: options?.offset ?? 0,
        readDays: 7,
      });
      const mapped = mapNotificationsFromApi(inbox.items);
      dispatch({
        type: 'LOAD_NOTIFICATIONS_SUCCESS',
        payload: {
          notifications: mapped,
          summary: inbox.summary,
          hasMore: inbox.hasMore,
          append: options?.append ?? false,
        },
      });
    } catch (error) {
      dispatch({ type: 'LOAD_NOTIFICATIONS_ERROR', payload: getApiErrorMessage(error) });
    }
  }, [state.backendEnabled]);

  const refetchProjectWorkflow = useCallback(
    async (projectId?: string) => {
      await Promise.all([
        projectId ? loadProjectDetail(projectId) : Promise.resolve(),
        projectId ? loadProjectObservations(projectId) : Promise.resolve(),
        loadProjects(),
        loadNotifications(),
      ]);
    },
    [loadProjectDetail, loadProjectObservations, loadProjects, loadNotifications],
  );

  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  const createProjectFromApi = useCallback(
    async (input: CreateProjectFormInput) => {
      if (!state.backendEnabled) {
        throw new Error('Backend deshabilitado. Activa la API o usa VITE_USE_MOCKS=true.');
      }
      await projectsApi.createProject(mapCreateProjectToApi(input));
      await loadProjects();
    },
    [state.backendEnabled, loadProjects],
  );

  const createObservationFromApi = useCallback(
    async (input: CreateObservationInput) => {
      if (!state.backendEnabled) throw new Error('Backend deshabilitado.');
      if (!input.projectId || !input.relatedEntityId || !input.text.trim()) {
        throw new Error('La observación requiere proyecto, entidad relacionada y texto.');
      }
      dispatch({ type: 'SET_MUTATING', payload: true });
      try {
        await observationsApi.createObservation(mapCreateObservationToApi(input));
        await Promise.all([
          refetchProjectWorkflow(input.projectId),
          input.subjectId ? loadSubjectObservations(input.subjectId) : Promise.resolve(),
        ]);
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
    },
    [state.backendEnabled, refetchProjectWorkflow, loadSubjectObservations],
  );

  const markObservationCorrectionAppliedFromApi = useCallback(
    async (observationId: string, projectId?: string, subjectId?: string) => {
      if (!state.backendEnabled) throw new Error('Backend deshabilitado.');
      dispatch({ type: 'SET_MUTATING', payload: true });
      try {
        const response = await observationsApi.markCorrectionApplied(observationId);
        const resolvedProjectId = projectId ?? response.projectId ?? response.observation.projectId;
        const resolvedSubjectId = subjectId ?? response.observation.subjectId ?? undefined;
        await Promise.all([
          refetchProjectWorkflow(resolvedProjectId),
          resolvedSubjectId ? loadSubjectObservations(resolvedSubjectId) : Promise.resolve(),
        ]);
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
    },
    [state.backendEnabled, refetchProjectWorkflow, loadSubjectObservations],
  );

  const validateObservationFromApi = useCallback(
    async (observationId: string, projectId?: string, subjectId?: string) => {
      if (!state.backendEnabled) throw new Error('Backend deshabilitado.');
      dispatch({ type: 'SET_MUTATING', payload: true });
      try {
        const response = await observationsApi.validateObservation(observationId);
        const resolvedProjectId = projectId ?? response.projectId ?? response.observation.projectId;
        const resolvedSubjectId = subjectId ?? response.observation.subjectId ?? undefined;
        await Promise.all([
          refetchProjectWorkflow(resolvedProjectId),
          resolvedSubjectId ? loadSubjectObservations(resolvedSubjectId) : Promise.resolve(),
        ]);
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
    },
    [state.backendEnabled, refetchProjectWorkflow, loadSubjectObservations],
  );

  const reopenObservationFromApi = useCallback(
    async (observationId: string, reason: string, projectId?: string, subjectId?: string) => {
      if (!state.backendEnabled) throw new Error('Backend deshabilitado.');
      dispatch({ type: 'SET_MUTATING', payload: true });
      try {
        const response = await observationsApi.reopenObservation(observationId, reason);
        const resolvedProjectId = projectId ?? response.projectId ?? response.observation.projectId;
        const resolvedSubjectId = subjectId ?? response.observation.subjectId ?? undefined;
        await Promise.all([
          refetchProjectWorkflow(resolvedProjectId),
          resolvedSubjectId ? loadSubjectObservations(resolvedSubjectId) : Promise.resolve(),
        ]);
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
    },
    [state.backendEnabled, refetchProjectWorkflow, loadSubjectObservations],
  );

  const submitSubjectFromApi = useCallback(
    async (subjectId: string, projectId: string) => {
      if (!state.backendEnabled) throw new Error('Backend deshabilitado.');
      if (!subjectId || !projectId) throw new Error('No se pudo identificar la asignatura o el proyecto.');
      dispatch({ type: 'SET_MUTATING', payload: true });
      try {
        await subjectsApi.submitSubject(subjectId);
        await refetchProjectWorkflow(projectId);
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
    },
    [state.backendEnabled, refetchProjectWorkflow],
  );

  const approveSubjectFromApi = useCallback(
    async (subjectId: string, projectId: string) => {
      if (!state.backendEnabled) throw new Error('Backend deshabilitado.');
      if (!subjectId) throw new Error('No se pudo identificar la asignatura.');
      dispatch({ type: 'SET_MUTATING', payload: true });
      try {
        await subjectsApi.approveSubject(subjectId);
        await refetchProjectWorkflow(projectId);
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
    },
    [state.backendEnabled, refetchProjectWorkflow],
  );

  const rejectSubjectFromApi = useCallback(
    async (subjectId: string, projectId: string, reason?: string) => {
      if (!state.backendEnabled) throw new Error('Backend deshabilitado.');
      if (!subjectId) throw new Error('No se pudo identificar la asignatura.');
      dispatch({ type: 'SET_MUTATING', payload: true });
      try {
        await subjectsApi.rejectSubject(subjectId, reason);
        await refetchProjectWorkflow(projectId);
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
    },
    [state.backendEnabled, refetchProjectWorkflow],
  );

  const requestSubjectCorrectionFromApi = useCallback(
    async (subjectId: string, projectId: string, reason: string) => {
      if (!state.backendEnabled) throw new Error('Backend deshabilitado.');
      if (!subjectId || !projectId) throw new Error('No se pudo identificar la asignatura o el proyecto.');
      dispatch({ type: 'SET_MUTATING', payload: true });
      try {
        await subjectsApi.requestCorrection(subjectId, reason);
        await Promise.all([refetchProjectWorkflow(projectId), loadSubjectObservations(subjectId)]);
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
    },
    [state.backendEnabled, refetchProjectWorkflow, loadSubjectObservations],
  );

  const updateSubjectProductionStatusFromApi = useCallback(
    async (
      subjectId: string,
      projectId: string,
      status: 'PENDIENTE' | 'EN_PRODUCCION' | 'COMPLETADA',
    ) => {
      if (!state.backendEnabled) throw new Error('Backend deshabilitado.');
      dispatch({ type: 'SET_MUTATING', payload: true });
      dispatch({
        type: 'UPDATE_SUBJECT_PRODUCTION_STATUS',
        payload: { projectId, subjectId, status: mapProductionInputToSubjectStatus(status) },
      });
      try {
        await subjectsApi.updateProductionStatus(subjectId, status);
        await Promise.all([refetchProjectWorkflow(projectId), loadSubjectObservations(subjectId)]);
      } catch (error) {
        await refetchProjectWorkflow(projectId);
        throw error;
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
    },
    [state.backendEnabled, refetchProjectWorkflow, loadSubjectObservations],
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

  const addObservation = useCallback(async (projectId: string, observation: OperationalObservation) => {
    if (state.backendEnabled) {
      await createObservationFromApi({
        projectId,
        subjectId: observation.subjectId,
        relatedEntityType: observation.subjectId ? 'SUBJECT' : 'PROJECT',
        relatedEntityId: observation.subjectId ?? projectId,
        text: observation.text,
        priority: 'MEDIUM',
      });
      return;
    }
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({ type: 'ADD_OBSERVATION', payload: { projectId, observation, project } });
  }, [state.backendEnabled, state.projects, createObservationFromApi]);

  const resolveObservation = useCallback(async (projectId: string, observationId: string, observation: OperationalObservation) => {
    if (state.backendEnabled) {
      await validateObservationFromApi(observationId, projectId);
      return;
    }
    dispatch({ type: 'RESOLVE_OBSERVATION', payload: { projectId, observationId, observation } });
  }, [state.backendEnabled, validateObservationFromApi]);

  const applyChecklistUpdateLocal = useCallback(
    (
      projectId: string,
      subjectId: string,
      checklistItemId: string,
      newStatus: ChecklistStatus,
      topicName?: string,
    ) => {
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;

      if (topicName) {
        dispatch({
          type: 'UPDATE_TOPIC_CHECKLIST_ITEM',
          payload: { projectId, subjectId, topicName, checklistItemId, newStatus },
        });
        return;
      }

      dispatch({
        type: 'UPDATE_CHECKLIST_ITEM',
        payload: { projectId, subjectId, checklistItemId, newStatus, project },
      });
    },
    [state.projects],
  );

  const patchChecklistStatus = useCallback(
    async (projectId: string, checklistItemId: string, newStatus: ChecklistStatus) => {
      if (state.backendEnabled) {
        await checklistApi.updateStatus(checklistItemId, { status: newStatus });
        await loadProjectDetail(projectId);
        return;
      }
    },
    [state.backendEnabled, loadProjectDetail],
  );

  const updateChecklistItem = useCallback(
    async (projectId: string, subjectId: string, checklistItemId: string, newStatus: ChecklistStatus) => {
      if (state.backendEnabled) {
        await patchChecklistStatus(projectId, checklistItemId, newStatus);
        return;
      }
      applyChecklistUpdateLocal(projectId, subjectId, checklistItemId, newStatus);
    },
    [state.backendEnabled, patchChecklistStatus, applyChecklistUpdateLocal],
  );

  const markNotificationRead = useCallback(async (notificationId: string) => {
    if (state.backendEnabled) {
      await notificationsApi.markNotificationRead(notificationId);
    }
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { notificationId } });
  }, [state.backendEnabled]);

  const markAllNotificationsReadFromApi = useCallback(async () => {
    if (state.backendEnabled) {
      await notificationsApi.markAllNotificationsRead();
      await loadNotifications();
      return;
    }
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  }, [state.backendEnabled, loadNotifications]);

  const markNotificationsReadByResource = useCallback(
    async (params: { projectId?: string; subjectId?: string }) => {
      if (!state.backendEnabled) return;
      await notificationsApi.markReadByResource(params);
      await loadNotifications();
    },
    [state.backendEnabled, loadNotifications],
  );

  const dismissNotifications = useCallback(
    async (params: { ids?: string[]; projectId?: string; subjectId?: string }) => {
      if (!state.backendEnabled) return;
      await notificationsApi.dismissNotifications(params);
      await loadNotifications();
    },
    [state.backendEnabled, loadNotifications],
  );

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

  const addSemesterToProject = useCallback(
    async (
      projectId: string,
      payload: { semesterNumber: number; factoryExpectedDate: string; subjects: { name: string; topics: string[] }[]; changeReason?: string },
    ) => {
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;

      if (state.backendEnabled) {
        dispatch({ type: 'SET_MUTATING', payload: true });
        try {
          const apiProject = await projectsApi.addSemester(projectId, {
            ...payload,
            factoryExpectedDate: payload.factoryExpectedDate.includes('T')
              ? payload.factoryExpectedDate
              : `${payload.factoryExpectedDate}T00:00:00.000Z`,
          });
          dispatch({ type: 'LOAD_PROJECT_DETAIL_SUCCESS', payload: mapProjectDetailFromApi(apiProject) });
          await loadNotifications();
        } finally {
          dispatch({ type: 'SET_MUTATING', payload: false });
        }
        return;
      }

      const semester = {
        id: `sem-${Date.now()}`,
        semesterNumber: payload.semesterNumber,
        status: 'PENDING' as const,
        curriculumStatus: 'PENDIENTE' as ChecklistStatus,
        factoryStatus: 'PENDIENTE' as ChecklistStatus,
        factoryExpectedDate: payload.factoryExpectedDate,
        continuationDate: '',
        observations: '',
      };

      const subjects = payload.subjects.map((subject, index) => ({
        id: `subj-${Date.now()}-${index}`,
        projectId,
        semesterNumber: payload.semesterNumber,
        name: subject.name.trim(),
        status: 'PENDING' as const,
        progress: 0,
        checklist: buildSubjectChecklist(),
        generalObservations: '',
        contentTopics: subject.topics.map((topic) => topic.trim()).filter(Boolean),
        topicChecklists: subject.topics.map((topic, topicIndex) => ({
          topicName: topic.trim(),
          topicOrder: topicIndex + 1,
          items: buildTopicChecklist(),
        })),
      }));

      dispatch({ type: 'ADD_SEMESTER_TO_PROJECT', payload: { projectId, semester, subjects } });
    },
    [state.projects, state.backendEnabled, loadNotifications],
  );

  const addSubjectToSemester = useCallback(
    async (
      projectId: string,
      payload: { semesterNumber: number; name: string; topics: string[]; expectedDeliveryDate: string; changeReason?: string },
    ) => {
      const project = state.projects.find((p) => p.id === projectId);
      const semester = project?.semesters.find((s) => s.semesterNumber === payload.semesterNumber);
      if (!project || !semester) return;

      if (state.backendEnabled) {
        dispatch({ type: 'SET_MUTATING', payload: true });
        try {
          const apiProject = await subjectsApi.addSubjectToSemester(semester.id, {
            name: payload.name,
            topics: payload.topics,
            expectedDeliveryDate: payload.expectedDeliveryDate,
            changeReason: payload.changeReason,
          });
          dispatch({ type: 'LOAD_PROJECT_DETAIL_SUCCESS', payload: mapProjectDetailFromApi(apiProject) });
          await loadNotifications();
        } finally {
          dispatch({ type: 'SET_MUTATING', payload: false });
        }
        return;
      }

      const subject = {
        id: `subj-${Date.now()}`,
        projectId,
        semesterNumber: payload.semesterNumber,
        name: payload.name.trim(),
        expectedDeliveryDate: payload.expectedDeliveryDate,
        status: 'PENDING' as const,
        progress: 0,
        checklist: buildSubjectChecklist(),
        generalObservations: '',
        contentTopics: payload.topics.map((topic) => topic.trim()).filter(Boolean),
        topicChecklists: payload.topics.map((topic, index) => ({
          topicName: topic.trim(),
          topicOrder: index + 1,
          items: buildTopicChecklist(),
        })),
      };

      dispatch({ type: 'ADD_SUBJECT_TO_SEMESTER', payload: { projectId, subject } });
    },
    [state.projects, state.backendEnabled, loadNotifications],
  );

  const addTopicToSubject = useCallback(
    async (
      projectId: string,
      subjectId: string,
      payload: { topics: string[]; changeReason?: string },
    ) => {
      const project = state.projects.find((p) => p.id === projectId);
      const subject = project?.subjects.find((s) => s.id === subjectId);
      if (!project || !subject) return;

      if (state.backendEnabled) {
        dispatch({ type: 'SET_MUTATING', payload: true });
        try {
          const apiProject = await topicsApi.addTopicsToSubject(subjectId, payload);
          dispatch({ type: 'LOAD_PROJECT_DETAIL_SUCCESS', payload: mapProjectDetailFromApi(apiProject) });
          await loadNotifications();
        } finally {
          dispatch({ type: 'SET_MUTATING', payload: false });
        }
        return;
      }

      for (const topicName of payload.topics) {
        const checklist = buildTopicChecklist();
        dispatch({
          type: 'ADD_TOPIC_TO_SUBJECT',
          payload: {
            projectId,
            subjectId,
            topicName: topicName.trim(),
            checklist,
            topicChecklistItems: checklist,
          },
        });
      }
    },
    [state.projects, state.backendEnabled, loadNotifications],
  );

  const startProjectProduction = useCallback(async (projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    if (state.backendEnabled) {
      dispatch({ type: 'SET_MUTATING', payload: true });
      try {
        await projectsApi.startProduction(projectId);
        await loadProjectDetail(projectId);
        await loadProjects();
      } finally {
        dispatch({ type: 'SET_MUTATING', payload: false });
      }
      return;
    }

    dispatch({
      type: 'UPDATE_PROJECT_STATUS',
      payload: { id: projectId, newStatus: 'IN_PRODUCTION', oldStatus: project.status, project },
    });
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
  }, [state.projects, state.backendEnabled, loadProjectDetail, loadProjects]);

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

  const updateFactoryChecklistItem = useCallback(
    async (projectId: string, subjectId: string, checklistItemId: string, newStatus: ChecklistStatus) => {
      if (state.backendEnabled) {
        await patchChecklistStatus(projectId, checklistItemId, newStatus);
        return;
      }
      applyChecklistUpdateLocal(projectId, subjectId, checklistItemId, newStatus);
    },
    [state.backendEnabled, patchChecklistStatus, applyChecklistUpdateLocal],
  );

  const updateFactoryTopicChecklistItem = useCallback(
    async (
      projectId: string,
      subjectId: string,
      topicName: string,
      checklistItemId: string,
      newStatus: ChecklistStatus,
    ) => {
      if (state.backendEnabled) {
        await patchChecklistStatus(projectId, checklistItemId, newStatus);
        return;
      }
      applyChecklistUpdateLocal(projectId, subjectId, checklistItemId, newStatus, topicName);
    },
    [state.backendEnabled, patchChecklistStatus, applyChecklistUpdateLocal],
  );

  const markObservationCorrectionApplied = useCallback(async (projectId: string, observationId: string, observation: OperationalObservation) => {
    if (state.backendEnabled) {
      await markObservationCorrectionAppliedFromApi(observationId, projectId);
      return;
    }
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({
      type: 'MARK_OBSERVATION_CORRECTION_APPLIED',
      payload: { projectId, observationId, observation },
    });
  }, [state.backendEnabled, state.projects, markObservationCorrectionAppliedFromApi]);

  const reopenObservation = useCallback(async (projectId: string, observationId: string, observation: OperationalObservation, reason: string) => {
    if (state.backendEnabled) {
      await reopenObservationFromApi(observationId, reason, projectId);
      return;
    }
    dispatch({
      type: 'REOPEN_OBSERVATION',
      payload: { projectId, observationId, observation, reason },
    });
  }, [state.backendEnabled, reopenObservationFromApi]);

  const markSubjectDelivered = useCallback(async (projectId: string, subjectId: string, subjectName: string) => {
    if (state.backendEnabled) {
      await submitSubjectFromApi(subjectId, projectId);
      return;
    }
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
  }, [state.backendEnabled, state.projects, submitSubjectFromApi]);

  const markProjectFeedbackPending = useCallback((projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    updateProjectStatus(projectId, 'FEEDBACK_PENDING');
  }, [state.projects, updateProjectStatus]);

  const markProjectDeliveredToLms = useCallback((projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    if (state.backendEnabled) {
      void projectsApi.markProjectDelivered(projectId).then(() => refetchProjectWorkflow(projectId));
      return;
    }
    const allApproved = project.subjects.length > 0 && project.subjects.every((s) => s.status === 'APPROVED');
    const { blockingObs, anyRejected } = getProjectBlockingSignals(project, state.projectObservations);
    if (!allApproved || blockingObs || anyRejected) return;
    updateProjectStatus(projectId, 'DELIVERED_TO_LMS');
  }, [state.backendEnabled, state.projects, state.projectObservations, updateProjectStatus, refetchProjectWorkflow]);

  const closeProject = useCallback((projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    if (state.backendEnabled) {
      void projectsApi.closeProject(projectId).then(() => refetchProjectWorkflow(projectId));
      return;
    }
    if (project.status !== 'DELIVERED_TO_LMS') return;
    updateProjectStatus(projectId, 'CLOSED');
  }, [state.backendEnabled, state.projects, updateProjectStatus, refetchProjectWorkflow]);

  const value: OperationsContextValue = {
    ...state,
    loadProjects,
    loadProjectDetail,
    loadProjectObservations,
    loadSubjectObservations,
    loadNotifications,
    refreshProjects,
    createProjectFromApi,
    createObservationFromApi,
    markObservationCorrectionAppliedFromApi,
    validateObservationFromApi,
    reopenObservationFromApi,
    submitSubjectFromApi,
    approveSubjectFromApi,
    rejectSubjectFromApi,
    requestSubjectCorrectionFromApi,
    updateSubjectProductionStatusFromApi,
    createProject,
    updateProject,
    updateProjectStatus,
    addProjectLink,
    addObservation,
    resolveObservation,
    updateChecklistItem,
    markNotificationRead,
    markAllNotificationsReadFromApi,
    markNotificationsReadByResource,
    dismissNotifications,
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
    reopenObservation,
    markSubjectDelivered,
    markProjectFeedbackPending,
    markProjectDeliveredToLms,
    closeProject,
  };

  return (
    <OperationsContext.Provider value={value}>
      <ProjectsBootstrap />
      {children}
    </OperationsContext.Provider>
  );
}

export function useOperations() {
  const context = useContext(OperationsContext);
  if (!context) throw new Error('useOperations must be used within OperationsProvider');
  return context;
}
