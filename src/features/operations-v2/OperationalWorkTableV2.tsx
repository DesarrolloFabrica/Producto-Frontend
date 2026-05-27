import { CalendarDays, Inbox } from 'lucide-react';
import { OperationalInboxFlowAction } from './components/OperationalInboxFlowAction';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatters';
import type { OperationalActionV2, OperationalRoleV2, OperationalWorkItemV2 } from '../../types/operationalWorkflow';
import { OperationalActionsV2 } from './components/OperationalActionsV2';
import { OperationalStateBadgeV2 } from './components/OperationalStateBadgeV2';
import { SlaBadgeV2 } from './components/SlaBadgeV2';

type BaseProps = {
  role: OperationalRoleV2;
  items: OperationalWorkItemV2[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  backFallback?: string;
};

type FlowOnlyProps = BaseProps & {
  flowOnly: true;
  semesterFirst?: boolean;
  onOpenFlow: (item: OperationalWorkItemV2) => void;
  onAction?: never;
};

type ActionProps = BaseProps & {
  flowOnly?: false;
  onAction: (params: { subjectId: string; action: OperationalActionV2 }) => void;
  onOpenFlow?: never;
};

export type OperationalWorkTableV2Props = FlowOnlyProps | ActionProps;

function FlowOpenButton({ onClick, label = 'Ver flujo' }: { onClick: () => void; label?: string }) {
  return <OperationalInboxFlowAction label={label} onClick={onClick} />;
}

export function OperationalWorkTableV2(props: OperationalWorkTableV2Props) {
  const { role, items, isLoading, error, flowOnly, onRefresh } = props;
  const semesterFirst = flowOnly && props.semesterFirst === true;
  const showEmpty = !isLoading && !error && items.length === 0;

  const handleRowOpen = (item: OperationalWorkItemV2) => {
    if (flowOnly) {
      props.onOpenFlow(item);
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 bg-white px-5 py-3.5 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Mis pendientes</p>
          <h2 className="text-sm font-semibold text-slate-900">
            {semesterFirst ? 'Paquetes semestrales' : 'Asignaturas'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-500">
          <span className="rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200/70">{items.length} en cola</span>
          {flowOnly ? (
            <span className="rounded-md bg-orange-50 px-2.5 py-1 text-orange-700 ring-1 ring-orange-100">
              Acciones en el centro operacional
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700 sm:px-6">{error}</div>
      ) : null}

      {showEmpty ? (
        <EmptyState
          icon={Inbox}
          title="Bandeja al día"
          description="No hay asignaturas pendientes en su bandeja operacional."
          variant="operational"
          action={
            <Button type="button" size="sm" variant="secondary" onClick={onRefresh}>
              Actualizar bandeja
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-auto md:block">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 text-left sm:px-6">
                    {semesterFirst ? 'Semestre' : 'Asignatura'}
                  </th>
                  {flowOnly && !semesterFirst ? (
                    <th className="px-4 py-2.5 text-left">Sem.</th>
                  ) : null}
                  <th className="px-4 py-2.5 text-left sm:px-6">Estado</th>
                  <th className="px-4 py-2.5 text-left sm:px-6">Responsable</th>
                  <th className="px-4 py-2.5 text-left sm:px-6">Límite</th>
                  {!flowOnly ? (
                    <th className="hidden px-4 py-2.5 text-left lg:table-cell">SLA</th>
                  ) : null}
                  <th className="px-5 py-2.5 text-right sm:px-6">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading
                  ? [...Array(6)].map((_, idx) => (
                      <tr key={idx}>
                        <td className="px-5 py-3 sm:px-6" colSpan={flowOnly ? 6 : 6}>
                          <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  : items.map((item) => (
                      <tr
                        key={item.subjectId}
                        className={flowOnly ? 'cursor-pointer transition-colors hover:bg-slate-50/80' : 'hover:bg-slate-50/60'}
                        onClick={flowOnly ? () => handleRowOpen(item) : undefined}
                      >
                        <td className="px-5 py-3 align-middle sm:px-6">
                          <p className="font-semibold text-slate-900">{item.subjectName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.program}
                            {semesterFirst && item.subjectsTotal != null
                              ? ` · ${item.subjectsReady ?? 0}/${item.subjectsTotal} producidas`
                              : ''}
                          </p>
                        </td>
                        {flowOnly && !semesterFirst ? (
                          <td className="px-4 py-3 align-middle text-xs font-medium text-slate-600">
                            {item.semesterNumber ?? '—'}
                          </td>
                        ) : null}
                        <td className="px-4 py-3 align-middle sm:px-6">
                          <OperationalStateBadgeV2 state={item.operationalState} />
                        </td>
                        <td className="px-4 py-3 align-middle sm:px-6">
                          <span className="text-xs font-medium text-slate-600">{item.currentResponsibleRole}</span>
                        </td>
                        <td className="px-4 py-3 align-middle sm:px-6">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(item.stageDueAt)}
                          </span>
                        </td>
                        {!flowOnly ? (
                          <td className="hidden px-4 py-3 align-middle lg:table-cell">
                            <SlaBadgeV2 status={item.slaStatus} />
                          </td>
                        ) : null}
                        <td
                          className="px-5 py-3 text-right align-middle sm:px-6"
                          onClick={flowOnly ? (e) => e.stopPropagation() : undefined}
                        >
                          {flowOnly ? (
                            <FlowOpenButton
                              label={semesterFirst ? 'Ir al semestre' : 'Ver flujo'}
                              onClick={() => props.onOpenFlow(item)}
                            />
                          ) : (
                            <OperationalActionsV2
                              primaryAction={item.primaryAction}
                              actions={item.actions}
                              onAction={(action) => props.onAction({ subjectId: item.subjectId, action })}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 p-3 md:hidden">
            {isLoading
              ? [...Array(4)].map((_, idx) => <div key={idx} className="h-24 animate-pulse rounded-xl bg-slate-100" />)
              : items.map((item) => (
                  <div
                    key={item.subjectId}
                    className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm"
                    onClick={flowOnly ? () => handleRowOpen(item) : undefined}
                    onKeyDown={flowOnly ? undefined : undefined}
                    role={flowOnly ? 'button' : undefined}
                    tabIndex={flowOnly ? 0 : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.subjectName}</p>
                        <p className="text-xs text-slate-500">
                          {item.program}
                          {flowOnly && item.semesterNumber != null ? ` · Sem. ${item.semesterNumber}` : ''}
                        </p>
                      </div>
                      <OperationalStateBadgeV2 state={item.operationalState} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                      <span>{item.currentResponsibleRole}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(item.stageDueAt)}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      {flowOnly ? (
                        <FlowOpenButton
                          label={semesterFirst ? 'Ir al semestre' : 'Ver flujo'}
                          onClick={() => props.onOpenFlow(item)}
                        />
                      ) : (
                        <OperationalActionsV2
                          primaryAction={item.primaryAction}
                          actions={item.actions}
                          onAction={(action) => props.onAction({ subjectId: item.subjectId, action })}
                        />
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </>
      )}
    </Card>
  );
}
