import { CheckCircle2, CornerDownLeft, Dot } from 'lucide-react';
import type { OperationalStateV2 } from '../../../types/operationalWorkflow';
import { cn } from '../../../components/ui/tokens';

type StepId =
  | 'PRODUCT_CREATE'
  | 'PLANNING_INITIAL'
  | 'FACTORY'
  | 'PLANNING_PRODUCTION'
  | 'LMS'
  | 'PLANNING_LMS'
  | 'PRODUCT_REVIEW'
  | 'FINALIZED';

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 'PRODUCT_CREATE', label: 'Product' },
  { id: 'PLANNING_INITIAL', label: 'Planeación' },
  { id: 'FACTORY', label: 'Fábrica' },
  { id: 'PLANNING_PRODUCTION', label: 'Planeación' },
  { id: 'LMS', label: 'LMS' },
  { id: 'PLANNING_LMS', label: 'Planeación' },
  { id: 'PRODUCT_REVIEW', label: 'Product' },
  { id: 'FINALIZED', label: 'Finalizado' },
];

function currentStep(state: OperationalStateV2): StepId {
  switch (state) {
    case 'PENDING_PLANNING_INITIAL_VALIDATION':
    case 'RETURNED_TO_PRODUCT_FROM_PLANNING':
      return 'PLANNING_INITIAL';
    case 'PENDING_FACTORY':
    case 'IN_FACTORY_PRODUCTION':
    case 'PENDING_PLANNING_PRODUCTION_VALIDATION':
    case 'RETURNED_TO_FACTORY_FROM_PLANNING':
    case 'CHANGES_REQUESTED_BY_PRODUCT':
      return state === 'PENDING_PLANNING_PRODUCTION_VALIDATION' ? 'PLANNING_PRODUCTION' : 'FACTORY';
    case 'PENDING_LMS_UPLOAD':
    case 'IN_LMS_UPLOAD':
    case 'PENDING_PLANNING_LMS_VALIDATION':
    case 'RETURNED_TO_LMS_FROM_PLANNING':
      return state === 'PENDING_PLANNING_LMS_VALIDATION' ? 'PLANNING_LMS' : 'LMS';
    case 'PENDING_PRODUCT_ACADEMIC_REVIEW':
    case 'IN_PRODUCT_ACADEMIC_REVIEW':
      return 'PRODUCT_REVIEW';
    case 'PENDING_PROJECT_RADICATION':
      return 'FINALIZED';
    case 'FINALIZED':
      return 'FINALIZED';
    default:
      return 'PLANNING_INITIAL';
  }
}

function isReturnedState(state: OperationalStateV2): boolean {
  return (
    state === 'RETURNED_TO_PRODUCT_FROM_PLANNING' ||
    state === 'RETURNED_TO_FACTORY_FROM_PLANNING' ||
    state === 'RETURNED_TO_LMS_FROM_PLANNING'
  );
}

export function OperationalPipelineV2({ state }: { state: OperationalStateV2 }) {
  const cur = currentStep(state);
  const curIndex = STEPS.findIndex((s) => s.id === cur);
  const returned = isReturnedState(state);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pipeline institucional</p>
      <p className="mt-1 text-xs font-bold text-slate-900">Etapa actual resaltada. Devoluciones marcadas.</p>

      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, idx) => {
          const done = idx < curIndex || (cur === 'FINALIZED' && idx === curIndex);
          const active = idx === curIndex;
          const muted = idx > curIndex;
          return (
            <div key={step.id} className="flex items-center gap-2 shrink-0">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-2xl border px-3 py-2 transition-colors',
                  active && returned ? 'border-rose-200 bg-rose-50/60' : active ? 'border-orange-200 bg-orange-50/60' : done ? 'border-emerald-200/60 bg-emerald-50/40' : 'border-slate-200/70 bg-slate-50/40',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-xl ring-1',
                    active && returned ? 'bg-rose-50 text-rose-700 ring-rose-200/80' : active ? 'bg-orange-50 text-orange-700 ring-orange-200/80' : done ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/80' : 'bg-white text-slate-500 ring-slate-200/70',
                  )}
                  title={active && returned ? 'Devuelto' : active ? 'Actual' : done ? 'Completado' : 'Pendiente'}
                >
                  {active && returned ? <CornerDownLeft className="h-4 w-4" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <Dot className="h-5 w-5" />}
                </span>
                <div className="leading-tight">
                  <p className={cn('text-[11px] font-black', muted ? 'text-slate-400' : 'text-slate-900')}>{step.label}</p>
                  <p className={cn('text-[9px] font-bold uppercase tracking-wide', muted ? 'text-slate-300' : 'text-slate-400')}>
                    {active ? 'Actual' : done ? 'Hecho' : 'Luego'}
                  </p>
                </div>
              </div>

              {idx < STEPS.length - 1 ? (
                <div className={cn('h-px w-6', idx < curIndex ? 'bg-emerald-200' : 'bg-slate-200')} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

