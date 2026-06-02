import { Link } from 'react-router-dom';
import { CheckCircle2, Package, Send } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';
import type { FactorySemesterDeliveryGuidance } from '../factorySemesterDeliveryGuidance';

type FactorySemesterDeliveryBannerProps = {
  guidance: FactorySemesterDeliveryGuidance;
  /** En el hub de semestre: cambiar tab en lugar de navegar por href */
  onPrimaryAction?: () => void;
  className?: string;
};

export function FactorySemesterDeliveryBanner({
  guidance,
  onPrimaryAction,
  className,
}: FactorySemesterDeliveryBannerProps) {
  const isReady = guidance.variant === 'ready_to_deliver';
  const Icon = isReady ? Send : Package;

  const primaryButtonClass = cn(
    'mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors',
    isReady
      ? 'bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:from-orange-500 hover:to-orange-700'
      : 'border border-amber-300 bg-white text-amber-900 hover:bg-amber-100',
  );

  const primaryContent = (
    <>
      <Icon className="h-3.5 w-3.5" />
      {guidance.buttonLabel}
    </>
  );

  return (
    <div
      className={cn(
        'rounded-[16px] border p-4 sm:p-5',
        isReady ? 'border-orange-200 bg-orange-50/80' : 'border-amber-200 bg-amber-50/70',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
            isReady ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-700',
          )}
        >
          {isReady ? <CheckCircle2 className="h-5 w-5" /> : <Package className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-bold', isReady ? 'text-orange-950' : 'text-amber-950')}>
            {guidance.title}
          </p>
          <p className={cn('mt-1 text-xs font-medium leading-relaxed', isReady ? 'text-orange-900' : 'text-amber-900')}>
            {guidance.message}
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Producidas: {guidance.subjectsReady}/{guidance.subjectsTotal}
            {guidance.subjectsPending > 0 ? ` · Pendientes: ${guidance.subjectsPending}` : ''}
          </p>
          {onPrimaryAction ? (
            <button type="button" onClick={onPrimaryAction} className={primaryButtonClass}>
              {primaryContent}
            </button>
          ) : (
            <Link to={guidance.href} className={primaryButtonClass}>
              {primaryContent}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
