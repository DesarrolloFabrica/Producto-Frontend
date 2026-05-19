import type { OperationalHealthStatus, OperationalSeverity } from './operationalTypes';

export type VisualSeverity = 'healthy' | 'info' | 'attention' | 'urgent' | 'blocking' | 'critical';

export const severityStyles: Record<VisualSeverity, { badge: string; card: string; accent: string; icon: string; glow: string; label: string }> = {
  healthy: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    card: 'border-emerald-100/80 bg-emerald-50/20',
    accent: 'bg-emerald-400',
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    glow: 'shadow-emerald-500/5',
    label: 'Saludable',
  },
  info: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-100',
    card: 'border-sky-100/80 bg-sky-50/15',
    accent: 'bg-sky-400',
    icon: 'bg-sky-50 text-sky-600 ring-sky-100',
    glow: 'shadow-sky-500/5',
    label: 'Info',
  },
  attention: {
    badge: 'bg-orange-50 text-orange-700 ring-orange-100',
    card: 'border-orange-100/90 bg-orange-50/20',
    accent: 'bg-orange-400',
    icon: 'bg-orange-50 text-orange-600 ring-orange-100',
    glow: 'shadow-orange-500/8',
    label: 'Atencion',
  },
  urgent: {
    badge: 'bg-amber-50 text-amber-800 ring-amber-100',
    card: 'border-amber-100/90 bg-amber-50/25',
    accent: 'bg-amber-400',
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    glow: 'shadow-amber-500/10',
    label: 'Urgente',
  },
  blocking: {
    badge: 'bg-orange-50 text-orange-800 ring-orange-200/80',
    card: 'border-orange-200/80 bg-orange-50/25',
    accent: 'bg-orange-500',
    icon: 'bg-orange-50 text-orange-700 ring-orange-200/80',
    glow: 'shadow-orange-500/12',
    label: 'Bloqueante',
  },
  critical: {
    badge: 'bg-rose-50 text-rose-800 ring-rose-200/80',
    card: 'border-rose-200/80 bg-rose-50/20 shadow-[0_18px_45px_-36px_rgba(190,18,60,0.45)]',
    accent: 'bg-rose-500',
    icon: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    glow: 'shadow-rose-500/12',
    label: 'Critico',
  },
};

export function visualSeverityFromOperational(severity?: OperationalSeverity): VisualSeverity {
  if (severity === 'critical') return 'critical';
  if (severity === 'blocking') return 'blocking';
  if (severity === 'urgent') return 'urgent';
  if (severity === 'attention') return 'attention';
  if (severity === 'completed') return 'healthy';
  return 'info';
}

export function visualSeverityFromHealth(healthStatus: OperationalHealthStatus): VisualSeverity {
  if (healthStatus === 'critico') return 'critical';
  if (healthStatus === 'bloqueado') return 'blocking';
  if (healthStatus === 'en_riesgo') return 'urgent';
  return 'healthy';
}
