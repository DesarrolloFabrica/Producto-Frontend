import { FileCheck2, Send } from 'lucide-react';
import { Card } from '../ui/Card';
import type { ProjectRadicationWorkItemDto } from '../../services/projectRadicationApi';
import { formatDate } from '../../utils/formatters';
import { OperationalRequestItemHeading } from './OperationalRequestItemHeading';
import { isReducedInstitutionalFlow } from '../../config/env';

const TRAY_LIMIT = 4;

export function ProgramRadicationTray({
  items,
  onOpenRadication,
}: {
  items: ProjectRadicationWorkItemDto[];
  onOpenRadication: (projectId: string) => void;
}) {
  const visible = items.slice(0, TRAY_LIMIT);
  const reducedFlow = isReducedInstitutionalFlow();

  return (
    <Card
      variant="subjectPanel"
      glass
      className="border-2 border-emerald-200/80 bg-linear-to-br from-emerald-50/40 via-white to-orange-50/20 p-3 sm:p-3.5"
    >
      <div className="mb-2.5 flex items-start gap-2 border-b border-emerald-200/60 pb-2.5">
        <FileCheck2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Cierre de solicitud
            </p>
            <span className="ml-auto shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-800">
              {items.length}
            </span>
          </div>
          <h2 className="truncate text-sm font-bold text-slate-900">Listas para radicar</h2>
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-600">
            {reducedFlow
              ? 'Solicitudes con alcance completo. Registre el radicado institucional para cerrar.'
              : 'Solicitudes con alcance completo. Registre el radicado institucional para enviar a Planeación.'}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {visible.map((item) => (
          <li key={item.projectId}>
            <div className="rounded-xl border border-emerald-200/80 bg-white/90 px-2.5 py-2.5 shadow-sm">
              <div className="flex items-start gap-2">
                <OperationalRequestItemHeading program={item.program} showIcon className="min-w-0 flex-1" />
                <button
                  type="button"
                  onClick={() => onOpenRadication(item.projectId)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-linear-to-br from-[#FF6B00] to-[#FF852D] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm hover:from-[#E66000] hover:to-[#FF6B00]"
                >
                  <Send className="h-3 w-3" />
                  Radicar
                </button>
              </div>
              <p className="mt-1.5 truncate pl-9 text-[10px] text-slate-500">
                {item.school}
                {' · '}
                Materias: {item.scopeSubjectsApproved}/{item.scopeSubjectsTotal}
                {item.productRadicationDueAt ? ` · ${formatDate(item.productRadicationDueAt)}` : ''}
              </p>
              {item.institutionalState === 'RADICATION_RETURNED_TO_PRODUCT' && item.lastRadicationReturnReason ? (
                <p className="mt-1 pl-9 text-[10px] text-amber-800 line-clamp-2">
                  Devuelto: {item.lastRadicationReturnReason}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {items.length > TRAY_LIMIT ? (
        <p className="mt-2 text-center text-[10px] text-slate-500">
          +{items.length - TRAY_LIMIT} más pendientes de radicar
        </p>
      ) : null}
    </Card>
  );
}
