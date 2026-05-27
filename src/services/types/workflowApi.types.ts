import type { Priority, Role } from '../../types/domain';

export type ApiObservationStatus = 'ABIERTA' | 'EN_CORRECCION' | 'RESUELTA';
export type ApiRelatedEntityType = 'PROJECT' | 'SUBJECT' | 'TOPIC' | 'CHECKLIST_ITEM';

export interface ApiObservationAuthor {
  id?: string;
  name?: string;
  email?: string;
  role?: Role;
}

export interface ApiObservationMessage {
  id: string;
  message?: string;
  text?: string;
  author?: ApiObservationAuthor | null;
  createdAt: string;
}

export interface ApiObservation {
  id: string;
  projectId: string;
  subjectId?: string | null;
  topicId?: string | null;
  checklistItemId?: string | null;
  author?: ApiObservationAuthor | null;
  role?: Role;
  text: string;
  status: ApiObservationStatus | string;
  notificationStatus?: 'PENDING' | 'SENT';
  correctionNotificationStatus?: 'PENDING' | 'SENT' | null;
  relatedEntityType?: ApiRelatedEntityType | string | null;
  relatedEntityId?: string | null;
  relatedEntity?: string | null;
  priority?: Priority;
  messages?: ApiObservationMessage[];
  createdAt: string;
  updatedAt?: string;
}

export interface ApiCreateObservationPayload {
  projectId: string;
  subjectId?: string;
  topicId?: string;
  checklistItemId?: string;
  relatedEntityType: ApiRelatedEntityType;
  relatedEntityId: string;
  text: string;
  priority: Priority;
}

export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  userId?: string | null;
  roleTarget?: Role;
  type?: 'INFO' | 'ACTION' | 'DEADLINE' | 'CRITICAL' | string;
  entityType?: string | null;
  entityId?: string | null;
  projectId?: string | null;
  subjectId?: string | null;
  eventType?: string | null;
  actionUrl?: string | null;
  readAt?: string | null;
  severity?: string | null;
  isRead: boolean;
  createdAt: string;
}
