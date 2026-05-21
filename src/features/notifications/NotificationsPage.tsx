import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Bell, CheckCircle2, Clock3, Eye, Check, ArrowRight, CalendarDays, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../../components/cards/MetricCard';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { cn } from '../../components/ui/tokens';
import { EmptyState } from '../../components/ui/EmptyState';
import { useOperations } from '../../features/operations/OperationsContext';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';
import { useToast } from '../../components/ui/ToastProvider';
import type { Notification } from '../../types/domain';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../auth/AuthContext';
import { OperationalHelp } from '../../components/operational/OperationalHelp';
import { getNotificationOperationalState, getNotificationRequiredAction } from '../operations/operationalRules';
import { severityStyles } from '../operations/severityStyles';
import { fadeUp, softScale } from '../../components/motion/presets';

type Filter = 'ALL' | 'NEW' | 'READ' | 'CRITICAL';

const filterLabels: Record<Filter, string> = { ALL: 'Todas', NEW: 'Nuevas', READ: 'Leídas', CRITICAL: 'Críticas' };

const leftAccent: Record<NonNullable<Notification['type']>, string> = {
  INFO: 'border-l-[6px] border-l-[#3B82F6]',
  ACTION: 'border-l-[6px] border-l-[#FF6B00]',
  DEADLINE: 'border-l-[6px] border-l-[#F59E0B]',
  CRITICAL: 'border-l-[6px] border-l-rose-500',
};

const typePill: Record<NonNullable<Notification['type']>, string> = {
  INFO: 'bg-blue-50 text-blue-700 ring-blue-100',
  ACTION: 'bg-orange-50 text-orange-700 ring-orange-100',
  DEADLINE: 'bg-amber-50 text-amber-700 ring-amber-100',
  CRITICAL: 'bg-rose-50 text-rose-800 ring-rose-200/80',
};

const typeIconBg: Record<NonNullable<Notification['type']>, string> = {
  INFO: 'bg-blue-500/10 text-blue-600',
  ACTION: 'bg-[#FF6B00]/10 text-[#FF6B00]',
  DEADLINE: 'bg-amber-500/10 text-amber-600',
  CRITICAL: 'bg-rose-500/10 text-rose-700',
};

export function NotificationsPage() {
  const { role } = useAuth();
  const { notifications, projects, markNotificationRead } = useOperations();
  const { openContextPanel } = useContextPanel();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>('ALL');
  const visible = notifications.filter((notification) => notification.roleTarget === role || role === 'ADMIN');
  const sorted = [...visible].sort((a, b) => {
    const stateRank = notificationPriorityRank(getNotificationOperationalState(a, projects)) - notificationPriorityRank(getNotificationOperationalState(b, projects));
    if (stateRank !== 0) return stateRank;
    const typeRank = notificationTypeRank(a.type) - notificationTypeRank(b.type);
    if (typeRank !== 0) return typeRank;
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const filtered = sorted.filter(
    (notification) =>
      filter === 'ALL' || (filter === 'NEW' && !notification.read) || (filter === 'READ' && notification.read) || (filter === 'CRITICAL' && notification.type === 'CRITICAL'),
  );

  const hasUnread = visible.some((n) => !n.read);
  const criticalCount = visible.filter((n) => n.type === 'CRITICAL' && !n.read).length;

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    showToast('Notificación marcada como leída');
  };

  const handleMarkAllRead = () => {
    visible.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
    showToast('Todas las notificaciones marcadas como leídas');
  };

  const handleContext = (notification: Notification) => {
    openContextPanel('notification', notification.id, { notification });
  };

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow="Centro de alertas"
        title="Centro de acciones"
        description="Bandeja operacional de novedades, acciones requeridas, vencimientos y eventos críticos por rol."
      />
      <OperationalHelp topic="notifications" />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard variant="subjectPanel" label="Total" value={visible.length} icon={Bell} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
        <MetricCard variant="subjectPanel" label="Nuevas" value={visible.filter((item) => !item.read).length} icon={Clock3} tone="text-orange-500" active={filter === 'NEW'} onClick={() => setFilter('NEW')} />
        <MetricCard variant="subjectPanel" label="Críticas" value={criticalCount} icon={AlertTriangle} tone="text-rose-500" active={filter === 'CRITICAL'} onClick={() => setFilter('CRITICAL')} />
        <MetricCard variant="subjectPanel" label="Leídas" value={visible.filter((item) => item.read).length} icon={CheckCircle2} tone="text-emerald-500" active={filter === 'READ'} onClick={() => setFilter('READ')} />
      </section>

      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center rounded-[100px] bg-[#F1F5F9] p-1">
          {(Object.keys(filterLabels) as Filter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                'rounded-[100px] px-4 py-2 text-xs font-medium transition-all duration-200',
                filter === item
                  ? 'border border-[#FF6B00] bg-white text-[#FF6B00] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                  : 'border border-transparent text-[#64748B] hover:text-[#1E293B]',
              )}
            >
              {filterLabels[item]}
            </button>
          ))}
        </div>
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 rounded-[12px] px-3 py-2 text-xs font-medium text-[#64748B] transition-all duration-200 hover:bg-[#F1F5F9] hover:text-[#1E293B]"
          >
            <Check className="h-3.5 w-3.5" /> Marcar todas vistas
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="Sin notificaciones" description="No hay alertas que coincidan con el filtro seleccionado." cardVariant="subjectPanel" />
      ) : (
        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Ordenado por prioridad operacional: requiere accion, seguimiento e informativas</p>
          <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} projects={projects} onContext={handleContext} onMarkRead={handleMarkRead} />
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

function notificationPriorityRank(state: ReturnType<typeof getNotificationOperationalState>) {
  if (state === 'nueva') return 0;
  if (state === 'en_proceso') return 1;
  if (state === 'vista') return 2;
  return 3;
}

function notificationTypeRank(type?: Notification['type']) {
  if (type === 'CRITICAL') return 0;
  if (type === 'DEADLINE') return 1;
  if (type === 'ACTION') return 2;
  return 3;
}

function NotificationCard({
  notification,
  projects,
  onContext,
  onMarkRead,
}: {
  notification: Notification;
  projects: ReturnType<typeof useOperations>['projects'];
  onContext: (notification: Notification) => void;
  onMarkRead: (id: string) => void;
}) {
  const metaType = notification.type ?? 'INFO';
  const accent = leftAccent[metaType];
  const pillStyle = typePill[metaType];
  const iconStyle = typeIconBg[metaType];
  const operationalState = getNotificationOperationalState(notification, projects);
  const requiredAction = getNotificationRequiredAction(notification, projects);
  const visual = severityStyles[metaType === 'CRITICAL' ? 'critical' : metaType === 'DEADLINE' ? 'urgent' : metaType === 'ACTION' ? 'attention' : 'info'];

  return (
    <motion.div {...fadeUp} {...softScale} className={cn('notification-card', notification.type === 'CRITICAL' && !notification.read && 'relative')}>
      <Card
        className={cn(
          'group relative overflow-hidden bg-white rounded-[20px] shadow-[0_4px_18px_-10px_rgba(15,23,42,0.16)] transition-all duration-200 hover:shadow-[0_18px_38_-24px_rgba(249,115,22,0.42)]',
          accent,
        )}
      >
        <div className="flex w-full flex-col">
          <div className="flex items-start gap-3 px-5 pb-3 pt-5 sm:gap-4">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconStyle)}>
              {metaType === 'CRITICAL' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : metaType === 'DEADLINE' ? (
                <Clock3 className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-[#1E293B]">{notification.title}</p>
                  <p className="mt-1.5 text-[0.9rem] font-medium leading-relaxed text-[#64748B]">{notification.message}</p>
                  <p className={cn('mt-3 inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ring-1', visual.badge)}>{notificationCue(metaType, operationalState)}</p>
                  <div className="mt-3 grid gap-2 rounded-2xl bg-orange-50/25 p-3 md:grid-cols-3">
                    <ActionInfo label="Accion requerida" value={requiredAction.action} />
                    <ActionInfo label="Impacto" value={requiredAction.impact} />
                    <ActionInfo label="Entidad" value={requiredAction.affectedEntity} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <span className={cn('rounded-[6px] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] ring-1', pillStyle)}>
                    {metaType === 'INFO' ? 'Info' : metaType === 'ACTION' ? 'Acción' : metaType === 'DEADLINE' ? 'Vence pronto' : 'Crítica'}
                  </span>
                  <span className="rounded-[6px] bg-slate-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-slate-600 ring-1 ring-slate-200">
                    {operationalState.replace('_', ' ')}
                  </span>
                  {!notification.read && (
                    <span className="rounded-[6px] bg-[#FF6B00] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-white">
                      Nueva
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mx-5 h-px bg-[#F1F5F9]" />
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#94A3B8]">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {formatDate(notification.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {notification.roleTarget}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!notification.read && (
                <button
                  type="button"
                  onClick={() => onMarkRead(notification.id)}
                  className="inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium text-[#64748B] transition-all duration-200 hover:bg-[#F1F5F9]"
                >
                  <Check className="h-3 w-3" /> Vista
                </button>
              )}
              <button
                type="button"
                onClick={() => onContext(notification)}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#E2E8F0] px-3 py-1.5 text-[11px] font-medium text-[#64748B] transition-all duration-200 hover:bg-[#F8FAFC]"
              >
                <Eye className="h-3 w-3" /> Vista rápida
              </button>
              {notification.projectId && (
                <Link
                  to={`/projects/${notification.projectId}`}
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#FF6B00] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-[#FF6B00]/20 transition-all duration-200 hover:bg-[#E66000]"
                >
                  Ver proyecto <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ActionInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-[11px] font-bold leading-5 text-slate-700">{value}</p>
    </div>
  );
}

function notificationCue(type: NonNullable<Notification['type']>, state: ReturnType<typeof getNotificationOperationalState>) {
  if (type === 'CRITICAL' || state === 'nueva') return 'requiere revision';
  if (type === 'ACTION') return 'habilita avance';
  if (type === 'DEADLINE') return 'espera respuesta';
  return 'seguimiento informativo';
}
