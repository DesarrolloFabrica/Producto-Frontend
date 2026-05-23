import { BellDot } from 'lucide-react';
import { cn } from '../ui/tokens';

export function ModificationBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 ring-1 ring-amber-200/80',
        className,
      )}
    >
      <BellDot className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
