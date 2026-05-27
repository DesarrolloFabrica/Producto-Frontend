import { Check, CornerDownLeft } from 'lucide-react';
import type { InstitutionalOperationalState } from '../../../types/domain';
import { cn } from '../../../components/ui/tokens';
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

function currentStep(state: InstitutionalOperationalState): StepId {
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

export function OperationalPipelineInstitutional({ state }: { state: InstitutionalOperationalState }) {
  const cur = currentStep(state);
  const curIndex = STEPS.findIndex((s) => s.id === cur);
  const returned = isReturnedState(state);

  return (
    <section className={pipelineContainer}>
      <header className="mb-6">
        <p className={pipelineHeaderEyebrow}>Pipeline institucional</p>
        <h2 className={pipelineHeaderTitle}>Orquestación del flujo end-to-end</h2>
      </header>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[640px] items-start">
          {STEPS.map((step, idx) => {
            const done = idx < curIndex || (cur === 'FINALIZED' && idx <= curIndex);
            const active = idx === curIndex;
            const upcoming = idx > curIndex;
            const nodeStatus = done ? 'done' : active ? 'active' : 'upcoming';
            const connectorStatus = idx < curIndex ? 'done' : active ? 'active' : 'upcoming';

            return (
              <div key={step.id} className="flex flex-1 items-start">
                <div className="flex flex-1 flex-col items-center px-1">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold',
                      pipelineNodeTransition,
                      pipelineNodeClass(nodeStatus, active && returned),
                      done && 'border-emerald-500 bg-emerald-500 text-white',
                      active && !returned && 'border-orange-500 bg-orange-500 text-white',
                      active && returned && 'border-rose-500 bg-rose-500 text-white',
                      upcoming && 'border-slate-200 bg-white text-slate-400',
                    )}
                  >
                    {done ? <Check className="h-5 w-5 stroke-[2.5]" /> : <span>{idx + 1}</span>}
                  </div>
                  <p
                    className={cn(
                      'mt-2 max-w-[88px] text-center text-xs font-medium leading-tight',
                      active && !returned && 'font-semibold text-orange-700',
                      active && returned && 'font-semibold text-rose-700',
                      done && 'text-emerald-700',
                      upcoming && 'text-slate-400',
                    )}
                  >
                    {step.label}
                  </p>
                </div>

                {idx < STEPS.length - 1 ? (
                  <div
                    className={cn('mt-5 h-0.5 min-w-[12px] flex-1 rounded-full', pipelineConnectorClass(connectorStatus))}
                    aria-hidden
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {returned ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100/80 bg-rose-50/80 px-3 py-2 text-sm font-medium text-rose-800">
          <CornerDownLeft className="h-4 w-4 shrink-0" />
          Hay una devolución activa en esta etapa del flujo.
        </p>
      ) : null}
    </section>
  );
}
