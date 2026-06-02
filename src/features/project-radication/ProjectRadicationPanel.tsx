import { useState } from 'react';

import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, Loader2, Send } from 'lucide-react';

import { Card } from '../../components/ui/Card';

import { Button } from '../../components/ui/Button';

import { Modal } from '../../components/ui/Modal';

import { useToast } from '../../components/ui/ToastProvider';

import { formatDate } from '../../utils/formatters';

import {

  projectRadicationApi,

  type ProjectRadicationReadinessDto,

  type RegisterProjectRadicationBody,

} from '../../services/projectRadicationApi';

import { invalidatePlanningDashboard } from '../planning/planningInvalidation';

import { cn } from '../../components/ui/tokens';
import { isReducedInstitutionalFlow } from '../../config/env';



export const projectRadicationKeys = {
  readiness: (projectId: string) => ['project-radication-readiness', projectId] as const,
  institutionalClosure: (projectId: string) => ['project-institutional-closure', projectId] as const,
  productWork: () => ['product', 'radication-work'] as const,
};



export const PROJECT_RADICATION_SECTION_ID = 'radication';

export const PROJECT_RADICATION_ACTION_ID = 'radication-action';



/** Desplaza al CTA de radicación (o al panel si aún no está listo). */

export function scrollToRadicationSection(behavior: ScrollBehavior = 'smooth'): boolean {

  const el =

    document.getElementById(PROJECT_RADICATION_ACTION_ID) ??

    document.getElementById(PROJECT_RADICATION_SECTION_ID);

  if (!el) return false;

  el.scrollIntoView({ behavior, block: 'start' });

  return true;

}



function projectStateLabel(state: ProjectRadicationReadinessDto['projectInstitutionalState']): string {

  switch (state) {

    case 'READY_FOR_PRODUCT_RADICATION':

      return 'Listo para radicar';

    case 'PENDING_PLANNING_RADICATION_CHECK':

      return 'En validación Planeación';

    case 'RADICATION_RETURNED_TO_PRODUCT':

      return 'Radicado devuelto';

    case 'FINALIZED':

      return 'Solicitud finalizada';

    default:

      return 'En progreso institucional';

  }

}



export function RadicationProgressBar({
  approved,
  total,
  complete = false,
}: {
  approved: number;
  total: number;
  /** Fuerza barra llena y verde (p. ej. solicitud ya finalizada). */
  complete?: boolean;
}) {
  const effectiveApproved = complete && total > 0 ? total : approved;
  const pct = total > 0 ? Math.round((effectiveApproved / total) * 100) : complete ? 100 : 0;
  const isComplete = complete || (total > 0 && effectiveApproved >= total);

  return (
    <div className="mt-3">
      <div
        className={cn(
          'flex items-center justify-between text-xs font-semibold',
          isComplete ? 'text-emerald-800' : 'text-slate-600',
        )}
      >
        <span>Materias del alcance aprobadas</span>
        <span>
          {effectiveApproved}/{total} ({pct}%)
        </span>
      </div>
      <div
        className={cn(
          'mt-1.5 h-2 overflow-hidden rounded-full',
          isComplete ? 'bg-emerald-100' : 'bg-slate-100',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isComplete ? 'bg-emerald-500' : 'bg-orange-400',
          )}
          style={{ width: `${isComplete ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}



export function ProjectRadicationPanel({
  projectId,
  readinessQuery: readinessQueryProp,
}: {
  projectId: string;
  readinessQuery?: UseQueryResult<ProjectRadicationReadinessDto>;
}) {

  const { showToast } = useToast();

  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);

  const [saving, setSaving] = useState(false);

  const internalReadinessQuery = useQuery({

    queryKey: projectRadicationKeys.readiness(projectId),

    queryFn: () => projectRadicationApi.getReadiness(projectId),

    enabled: !readinessQueryProp,

    retry: 1,

  });

  const readinessQuery = readinessQueryProp ?? internalReadinessQuery;

  const [form, setForm] = useState<RegisterProjectRadicationBody>({

    radicationNumber: '',

    radicatedAt: new Date().toISOString().slice(0, 10),

    comment: '',

    evidenceUrl: '',

  });



  const data = readinessQuery.data;
  const reducedFlow = isReducedInstitutionalFlow();

  if (readinessQuery.isLoading && !data) {

    return (

      <Card className="p-6 text-center text-sm text-slate-500">

        <Loader2 className="mx-auto h-5 w-5 animate-spin text-orange-500" />

        <p className="mt-2">Cargando cierre de solicitud…</p>

      </Card>

    );

  }

  if (readinessQuery.isError && !data) {
    return (
      <Card className="border-amber-200 bg-amber-50/70 p-6 text-center text-sm text-amber-950">
        <AlertTriangle className="mx-auto h-5 w-5 text-amber-600" />
        <p className="mt-2 font-semibold">No se pudo cargar el cierre de solicitud</p>
        <p className="mt-1 text-xs text-amber-900">
          {readinessQuery.error instanceof Error
            ? readinessQuery.error.message
            : 'Use el botón «Actualizar datos» en la parte superior para reintentar.'}
        </p>
      </Card>
    );
  }



  if (!data || data.projectInstitutionalState === null) {

    return null;

  }



  const canSubmit = data.canRegisterRadication || data.canResubmitRadication;

  const isPendingPlanning = data.projectInstitutionalState === 'PENDING_PLANNING_RADICATION_CHECK';

  const isFinalized = data.projectInstitutionalState === 'FINALIZED';

  const isReturned = data.projectInstitutionalState === 'RADICATION_RETURNED_TO_PRODUCT';

  const scopeComplete =

    data.scope.subjectsTotal > 0 && data.scope.subjectsApproved >= data.scope.subjectsTotal;



  const handleSubmit = async () => {

    if (!form.radicationNumber.trim()) {

      showToast('Ingrese el número de radicado', 'error');

      return;

    }

    setSaving(true);

    try {

      const body: RegisterProjectRadicationBody = {

        radicationNumber: form.radicationNumber.trim(),

        radicatedAt: new Date(form.radicatedAt).toISOString(),

        comment: form.comment?.trim() || undefined,

        evidenceUrl: form.evidenceUrl?.trim() || undefined,

      };

      if (data.canResubmitRadication) {

        await projectRadicationApi.resubmit(projectId, body);

        showToast('Solicitud radicada y reenviada a Planeación');

      } else {

        await projectRadicationApi.register(projectId, body);

        showToast(
          reducedFlow
            ? 'Solicitud radicada y finalizada correctamente.'
            : 'Solicitud radicada correctamente. Planeación validará el cierre.',
        );

      }

      setShowModal(false);

      await queryClient.invalidateQueries({ queryKey: projectRadicationKeys.readiness(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectRadicationKeys.productWork() });

      if (!reducedFlow) {
        await invalidatePlanningDashboard(queryClient);
      }

      await queryClient.invalidateQueries({ queryKey: ['institutional-work'] });

    } catch (e: unknown) {

      showToast(e instanceof Error ? e.message : 'No se pudo radicar la solicitud', 'error');

    } finally {

      setSaving(false);

    }

  };



  const openRadicationModal = () => setShowModal(true);



  return (

    <>

      <Card

        id={PROJECT_RADICATION_SECTION_ID}

        className="scroll-mt-6 overflow-hidden rounded-[20px] border border-orange-100/80 bg-white shadow-[0_8px_30px_-12px_rgba(255,107,0,0.12)]"

      >

        <div className="border-b border-slate-100 bg-linear-to-r from-orange-50/80 via-white to-white px-6 py-5 sm:px-7">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>

              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">

                Cierre de solicitud · Product

              </p>

              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">

                Radicación institucional

              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-500">

                Último paso de Product: registra el radicado del paquete completo (semestres y asignaturas del

                alcance) {reducedFlow ? 'para cerrar el flujo.' : 'para enviarlo a Planeación y cerrar el flujo.'}

              </p>

            </div>

            <span

              className={cn(

                'rounded-full px-3 py-1 text-xs font-bold ring-1',

                data.ready || isPendingPlanning || isFinalized

                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'

                  : 'bg-slate-50 text-slate-600 ring-slate-200',

              )}

            >

              {projectStateLabel(data.projectInstitutionalState)}

            </span>

          </div>

          <RadicationProgressBar
            approved={data.scope.subjectsApproved}
            total={data.scope.subjectsTotal}
            complete={isFinalized || scopeComplete}
          />

          <p className="mt-2 text-xs text-slate-500">

            {data.scope.semesters} semestre(s) en alcance · {data.scope.subjectsPending} materia(s) pendiente(s) de

            cierre académico

          </p>

        </div>



        <div id={PROJECT_RADICATION_ACTION_ID} className="scroll-mt-6 p-6 sm:p-7">

          {canSubmit && (

            <div className="rounded-2xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/60 p-5 sm:p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">

                    <FileCheck2 className="h-5 w-5" />

                  </div>

                  <div>

                    <p className="text-sm font-bold text-emerald-900">

                      {isReturned

                        ? 'Corrija y vuelva a radicar la solicitud'

                        : 'Puede radicar la solicitud completa'}

                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-emerald-800/90">

                      {isReturned

                        ? 'Planeación devolvió el radicado. Actualice número y fecha, luego reenvíe.'

                        : reducedFlow
                          ? 'Todas las materias del alcance están listas. Al radicar, la solicitud se cerrará inmediatamente.'
                          : 'Todas las materias del alcance están listas. Al radicar, la solicitud pasa a validación final de Planeación (fase 8).'}

                    </p>

                  </div>

                </div>

                <Button size="lg" className="w-full shrink-0 shadow-lg shadow-orange-500/30 sm:w-auto" onClick={openRadicationModal}>

                  <Send className="h-4 w-4" />

                  {isReturned ? 'Radicar de nuevo' : 'Radicar solicitud'}

                </Button>

              </div>

            </div>

          )}



          {isPendingPlanning && (

            <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-5">

              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />

              <div>

                <p className="text-sm font-bold text-sky-900">Radicado enviado a Planeación</p>

                <p className="mt-1 text-xs text-sky-800">

                  La solicitud está en validación final. No requiere más acciones de Product por ahora.

                </p>

                {data.radicationNumber && (

                  <p className="mt-2 text-sm text-sky-900">

                    N.º <strong>{data.radicationNumber}</strong>

                    {data.radicatedAt ? ` · ${formatDate(data.radicatedAt)}` : ''}

                  </p>

                )}

              </div>

            </div>

          )}



          {isFinalized && (

            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div>

                <p className="text-sm font-bold text-emerald-900">Solicitud finalizada</p>

                <p className="mt-1 text-xs text-emerald-800">

                  {reducedFlow
                    ? 'Product registró el radicado. El proceso institucional quedó cerrado.'
                    : 'Planeación validó el radicado. El proceso institucional quedó cerrado.'}

                </p>

                {data.radicationNumber && (

                  <p className="mt-2 text-sm text-emerald-900">

                    Radicado: <strong>{data.radicationNumber}</strong>

                    {data.radicatedAt ? ` · ${formatDate(data.radicatedAt)}` : ''}

                  </p>

                )}

              </div>

            </div>

          )}



          {!canSubmit && !isPendingPlanning && !isFinalized && (

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">

              <p className="text-sm font-bold text-slate-800">

                {scopeComplete

                  ? 'Cierre académico en curso'

                  : 'Aún no puede radicar la solicitud'}

              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-600">

                {scopeComplete

                  ? 'Las materias están aprobadas. Recargue la página para sincronizar el cierre de cada semestre; si persiste, confirme «Aprobar revisión académica» en el centro operacional de cada semestre.'

                  : 'Apruebe todas las materias del alcance inicial y complete la revisión académica de cada semestre.'}

              </p>

              {data.blockers.length > 0 && (

                <ul className="mt-3 space-y-1.5 border-t border-slate-200/80 pt-3 text-xs text-slate-600">

                  {data.blockers.slice(0, 6).map((b) => (

                    <li key={b} className="flex gap-2">

                      <span className="text-slate-400">•</span>

                      <span>{b}</span>

                    </li>

                  ))}

                </ul>

              )}

              <Button size="lg" className="mt-4 w-full sm:w-auto" disabled variant="secondary">

                <FileCheck2 className="h-4 w-4" />

                Radicar solicitud

              </Button>

              <p className="mt-2 text-[11px] text-slate-500">Se habilitará automáticamente cuando el alcance esté listo.</p>

            </div>

          )}



          {isReturned && data.lastRadicationReturnReason && (

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">

              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

              <div>

                <p className="font-bold">Motivo de devolución</p>

                <p className="mt-1">{data.lastRadicationReturnReason}</p>

              </div>

            </div>

          )}

        </div>

      </Card>



      <Modal

        isOpen={showModal}

        onClose={() => setShowModal(false)}

        title={data.canResubmitRadication ? 'Radicar solicitud de nuevo' : 'Radicar solicitud'}

        description={
          reducedFlow
            ? 'Registre el número y la fecha del radicado institucional. La solicitud completa se cerrará inmediatamente.'
            : 'Registre el número y la fecha del radicado institucional. La solicitud completa pasará a Planeación para la validación final del proceso.'
        }

        size="md"

      >

        <div className="space-y-4">

          <div>

            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Número de radicado *</label>

            <input

              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"

              value={form.radicationNumber}

              onChange={(e) => setForm((f) => ({ ...f, radicationNumber: e.target.value }))}

              placeholder="Ej. RAD-2026-001234"

            />

          </div>

          <div>

            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Fecha de radicado *</label>

            <input

              type="date"

              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"

              value={form.radicatedAt.slice(0, 10)}

              onChange={(e) => setForm((f) => ({ ...f, radicatedAt: e.target.value }))}

            />

          </div>

          <div>

            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Comentario</label>

            <textarea

              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"

              rows={3}

              value={form.comment ?? ''}

              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}

              placeholder={reducedFlow ? 'Opcional: notas de cierre' : 'Opcional: notas para Planeación'}

            />

          </div>

          <div>

            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">URL evidencia</label>

            <input

              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"

              value={form.evidenceUrl ?? ''}

              onChange={(e) => setForm((f) => ({ ...f, evidenceUrl: e.target.value }))}

              placeholder="https://…"

            />

          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">

            <Button variant="secondary" onClick={() => setShowModal(false)}>

              Cancelar

            </Button>

            <Button onClick={() => void handleSubmit()} disabled={saving}>

              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}

              Confirmar radicación

            </Button>

          </div>

        </div>

      </Modal>

    </>

  );

}



export function ProjectRadicationScopeLockHint({ projectId }: { projectId: string }) {

  const { data } = useQuery({

    queryKey: projectRadicationKeys.readiness(projectId),

    queryFn: () => projectRadicationApi.getReadiness(projectId),

  });

  if (!data?.institutionalScopeLockedAt) return null;



  const canRadicate = data.canRegisterRadication || data.canResubmitRadication;

  if (canRadicate) {
    return (
      <p className="text-xs text-amber-700">
        {isReducedInstitutionalFlow()
          ? 'El alcance quedó bloqueado al iniciar el flujo de Fábrica. El cierre de la solicitud se gestiona en el panel de radicación institucional arriba.'
          : 'El alcance quedó bloqueado tras la validación inicial de Planeación. El cierre de la solicitud se gestiona en el panel de radicación institucional arriba.'}
      </p>
    );
  }

  return (
    <p className="text-xs text-amber-700">
      {isReducedInstitutionalFlow()
        ? 'El alcance quedó bloqueado al iniciar el flujo de Fábrica.'
        : 'El alcance quedó bloqueado tras la validación inicial de Planeación.'}{' '}
      <button
        type="button"
        className="font-bold underline hover:text-amber-900"
        onClick={() => scrollToRadicationSection()}
      >
        Ver estado de radicación
      </button>
    </p>
  );

}


