import { useEffect, useMemo, useState } from 'react';

import { motion } from 'motion/react';

import { AlertTriangle, ArrowRight, Bell, Clock3, Loader2, X } from 'lucide-react';

import { ContextLink } from '../../navigation/ContextLink';

import { MetricCard } from '../../components/cards/MetricCard';

import { Card } from '../../components/ui/Card';

import { PageHeader } from '../../components/ui/PageHeader';

import { cn } from '../../components/ui/tokens';

import { EmptyState } from '../../components/ui/EmptyState';

import { useOperations } from '../../features/operations/OperationsContext';

import { useAuth } from '../auth/AuthContext';

import { OperationalHelp } from '../../components/operational/OperationalHelp';

import { fadeUp, softScale } from '../../components/motion/presets';

import {

  formatRelativeTime,

  groupNotificationsByResource,

  isActionableNotification,

  isVisibleNotification,

  type NotificationGroup,

} from '../operations/notificationInbox';

import type { Notification } from '../../types/domain';

import { notificationsApi } from '../../services/notificationsApi';



type InboxView = 'attention' | 'activity' | 'cleared';



export function NotificationsPage() {

  const { role, user } = useAuth();

  const {

    notifications,

    notificationSummary,

    hasMoreNotifications,

    projects,

    loadNotifications,

    markNotificationsReadByResource,

    dismissNotifications,

    isLoadingNotifications,

    notificationsError,

    backendEnabled,

  } = useOperations();



  const [view, setView] = useState<InboxView>('attention');



  useEffect(() => {

    if (!backendEnabled) return;

    void (async () => {

      await notificationsApi.dismissInformative().catch(() => undefined);

      await loadNotifications();

    })();

  }, [backendEnabled, loadNotifications]);



  const actionContext = useMemo(() => ({ projects, role }), [projects, role]);

  const visible = useMemo(

    () => notifications.filter((n) => isVisibleNotification(n, role, user?.id)),

    [notifications, role, user?.id],

  );



  const actionable = useMemo(

    () => visible.filter((n) => isActionableNotification(n, actionContext)),

    [visible, actionContext],

  );



  const groups = useMemo(

    () => groupNotificationsByResource(visible, projects, actionContext),

    [visible, projects, actionContext],

  );



  const clearedGroups = useMemo(
    () => groups.filter((g) => !g.hasActionable),
    [groups],
  );

  const activityGroups = useMemo(
    () => groups.filter((g) => !g.hasActionable || g.items.every((n) => n.read)),
    [groups],
  );



  const attentionGroups = useMemo(

    () => groups.filter((g) => g.hasActionable),

    [groups],

  );



  const summary = notificationSummary ?? {

    actionableCount: actionable.length,

    unreadCount: visible.filter((n) => !n.read).length,

    inboxCount: visible.length,

  };



  useEffect(() => {

    if (summary.actionableCount === 0 && view === 'attention') {

      setView('activity');

    }

  }, [summary.actionableCount, view]);



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

    // Context mantiene su propio cursor/offset
    void loadNotifications();

  };



  return (

    <div className="space-y-7">

      <PageHeader

        prominentEyebrow

        eyebrow="Centro de alertas"

        title="Bandeja operacional"

        description="Solo ves lo que requiere acción o la actividad reciente de los últimos 7 días. Al entrar a un proyecto o asignatura, las alertas se archivan solas."

      />

      <OperationalHelp topic="notifications" />



      {isLoadingNotifications && visible.length === 0 && (

        <Card variant="subjectPanel" className="flex items-center gap-3 p-4 text-sm font-bold text-slate-500">

          <Loader2 className="h-4 w-4 animate-spin" /> Cargando bandeja...

        </Card>

      )}



      {notificationsError && (

        <Card variant="subjectPanel" className="flex items-center justify-between gap-3 border-rose-100 bg-rose-50/40 p-4">

          <p className="text-sm font-bold text-rose-700">{notificationsError}</p>

          <button

            type="button"

            onClick={() => void loadNotifications()}

            className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200"

          >

            Reintentar

          </button>

        </Card>

      )}



      <section className="grid gap-4 md:grid-cols-3">

        <MetricCard

          variant="subjectPanel"

          label="Requieren atención"

          value={summary.actionableCount}

          icon={AlertTriangle}

          tone="text-orange-500"

          active={view === 'attention'}

          onClick={() => setView('attention')}

        />

        <MetricCard

          variant="subjectPanel"

          label="Actividad reciente"

          value={summary.inboxCount}

          icon={Clock3}

          tone="text-sky-500"

          active={view === 'activity'}

          onClick={() => setView('activity')}

        />

        <MetricCard
          variant="subjectPanel"
          label="Sin pendientes"
          value={clearedGroups.length}
          icon={Bell}
          tone="text-emerald-500"
          active={view === 'cleared'}
          onClick={() => setView('cleared')}
        />

      </section>



      <div className="inline-flex items-center rounded-[100px] bg-[#F1F5F9] p-1">

        <TabButton active={view === 'attention'} onClick={() => setView('attention')}>

          Requiere atención ({summary.actionableCount})

        </TabButton>

        <TabButton active={view === 'activity'} onClick={() => setView('activity')}>
          Actividad reciente
        </TabButton>
        <TabButton active={view === 'cleared'} onClick={() => setView('cleared')}>
          Sin pendientes ({clearedGroups.length})
        </TabButton>
      </div>

      {view === 'attention' ? (

        attentionGroups.length === 0 ? (

          <EmptyState

            icon={Bell}

            title="Sin alertas pendientes"

            description="No hay acciones urgentes. Revisa la actividad reciente o continúa desde el dashboard."

            cardVariant="subjectPanel"

          />

        ) : (

          <div className="grid gap-4 lg:grid-cols-2">

            {attentionGroups.map((group) => (

              <AttentionGroupCard
                key={group.key}
                group={group}
                onOpen={handleOpenResource}
                onDismiss={handleDismissGroup}
              />

            ))}

          </div>

        )

      ) : view === 'activity' ? (
        activityGroups.length === 0 ? (
          <EmptyState
            icon={Clock3}
            title="Sin actividad reciente"
            description="Las actualizaciones informativas se archivan automáticamente. Solo conservamos los últimos 7 días."
            cardVariant="subjectPanel"
          />
        ) : (
          <div className="space-y-3">
            {activityGroups.map((group) => (
              <ActivityGroupRow
                key={group.key}
                group={group}
                onOpen={handleOpenResource}
                onDismiss={handleDismissGroup}
              />
            ))}
          </div>
        )
      ) : clearedGroups.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sin novedades informativas"
          description="Aquí aparecen las actualizaciones que ya no requieren acción: aprobaciones, cambios resueltos o actividad archivada."
          cardVariant="subjectPanel"
        />
      ) : (
        <div className="space-y-3">
          {clearedGroups.map((group) => (
            <ActivityGroupRow
              key={group.key}
              group={group}
              onOpen={handleOpenResource}
              onDismiss={handleDismissGroup}
            />
          ))}
        </div>
      )}



      {hasMoreNotifications && (

        <div className="flex justify-center pt-2">

          <button

            type="button"

            onClick={handleLoadMore}

            disabled={isLoadingNotifications}

            className="inline-flex items-center gap-2 rounded-[12px] bg-white px-4 py-2.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"

          >

            {isLoadingNotifications ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}

            Cargar actividad anterior

          </button>

        </div>

      )}

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

        'rounded-[100px] px-4 py-2 text-xs font-medium transition-all duration-200',

        active

          ? 'border border-[#FF6B00] bg-white text-[#FF6B00] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'

          : 'border border-transparent text-[#64748B] hover:text-[#1E293B]',

      )}

    >

      {children}

    </button>

  );

}



function AttentionGroupCard({

  group,

  onOpen,

  onDismiss,

}: {

  group: NotificationGroup;

  onOpen: (group: NotificationGroup) => void;

  onDismiss: (group: NotificationGroup) => void;

}) {

  const latest = group.items.find((item) => isActionableNotification(item)) ?? group.items[0];

  const type = latest.type ?? 'ACTION';

  const accent =

    type === 'CRITICAL'

      ? 'border-l-rose-500'

      : type === 'DEADLINE'

        ? 'border-l-amber-500'

        : 'border-l-[#FF6B00]';



  return (

    <motion.div {...fadeUp} {...softScale}>

      <Card

        className={cn(

          'overflow-hidden rounded-[20px] border-none bg-white shadow-[0_4px_18px_-10px_rgba(15,23,42,0.16)]',

          'border-l-[6px]',

          accent,

        )}

      >

        <div className="p-5">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">

                {group.subtitle ?? 'Operación'}

              </p>

              <h3 className="mt-1 text-base font-bold text-slate-900">{group.label}</h3>

              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{latest.message}</p>

            </div>

            <div className="flex shrink-0 items-start gap-2">
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-orange-700 ring-1 ring-orange-100">

              {type === 'CRITICAL' ? 'Urgente' : 'Acción'}

              </span>

              <button
                type="button"
                onClick={() => onDismiss(group)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title="Descartar notificación"
                aria-label="Descartar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

          </div>



          <div className="mt-4 flex items-center justify-between gap-3">

            <span className="text-[11px] font-medium text-slate-400">

              {formatRelativeTime(group.latestAt)}

              {group.items.length > 1 ? ` · ${group.items.length} actualizaciones` : ''}

            </span>

            {group.hasActionable && group.targetUrl ? (

              <ContextLink

                to={group.targetUrl}

                onClick={() => onOpen(group)}

                className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#FF6B00] px-3 py-2 text-[11px] font-semibold text-white shadow-lg shadow-[#FF6B00]/20 transition hover:bg-[#E66000]"

              >

                Ir a resolver <ArrowRight className="h-3 w-3" />

              </ContextLink>

            ) : group.targetUrl ? (

              <ContextLink

                to={group.targetUrl}

                className="inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100"

              >

                Ver historial <ArrowRight className="h-3 w-3" />

              </ContextLink>

            ) : null}

          </div>

        </div>

      </Card>

    </motion.div>

  );

}



function ActivityGroupRow({

  group,

  onOpen,

  onDismiss,

}: {

  group: NotificationGroup;

  onOpen: (group: NotificationGroup) => void;

  onDismiss: (group: NotificationGroup) => void;

}) {

  const latest = group.items[0] as Notification;



  return (

    <Card className="rounded-[16px] border-none bg-white px-5 py-4 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)]">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div className="min-w-0 flex-1">

          <p className="text-sm font-bold text-slate-800">{group.label}</p>

          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">

            {latest.title}

            {group.items.length > 1 ? ` · ${group.items.length} eventos` : ''}

          </p>

          {group.subtitle && (

            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">

              {group.subtitle}

            </p>

          )}

        </div>

        <div className="flex items-center gap-3">

          <span className="text-[11px] font-medium text-slate-400">{formatRelativeTime(group.latestAt)}</span>

          <button
            type="button"
            onClick={() => onDismiss(group)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Descartar notificación"
            aria-label="Descartar notificación"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {group.targetUrl && (

            <ContextLink

              to={group.targetUrl}

              onClick={() => onOpen(group)}

              className="inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold text-[#FF6B00] transition hover:bg-orange-50"

            >

              Ver <ArrowRight className="h-3 w-3" />

            </ContextLink>

          )}

        </div>

      </div>

    </Card>

  );

}


