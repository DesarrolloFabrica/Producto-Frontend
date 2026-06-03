import { ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReportCatalogItem } from '../../../services/types/reportingApi.types';
import { REPORT_ICONS } from '../reportCatalog';
import { Card } from '../../../components/ui/Card';
import { cn, motion, text } from '../../../components/ui/tokens';

export function ReportCard({ item }: { item: ReportCatalogItem }) {
  const Icon = REPORT_ICONS[item.id] ?? REPORT_ICONS['requests-general'];

  return (
    <Link to={`/reports/${item.id}`} className="group block h-full">
      <Card
        variant="roleGlass"
        interactive
        className={cn(
          'flex h-full flex-col p-5',
          motion.default,
          'hover:border-orange-200/80 hover:ring-1 hover:ring-orange-100/80',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100/60">
            <Icon className="h-5 w-5" />
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-orange-500 [.group:hover_&]:text-orange-500" />
        </div>
        <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900">{item.name}</h3>
        <p className={cn(text.body, 'mt-1.5 flex-1 text-xs')}>{item.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/50 pt-4">
          {item.supportsExcel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200/60">
              <FileSpreadsheet className="h-3 w-3" />
              Excel
            </span>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
