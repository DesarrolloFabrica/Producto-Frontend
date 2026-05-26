import type { SlaStatusV2 } from '../../../types/operationalWorkflow';

function parseIso(value: string): number {
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : Date.now();
}

export function computeSlaStatusV2(params: {
  now: Date;
  dueAt: string;
  finalizedAt: string | null;
}): SlaStatusV2 {
  const now = params.now.getTime();
  const due = parseIso(params.dueAt);

  if (params.finalizedAt) {
    const fin = parseIso(params.finalizedAt);
    return fin <= due ? 'FINALIZED_ON_TIME' : 'FINALIZED_OVERDUE';
  }

  if (now > due) return 'OVERDUE';

  const hoursLeft = Math.max(0, (due - now) / (1000 * 60 * 60));
  if (hoursLeft <= 24) return 'AT_RISK';
  if (hoursLeft <= 72) return 'AT_RISK';
  return 'ON_TIME';
}

export function slaLabelV2(status: SlaStatusV2): string {
  switch (status) {
    case 'FINALIZED_ON_TIME':
      return 'Finalizado a tiempo';
    case 'FINALIZED_OVERDUE':
      return 'Finalizado tarde';
    case 'OVERDUE':
      return 'Retrasado';
    case 'AT_RISK':
      return 'En riesgo';
    default:
      return 'A tiempo';
  }
}

export function slaToneV2(status: SlaStatusV2): { bg: string; text: string; ring: string; dot: string } {
  switch (status) {
    case 'OVERDUE':
    case 'FINALIZED_OVERDUE':
      return { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200/80', dot: 'bg-rose-500' };
    case 'AT_RISK':
      return { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200/80', dot: 'bg-amber-500' };
    case 'FINALIZED_ON_TIME':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/80', dot: 'bg-emerald-500' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200/80', dot: 'bg-slate-400' };
  }
}

