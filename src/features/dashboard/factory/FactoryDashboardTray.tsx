import type { LucideIcon } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { FactorySubjectWorkRow } from './FactorySubjectWorkRow';
import type { SubjectWorkItem } from '../../operations/subjectOperationalState';

export function FactoryDashboardTray({
  title,
  description,
  icon: Icon,
  iconClassName,
  items,
  emptyMessage,
  limit,
  footerLink,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconClassName: string;
  items: SubjectWorkItem[];
  emptyMessage: string;
  limit?: number;
  footerLink?: { label: string; to: string };
}) {
  const visible = limit ? items.slice(0, limit) : items;

  if (visible.length === 0 && !footerLink) {
    return null;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] bg-white/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={iconClassName}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">{title}</h2>
            {description && (
              <p className="text-[11px] font-medium text-[#64748B]">{description}</p>
            )}
          </div>
        </div>
        <span className="rounded-[12px] bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#64748B] ring-1 ring-slate-200/50">
          {items.length}
        </span>
      </div>
      <div className="space-y-3 bg-[#F8FAFC]/60 p-4 sm:p-5">
        {visible.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#94A3B8]">{emptyMessage}</p>
        ) : (
          visible.map((item) => <FactorySubjectWorkRow key={item.subjectId} item={item} />)
        )}
        {footerLink && items.length > (limit ?? items.length) && (
          <p className="pt-1 text-center text-xs font-medium text-[#64748B]">
            Mostrando {visible.length} de {items.length}
          </p>
        )}
      </div>
    </Card>
  );
}
