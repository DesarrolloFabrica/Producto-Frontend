import type { Notification } from '../../types/domain';

function isModificationNotification(notification: Notification, projectId: string): boolean {
  if (notification.read) return false;
  if (notification.projectId !== projectId) return false;
  const title = notification.title?.toLowerCase() ?? '';
  const message = notification.message?.toLowerCase() ?? '';
  return title.includes('modific') || message.includes('agregó') || message.includes('agrego');
}

export function getProjectModificationLabel(
  notifications: Notification[],
  projectId: string,
): string | null {
  const notification = notifications.find((item) => isModificationNotification(item, projectId));
  if (!notification) return null;

  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (text.includes('semestre')) return 'Semestre agregado';
  if (text.includes('asignatura')) return 'Asignatura agregada';
  if (text.includes('tema')) return 'Tema agregado';
  return 'Modificación reciente de Product';
}
