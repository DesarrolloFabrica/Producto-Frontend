import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, CornerDownLeft, History } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { closureTimelineLabel } from '../institutionalTimelineLabels';
import type { ProjectInstitutionalClosureDto } from '../../../services/projectRadicationApi';

type TimelineEvent = ProjectInstitutionalClosureDto['timeline'][number];

const EVENTS_PER_PAGE = 5;

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
      return 'bg-violet-50 text-violet-700 ring-violet-100';
    case 'PLANEACION':
      return 'bg-sky-50 text-sky-700 ring-sky-100';
    case 'FABRICA':
      return 'bg-orange-50 text-orange-700 ring-orange-100';
    case 'LMS':
      return 'bg-teal-50 text-teal-700 ring-teal-100';
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200';
  }
}

function actionTone(action: string): { node: string; icon: typeof CheckCircle2 } {
  const isReturn = action.includes('RETURN') || action.includes('REQUEST_CHANGES');
  if (isReturn) {
    return { node: 'bg-rose-500', icon: CornerDownLeft };
  }
  return { node: 'bg-emerald-500', icon: CheckCircle2 };
}

type PhaseGroup = {
  id: string;
  label: string;
  events: TimelineEvent[];
};

function phaseForAction(action: string): PhaseGroup['id'] {
  if (action.includes('INITIAL') || action === 'PRODUCT_RESUBMIT_REQUEST') return 'initial';
  if (
    action.includes('FACTORY') ||
    action === 'PLANNING_VALIDATE_PRODUCTION' ||
    action === 'PLANNING_RETURN_PRODUCTION'
  ) {
    return 'factory';
  }
  if (action.includes('LMS') || action === 'PLANNING_VALIDATE_LMS' || action === 'PLANNING_RETURN_LMS') {
    return 'lms';
  }
  if (action.includes('ACADEMIC') || action.includes('PRODUCT_APPROVE') || action.includes('PRODUCT_START')) {
    return 'product';
  }
  if (action.includes('RADICATION') || action === 'PLANNING_FINALIZE') return 'closure';
  return 'other';
}

const PHASE_LABELS: Record<string, string> = {
  initial: 'Validación inicial',
  factory: 'Producción en Fábrica',
  lms: 'Carga LMS',
  product: 'Revisión académica',
  closure: 'Radicación y cierre',
  other: 'Otros movimientos',
};

function groupByPhase(events: TimelineEvent[]): PhaseGroup[] {
  const buckets = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const phase = phaseForAction(event.action);
    const list = buckets.get(phase) ?? [];
    list.push(event);
    buckets.set(phase, list);
  }

  const order = ['initial', 'factory', 'lms', 'product', 'closure', 'other'];
  return order
    .filter((id) => (buckets.get(id)?.length ?? 0) > 0)
    .map((id) => ({
      id,
      label: PHASE_LABELS[id] ?? id,
      events: buckets.get(id)!,
    }));
}

type FlatTimelineRow = {
  phaseId: string;
  phaseLabel: string;
  showPhaseHeader: boolean;
  event: TimelineEvent;
};

function flattenForPagination(phases: PhaseGroup[]): FlatTimelineRow[] {
  const rows: FlatTimelineRow[] = [];
  for (const phase of phases) {
    phase.events.forEach((event, index) => {
      rows.push({
        phaseId: phase.id,
        phaseLabel: phase.label,
        showPhaseHeader: index === 0,
        event,
      });
    });
  }
  return rows;
}

function TimelineEventCard({ ev }: { ev: TimelineEvent }) {
  const tone = actionTone(ev.action);
  const Icon = tone.icon;
  const title = closureTimelineLabel(ev.action);

  return (
    <li className="flex gap-2.5 rounded-lg border border-slate-200/60 bg-white px-2.5 py-2 shadow-sm">
      <span
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white',
          tone.node,
        )}
      >
        <Icon className="h-2.5 w-2.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
          <p className="text-xs font-semibold leading-snug text-slate-800">{title}</p>
          <span
            className={cn(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1',
              roleBadgeClass(ev.actorRole),
            )}
          >
            {roleBadgeLabel(ev.actorRole)}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {ev.actorName}
          {ev.scopeLabel ? (
            <>
              <span className="text-slate-300"> · </span>
              <span className="text-slate-600">{ev.scopeLabel}</span>
            </>
          ) : null}
          {ev.mergedCount && ev.mergedCount > 1 ? (
            <span className="ml-1 text-slate-400">({ev.mergedCount} sem.)</span>
          ) : null}
        </p>
        <time className="mt-0.5 block text-[10px] text-slate-400">{formatWhen(ev.createdAt)}</time>
        {ev.returnReason ? (
          <p className="mt-1 text-[10px] leading-relaxed text-rose-700">{ev.returnReason}</p>
        ) : null}
      </div>
    </li>
  );
}

export function InstitutionalClosureTimeline({
  events,
  rawCount,
  className,
}: {
  events: TimelineEvent[];
  rawCount?: number;
  className?: string;
}) {
  const [page, setPage] = useState(1);

  const phases = useMemo(() => groupByPhase(events), [events]);
  const flatRows = useMemo(() => flattenForPagination(phases), [phases]);

  useEffect(() => {
    setPage(1);
  }, [events]);

  const totalPages = Math.max(1, Math.ceil(flatRows.length / EVENTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageRows = useMemo(() => {
    const slice = flatRows.slice((safePage - 1) * EVENTS_PER_PAGE, safePage * EVENTS_PER_PAGE);
    let previousPhaseId: string | null = null;
    return slice.map((row) => {
      const showPhaseHeader = row.phaseId !== previousPhaseId;
      previousPhaseId = row.phaseId;
      return { ...row, showPhaseHeader };
    });
  }, [flatRows, safePage]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sin eventos en el historial"
        description="No hay transiciones registradas para esta solicitud."
        variant="compact"
        cardVariant="solid"
        className="border-0 bg-transparent shadow-none"
      />
    );
  }

  const milestoneLabel =
    rawCount && rawCount > events.length
      ? `${events.length} hitos · ${rawCount} movimientos`
      : `${events.length} hito${events.length !== 1 ? 's' : ''}`;

  const rangeStart = flatRows.length === 0 ? 0 : (safePage - 1) * EVENTS_PER_PAGE + 1;
  const rangeEnd = Math.min(safePage * EVENTS_PER_PAGE, flatRows.length);

  return (
    <section className={cn('flex h-full min-h-0 flex-col', className)}>
      <header className="mb-3 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Historial operacional</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Trazabilidad de auditoría</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
            {milestoneLabel}
          </span>
        </div>
        {rawCount && rawCount > events.length ? (
          <p className="mt-1 text-[11px] text-slate-500">
            Los pasos repetidos por semestre se agrupan en un solo hito por etapa.
          </p>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200/80 bg-slate-50/50">
        <div className="flex-1 space-y-3 p-3">
          {pageRows.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">Sin eventos en esta página.</p>
          ) : (
            pageRows.map((row) => (
              <div key={`${row.event.id}-${row.phaseId}`}>
                {row.showPhaseHeader ? (
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {row.phaseLabel}
                  </p>
                ) : null}
                <ol>
                  <TimelineEventCard ev={row.event} />
                </ol>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 ? (
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 bg-white/80 px-3 py-2.5">
            <p className="text-[11px] font-medium text-slate-500">
              {rangeStart}-{rangeEnd} de {flatRows.length} registros
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-1 px-2.5"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>
              <span className="min-w-[3rem] text-center text-[11px] font-bold tabular-nums text-slate-600">
                {safePage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-1 px-2.5"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </footer>
        ) : null}
      </div>
    </section>
  );
}
