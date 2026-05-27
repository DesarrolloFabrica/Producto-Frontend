import { AlertTriangle, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';
import { ContextLink } from '../../../navigation/ContextLink';
import type { SemesterSubjectOperationalDto } from '../../../services/institutionalWorkflowApi';
import {
  filterSemesterSubjectBlockers,
  formatSemesterSubjectBlocker,
  semesterSubjectInternalStateMeta,
} from '../institutionalCopy';
import { subjectChecklistPath, subjectFactoryCorrectionsPath, subjectOperationsPath } from '../institutionalNavigation';

const toneStyles = {
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
} as const;

function InternalStatusBadge({ state }: { state: string }) {
  const meta = semesterSubjectInternalStateMeta(state);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight',
        toneStyles[meta.tone],
      )}
    >
      {meta.label}
    </span>
  );
}

function ProgressMini({
  value,
  complete,
  hasObservations,
}: {
  value: number;
  complete: boolean;
  hasObservations: boolean;
}) {
  const pct = complete && !hasObservations ? 100 : Math.min(100, Math.max(0, value));
  const barComplete = complete && !hasObservations;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            hasObservations ? 'bg-amber-400' : barComplete ? 'bg-emerald-500' : 'bg-orange-400',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          'text-[10px] font-bold tabular-nums',
          hasObservations ? 'text-amber-700' : barComplete ? 'text-emerald-600' : 'text-slate-500',
        )}
      >
        {hasObservations ? 'Obs.' : `${pct}%`}
      </span>
    </div>
  );
}

interface SemesterSubjectsTableProps {
  subjects: SemesterSubjectOperationalDto[];
  /** Requisitos académicos (temas, granularidad): solo Planeación / Product, no Fábrica. */
  showRequirements?: boolean;
  /** Fase 7 Product: enlaces al checklist por asignatura. */
  checklistReviewMode?: boolean;
  /** Enlace a correcciones de Product en detalle de asignatura. */
  factoryCorrectionsMode?: boolean;
  /** Planeación / LMS: seguimiento en centro operacional de asignatura (no checklist Product). */
  institutionalReaderMode?: boolean;
}

export function SemesterSubjectsTable({
  subjects,
  showRequirements = false,
  checklistReviewMode = false,
  factoryCorrectionsMode = false,
  institutionalReaderMode = false,
}: SemesterSubjectsTableProps) {
  if (subjects.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-slate-500">Este semestre no tiene asignaturas registradas.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <th className="px-5 py-3.5 text-left">Asignatura</th>
            <th className="px-5 py-3.5 text-left">Estado de producción</th>
            {showRequirements ? (
              <th className="px-5 py-3.5 text-left">Requisitos académicos</th>
            ) : null}
            <th className="px-5 py-3.5 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subjects.map((subject) => {
            const hasObservations =
              subject.internalState === 'HAS_OBSERVATIONS' || (subject.openObservationsCount ?? 0) > 0;
            const isProductionComplete =
              subject.internalState === 'FACTORY_PRODUCTION_COMPLETE' && !hasObservations;
            const visibleBlockers = filterSemesterSubjectBlockers(
              subject.blockers,
              showRequirements,
            );
            const hasBlockers = visibleBlockers.length > 0;
            const obsCount = subject.openObservationsCount ?? 0;
            const actionHref = hasObservations && factoryCorrectionsMode
              ? subjectFactoryCorrectionsPath(subject.subjectId)
              : institutionalReaderMode
                ? subjectOperationsPath(subject.subjectId)
                : subjectChecklistPath(subject.subjectId);
            const actionLabel =
              checklistReviewMode && !institutionalReaderMode
                ? 'Revisar checklist'
                : hasObservations && factoryCorrectionsMode
                  ? 'Ver observaciones'
                  : institutionalReaderMode
                    ? 'Ver asignatura'
                    : isProductionComplete
                      ? 'Ver asignatura'
                      : 'Trabajar asignatura';

            return (
              <tr
                key={subject.subjectId}
                id={hasObservations ? `subject-row-${subject.subjectId}` : undefined}
                className={cn(
                  'transition-colors hover:bg-slate-50/60',
                  hasObservations && 'bg-amber-50/30',
                )}
              >
                <td className="px-5 py-4 align-top">
                  <p className="font-semibold text-slate-900">{subject.subjectName}</p>
                  <ProgressMini
                    value={subject.progress ?? 0}
                    complete={isProductionComplete || subject.internalState === 'FACTORY_PRODUCTION_COMPLETE'}
                    hasObservations={hasObservations}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="space-y-2">
                    <InternalStatusBadge state={subject.internalState} />
                    {hasObservations ? (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-amber-900">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        {obsCount === 1
                          ? '1 observación sin resolver'
                          : `${obsCount} observaciones sin resolver`}
                      </p>
                    ) : null}
                    {!showRequirements && hasBlockers && !hasObservations ? (
                      <ul className="space-y-1">
                        {visibleBlockers.slice(0, 2).map((blocker) => (
                          <li key={blocker} className="text-xs text-amber-800">
                            {formatSemesterSubjectBlocker(blocker)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </td>
                {showRequirements ? (
                  <td className="px-5 py-4 align-top">
                    {hasBlockers ? (
                      <ul className="space-y-1.5">
                        {visibleBlockers.slice(0, 3).map((blocker) => (
                          <li
                            key={blocker}
                            className="flex items-start gap-2 text-xs leading-5 text-amber-900"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                            <span>{formatSemesterSubjectBlocker(blocker)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Sin requisitos pendientes
                      </span>
                    )}
                  </td>
                ) : null}
                <td className="px-5 py-4 text-right align-top">
                  <ContextLink
                    to={actionHref}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors',
                      checklistReviewMode
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : hasObservations
                          ? 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          : isProductionComplete
                            ? 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            : 'border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100',
                    )}
                  >
                    {actionLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </ContextLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
