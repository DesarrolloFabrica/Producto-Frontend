import type React from 'react';
import { CheckCircle2, CornerDownLeft } from 'lucide-react';
import type { OperationalTransitionV2 } from '../../../types/operationalWorkflow';
import { cn } from '../../../components/ui/tokens';
import { actionTimelineLabel } from '../institutionalTimelineLabels';

function formatTimelineDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
  };
}

function roleBadgeLabel(role: string): string {
  switch (role) {
    case 'PLANEACION':
      return 'Planeación';
    case 'FABRICA':
      return 'Fábrica';
    case 'PRODUCT':
      return 'Product';
    case 'LMS':
      return 'LMS';
    default:
      return role;
  }
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'PRODUCT':
      return 'bg-violet-50 text-violet-700 ring-1 ring-violet-100';
    case 'PLANEACION':
      return 'bg-sky-50 text-sky-700 ring-1 ring-sky-100';
    case 'FABRICA':
      return 'bg-orange-50 text-orange-700 ring-1 ring-orange-100';
    case 'LMS':
      return 'bg-teal-50 text-teal-700 ring-1 ring-teal-100';
    default:
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  }
}

function actionTone(action: string): {
  node: string;
  icon: React.ComponentType<{ className?: string }>;
} {
  const isReturn = action.includes('RETURN') || action.includes('REQUEST_CHANGES');
  if (isReturn) {
    return { node: 'bg-rose-500 ring-rose-100', icon: CornerDownLeft };
  }
  return { node: 'bg-emerald-500 ring-emerald-100', icon: CheckCircle2 };
}

type OperationalTimelineExecutiveProps = {
  items: OperationalTransitionV2[];
  compact?: boolean;
};

export function OperationalTimelineExecutive({ items, compact = false }: OperationalTimelineExecutiveProps) {
  if (items.length === 0) {
    return (
      <section className="border-t border-slate-200 pt-6">
        <p className="text-sm text-slate-500">No hay eventos registrados en el historial operacional.</p>
      </section>
    );
  }

  const display = compact ? items.slice(-5) : [...items].reverse();

  return (
    <section className="border-t border-slate-200 pt-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Historial operacional
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Trazabilidad de auditoría</h2>
        </div>
        <span className="rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {items.length} evento{items.length !== 1 ? 's' : ''}
        </span>
      </header>

      <ol className="relative">
        <div
          className="absolute bottom-2 left-[9px] top-2 w-px bg-slate-200"
          aria-hidden
        />

        {display.map((ev, index) => {
          const tone = actionTone(ev.action);
          const Icon = tone.icon;
          const title = actionTimelineLabel(ev.action);
          const { date, time } = formatTimelineDate(ev.occurredAt);
          const isLast = index === display.length - 1;

          return (
            <li
              key={ev.id}
              className={cn(
                'relative flex gap-3 rounded-lg py-2.5 pl-0 pr-2 transition-colors hover:bg-slate-50/80',
                !isLast && 'mb-1',
              )}
            >
              <div className="relative z-10 mt-0.5 shrink-0">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-white ring-2 ring-white',
                    tone.node,
                  )}
                >
                  <Icon className="h-3 w-3" />
                </span>
              </div>

              <div className="min-w-0 flex-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <time className="text-xs text-slate-400">
                    {date} · {time}
                  </time>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      roleBadgeClass(ev.actor.role),
                    )}
                  >
                    {roleBadgeLabel(ev.actor.role)}
                  </span>
                </div>

                <p className="mt-1 text-sm font-medium text-slate-800">{title}</p>
                <p className="text-xs text-slate-500">{ev.actor.name}</p>

                {ev.returnReason ? (
                  <p className="mt-2 text-xs leading-relaxed text-rose-700">
                    <span className="font-medium">Motivo:</span> {ev.returnReason}
                  </p>
                ) : null}

                {ev.comment && !ev.returnReason ? (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{ev.comment}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
