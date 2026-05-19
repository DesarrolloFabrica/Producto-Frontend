import { CheckCircle2, FileText, History, Link as LinkIcon, MessageSquare, RotateCcw, Eye, User } from 'lucide-react';
import type { ActivityEvent, Role } from '../../types/domain';
import { relativeTime } from '../../utils/time';
import { Card, type CardVariant } from '../ui/Card';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';

const icons = {
  LINK: LinkIcon,
  STATUS: RotateCcw,
  OBSERVATION: MessageSquare,
  APPROVAL: CheckCircle2,
  DOCUMENT: FileText,
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
      <div className="flex items-center justify-between border-b border-[#F1F5F9] bg-white/60 px-4 py-3.5 sm:px-6">
        <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">{title}</h2>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[#FF6B00]">
          <History className="h-4 w-4" aria-hidden />
        </div>
      </div>
      <div className="divide-y divide-[#F1F5F9]">
        {filtered.slice(0, compact ? 5 : 8).map((event) => {
          const Icon = icons[event.eventType];
          return (
            <div
              key={event.id}
              className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-[#F8FAFC] sm:px-6"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[#FF6B00] ring-1 ring-[#FF6B00]/20">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium leading-snug text-slate-800">
                  <span className="font-semibold text-slate-900">{event.userName}</span> {event.action}{' '}
                  <span className="font-bold text-[#FF6B00]">{event.entityName}</span>
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-[#64748B]">
                  {event.role} · {event.entityType} · {relativeTime(event.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-start pt-0.5">
                {event.projectId ? (
                  <button
                    type="button"
                    onClick={() => openContextPanel('project', event.projectId)}
                    className="rounded-[12px] p-1.5 text-[#94A3B8] transition-colors hover:bg-[#EEF2FF] hover:text-[#6366F1]"
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
