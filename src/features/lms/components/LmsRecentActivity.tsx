import { Link } from 'react-router-dom';
import { ArrowRight, Clock3 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { formatDate } from '../../../utils/formatters';
import { RECENT_ACTIVITY_PREVIEW_LIMIT } from '../../institutional-workflow/recentActivityConstants';
import type { LmsActivityItem } from '../../../services/lmsApi';

type LmsRecentActivityProps = {
  items: LmsActivityItem[];
  historyTo?: string;
  limit?: number;
};

export function LmsRecentActivity({
  items,
  historyTo = '/lms/dashboard?filter=history',
  limit = RECENT_ACTIVITY_PREVIEW_LIMIT,
}: LmsRecentActivityProps) {
  const visibleItems = items.slice(0, limit);
  const hasMore = items.length > limit;

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200/60 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-bold text-slate-900">Actividad reciente</h2>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Cargas iniciadas, publicaciones confirmadas y devoluciones de Planeación.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
          Aún no hay actividad registrada en el flujo LMS.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {visibleItems.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.school}</p>
                  <p className="font-bold text-slate-900">{item.program}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{item.subjectName}</p>
                  <p className="mt-1 text-sm font-semibold text-orange-700">{item.actionLabel}</p>
                  {(item.returnReason ?? item.comment) ? (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {item.returnReason ?? item.comment}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    {item.actorName} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <Link
                  to={item.deepLink}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Ver detalle
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-center sm:px-6">
              <Link
                to={historyTo}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:text-orange-800"
              >
                Ver historial completo
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
