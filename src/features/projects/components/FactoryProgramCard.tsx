import { ArrowRight, CalendarDays, GraduationCap, Layers, MessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ModificationBadge } from '../../../components/project/ModificationBadge';
import { StatusBadge } from '../../../components/status/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { cn, motion, radius, shadow, text } from '../../../components/ui/tokens';
import { ProgramActiveStageBadge } from '../../operations-v2/components/ProgramActiveStageBadge';
import type { ApiFactoryProgramWorkItem } from '../../../services/factoryApi';
import type { FactoryProjectInsight } from '../../operations/factoryProjectState';
import type { VirtualizationProject } from '../../../types/domain';
import { formatDate } from '../../../utils/formatters';

type AccentTone = 'active' | 'complete' | 'corrections' | 'neutral';

const accentBar: Record<AccentTone, string> = {
  active: 'bg-linear-to-r from-[#FF6B00] via-[#FF8C42] to-[#FFB347]',
  complete: 'bg-linear-to-r from-emerald-500 via-emerald-400 to-teal-400',
  corrections: 'bg-linear-to-r from-rose-500 via-rose-400 to-orange-400',
  neutral: 'bg-linear-to-r from-slate-300 via-slate-200 to-slate-300',
};

function calcProgramProgress(program: ApiFactoryProgramWorkItem): number {
  const semPct =
    program.totalSemesters > 0 ? (program.completedSemesters / program.totalSemesters) * 100 : 0;
  const subPct =
    program.totalSubjects > 0 ? (program.completedSubjects / program.totalSubjects) * 100 : 0;
  return Math.round((semPct + subPct) / 2);
}

function MetricTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Layers }) {
  return (
    <div className="rounded-xl bg-slate-50/90 px-3 py-2.5 ring-1 ring-slate-100/80">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-orange-500/80" />
        <span className={text.label}>{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function FactoryCardShell({
  accent,
  isComplete,
  children,
  footer,
}: {
  accent: AccentTone;
  isComplete?: boolean;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden border border-slate-200/70 bg-white/95 backdrop-blur-sm',
        radius.card,
        shadow.card,
        motion.slow,
        'hover:-translate-y-1 hover:border-orange-200/60 hover:shadow-[0_20px_40px_-16px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,107,0,0.06)]',
        isComplete && 'border-emerald-100/80 hover:border-emerald-200/70',
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-[3px]', accentBar[accent])} />
      <div className="flex flex-1 flex-col p-5 pt-6">{children}</div>
      <div className="mt-auto border-t border-slate-100/90 bg-linear-to-b from-slate-50/30 to-slate-50/60 px-5 py-4">
        {footer}
      </div>
    </article>
  );
}

export function FactoryProgramCard({
  program,
  operationsNav,
  isComplete,
}: {
  program: ApiFactoryProgramWorkItem;
  operationsNav: { to: string; state?: unknown };
  isComplete: boolean;
}) {
  const progress = calcProgramProgress(program);
  const accent: AccentTone = isComplete ? 'complete' : program.openObservations > 0 ? 'corrections' : 'active';

  return (
    <FactoryCardShell
      accent={accent}
      isComplete={isComplete}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {program.nearestDueDate ? formatDate(program.nearestDueDate) : 'Sin fecha'}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1',
                program.openObservations > 0
                  ? 'bg-rose-50 text-rose-600 ring-rose-100'
                  : 'bg-white text-slate-500 ring-slate-200/80',
              )}
            >
              <MessageSquare className="h-3 w-3 shrink-0" />
              {program.openObservations} obs.
            </span>
          </div>
          <Link
            to={operationsNav.to}
            state={operationsNav.state}
            className={cn(
              'group/btn inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-200',
              isComplete
                ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'
                : 'bg-[#FF6B00] shadow-[#FF6B00]/25 hover:bg-[#E66000] hover:shadow-lg hover:shadow-[#FF6B00]/30',
            )}
          >
            Ver programa
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={cn(text.label, 'text-slate-400')}>{program.school}</p>
          <h3 className="mt-1.5 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-900">
            {program.program}
          </h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-linear-to-br from-orange-50 to-orange-100/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-700 ring-1 ring-orange-200/60">
          <GraduationCap className="h-3 w-3" />
          {program.totalSemesters} sem.
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MetricTile
          label="Semestres"
          value={`${program.completedSemesters}/${program.totalSemesters}`}
          icon={Layers}
        />
        <MetricTile
          label="Materias"
          value={`${program.completedSubjects}/${program.totalSubjects}`}
          icon={GraduationCap}
        />
      </div>

      <ProgressBar value={progress} size="sm" showLabel={false} className="mt-3" />

      <div className="mt-4 rounded-xl bg-slate-50/70 p-3 ring-1 ring-slate-100/90">
        <ProgramActiveStageBadge stages={program.activeStageSummary} />
      </div>
    </FactoryCardShell>
  );
}

export function FactoryInsightCard({
  insight,
  project,
  subjectCount,
  modificationLabel,
}: {
  insight: FactoryProjectInsight;
  project: VirtualizationProject;
  subjectCount: number;
  modificationLabel: string | null;
}) {
  const accent: AccentTone = insight.isFactoryWorkComplete
    ? 'complete'
    : insight.bucket === 'HAS_CORRECTIONS'
      ? 'corrections'
      : 'active';

  return (
    <FactoryCardShell
      accent={accent}
      isComplete={insight.isFactoryWorkComplete}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {formatDate(project.expectedDeliveryDate)}
            </span>
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
                project.priority === 'CRITICAL' || project.priority === 'HIGH'
                  ? 'bg-rose-50 text-rose-600 ring-rose-100'
                  : project.priority === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700 ring-amber-100'
                    : 'bg-white text-slate-500 ring-slate-200/80',
              )}
            >
              {project.priority ?? 'NORMAL'}
            </span>
          </div>
          <Link
            to={insight.actionRoute}
            className={cn(
              'group/btn inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-200',
              insight.isFactoryWorkComplete
                ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'
                : insight.bucket === 'HAS_CORRECTIONS'
                  ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700'
                  : 'bg-[#FF6B00] shadow-[#FF6B00]/25 hover:bg-[#E66000]',
            )}
          >
            {insight.actionLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={cn(text.label, 'text-slate-400')}>{project.school}</p>
          <h3 className="mt-1.5 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-900">
            {project.program}
          </h3>
          {modificationLabel && (
            <div className="mt-2">
              <ModificationBadge label={modificationLabel} />
            </div>
          )}
        </div>
        <StatusBadge status={insight.displayStatus as VirtualizationProject['status']} />
      </div>

      <p className="mt-3 text-sm font-medium text-slate-600">{insight.summaryLabel}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {[project.modality, `${project.semesters?.length ?? 1} semestre${(project.semesters?.length ?? 1) !== 1 ? 's' : ''}`, `${subjectCount} asignatura${subjectCount !== 1 ? 's' : ''}`].map(
          (item) => (
            <span
              key={item}
              className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100"
            >
              {item}
            </span>
          ),
        )}
      </div>

      {insight.correctionsCount > 0 && (
        <div className="mt-3 rounded-xl bg-rose-50/80 px-3 py-2.5 text-xs font-medium text-rose-700 ring-1 ring-rose-100">
          {insight.correctionsCount} materia{insight.correctionsCount !== 1 ? 's' : ''} con correcciones
        </div>
      )}
    </FactoryCardShell>
  );
}
