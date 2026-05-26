import type React from 'react';
import { CheckCircle2, Clock, CornerDownLeft, ExternalLink } from 'lucide-react';
import type { OperationalCheckV2 } from '../../../types/operationalWorkflow';
import { cn } from '../../../components/ui/tokens';
import { formatDate } from '../../../utils/formatters';

function roleLabel(role: string): string {
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

function statusMeta(
  status: OperationalCheckV2['status'],
  overdue: boolean,
): {
  label: string;
  bg: string;
  text: string;
  ring: string;
  icon: React.ComponentType<{ className?: string }>;
} {
  if (status === 'CHECKED') {
    return {
      label: 'Completado',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'ring-emerald-200',
      icon: CheckCircle2,
    };
  }
  if (status === 'RETURNED') {
    return {
      label: 'Devuelto',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      ring: 'ring-rose-200',
      icon: CornerDownLeft,
    };
  }
  if (overdue) {
    return {
      label: 'Vencido',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      ring: 'ring-rose-200',
      icon: Clock,
    };
  }
  return {
    label: 'Pendiente',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
    icon: Clock,
  };
}

export function InstitutionalOperationalChecks({
  checks = [],
  now = new Date(),
}: {
  checks?: OperationalCheckV2[];
  now?: Date;
}) {
  const completed = checks.filter((c) => c.status === 'CHECKED').length;
  const total = checks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Validaciones operacionales
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            Checklist institucional
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Validaciones por etapa del flujo (no académico). Cada ítem debe completarse antes de
            avanzar en el pipeline.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums text-slate-900">
            {completed}
            <span className="text-base font-normal text-slate-400">/{total}</span>
          </p>
          <p className="text-xs text-slate-500">{progress}% completado</p>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => {
          const due = check.dueAt ? Date.parse(check.dueAt) : null;
          const overdue = check.status === 'PENDING' && due != null && now.getTime() > due;
          const meta = statusMeta(check.status, overdue);
          const Icon = meta.icon;
          const deadlineLabel = check.checkedAt
            ? `Completado · ${formatDate(check.checkedAt)}`
            : check.dueAt
              ? `Límite · ${formatDate(check.dueAt)}`
              : 'Sin fecha límite registrada';

          return (
            <article
              key={check.key}
              className={cn(
                'relative flex min-h-[132px] flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
                check.status === 'CHECKED' && 'border-emerald-100/80 bg-emerald-50/20',
              )}
            >
              <span
                className={cn(
                  'absolute right-3 top-3',
                  check.status === 'CHECKED' ? 'text-emerald-500' : 'text-amber-500',
                  overdue && 'text-rose-500',
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="pr-6">
                <h3 className="text-sm font-medium leading-snug text-slate-800">{check.label}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {roleLabel(check.responsibleRole)}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      check.status === 'CHECKED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-800',
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-slate-400">{deadlineLabel}</p>
                {check.evidenceUrl ? (
                  <a
                    href={check.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    Ver evidencia
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                {check.comment ? (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {check.comment}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
