import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Bell, CheckCheck, Clock3, Loader2, X } from 'lucide-react';
import { ContextLink } from '../../navigation/ContextLink';
import { MetricCard } from '../../components/cards/MetricCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { cn, radius, surface, tableRow, text } from '../../components/ui/tokens';
import { EmptyState } from '../../components/ui/EmptyState';
import { useOperations } from '../../features/operations/OperationsContext';
import { useAuth } from '../auth/AuthContext';
import { OperationalHelp } from '../../components/operational/OperationalHelp';
import { fadeUp, softScale } from '../../components/motion/presets';
import { operationalInboxFlowActionClass } from '../operations-v2/components/OperationalInboxFlowAction';
import { OperationalInboxPagination } from '../operations-v2/components/OperationalInboxPagination';
import {
  filterActivityGroups,
  filterAttentionGroups,
  filterClearedGroups,
  formatRelativeTime,
  getNotificationEventLabel,
  getNotificationPreview,
  groupNotificationsByDateBucket,
  groupNotificationsByResource,
  isVisibleNotification,
  NOTIFICATION_MAX_LOADED,
  NOTIFICATION_PAGE_SIZE,
  notificationSafePage,
  notificationTotalPages,
  paginateNotificationGroups,
  type NotificationGroup,
} from '../operations/notificationInbox';
import type { Notification } from '../../types/domain';

type InboxView = 'attention' | 'activity' | 'cleared';

const EMPTY_INBOX_TITLE = 'Sin notificaciones disponibles';
const EMPTY_INBOX_DESCRIPTION =
  'No hay notificaciones para tu usuario o rol. Si esperabas ver alertas, confirma que tu sesión coincide con el destinatario (rol o usuario) en el sistema.';
const EMPTY_INBOX_DESCRIPTION_ADMIN =
  'No hay alertas recientes en el sistema. Cuando los roles operativos reciban novedades, aparecerán aquí para supervisión.';

export function NotificationsPage() {
  const { role, user } = useAuth();
  const {
    notifications,
    notificationSummary,
    hasMoreNotifications,
    projects,
    loadNotifications,
    markNotificationsReadByResource,
    markAllNotificationsReadFromApi,
    dismissNotifications,
    isLoadingNotifications,
    notificationsError,
    backendEnabled,
  } = useOperations();

  const [view, setView] = useState<InboxView>('attention');
  const [page, setPage] = useState(1);
  const [isClearing, setIsClearing] = useState(false);
  const didAutoSwitchView = useRef(false);

  useEffect(() => {
    if (!backendEnabled) return;
    void loadNotifications();
  }, [backendEnabled]);

  useEffect(() => {
    setPage(1);
  }, [view]);

  const actionContext = useMemo(() => ({ projects, role }), [projects, role]);

  const visible = useMemo(
    () => notifications.filter((n) => isVisibleNotification(n, role, user?.id)),
    [notifications, role, user?.id],
  );

  const groups = useMemo(
    () => groupNotificationsByResource(visible, projects, actionContext),
    [visible, projects, actionContext],
  );

  const attentionGroups = useMemo(() => filterAttentionGroups(groups), [groups]);
  const activityGroups = useMemo(() => filterActivityGroups(groups), [groups]);
  const clearedGroups = useMemo(() => filterClearedGroups(groups), [groups]);

  const summary = useMemo(
    () =>
      notificationSummary ?? {
        actionableCount: attentionGroups.length,
        unreadCount: visible.filter((n) => !n.read).length,
        inboxCount: visible.length,
      },
    [notificationSummary, attentionGroups.length, visible],
  );

  useEffect(() => {
    if (didAutoSwitchView.current || isLoadingNotifications) return;
    if (attentionGroups.length === 0 && activityGroups.length > 0) {
      setView('activity');
      didAutoSwitchView.current = true;
    }
  }, [isLoadingNotifications, attentionGroups.length, activityGroups.length]);

  const inboxLoadedEmpty =
    !isLoadingNotifications && !notificationsError && notifications.length === 0;

  const recipientFilterMismatch =
    !isLoadingNotifications &&
    !notificationsError &&
    notifications.length > 0 &&
    visible.length === 0;

  const activeGroups =
    view === 'attention' ? attentionGroups : view === 'activity' ? activityGroups : clearedGroups;

  const safePage = useMemo(
    () => notificationSafePage(page, activeGroups.length),
    [page, activeGroups.length],
  );
  const totalPages = useMemo(
    () => notificationTotalPages(activeGroups.length),
    [activeGroups.length],
  );
  const pagedGroups = useMemo(
    () => paginateNotificationGroups(activeGroups, safePage),
    [activeGroups, safePage],
  );
  const dateBuckets = useMemo(
    () => (view === 'activity' ? groupNotificationsByDateBucket(pagedGroups) : []),
    [view, pagedGroups],
  );

  const unreadInActiveTab = useMemo(
    () => activeGroups.filter((group) => group.items.some((item) => !item.read)).length,
    [activeGroups],
  );

  const atLoadCap = notifications.length >= NOTIFICATION_MAX_LOADED;

  const handleOpenResource = (group: NotificationGroup) => {
    if (!group.targetUrl) return;
    void markNotificationsReadByResource({
      projectId: group.projectId,
      subjectId: group.subjectId,
    });
  };

  const handleDismissGroup = (group: NotificationGroup) => {
    const unreadIds = group.items.filter((item) => !item.read).map((item) => item.id);
    void dismissNotifications(
      unreadIds.length > 0
        ? { ids: unreadIds }
        : { projectId: group.projectId, subjectId: group.subjectId },
    );
  };

  const handleLoadMore = () => {
    if (atLoadCap) return;
    void loadNotifications({ offset: notifications.length, append: true });
  };

  const handleClearTab = async () => {
    setIsClearing(true);
    try {
      await markAllNotificationsReadFromApi();
      await loadNotifications();
      setPage(1);
    } finally {
      setIsClearing(false);
    }
  };

  const switchView = (next: InboxView) => {
    setView(next);
    setPage(1);
  };

  const isAdminSupervision = role === 'ADMIN';

  return (
    <div className="space-y-6">
      <PageHeader
        roleAccent={
          role === 'PLANEACION'
            ? 'planning'
            : role === 'LMS'
              ? 'lms'
              : role === 'FABRICA'
                ? 'factory'
                : role === 'ADMIN'
                  ? 'product'
                  : 'product'
        }
        eyebrow={isAdminSupervision ? 'Supervisión institucional' : 'Centro de alertas'}
        title={isAdminSupervision ? 'Alertas del sistema' : 'Bandeja operacional'}
        description={
          isAdminSupervision
            ? 'Vista transversal de novedades por rol. Puedes revisar contexto y navegar al programa, sin modificar la bandeja de otros equipos.'
            : 'Máximo 8 novedades por página. La actividad reciente se conserva 3 días; las informativas antiguas se archivan automáticamente.'
        }
      />

      <OperationalHelp topic="notifications" />

      {isLoadingNotifications && visible.length === 0 ? (
        <Card variant="roleGlass" className="flex items-center gap-3 p-4 text-sm font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          Cargando bandeja...
        </Card>
      ) : null}

      {notificationsError ? (
        <Card variant="roleGlass" className="flex items-center justify-between gap-3 border-rose-200/60 bg-rose-50/30 p-4">
          <p className="text-sm font-bold text-rose-700">{notificationsError}</p>
          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200 backdrop-blur-sm"
          >
            Reintentar
          </button>
        </Card>
      ) : null}

      {inboxLoadedEmpty ? (
        <EmptyState
          icon={Bell}
          title={EMPTY_INBOX_TITLE}
          description={isAdminSupervision ? EMPTY_INBOX_DESCRIPTION_ADMIN : EMPTY_INBOX_DESCRIPTION}
          cardVariant="roleGlass"
        />
      ) : null}

      {recipientFilterMismatch ? (
        <Card variant="roleGlass" className="border-amber-200/60 bg-amber-50/25 p-4">
          <p className="text-sm font-bold text-amber-800">
            El servidor devolvió {notifications.length} notificación(es), pero ninguna coincide con tu
            usuario o rol ({role}).
          </p>
        </Card>
      ) : null}

      {!inboxLoadedEmpty && visible.length > 0 ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              compact
              label="Requieren atención"
              value={attentionGroups.length}
              icon={AlertTriangle}
              tone="text-orange-500"
              active={view === 'attention'}
              onClick={() => switchView('attention')}
            />
            <MetricCard
              compact
              label="Actividad reciente"
              value={activityGroups.length}
              icon={Clock3}
              tone="text-orange-600"
              active={view === 'activity'}
              onClick={() => switchView('activity')}
            />
            <MetricCard
              compact
              label="Archivadas"
              value={clearedGroups.length}
              icon={Bell}
              tone="text-orange-500"
              active={view === 'cleared'}
              onClick={() => switchView('cleared')}
            />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={cn('inline-flex p-1', surface.roleGlassTab, radius.control)}>
              <TabButton active={view === 'attention'} onClick={() => switchView('attention')}>
                Requiere atención ({attentionGroups.length})
              </TabButton>
              <TabButton active={view === 'activity'} onClick={() => switchView('activity')}>
                Actividad reciente ({activityGroups.length})
              </TabButton>
              <TabButton active={view === 'cleared'} onClick={() => switchView('cleared')}>
                Archivadas ({clearedGroups.length})
              </TabButton>
            </div>

            {unreadInActiveTab > 0 && !isAdminSupervision ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                loading={isClearing}
                onClick={() => void handleClearTab()}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar pestaña como leída
              </Button>
            ) : null}
          </div>

          {activeGroups.length === 0 ? (
            <EmptyState
              icon={view === 'attention' ? AlertTriangle : view === 'activity' ? Clock3 : Bell}
              title={
                view === 'attention'
                  ? 'Sin alertas pendientes'
                  : view === 'activity'
                    ? 'Sin actividad reciente'
                    : 'Sin novedades archivadas'
              }
              description={
                view === 'attention'
                  ? 'No hay acciones urgentes para tu rol. Revisa actividad reciente o continúa desde tu dashboard.'
                  : view === 'activity'
                    ? 'Las actualizaciones de los últimos 7 días aparecerán aquí cuando existan.'
                    : 'Las notificaciones leídas fuera de la ventana reciente se listan aquí (máx. 20).'
              }
              cardVariant="roleGlass"
            />
          ) : view === 'attention' ? (
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-2">
                {pagedGroups.map((notificationGroup) => (
                  <AttentionGroupCard
                    key={notificationGroup.key}
                    notificationGroup={notificationGroup}
                    onOpen={handleOpenResource}
                    onDismiss={isAdminSupervision ? undefined : handleDismissGroup}
                    showRoleTarget={isAdminSupervision}
                  />
                ))}
              </div>
            </div>
          ) : (
            <NotificationCompactTable
              buckets={view === 'activity' ? dateBuckets : [{ bucket: 'older' as const, label: '', groups: pagedGroups }]}
              onOpen={handleOpenResource}
              onDismiss={isAdminSupervision ? undefined : handleDismissGroup}
              showDateHeaders={view === 'activity'}
              showRoleTarget={isAdminSupervision}
            />
          )}

          <OperationalInboxPagination
            page={safePage}
            totalPages={totalPages}
            totalItems={activeGroups.length}
            pageSize={NOTIFICATION_PAGE_SIZE}
            itemLabel={{ one: 'novedad', other: 'novedades' }}
            onPageChange={setPage}
          />

          {hasMoreNotifications && !atLoadCap ? (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={isLoadingNotifications}
                onClick={handleLoadMore}
              >
                Cargar historial adicional
              </Button>
            </div>
          ) : null}

          {atLoadCap ? (
            <p className="text-center text-[11px] font-medium text-slate-400">
              Límite de {NOTIFICATION_MAX_LOADED} notificaciones en memoria. Las más antiguas ya no se muestran.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3.5 py-2 text-xs font-semibold transition-all',
        active
          ? 'bg-white/75 text-orange-700 shadow-sm ring-1 ring-orange-200/80 backdrop-blur-sm'
          : 'text-slate-600 hover:bg-white/45 hover:text-slate-800',
      )}
    >
      {children}
    </button>
  );
}

function AttentionGroupCard({
  notificationGroup,
  onOpen,
  onDismiss,
  showRoleTarget = false,
}: {
  notificationGroup: NotificationGroup;
  onOpen: (group: NotificationGroup) => void;
  onDismiss?: (group: NotificationGroup) => void;
  showRoleTarget?: boolean;
}) {
  const latest = notificationGroup.items.find((item) => !item.read) ?? notificationGroup.items[0];
  const type = latest.type ?? 'ACTION';
  const accent =
    type === 'CRITICAL'
      ? 'border-l-rose-500'
      : type === 'DEADLINE'
        ? 'border-l-amber-500'
        : 'border-l-orange-500';

  return (
    <motion.div {...fadeUp} {...softScale}>
      <Card variant="roleGlass" className={cn('overflow-hidden border-l-[5px]', accent)}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {notificationGroup.subtitle ?? 'Operación'}
                {showRoleTarget && latest.roleTarget ? (
                  <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                    {latest.roleTarget}
                  </span>
                ) : null}
              </p>
              <h3 className="mt-0.5 text-sm font-bold text-slate-900">{notificationGroup.label}</h3>
              <p className="mt-1.5 line-clamp-2 text-xs font-medium text-slate-600">
                {getNotificationPreview(latest)}
              </p>
            </div>
            {onDismiss ? (
              <button
                type="button"
                onClick={() => onDismiss(notificationGroup)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-600"
                title="Descartar"
                aria-label="Descartar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-slate-400">
              {formatRelativeTime(notificationGroup.latestAt)}
              {notificationGroup.items.length > 1 ? ` · ${notificationGroup.items.length} eventos` : ''}
            </span>
            {notificationGroup.targetUrl ? (
              <ContextLink
                to={notificationGroup.targetUrl}
                onClick={() => onOpen(notificationGroup)}
                className={cn(operationalInboxFlowActionClass, 'text-[10px]')}
              >
                Ir a resolver
                <ArrowRight className="h-3 w-3" />
              </ContextLink>
            ) : null}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function NotificationCompactTable({
  buckets,
  onOpen,
  onDismiss,
  showDateHeaders,
  showRoleTarget = false,
}: {
  buckets: Array<{ bucket: string; label: string; groups: NotificationGroup[] }>;
  onOpen: (group: NotificationGroup) => void;
  onDismiss?: (group: NotificationGroup) => void;
  showDateHeaders: boolean;
  showRoleTarget?: boolean;
}) {
  return (
    <Card variant="roleGlass" className="overflow-hidden p-0">
      <div className={cn('px-5 py-3 sm:px-6', surface.table)}>
        <p className={text.label}>Historial</p>
        <h2 className="text-sm font-semibold text-slate-900">Novedades por programa</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className={cn('text-[10px] font-bold uppercase tracking-wider text-slate-400', surface.roleGlassTableHead)}>
              <th className="px-5 py-2.5 sm:px-6">Programa</th>
              <th className="px-3 py-2.5">Novedad</th>
              <th className="px-3 py-2.5">Cuándo</th>
              <th className="px-3 py-2.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {buckets.map((bucket) => (
              <BucketRows
                key={bucket.label || 'all'}
                bucketLabel={showDateHeaders ? bucket.label : null}
                groups={bucket.groups}
                onOpen={onOpen}
                onDismiss={onDismiss}
                showRoleTarget={showRoleTarget}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BucketRows({
  bucketLabel,
  groups,
  onOpen,
  onDismiss,
  showRoleTarget = false,
}: {
  bucketLabel: string | null;
  groups: NotificationGroup[];
  onOpen: (group: NotificationGroup) => void;
  onDismiss?: (group: NotificationGroup) => void;
  showRoleTarget?: boolean;
}) {
  return (
    <>
      {bucketLabel ? (
        <tr className="bg-orange-50/40">
          <td colSpan={4} className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-orange-700 sm:px-6">
            {bucketLabel}
          </td>
        </tr>
      ) : null}
      {groups.map((group) => (
        <CompactNotificationRow
          key={group.key}
          group={group}
          onOpen={onOpen}
          onDismiss={onDismiss}
          showRoleTarget={showRoleTarget}
        />
      ))}
    </>
  );
}

function CompactNotificationRow({
  group,
  onOpen,
  onDismiss,
  showRoleTarget = false,
}: {
  group: NotificationGroup;
  onOpen: (group: NotificationGroup) => void;
  onDismiss?: (group: NotificationGroup) => void;
  showRoleTarget?: boolean;
}) {
  const latest = group.items[0] as Notification;
  const eventLabel = getNotificationEventLabel(latest);
  const unreadCount = group.items.filter((item) => !item.read).length;

  return (
    <tr className={tableRow}>
      <td className="px-5 py-2.5 sm:px-6">
        <p className="text-[10px] font-bold uppercase text-slate-400">
          {group.subtitle ?? '—'}
          {showRoleTarget && latest.roleTarget ? (
            <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
              {latest.roleTarget}
            </span>
          ) : null}
        </p>
        <p className="text-sm font-bold text-slate-900">{group.label}</p>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-slate-100/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            {eventLabel}
          </span>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
              {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs font-medium text-slate-500">
        {formatRelativeTime(group.latestAt)}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1">
          {onDismiss ? (
            <button
              type="button"
              onClick={() => onDismiss(group)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-600"
              title="Descartar"
              aria-label="Descartar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {group.targetUrl ? (
            <ContextLink
              to={group.targetUrl}
              onClick={() => onOpen(group)}
              className={cn(operationalInboxFlowActionClass, 'text-[10px]')}
            >
              Ver detalle
              <ArrowRight className="h-3 w-3" />
            </ContextLink>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
