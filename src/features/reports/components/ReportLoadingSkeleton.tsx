import { Card } from '../../../components/ui/Card';
import { cn, motion, surface } from '../../../components/ui/tokens';

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-100/90', className)} />;
}

export function ReportCatalogSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} variant="roleGlass" className="p-5">
          <div className="flex items-start justify-between">
            <Pulse className="h-11 w-11 rounded-xl" />
            <Pulse className="h-5 w-5 rounded-md" />
          </div>
          <Pulse className="mt-4 h-5 w-3/4" />
          <Pulse className="mt-2 h-3 w-full" />
          <Pulse className="mt-1 h-3 w-5/6" />
          <div className="mt-4 flex gap-2">
            <Pulse className="h-5 w-12 rounded-full" />
            <Pulse className="h-5 w-10 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ReportTableSkeleton() {
  return (
    <Card variant="roleGlass" className="overflow-hidden p-0">
      <div className="space-y-0 p-1">
        <Pulse className="mx-2 mt-2 h-9 rounded-lg" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Pulse key={i} className="mx-2 my-1.5 h-10 rounded-lg" />
        ))}
      </div>
    </Card>
  );
}

export function ReportLoadingSkeleton({ variant = 'table' }: { variant?: 'catalog' | 'table' }) {
  if (variant === 'catalog') return <ReportCatalogSkeleton />;
  return <ReportTableSkeleton />;
}
