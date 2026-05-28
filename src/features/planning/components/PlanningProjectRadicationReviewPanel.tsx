import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileCheck2, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/ToastProvider';
import { formatDate } from '../../../utils/formatters';
import { projectRadicationApi } from '../../../services/projectRadicationApi';
import {
  projectRadicationKeys,
  RadicationProgressBar,
} from '../../project-radication/ProjectRadicationPanel';
import { OperationalPipelineInstitutional } from '../../institutional-workflow/components/OperationalPipelineInstitutional';
import { InstitutionalOperationalChecks } from '../../institutional-workflow/components/InstitutionalOperationalChecks';
import type { OperationalCheckKeyV2 } from '../../../types/operationalWorkflow';
import { INSTITUTIONAL_CLOSURE_CHECKS } from '../../institutional-workflow/institutionalClosureChecks';
import { invalidatePlanningDashboard } from '../planningInvalidation';

type PlanningProjectRadicationReviewPanelProps = {
  projectId: string;
};

export function PlanningProjectRadicationReviewPanel({ projectId }: PlanningProjectRadicationReviewPanelProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const readinessQuery = useQuery({
    queryKey: projectRadicationKeys.readiness(projectId),
    queryFn: () => projectRadicationApi.getReadiness(projectId),
  });

  const data = readinessQuery.data;
  const isPendingPlanning = data?.projectInstitutionalState === 'PENDING_PLANNING_RADICATION_CHECK';

  if (readinessQuery.isLoading) {
    return (
      <Card className="flex items-center gap-2 p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Cargando validación de radicado…
      </Card>
    );
  }

  if (!isPendingPlanning || !data) return null;

  const checks = INSTITUTIONAL_CLOSURE_CHECKS.map((def, index) => ({
    key: def.key,
    label: def.label,
    responsibleRole: def.responsibleRole,
    status: (index < INSTITUTIONAL_CLOSURE_CHECKS.length - 1 ? 'CHECKED' : 'PENDING') as 'CHECKED' | 'PENDING',
    checkedAt: index < INSTITUTIONAL_CLOSURE_CHECKS.length - 1 ? new Date().toISOString() : null,
    checkedBy: null,
    comment: null,
    evidenceUrl: null,
    dueAt: data.planningRadicationCheckDueAt,
  }));

  const handleValidate = async () => {
    setBusy(true);
    try {
      await projectRadicationApi.validate(projectId);
      showToast('Radicado validado. La solicitud quedó finalizada.');
      await queryClient.invalidateQueries({ queryKey: projectRadicationKeys.readiness(projectId) });
      await invalidatePlanningDashboard(queryClient);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'No se pudo validar el radicado', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReturn = async () => {
    if (returnReason.trim().length < 10) return;
    setBusy(true);
    try {
      await projectRadicationApi.returnRadication(projectId, { returnReason: returnReason.trim() });
      showToast('Radicado devuelto a Product');
      setReturnModalOpen(false);
      setReturnReason('');
      await queryClient.invalidateQueries({ queryKey: projectRadicationKeys.readiness(projectId) });
      await invalidatePlanningDashboard(queryClient);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'No se pudo devolver el radicado', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden rounded-[20px] border border-orange-100/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-linear-to-r from-orange-50/80 via-white to-white px-6 py-5 sm:px-7">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
            Validación final · Planeación
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Cierre institucional de la solicitud</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Revise el radicado registrado por Product y confirme el cierre del flujo completo. La validación se realiza
            aquí, a nivel de solicitud (no por semestre).
          </p>
          {data.radicationNumber ? (
            <p className="mt-3 text-sm text-slate-700">
              Radicado <strong>{data.radicationNumber}</strong>
              {data.radicatedAt ? ` · ${formatDate(data.radicatedAt)}` : ''}
            </p>
          ) : null}
          <div className="mt-4">
            <RadicationProgressBar approved={data.scope.subjectsApproved} total={data.scope.subjectsTotal} />
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-7">
          <OperationalPipelineInstitutional state="PENDING_PROJECT_RADICATION" />

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 lg:col-span-2">
              <InstitutionalOperationalChecks checks={checks} />
            </section>

            <section className="h-fit rounded-2xl border-l-4 border-l-orange-500 bg-orange-50/40 p-5 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-800/90">Siguiente acción</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">Validar radicado institucional</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Alcance: {data.scope.subjectsApproved}/{data.scope.subjectsTotal} materias · {data.scope.semesters}{' '}
                semestre(s). Al validar, la solicitud pasa a estado finalizado.
              </p>
              {data.planningRadicationCheckDueAt ? (
                <p className="mt-2 text-xs font-medium text-slate-600">
                  Plazo: {formatDate(data.planningRadicationCheckDueAt)}
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2">
                <Button size="lg" className="w-full shadow-lg shadow-orange-500/25" disabled={busy} onClick={() => void handleValidate()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Validar y finalizar solicitud
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={busy}
                  onClick={() => {
                    setReturnModalOpen(true);
                    setReturnReason('');
                  }}
                >
                  Devolver a Product
                </Button>
              </div>
            </section>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-emerald-300/80 bg-emerald-50/50 p-4">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-xs leading-relaxed text-emerald-900">
              Los semestres del programa permanecen en radicación pendiente hasta que confirme aquí. No es necesario
              abrir cada semestre para cerrar la solicitud.
            </p>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
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
          <Button variant="secondary" onClick={() => setReturnModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleReturn()} disabled={busy || returnReason.trim().length < 10}>
            Devolver
          </Button>
        </div>
      </Modal>
    </>
  );
}
