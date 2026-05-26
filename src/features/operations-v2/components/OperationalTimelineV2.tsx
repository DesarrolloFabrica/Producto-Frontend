import type React from 'react';
import { ArrowRight, CornerDownLeft, Timer } from 'lucide-react';
import type { OperationalTransitionV2 } from '../../../types/operationalWorkflow';
import { cn } from '../../../components/ui/tokens';
import { formatDate } from '../../../utils/formatters';
import { stateLabelV2 } from '../rules/workflowRulesV2';

function actionTone(action: string): { bg: string; text: string; ring: string; icon: React.ComponentType<any> } {
  const isReturn = action.includes('RETURN') || action.includes('RETURNED');
  if (isReturn) return { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200/80', icon: CornerDownLeft };
  return { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200/80', icon: ArrowRight };
}

export function OperationalTimelineV2({ items }: { items: OperationalTransitionV2[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-sm text-slate-500">
        No hay eventos registrados en este timeline.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline operacional</p>
          <p className="text-xs font-bold text-slate-900">Historial de transiciones institucionales</p>
        </div>
        <span className="text-[10px] font-bold text-slate-500">{items.length}</span>
      </div>

      <div className="mt-3 space-y-2">
        {items.slice(0, 20).map((ev) => {
          const tone = actionTone(ev.action);
          const Icon = tone.icon;
          return (
            <div key={ev.id} className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-xl ring-1', tone.bg, tone.ring, tone.text)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-slate-900">
                        {ev.from ? (
                          <span className="inline-flex flex-wrap items-center gap-2">
                            <span className="truncate">{stateLabelV2(ev.from)}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                            <span className="truncate">{stateLabelV2(ev.to)}</span>
                          </span>
                        ) : (
                          <span className="truncate">{stateLabelV2(ev.to)}</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                        {ev.actor.name} · {ev.actor.role} · {formatDate(ev.occurredAt)}
                      </p>
                    </div>
                  </div>
                  {ev.comment ? <p className="mt-2 text-[11px] font-medium text-slate-700">{ev.comment}</p> : null}
                  {ev.returnReason ? <p className="mt-1 text-[10px] font-bold text-rose-600">Motivo: {ev.returnReason}</p> : null}
                </div>
                {ev.durationLabel ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-200/70">
                    <Timer className="h-3.5 w-3.5" />
                    {ev.durationLabel}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
