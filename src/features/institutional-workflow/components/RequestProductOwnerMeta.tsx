import { User } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';

type RequestProductOwnerMetaProps = {
  name: string | null | undefined;
  className?: string;
  compact?: boolean;
};

export function RequestProductOwnerMeta({ name, className, compact = false }: RequestProductOwnerMetaProps) {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex max-w-full items-center gap-1 rounded-md bg-violet-50/80 px-2 py-0.5 text-[10px] font-medium text-violet-800 ring-1 ring-violet-100',
          className,
        )}
        title={`Responsable Product: ${trimmed}`}
      >
        <User className="h-3 w-3 shrink-0 text-violet-500" aria-hidden />
        <span className="truncate">{trimmed}</span>
      </span>
    );
  }

  return (
    <p
      className={cn(
        'flex max-w-full flex-wrap items-center gap-1.5 text-xs text-slate-500',
        className,
      )}
    >
      <User className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden />
      <span>
        Solicitud creada por{' '}
        <span className="font-semibold text-slate-700">{trimmed}</span>
      </span>
    </p>
  );
}
