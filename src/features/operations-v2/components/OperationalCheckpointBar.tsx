import type React from 'react';
import { CheckCircle2, Clock, CornerDownLeft, Link as LinkIcon } from 'lucide-react';
import type { OperationalCheckV2 } from '../../../types/operationalWorkflow';
import { cn } from '../../../components/ui/tokens';
import { formatDate } from '../../../utils/formatters';

function statusTone(status: OperationalCheckV2['status'] | 'OVERDUE'): { bg: string; text: string; ring: string; icon: React.ComponentType<any> } {
  switch (status) {
    case 'CHECKED':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/80', icon: CheckCircle2 };
    case 'RETURNED':
      return { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200/80', icon: CornerDownLeft };
    case 'OVERDUE':
      return { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200/80', icon: Clock };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200/80', icon: Clock };
  }
}

function tooltipText(check: OperationalCheckV2, params: { overdue: boolean }): string {
  const parts: string[] = [];
  parts.push(check.label);
  parts.push(`Resp: ${check.responsibleRole}`);
  if (check.checkedAt) parts.push(`OK: ${formatDate(check.checkedAt)}`);
  else if (check.dueAt) parts.push(`Límite: ${formatDate(check.dueAt)}`);
  if (params.overdue) parts.push('Vencido');
  if (check.comment) parts.push(`Nota: ${check.comment}`);
  return parts.join(' · ');
}

export function OperationalCheckpointBar({
  checks = [],
  now = new Date(),
}: {
  checks?: OperationalCheckV2[];
  now?: Date;
}) {
  const simplifiedLabel = (raw: string) =>
    raw
      .replace('por Planeación', '')
      .replace('por Planeacion', '')
      .replace('por Fábrica', '')
      .replace('por Fabrica', '')
      .replace('por Product', '')
      .replace('por LMS', '')
      .trim();

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checks operacionales</p>
          <p className="text-xs font-bold text-slate-900">Checklist institucional (no académico)</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">Validaciones operacionales por etapa del flujo institucional.</p>
        </div>
        <span className="text-[10px] font-bold text-slate-500">{checks.filter((c) => c.status === 'CHECKED').length}/{checks.length}</span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {checks.map((check) => {
          const due = check.dueAt ? Date.parse(check.dueAt) : null;
          const overdue = check.status === 'PENDING' && due != null && now.getTime() > due;
          const tone = statusTone(overdue ? 'OVERDUE' : check.status);
          const Icon = tone.icon;
          return (
            <div
              key={check.key}
              className={cn(
                'group relative overflow-hidden rounded-xl border p-3 transition-colors',
                'border-slate-100 hover:border-slate-200',
              )}
              title={tooltipText(check, { overdue })}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-black text-slate-800">{simplifiedLabel(check.label)}</p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">{check.responsibleRole}</p>
                </div>
                <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-xl ring-1', tone.bg, tone.ring, tone.text)}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-slate-500">
                <span className="truncate">
                  {check.checkedAt ? `OK · ${formatDate(check.checkedAt)}` : (check.dueAt ? `Límite · ${formatDate(check.dueAt)}` : 'Pendiente')}
                </span>
                {check.evidenceUrl ? (
                  <a
                    href={check.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200/70 hover:bg-slate-50"
                    onClick={(e) => e.stopPropagation()}
                    title="Abrir evidencia"
                  >
                    <LinkIcon className="h-3 w-3" />
                    Link
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300">
                    <LinkIcon className="h-3 w-3" /> —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
