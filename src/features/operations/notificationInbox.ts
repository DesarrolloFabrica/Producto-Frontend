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

const RECENT_ACTIVITY_DAYS = 7;
export const NOTIFICATION_PAGE_SIZE = 8;
export const NOTIFICATION_LOAD_LIMIT = 15;
export const NOTIFICATION_MAX_LOADED = 45;
export const NOTIFICATION_READ_RETENTION_DAYS = 3;

const INFORMATIVE_EVENT_TYPES = new Set([
  'SUBJECT_APPROVED',
  'OBSERVATION_VALIDATED',
  'PROJECT_DELIVERED',
  'PROJECT_CLOSED',
]);

const LEGACY_INFORMATIVE_TITLES = new Set(['Asignatura aprobada', 'Materia aprobada']);

/** Eventos INFO que aún requieren acción según el rol destinatario. */
const ROLE_ACTIONABLE_EVENTS: Partial<Record<Role, Set<string>>> = {
  PLANEACION: new Set([
    'INSTITUTIONAL_REQUEST_CREATED',
    'INSTITUTIONAL_FACTORY_DELIVERED',
    'INSTITUTIONAL_LMS_UPLOAD_COMPLETED',
  ]),
  FABRICA: new Set([
    'INSTITUTIONAL_RETURNED_TO_FACTORY',
    'INSTITUTIONAL_PRODUCT_REQUESTED_CHANGES',
    'INSTITUTIONAL_PLANNING_VALIDATED_INITIAL',
  ]),
  LMS: new Set([
    'INSTITUTIONAL_RETURNED_TO_LMS',
    'INSTITUTIONAL_PLANNING_VALIDATED_PRODUCTION',
  ]),
  PRODUCT: new Set([
    'INSTITUTIONAL_RETURNED_TO_PRODUCT',
    'SUBJECT_CHANGES_REQUESTED',
    'SUBJECT_REJECTED',
    'OBSERVATION_REOPENED',
  ]),
};

const FACTORY_PENDING_SUBJECT_STATUSES = new Set([
  'PENDING',
  'IN_PRODUCTION',
  'CHANGES_REQUESTED',
]);

function isRecentActivity(isoDate: string, days = RECENT_ACTIVITY_DAYS): boolean {
  return Date.now() - new Date(isoDate).getTime() <= days * 86_400_000;
}

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
    notification.eventType === 'NEW_SUBJECT_ADDED' ||
    notification.eventType === 'NEW_SEMESTER_ADDED'
  ) {
    return false;
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

function isRoleActionableInfoEvent(notification: Notification, role?: Role): boolean {
  if (!role || !notification.eventType || notification.read) return false;
  return ROLE_ACTIONABLE_EVENTS[role]?.has(notification.eventType) ?? false;
}

export function isActionableNotification(
  notification: Notification,
  context?: NotificationActionContext,
): boolean {
  if (notification.read) return false;

  if (isRoleActionableInfoEvent(notification, context?.role)) {
    if (context?.projects?.length && isNotificationObsolete(notification, context.projects)) {
      return false;
    }
    return true;
  }

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

export function resolveRoleActionUrl(notification: Notification, role?: Role): string | null {
  const fallback = getNotificationTargetUrl(notification);
  if (!role || !notification.eventType) return fallback;

  switch (notification.eventType) {
    case 'INSTITUTIONAL_REQUEST_CREATED':
      if (role === 'PLANEACION') return '/planning/dashboard?filter=initial';
      if (role === 'FABRICA') return '/factory/dashboard';
      if (role === 'LMS') return '/lms/dashboard';
      break;
    case 'INSTITUTIONAL_PLANNING_VALIDATED_PRODUCTION':
      if (role === 'LMS') return '/lms/dashboard?filter=pending';
      break;
    case 'INSTITUTIONAL_RETURNED_TO_LMS':
      if (role === 'LMS') return '/lms/dashboard?filter=returned';
      break;
    case 'INSTITUTIONAL_RETURNED_TO_FACTORY':
      if (role === 'FABRICA') return '/factory/work';
      break;
    case 'INSTITUTIONAL_FACTORY_DELIVERED':
    case 'INSTITUTIONAL_LMS_UPLOAD_COMPLETED':
      if (role === 'PLANEACION') return '/planning/dashboard';
      break;
    default:
      break;
  }

  return fallback;
}

function parseMessageContext(message: string): { label?: string; subtitle?: string } {
  const institutional = message.match(/^Nueva solicitud:\s*(.+?)\s*[—–-]\s*(.+)$/i);
  if (institutional) {
    return { label: institutional[1].trim(), subtitle: institutional[2].trim() };
  }

  const dotSeparated = message.match(/^(.+?)\s*·\s*(.+)$/);
  if (dotSeparated) {
    return { label: dotSeparated[1].trim(), subtitle: dotSeparated[2].trim() };
  }

  return {};
}

export function getNotificationPreview(notification: Notification): string {
  const fromMessage = notification.message?.trim();
  if (fromMessage && fromMessage !== notification.title) {
    return fromMessage;
  }
  return notification.title;
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

  const parsed = parseMessageContext(notification.message ?? '');
  if (parsed.label) {
    return {
      label: parsed.label,
      subtitle: parsed.subtitle ?? notification.title,
    };
  }

  if (notification.message && notification.message !== notification.title) {
    return {
      label: notification.title,
      subtitle: notification.message,
    };
  }

  return { label: notification.title };
}

export function groupNotificationsByResource(
  notifications: Notification[],
  projects: VirtualizationProject[],
  context?: NotificationActionContext,
): NotificationGroup[] {
  const actionContext = context ?? { projects };
  const role = context?.role;

  const map = new Map<string, NotificationGroup>();

  for (const notification of notifications) {
    const key = notification.subjectId
      ? `subject:${notification.subjectId}`
      : notification.projectId
        ? `project:${notification.projectId}`
        : `single:${notification.id}`;

    const { label, subtitle } = resolveGroupLabel(notification, projects);
    const actionable = isActionableNotification(notification, actionContext);
    const targetUrl = resolveRoleActionUrl(notification, role) ?? getNotificationTargetUrl(notification);
    const existing = map.get(key);

    if (existing) {
      existing.items.push(notification);
      if (new Date(notification.createdAt) > new Date(existing.latestAt)) {
        existing.latestAt = notification.createdAt;
      }
      existing.hasActionable = existing.hasActionable || actionable;
      if (actionable && targetUrl) {
        existing.targetUrl = targetUrl;
      } else if (!existing.targetUrl && targetUrl) {
        existing.targetUrl = targetUrl;
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
        targetUrl,
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

export function filterAttentionGroups(groups: NotificationGroup[]): NotificationGroup[] {
  return groups.filter((group) => group.hasActionable);
}

export function getNotificationEventLabel(notification: Notification): string {
  switch (notification.eventType) {
    case 'INSTITUTIONAL_REQUEST_CREATED':
      return 'Nueva solicitud';
    case 'INSTITUTIONAL_FACTORY_DELIVERED':
      return 'Entrega Fábrica';
    case 'INSTITUTIONAL_LMS_UPLOAD_COMPLETED':
      return 'Carga LMS';
    case 'INSTITUTIONAL_PLANNING_VALIDATED_INITIAL':
      return 'Validación inicial';
    case 'INSTITUTIONAL_PLANNING_VALIDATED_PRODUCTION':
      return 'Validación producción';
    case 'INSTITUTIONAL_RETURNED_TO_FACTORY':
      return 'Devuelta a Fábrica';
    case 'INSTITUTIONAL_RETURNED_TO_LMS':
      return 'Devuelta a LMS';
    case 'INSTITUTIONAL_RETURNED_TO_PRODUCT':
      return 'Devuelta a Product';
    case 'SUBJECT_CHANGES_REQUESTED':
      return 'Corrección solicitada';
    case 'SUBJECT_REJECTED':
      return 'Asignatura rechazada';
    case 'OBSERVATION_REOPENED':
      return 'Observación reabierta';
    default:
      return notification.title;
  }
}

export function paginateNotificationGroups<T>(groups: T[], page: number, pageSize = NOTIFICATION_PAGE_SIZE): T[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return groups.slice(start, start + pageSize);
}

export function notificationTotalPages(totalItems: number, pageSize = NOTIFICATION_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function notificationSafePage(page: number, totalItems: number, pageSize = NOTIFICATION_PAGE_SIZE): number {
  const totalPages = notificationTotalPages(totalItems, pageSize);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), totalPages);
}

export type NotificationDateBucket = 'today' | 'yesterday' | 'week' | 'older';

export function notificationDateBucket(isoDate: string): NotificationDateBucket {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < RECENT_ACTIVITY_DAYS) return 'week';
  return 'older';
}

export function notificationDateBucketLabel(bucket: NotificationDateBucket): string {
  switch (bucket) {
    case 'today':
      return 'Hoy';
    case 'yesterday':
      return 'Ayer';
    case 'week':
      return 'Esta semana';
    default:
      return 'Anterior';
  }
}

export function groupNotificationsByDateBucket(
  groups: NotificationGroup[],
): Array<{ bucket: NotificationDateBucket; label: string; groups: NotificationGroup[] }> {
  const order: NotificationDateBucket[] = ['today', 'yesterday', 'week', 'older'];
  const map = new Map<NotificationDateBucket, NotificationGroup[]>();
  for (const group of groups) {
    const bucket = notificationDateBucket(group.latestAt);
    const list = map.get(bucket) ?? [];
    list.push(group);
    map.set(bucket, list);
  }
  return order
    .filter((bucket) => map.has(bucket))
    .map((bucket) => ({
      bucket,
      label: notificationDateBucketLabel(bucket),
      groups: map.get(bucket)!,
    }));
}

export function filterActivityGroups(groups: NotificationGroup[]): NotificationGroup[] {
  return groups
    .filter((group) => !group.hasActionable && isRecentActivity(group.latestAt))
    .slice(0, 30);
}

export function filterClearedGroups(groups: NotificationGroup[]): NotificationGroup[] {
  return groups
    .filter((group) => !group.hasActionable && !isRecentActivity(group.latestAt))
    .slice(0, 20);
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
