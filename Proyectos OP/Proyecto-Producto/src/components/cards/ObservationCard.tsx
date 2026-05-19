import { Check } from 'lucide-react';
import type { OperationalObservation } from '../../types/domain';
import { formatDate } from '../../utils/formatters';
import { Card, type CardVariant } from '../ui/Card';
import { cn } from '../ui/tokens';

const tones: Record<string, { badge: string; dot?: boolean }> = {
  ABIERTA: { badge: 'bg-[#FEF2F2] text-[#EF4444] ring-[#FECACA]', dot: true },
  EN_CORRECCION: { badge: 'bg-amber-50 text-amber-800 ring-amber-200/70' },
  RESUELTA: { badge: 'bg-[#F0FDF4] text-[#16A34A] ring-[#BBF7D0]' },
};

export function ObservationCard({
  observation,
  variant = 'default',
}: {
  observation: OperationalObservation;
  variant?: CardVariant;
}) {
  const tone = tones[observation.status] || tones.ABIERTA;

  return (
    <Card variant={variant} className="p-4 transition-shadow hover:shadow-md sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-slate-950">{observation.relatedEntity}</p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">
            {observation.author} · {observation.role} · {formatDate(observation.createdAt)}
          </p>
        </div>
        <span className={cn('relative shrink-0 inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider ring-1', tone.badge, tone.dot && 'ping-dot pl-5')}>
          {observation.status === 'RESUELTA' && <Check className="h-2.5 w-2.5" />}
          {observation.status === 'ABIERTA' ? 'Abierta' : observation.status === 'RESUELTA' ? 'Resuelta' : observation.status.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-3 text-xs font-medium leading-relaxed text-slate-600">{observation.text}</p>
    </Card>
  );
}
