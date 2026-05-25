const markedResourceKeys = new Set<string>();

export function buildNotificationResourceKey(params: {
  projectId?: string;
  subjectId?: string;
}): string {
  return `${params.projectId ?? ''}:${params.subjectId ?? ''}`;
}

export function shouldMarkNotificationsRead(params: {
  projectId?: string;
  subjectId?: string;
}): boolean {
  const key = buildNotificationResourceKey(params);
  if (!params.projectId && !params.subjectId) return false;
  if (markedResourceKeys.has(key)) return false;
  markedResourceKeys.add(key);
  return true;
}

export function resetNotificationReadDedup(): void {
  markedResourceKeys.clear();
}
