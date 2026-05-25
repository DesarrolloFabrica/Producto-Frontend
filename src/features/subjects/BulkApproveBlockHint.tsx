import { Clock3, Info } from 'lucide-react';
import { cn } from '../../components/ui/tokens';

type BulkApproveBlockHintProps = {
  message: string;
  variant?: 'waiting' | 'info';
  className?: string;
};

export function BulkApproveBlockHint({
  message,
  variant = 'waiting',
  className,
}: BulkApproveBlockHintProps) {
  const Icon = variant === 'waiting' ? Clock3 : Info;

  return (
    <p
      className={cn(
        'flex max-w-[220px] items-start gap-1.5 text-[10px] font-medium leading-snug',
        variant === 'waiting' ? 'text-amber-700' : 'text-slate-500',
        className,
      )}
      role="note"
    >
      <Icon className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

type SubjectReviewBlockBannerProps = {
  message: string;
};

export function SubjectReviewBlockBanner({ message }: SubjectReviewBlockBannerProps) {
  return (
    <div
      className="mx-5 mt-4 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200/80"
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <div>
          <p className="text-[11px] font-bold text-amber-900">Revisión bloqueada por ahora</p>
          <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-amber-800">{message}</p>
        </div>
      </div>
    </div>
  );
}
