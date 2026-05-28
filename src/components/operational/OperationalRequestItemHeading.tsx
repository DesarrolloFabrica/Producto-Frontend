import { FileText } from 'lucide-react';
import { cn } from '../ui/tokens';

type OperationalRequestItemHeadingProps = {
  program: string;
  showIcon?: boolean;
  size?: 'tray' | 'table';
  className?: string;
};

/** Título de fila para una solicitud/programa (distinto del encabezado de bandeja o tabla). */
export function OperationalRequestItemHeading({
  program,
  showIcon = false,
  size = 'tray',
  className,
}: OperationalRequestItemHeadingProps) {
  return (
    <div className={cn('flex min-w-0 items-start gap-2', className)}>
      {showIcon ? (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-orange-500 ring-1 ring-slate-200/80"
          aria-hidden
        >
          <FileText className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange-600">Solicitud</span>
        <p
          className={cn(
            'truncate font-bold leading-snug text-slate-900',
            size === 'table' ? 'text-sm' : 'text-xs',
          )}
        >
          {program}
        </p>
      </div>
    </div>
  );
}
