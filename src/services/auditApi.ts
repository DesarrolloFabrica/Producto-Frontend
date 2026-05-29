import { apiClient } from './apiClient';
import type { Role } from '../types/domain';

export interface ApiAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  action: string;
  userName: string;
  role: Role;
  roleLabel?: string;
  entityTypeLabel?: string;
  previousValue: string;
  newValue: string;
  createdAt: string;
  projectId?: string;
  subjectId?: string;
  semesterId?: string;
  program?: string;
  school?: string;
  semesterNumber?: number;
  subjectName?: string;
  scope?: string;
  summary?: string;
  changeLabel?: string;
  details?: Array<{ label: string; value: string }>;
}

export interface ApiAuditLogStats {
  total: number;
  productCount: number;
  factoryCount: number;
  checklistCount: number;
}

export interface ApiAuditLogList {
  items: ApiAuditLog[];
  hasMore: boolean;
  total: number;
  stats: ApiAuditLogStats;
  page: number;
  pageSize: number;
  totalPages: number;
}

const buildQuery = (params?: Record<string, string | number | undefined>) => {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const auditApi = {
  getLogs: (params?: {
    page?: number;
    limit?: number;
    entityTypes?: string;
    action?: string;
    role?: Role;
  }) => apiClient.get<ApiAuditLogList>(`/audit/logs${buildQuery(params)}`),
};
