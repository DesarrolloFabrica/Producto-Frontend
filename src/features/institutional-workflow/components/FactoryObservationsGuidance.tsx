import { ArrowRight, MessageSquare } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { ContextLink } from '../../../navigation/ContextLink';
import { cn } from '../../../components/ui/tokens';
import { semesterHubPath } from '../institutionalNavigation';

export type FactoryObservationSubjectRef = {
  subjectId: string;
  subjectName: string;
  count: number;
};

export type FactoryObservationSemesterRef = {
  semesterId: string;
  semesterNumber: number;
  semesterLabel: string;
  count: number;
  subjects?: FactoryObservationSubjectRef[];
};

/** Métrica de observaciones; por defecto usa Card como las demás KPI del programa. */
export function FactoryObservationsMetricHighlight({
  count,
  label = 'Observaciones abiertas',
  embedded = false,
}: {
  count: number;
  label?: string;
  /** true dentro del panel resumen del semestre (junto a Info). */
  embedded?: boolean;
}) {
  const content = (
    <>
      <p
        className={cn(
          'font-semibold uppercase tracking-wider text-slate-400',
          embedded ? 'mb-1 text-[10px] tracking-[0.1em] text-[#94A3B8]' : 'text-[10px]',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'inline-flex items-center gap-1.5 font-semibold text-slate-900',
          embedded ? 'text-sm font-medium text-[#1E293B]' : 'mt-1 text-sm',
        )}
      >
        {count}
        {count > 0 ? (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        ) : null}
      </p>
    </>
  );

  if (embedded) return <div>{content}</div>;

  return (
    <Card className={cn('p-4', count > 0 && 'ring-1 ring-amber-100')}>
      {content}
    </Card>
  );
}

/** Aviso compacto en centro operacional del programa. */
export function FactoryObservationsProgramAlert({
  totalCount,
  semesters,
  projectId,
  className,
}: {
  totalCount: number;
  semesters: FactoryObservationSemesterRef[];
  projectId: string;
  className?: string;
}) {
  if (totalCount <= 0) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm leading-5 text-slate-600">
          <span className="font-medium text-slate-800">
            {totalCount === 1
              ? '1 observación de Product pendiente'
              : `${totalCount} observaciones de Product pendientes`}
          </span>
          {' · '}
          Revise las asignaturas en el semestre indicado.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 sm:shrink-0">
        {semesters.map((semester) => (
          <ContextLink
            key={semester.semesterId}
            to={semesterHubPath(projectId, semester.semesterNumber)}
            state={{ focusObservations: true }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            {semester.semesterLabel}
            <span className="text-amber-700">({semester.count})</span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
          </ContextLink>
        ))}
      </div>
    </div>
  );
}

/** Franja breve en hub de semestre; el detalle vive en las tarjetas. */
export function FactoryObservationsSemesterAlert({
  totalCount,
  subjects,
}: {
  totalCount: number;
  subjects: FactoryObservationSubjectRef[];
}) {
  if (totalCount <= 0 || subjects.length === 0) return null;

  const subjectSummary = subjects.map((subject) => subject.subjectName).join(', ');

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2.5">
      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
      <p className="text-xs leading-5 text-slate-600">
        <span className="font-medium text-slate-800">
          {totalCount === 1 ? '1 observación pendiente' : `${totalCount} observaciones pendientes`}
        </span>
        {' — '}
        {subjectSummary}
      </p>
    </div>
  );
}

/** Indicador discreto junto al nombre de la asignatura. */
export function FactorySubjectObservationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="text-[10px] font-medium text-amber-700">
      · {count} obs.
    </span>
  );
}
