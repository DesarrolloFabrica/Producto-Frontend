import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';

export const operationalInboxFlowActionClass = cn(
  'group inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl',
  'border border-orange-400/45',
  'bg-linear-to-br from-orange-500 via-[#FF6B00] to-orange-600',
  'px-3.5 py-2 text-xs font-bold text-white',
  'shadow-[0_2px_12px_-2px_rgba(234,88,12,0.42)]',
  'transition-all duration-200 ease-out',
  'hover:border-orange-300 hover:from-orange-600 hover:via-[#E66000] hover:to-orange-700',
  'hover:shadow-[0_6px_22px_-4px_rgba(234,88,12,0.52)]',
  'hover:-translate-y-0.5',
  'active:translate-y-0 active:scale-[0.98]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2',
);

const actionCellClass = 'w-[1%] whitespace-nowrap px-5 py-4 text-right sm:px-6';

function FlowActionContent({ label }: { label: string }) {
  return (
    <>
      <span>{label}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
    </>
  );
}

export function OperationalInboxFlowAction({
  label,
  to,
  onClick,
  disabled = false,
  className,
}: {
  label: string;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const classes = cn(
    operationalInboxFlowActionClass,
    disabled && 'pointer-events-none opacity-50',
    className,
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled}>
        <FlowActionContent label={label} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      <FlowActionContent label={label} />
    </button>
  );
}

export function OperationalInboxActionCell({ children }: { children: ReactNode }) {
  return <td className={actionCellClass}>{children}</td>;
}

export const operationalInboxActionHeaderClass = 'w-[1%] whitespace-nowrap px-5 py-3 text-right sm:px-6';
