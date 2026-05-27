import type { ReactNode } from 'react';
import { cn, type RoleAccent } from '../ui/tokens';

interface DashboardShellProps {
  children: ReactNode;
  roleAccent?: RoleAccent;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}

export function DashboardSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn(className)}>{children}</section>;
}

export function DashboardKpiGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 3 | 4 | 6;
}) {
  const gridClass =
    columns === 6
      ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
      : columns === 3
        ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4';

  return <div className={gridClass}>{children}</div>;
}
