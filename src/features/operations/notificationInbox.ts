import type { Notification, Role, VirtualizationProject } from '../../types/domain';
import { analyzeFactoryProject } from './factoryProjectState';
import { getProjectSubjects } from './subjectOperationalState';

export interface NotificationSummary {
  actionableCount: number;
  unreadCount: number;
  inboxCount: number;
}

export interface NotificationGroup {
  key: string;
  projectId?: string;
  subjectId?: string;
  label: string;
  subtitle?: string;
  items: Notification[];
  latestAt: string;
  hasActionable: boolean;
  targetUrl: string | null;
}

export interface NotificationActionContext {
  projects?: VirtualizationProject[];
  role?: Role;
}

const INFORMATIVE_EVENT_TYPES = new Set([
  'SUBJECT_APPROVED',
  'OBSERVATION_VALIDATED',
  'PROJECT_DELIVERED',
  'PROJECT_CLOSED',
]);

const LEGACY_INFORMATIVE_TITLES = new Set(['Asignatura aprobada', 'Materia aprobada']);

const FACTORY_PENDING_SUBJECT_STATUSES = new Set([
  'PENDING',
  'IN_PRODUCTION',
  'CHANGES_REQUESTED',
]);

function isNotificationObsolete(
  notification: Notification,
  projects: VirtualizationProject[],
): boolean {
  const project = notification.projectId
    ? projects.find((item) => item.id === notification.projectId)
    : undefined;
  if (!project) return false;

  const subjects = getProjectSubjects(project);

  if (notification.subjectId) {
    const subject = subjects.find((item) => item.id === notification.subjectId);
    if (subject && (subject.status === 'APPROVED' || subject.status === 'DELIVERED')) {
      return true;
    }
  }

  if (
    notification.eventType === 'PROJECT_MODIFIED' ||
    (notification.projectId && !notification.subjectId)
  ) {
    const factoryInsight = analyzeFactoryProject(project);
    if (factoryInsight.isFactoryWorkComplete) return true;

    const hasPendingFactoryWork = subjects.some((subject) =>
      FACTORY_PENDING_SUBJECT_STATUSES.has(subject.status),
    );
    return subjects.length > 0 && !hasPendingFactoryWork;
  }

  return false;
}

export function isActionableNotification(
  notification: Notification,
  context?: NotificationActionContext,
): boolean {
  if (notification.read) return false;

  if (notification.eventType && INFORMATIVE_EVENT_TYPES.has(notification.eventType)) {
    return false;
  }

  if (LEGACY_INFORMATIVE_TITLES.has(notification.title)) {
    return false;
  }

  if (notification.type === 'INFO') return false;

  if (
    notification.type !== 'ACTION' &&
    notification.type !== 'CRITICAL' &&
    notification.type !== 'DEADLINE'
  ) {
    return false;
  }

  if (context?.projects?.length && isNotificationObsolete(notification, context.projects)) {
    return false;
  }

  return true;
}

export function isVisibleNotification(
  notification: Notification,
  role: Role,
  userId?: string | null,
): boolean {
  if (role === 'ADMIN') return true;
  const byUser = Boolean(userId && notification.userId && notification.userId === userId);
  const byRole = Boolean(notification.roleTarget && notification.roleTarget === role);
  return byUser || byRole;
}

export function getNotificationTargetUrl(notification: Notification): string | null {
  if (notification.actionUrl) return notification.actionUrl;
  if (notification.subjectId) {
    const focus =
      notification.eventType === 'SUBJECT_CHANGES_REQUESTED' ||
      notification.eventType === 'SUBJECT_REJECTED' ||
      notification.eventType === 'OBSERVATION_REOPENED'
        ? '?focus=correction'
        : '';
    return `/subjects/${notification.subjectId}${focus}`;
  }
  if (notification.projectId) return `/projects/${notification.projectId}`;
  return null;
}

function resolveGroupLabel(
  notification: Notification,
  projects: VirtualizationProject[],
): { label: string; subtitle?: string } {
  const project = notification.projectId
    ? projects.find((p) => p.id === notification.projectId)
    : undefined;

  if (notification.subjectId && project) {
    const subject =
      project.subjects?.find((s) => s.id === notification.subjectId) ??
      project.subjectsSummary?.find((s) => s.id === notification.subjectId);
    return {
      label: subject?.name ?? 'Asignatura',
      subtitle: project.program,
    };
  }

  if (project) {
    return { label: project.program, subtitle: project.school };
  }

  return { label: notification.title };
}

export function groupNotificationsByResource(
  notifications: Notification[],
  projects: VirtualizationProject[],
  context?: NotificationActionContext,
): NotificationGroup[] {
  const actionContext = context ?? { projects };

  const map = new Map<string, NotificationGroup>();

  for (const notification of notifications) {
    const key = notification.subjectId
      ? `subject:${notification.subjectId}`
      : notification.projectId
        ? `project:${notification.projectId}`
        : `single:${notification.id}`;

    const { label, subtitle } = resolveGroupLabel(notification, projects);
    const actionable = isActionableNotification(notification, actionContext);
    const existing = map.get(key);

    if (existing) {
      existing.items.push(notification);
      if (new Date(notification.createdAt) > new Date(existing.latestAt)) {
        existing.latestAt = notification.createdAt;
      }
      existing.hasActionable = existing.hasActionable || actionable;
      if (!existing.targetUrl) {
        existing.targetUrl = getNotificationTargetUrl(notification);
      }
    } else {
      map.set(key, {
        key,
        projectId: notification.projectId,
        subjectId: notification.subjectId,
        label,
        subtitle,
        items: [notification],
        latestAt: notification.createdAt,
        hasActionable: actionable,
        targetUrl: getNotificationTargetUrl(notification),
      });
    }
  }

  return [...map.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }))
    .sort((a, b) => {
      if (a.hasActionable !== b.hasActionable) return a.hasActionable ? -1 : 1;
      return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
    });
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return new Date(isoDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}
