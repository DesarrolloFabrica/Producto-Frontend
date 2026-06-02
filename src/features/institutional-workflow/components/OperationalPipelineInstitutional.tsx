import { Check, CornerDownLeft } from 'lucide-react';
import type { InstitutionalOperationalState } from '../../../types/domain';
import { cn } from '../../../components/ui/tokens';
import { isReducedInstitutionalFlow } from '../../../config/env';
import {
  pipelineConnectorClass,
  pipelineContainer,
  pipelineHeaderEyebrow,
  pipelineHeaderTitle,
  pipelineNodeClass,
  pipelineNodeTransition,
} from './pipelineStyles';

type StepId =
  | 'PRODUCT_CREATE'
  | 'PLANNING_INITIAL'
  | 'FACTORY'
  | 'PLANNING_PRODUCTION'
  | 'LMS'
  | 'PLANNING_LMS'
  | 'PRODUCT_REVIEW'
  | 'FINALIZED';

const STEPS: Array<{ id: StepId; label: string; short: string }> = [
  { id: 'PRODUCT_CREATE', label: 'Product', short: 'Prod.' },
  { id: 'PLANNING_INITIAL', label: 'Planeación', short: 'Plan.' },
  { id: 'FACTORY', label: 'Fábrica', short: 'Fáb.' },
  { id: 'PLANNING_PRODUCTION', label: 'Planeación', short: 'Plan.' },
  { id: 'LMS', label: 'LMS', short: 'LMS' },
  { id: 'PLANNING_LMS', label: 'Planeación', short: 'Plan.' },
  { id: 'PRODUCT_REVIEW', label: 'Product', short: 'Prod.' },
  { id: 'FINALIZED', label: 'Finalizado', short: 'Fin.' },
];

const REDUCED_STEPS: Array<{ id: StepId; label: string; short: string }> = [
  { id: 'PRODUCT_CREATE', label: 'Solicitud', short: 'Sol.' },
  { id: 'FACTORY', label: 'Producción Fábrica', short: 'Fáb.' },
  { id: 'PRODUCT_REVIEW', label: 'Radicación Product', short: 'Prod.' },
  { id: 'FINALIZED', label: 'Finalizado', short: 'Fin.' },
];

function currentStep(state: InstitutionalOperationalState, reduced = isReducedInstitutionalFlow()): StepId {
  if (reduced) {
    switch (state) {
      case 'PENDING_FACTORY':
      case 'IN_FACTORY_PRODUCTION':
      case 'CHANGES_REQUESTED_BY_PRODUCT':
      case 'RETURNED_TO_FACTORY_FROM_PLANNING':
        return 'FACTORY';
      case 'PENDING_PRODUCT_ACADEMIC_REVIEW':
      case 'IN_PRODUCT_ACADEMIC_REVIEW':
      case 'PENDING_PROJECT_RADICATION':
        return 'PRODUCT_REVIEW';
      case 'FINALIZED':
        return 'FINALIZED';
      default:
        return 'PRODUCT_CREATE';
    }
  }

  switch (state) {
    case 'PENDING_PLANNING_INITIAL_VALIDATION':
    case 'RETURNED_TO_PRODUCT_FROM_PLANNING':
      return 'PLANNING_INITIAL';
    case 'PENDING_FACTORY':
    case 'IN_FACTORY_PRODUCTION':
    case 'CHANGES_REQUESTED_BY_PRODUCT':
      return 'FACTORY';
    case 'PENDING_PLANNING_PRODUCTION_VALIDATION':
    case 'RETURNED_TO_FACTORY_FROM_PLANNING':
      return 'PLANNING_PRODUCTION';
    case 'PENDING_LMS_UPLOAD':
    case 'IN_LMS_UPLOAD':
    case 'RETURNED_TO_LMS_FROM_PLANNING':
      return state === 'RETURNED_TO_LMS_FROM_PLANNING' ? 'PLANNING_LMS' : 'LMS';
    case 'PENDING_PLANNING_LMS_VALIDATION':
      return 'PLANNING_LMS';
    case 'PENDING_PRODUCT_ACADEMIC_REVIEW':
    case 'IN_PRODUCT_ACADEMIC_REVIEW':
      return 'PRODUCT_REVIEW';
    case 'PENDING_PROJECT_RADICATION':
    case 'FINALIZED':
      return 'FINALIZED';
    default:
      return 'PLANNING_INITIAL';
  }
}

function isReturnedState(state: InstitutionalOperationalState): boolean {
  return (
    state === 'RETURNED_TO_PRODUCT_FROM_PLANNING' ||
    state === 'RETURNED_TO_FACTORY_FROM_PLANNING' ||
    state === 'RETURNED_TO_LMS_FROM_PLANNING' ||
    state === 'CHANGES_REQUESTED_BY_PRODUCT'
  );
}

/** Índice 0–7 del paso activo en el pipeline institucional (reutilizado por Admin tracking). */
export function institutionalPipelineStepIndex(state: InstitutionalOperationalState): number {
  const reduced = isReducedInstitutionalFlow();
  const steps = reduced ? REDUCED_STEPS : STEPS;
  const cur = currentStep(state, reduced);
  return steps.findIndex((s) => s.id === cur);
}

export function isInstitutionalReturnedState(state: InstitutionalOperationalState): boolean {
  return isReturnedState(state);
}

export function OperationalPipelineInstitutional({
  state,
  variant = 'default',
  showHeader,
}: {
  state: InstitutionalOperationalState;
  variant?: 'default' | 'compact' | 'micro' | 'row';
  showHeader?: boolean;
}) {
  const row = variant === 'row';
  const micro = variant === 'micro';
  const compact = variant === 'compact' || micro;
  const headerVisible = showHeader ?? !(compact || row || micro);
  const reduced = isReducedInstitutionalFlow();
  const steps = reduced ? REDUCED_STEPS : STEPS;
  const cur = currentStep(state, reduced);
  const curIndex = steps.findIndex((s) => s.id === cur);
  const returned = isReturnedState(state);

  return (
    <section
      className={cn(
        pipelineContainer,
        compact && 'border-slate-200/60 p-3 shadow-none',
        (micro || row) && 'rounded-none border-0 bg-transparent p-0 shadow-none',
        row && 'w-full',
      )}
    >
      {headerVisible ? (
        <header className={cn(compact ? 'mb-3' : 'mb-6')}>
          <p className={pipelineHeaderEyebrow}>Pipeline institucional</p>
          <h2 className={pipelineHeaderTitle}>Orquestación del flujo end-to-end</h2>
        </header>
      ) : null}

      <div className={cn(row ? 'w-full' : micro ? 'overflow-x-auto' : 'overflow-x-auto pb-1')}>
        <div
          className={cn(
            'flex items-start',
            row ? 'w-full min-w-0' : micro ? 'min-w-[168px]' : compact ? 'min-w-[520px]' : 'min-w-[640px]',
          )}
        >
          {steps.map((step, idx) => {
            const done = idx < curIndex || (cur === 'FINALIZED' && idx <= curIndex);
            const active = idx === curIndex;
            const upcoming = idx > curIndex;
            const nodeStatus = done ? 'done' : active ? 'active' : 'upcoming';
            const connectorStatus = idx < curIndex ? 'done' : active ? 'active' : 'upcoming';

            return (
              <div key={step.id} className="flex min-w-0 flex-1 items-start">
                <div className={cn('flex min-w-0 flex-1 flex-col items-center', row ? 'px-1' : 'px-0.5')}>
                  <div
                    title={step.label}
                    className={cn(
                      'flex shrink-0 items-center justify-center rounded-full border-2 font-semibold',
                      pipelineNodeTransition,
                      pipelineNodeClass(nodeStatus, active && returned),
                      row
                        ? 'h-6 w-6 text-[9px] shadow-sm'
                        : micro
                          ? 'h-4 w-4 text-[7px]'
                          : compact
                            ? 'h-7 w-7 text-[10px]'
                            : 'h-10 w-10 text-sm',
                      done && 'border-emerald-500 bg-emerald-500 text-white',
                      active && !returned && 'border-orange-500 bg-orange-500 text-white ring-2 ring-orange-200/80',
                      active && returned && 'border-rose-500 bg-rose-500 text-white ring-2 ring-rose-200/80',
                      upcoming && 'border-slate-200 bg-white text-slate-400',
                    )}
                  >
                    {done ? (
                      <Check
                        className={cn(
                          row ? 'h-3 w-3' : micro ? 'h-2.5 w-2.5' : compact ? 'h-3.5 w-3.5' : 'h-5 w-5',
                          'stroke-[2.5]',
                        )}
                      />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <p
                    title={step.label}
                    className={cn(
                      'text-center font-medium leading-tight',
                      row
                        ? 'mt-1 block max-w-[56px] truncate text-[9px]'
                        : micro
                          ? 'mt-1.5 hidden max-w-[36px] text-[7px] xl:block'
                          : compact
                            ? 'mt-1.5 max-w-[56px] text-[9px]'
                            : 'mt-1.5 max-w-[88px] text-xs',
                      active && !returned && 'font-bold text-orange-700',
                      active && returned && 'font-bold text-rose-700',
                      done && 'text-emerald-700',
                      upcoming && 'text-slate-400',
                    )}
                  >
                    {row || compact || micro ? step.short : step.label}
                  </p>
                </div>

                {idx < steps.length - 1 ? (
                  <div
                    className={cn(
                      'rounded-full',
                      row
                        ? 'mt-3 h-1 min-w-[12px] flex-1'
                        : micro
                          ? 'mt-2 h-px min-w-[2px] flex-1'
                          : compact
                            ? 'mt-3.5 h-0.5 min-w-[8px] flex-1'
                            : 'mt-5 h-0.5 min-w-[12px] flex-1',
                      pipelineConnectorClass(connectorStatus),
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {returned && !compact && !row && !micro ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100/80 bg-rose-50/80 px-3 py-2 text-sm font-medium text-rose-800">
          <CornerDownLeft className="h-4 w-4 shrink-0" />
          Hay una devolución activa en esta etapa del flujo.
        </p>
      ) : null}
    </section>
  );
}
