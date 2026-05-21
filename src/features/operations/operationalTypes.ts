import type { Role } from '../../types/domain';

export type OperationalSeverity = 'critical' | 'blocking' | 'urgent' | 'attention' | 'info' | 'completed';
export type OperationalHealthStatus = 'saludable' | 'en_riesgo' | 'bloqueado' | 'critico';

export type OperationalEntityType = 'project' | 'subject' | 'checklist' | 'observation' | 'notification' | 'audit';

export interface OperationalInsight {
  id: string;
  entityType: OperationalEntityType;
  entityId: string;
  title: string;
  description: string;
  severity: OperationalSeverity;
  nextAction: string;
  responsibleRole: Role;
  impact: string;
  dependency?: string;
  projectId?: string;
  subjectId?: string;
  targetRoute?: string;
  targetContext?: {
    type: 'project' | 'subject' | 'link' | 'observation' | 'notification' | 'checklist';
    id: string;
  };
}

export interface OperationalBlocker {
  id: string;
  title: string;
  reason: string;
  impact: string;
  requiredAction: string;
  blockedEntityType: 'project' | 'subject' | 'checklist';
  blockedEntityId: string;
  responsibleRole: Role;
  severity: Extract<OperationalSeverity, 'critical' | 'blocking' | 'urgent'>;
  projectId?: string;
  subjectId?: string;
  targetRoute?: string;
  targetContext?: {
    type: 'project' | 'subject' | 'checklist';
    id: string;
  };
}

export interface OperationalNextStep {
  title: string;
  description: string;
  actionLabel: string;
  responsibleRole: Role;
  impact: string;
  dependency?: string;
  severity?: OperationalSeverity;
  targetRoute?: string;
  targetContext?: {
    type: 'project' | 'subject' | 'link' | 'observation' | 'notification' | 'checklist';
    id: string;
  };
}

export interface NotificationRequiredAction {
  action: string;
  impact: string;
  affectedEntity: string;
}

export type NotificationOperationalState = 'nueva' | 'vista' | 'en_proceso' | 'resuelta';

export interface AuditOperationalImpact {
  change: string;
  importance: string;
  consequence: string;
}

export interface ActivityOperationalImpact {
  label: string;
  impact: string;
  severity: OperationalSeverity;
}

export interface OperationalHealthSummary {
  healthStatus: OperationalHealthStatus;
  title: string;
  description: string;
  reason: string;
  nextAction: string;
  severity: OperationalSeverity;
}
