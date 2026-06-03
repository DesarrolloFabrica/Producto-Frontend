import type { ReportColumn } from '../../../services/types/reportingApi.types';
import { Card } from '../../../components/ui/Card';
import { cn, surface, tableRow } from '../../../components/ui/tokens';

type Props = {
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
};

export function ReportPreviewTable({ columns, rows }: Props) {
  return (
    <Card variant="roleGlass" className="overflow-hidden p-0">
      <div className="max-h-[min(62vh,680px)] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className={cn('sticky top-0 z-10', surface.roleGlassTableHead)}>
            <tr className="border-b border-slate-100/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  tableRow,
                  'border-b border-slate-50/80 last:border-0',
                  idx % 2 === 1 && 'bg-white/25',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="max-w-[220px] truncate px-3 py-2 text-[11px] font-medium text-slate-700"
                    title={String(row[col.key] ?? '—')}
                  >
                    {String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
