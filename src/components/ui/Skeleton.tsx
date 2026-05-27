import { cn, radius } from './tokens';

type SkeletonVariant = 'text' | 'title' | 'circle' | 'card' | 'row';

export function Skeleton({
  className,
  variant = 'text',
}: {
  className?: string;
  variant?: SkeletonVariant;
}) {
  const base = 'animate-pulse bg-slate-200/80';

  if (variant === 'circle') {
    return <div className={cn(base, 'h-10 w-10 rounded-full', className)} />;
  }
  if (variant === 'title') {
    return <div className={cn(base, 'h-6 w-48 rounded-lg', className)} />;
  }
  if (variant === 'card') {
    return <div className={cn(base, radius.card, 'h-28 w-full', className)} />;
  }
  if (variant === 'row') {
    return <div className={cn(base, 'h-12 w-full rounded-xl', className)} />;
  }
  return <div className={cn(base, 'h-4 w-full rounded-md', className)} />;
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="row" />
      ))}
    </div>
  );
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}
