import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { formatDate } from '../../../utils/formatters';
import { OperationalStateBadgeV2 } from '../../operations-v2/components/OperationalStateBadgeV2';
import { SlaBadgeV2 } from '../../operations-v2/components/SlaBadgeV2';
import { roleLabelV2 } from '../../operations-v2/rules/workflowRulesV2';
import type { OperationalRoleV2, SlaStatusV2 } from '../../../types/operationalWorkflow';
import type { PlanningWorkRow } from '../planningTypes';

function roleLabel(role: string): string {
  return roleLabelV2(role as OperationalRoleV2);
}

export function PlanningWorkTable({
  rows,
  isLoading,
  error,
  onOpenFlow,
  onValidateRadication,
  onReturnRadication,
  busyProjectId,
}: {
  rows: PlanningWorkRow[];
  isLoading: boolean;
  error: string | null;
  onOpenFlow: (subjectId: string) => void;
  onValidateRadication: (projectId: string) => void;
  onReturnRadication: (projectId: string, reason: string) => Promise<void>;
  busyProjectId: string | null;
}) {
  const [returnModal, setReturnModal] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  const handleReturn = async () => {
    if (!returnModal || returnReason.trim().length < 10) return;
    await onReturnRadication(returnModal, returnReason.trim());
    setReturnModal(null);
    setReturnReason('');
  };

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 bg-white px-5 py-3.5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Mis pendientes</p>
            <h2 className="text-sm font-semibold text-slate-900">Bandeja operacional</h2>
          </div>
          <span className="rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200/70">
            {rows.length} en vista
          </span>
        </div>

        {error ? (
          <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700 sm:px-6">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : rows.length === 0 ? null : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 sm:px-6">Solicitud</th>
                  <th className="px-3 py-3">Asignatura</th>
                  <th className="px-3 py-3">Etapa</th>
                  <th className="px-3 py-3">Responsable</th>
                  <th className="px-3 py-3">Plazo</th>
                  <th className="px-3 py-3">Última actividad</th>
                  <th className="px-5 py-3 text-right sm:px-6">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  if (row.kind === 'subject' || row.kind === 'returned') {
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-4 sm:px-6">
                          <p className="text-[10px] font-bold uppercase text-slate-400">{row.school}</p>
                          <p className="font-bold text-slate-900">{row.program}</p>
                          <p className="text-xs text-slate-500">Sem. {row.kind === 'subject' ? row.semesterNumber : '—'}</p>
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-800">{row.subjectName}</td>
                        <td className="px-3 py-4">
                          <OperationalStateBadgeV2 state={row.operationalState} />
                        </td>
                        <td className="px-3 py-4 text-xs font-semibold text-slate-600">
                          {roleLabel(row.responsibleRole)}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-col gap-1">
                            {row.stageDueAt ? (
                              <span className="text-xs font-medium text-slate-600">
                                {formatDate(row.stageDueAt)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                            <SlaBadgeV2 status={row.slaStatus as SlaStatusV2} />
                          </div>
                        </td>
                        <td className="max-w-[12rem] px-3 py-4 text-xs text-slate-500">
                          {row.lastActivity ? (
                            <span className="line-clamp-2">{row.lastActivity}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-5 py-4 text-right sm:px-6">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="gap-1.5"
                            onClick={() => onOpenFlow(row.subjectId)}
                          >
                            Ver flujo
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  }

                  if (row.kind === 'radication') {
                    return (
                      <tr key={row.id} className="hover:bg-orange-50/30">
                        <td className="px-5 py-4 sm:px-6">
                          <p className="text-[10px] font-bold uppercase text-slate-400">{row.school}</p>
                          <p className="font-bold text-slate-900">{row.program}</p>
                          <p className="text-xs font-medium text-orange-600">Radicación de proyecto</p>
                        </td>
                        <td className="px-3 py-4 text-slate-400">—</td>
                        <td className="px-3 py-4">
                          <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700 ring-1 ring-orange-100">
                            Revisión de radicado
                          </span>
                        </td>
                        <td className="px-3 py-4 text-xs font-semibold text-slate-600">Product</td>
                        <td className="px-3 py-4 text-xs font-medium text-slate-600">
                          {row.planningRadicationCheckDueAt
                            ? formatDate(row.planningRadicationCheckDueAt)
                            : '—'}
                        </td>
                        <td className="max-w-[12rem] px-3 py-4 text-xs text-slate-500">
                          {row.radicationNumber ? (
                            <>
                              <span className="font-bold text-slate-700">{row.radicationNumber}</span>
                              {row.radicatedAt ? ` · ${formatDate(row.radicatedAt)}` : ''}
                            </>
                          ) : (
                            (row.lastRadicationReturnReason ?? '—')
                          )}
                        </td>
                        <td className="px-5 py-4 text-right sm:px-6">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Link
                              to={`/projects/${row.projectId}`}
                              className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                            >
                              Ver proyecto
                            </Link>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={busyProjectId === row.projectId}
                              onClick={() => {
                                setReturnModal(row.projectId);
                                setReturnReason('');
                              }}
                            >
                              Devolver
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={busyProjectId === row.projectId}
                              onClick={() => onValidateRadication(row.projectId)}
                            >
                              {busyProjectId === row.projectId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Validar'
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={row.id} className="hover:bg-emerald-50/20">
                      <td className="px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-bold uppercase text-slate-400">{row.school}</p>
                        <p className="font-bold text-slate-900">{row.program}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-400">—</td>
                      <td className="px-3 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                          Finalizada
                        </span>
                      </td>
                      <td className="px-3 py-4 text-xs font-semibold text-slate-600">{row.productOwnerName}</td>
                      <td className="px-3 py-4 text-xs text-slate-500">
                        {row.radicatedAt ? formatDate(row.radicatedAt) : '—'}
                      </td>
                      <td className="px-3 py-4 text-xs text-slate-500">
                        {row.radicationNumber ?? '—'} · {row.subjectsCount} materias · {row.semestersCount} sem.
                      </td>
                      <td className="px-5 py-4 text-right sm:px-6">
                        <Link
                          to={`/projects/${row.projectId}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                        >
                          Ver solicitud
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={Boolean(returnModal)}
        onClose={() => setReturnModal(null)}
        title="Devolver radicado a Product"
        description="Indique el motivo de la devolución (mínimo 10 caracteres)."
        size="md"
      >
        <textarea
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          rows={4}
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
          placeholder="Motivo de devolución…"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setReturnModal(null)}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleReturn()}
            disabled={
              (busyProjectId !== null && busyProjectId !== returnModal) ||
              returnReason.trim().length < 10
            }
          >
            Devolver
          </Button>
        </div>
      </Modal>
    </>
  );
}
