import { CheckCircle2, FileText, History, Link as LinkIcon, MessageSquare, RotateCcw, Eye, User } from 'lucide-react';
import type { ActivityEvent, Role } from '../../types/domain';
import { relativeTime } from '../../utils/time';
import { Card, type CardVariant } from '../ui/Card';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';
import { cn } from '../ui/tokens';

const icons = {
  LINK: LinkIcon,
  STATUS: RotateCcw,
  OBSERVATION: MessageSquare,
  APPROVAL: CheckCircle2,
  DOCUMENT: FileText,
};

const iconColors = {
  LINK: 'text-sky-600 bg-sky-50',
  STATUS: 'text-violet-600 bg-violet-50',
  OBSERVATION: 'text-amber-600 bg-amber-50',
  APPROVAL: 'text-emerald-600 bg-emerald-50',
  DOCUMENT: 'text-orange-600 bg-orange-50',
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function ActivityFeed({
  events,
  title = 'Ultimas acciones',
  roleFilter,
  projectId,
  compact = false,
  cardVariant = 'default',
}: {
  events: ActivityEvent[];
  title?: string;
  roleFilter?: Role;
  projectId?: string;
  compact?: boolean;
  cardVariant?: CardVariant;
}) {
  const { openContextPanel } = useContextPanel();
  const filtered = events.filter((event) => (!roleFilter || event.role === roleFilter) && (!projectId || event.projectId === projectId));

  return (
    <Card variant={cardVariant} className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-white/60 px-4 py-3.5 sm:px-6">
        <h2 className="text-sm font-bold tracking-[-0.02em] text-slate-900">{title}</h2>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
          <History className="h-4 w-4" aria-hidden />
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {filtered.slice(0, compact ? 5 : 8).map((event) => {
          const Icon = icons[event.eventType];
          const iconColor = iconColors[event.eventType];
          return (
            <div
              key={event.id}
              className="group grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 px-4 py-3.5 transition-colors hover:bg-slate-50 sm:px-6"
            >
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1', iconColor, 'ring-current/20')}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm leading-snug text-slate-600">
                  <span className="font-semibold text-slate-900">{event.userName}</span>{' '}
                  <span className="text-slate-500">{event.action}</span>{' '}
                  <span className="font-semibold text-slate-700">{event.entityName}</span>
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">{event.role}</span>
                  <span className="text-[10px] font-medium text-slate-400">{relativeTime(event.createdAt)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-start pt-0.5">
                {event.projectId ? (
                  <button
                    type="button"
                    onClick={() => openContextPanel('project', event.projectId)}
                    className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-orange-50 hover:text-orange-600"
                    aria-label="Ver contexto del proyecto"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="w-7" aria-hidden />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
