import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FileCheck2, Loader2 } from 'lucide-react';
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

const projectRadicationKeys = {
  readiness: (projectId: string) => ['project-radication-readiness', projectId] as const,
};

function projectStateLabel(state: ProjectRadicationReadinessDto['projectInstitutionalState']): string {
  switch (state) {
    case 'READY_FOR_PRODUCT_RADICATION':
      return 'Listo para radicación Product';
    case 'PENDING_PLANNING_RADICATION_CHECK':
      return 'Pendiente validación Planeación';
    case 'RADICATION_RETURNED_TO_PRODUCT':
      return 'Radicado devuelto a Product';
    case 'FINALIZED':
      return 'Solicitud finalizada';
    default:
      return 'En progreso institucional';
  }
}

export function ProjectRadicationPanel({ projectId }: { projectId: string }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RegisterProjectRadicationBody>({
    radicationNumber: '',
    radicatedAt: new Date().toISOString().slice(0, 10),
    comment: '',
    evidenceUrl: '',
  });

  const readinessQuery = useQuery({
    queryKey: projectRadicationKeys.readiness(projectId),
    queryFn: () => projectRadicationApi.getReadiness(projectId),
  });

  const data = readinessQuery.data;
  if (readinessQuery.isLoading) {
    return (
      <Card className="p-6 text-center text-sm text-slate-500">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-orange-500" />
        <p className="mt-2">Cargando progreso de radicación…</p>
      </Card>
    );
  }

  if (!data || data.projectInstitutionalState === null) {
    return null;
  }

  const canSubmit = data.canRegisterRadication || data.canResubmitRadication;

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
        showToast('Radicado reenviado a Planeación');
      } else {
        await projectRadicationApi.register(projectId, body);
        showToast('Radicado registrado correctamente');
      }
      setShowModal(false);
      await queryClient.invalidateQueries({ queryKey: projectRadicationKeys.readiness(projectId) });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'No se pudo registrar el radicado', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden rounded-[20px] border-none bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Radicación</p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Progreso de radicación del proyecto</h2>
              <p className="mt-1 text-sm text-slate-500">
                Alcance inicial: {data.scope.subjectsApproved} de {data.scope.subjectsTotal} materias aprobadas
                · {data.scope.semesters} semestre(s)
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                data.ready
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-slate-50 text-slate-600 ring-slate-200'
              }`}
            >
              {projectStateLabel(data.projectInstitutionalState)}
            </span>
          </div>

          {data.ready && data.canRegisterRadication && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Todas las materias del alcance inicial están listas. Puede registrar el radicado de la solicitud.
            </div>
          )}

          {data.projectInstitutionalState === 'RADICATION_RETURNED_TO_PRODUCT' && data.lastRadicationReturnReason && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Radicado devuelto por Planeación</p>
                <p className="mt-1">{data.lastRadicationReturnReason}</p>
              </div>
            </div>
          )}

          {data.blockers.length > 0 && !data.ready && (
            <ul className="mt-4 space-y-1 text-xs text-slate-600">
              {data.blockers.slice(0, 5).map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.bySemester.map((sem) => (
              <div key={sem.semesterNumber} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-xs font-bold text-slate-700">Semestre {sem.semesterNumber}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {sem.approved}/{sem.total} aprobadas
                </p>
              </div>
            ))}
          </div>

          {data.radicationNumber && (
            <p className="mt-4 text-sm text-slate-600">
              Radicado: <strong>{data.radicationNumber}</strong>
              {data.radicatedAt ? ` · ${formatDate(data.radicatedAt)}` : ''}
            </p>
          )}

          {canSubmit && (
            <div className="mt-5">
              <Button onClick={() => setShowModal(true)}>
                <FileCheck2 className="h-4 w-4" />
                {data.canResubmitRadication ? 'Corregir y reenviar radicado' : 'Registrar radicado'}
              </Button>
            </div>
          )}

          {data.projectInstitutionalState === 'PENDING_PLANNING_RADICATION_CHECK' && (
            <p className="mt-4 text-sm text-slate-500">
              Radicado enviado a Planeación para validación final.
            </p>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={data.canResubmitRadication ? 'Corregir radicado' : 'Registrar radicado'}
        description="Número y fecha del radicado institucional de la solicitud completa."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Número de radicado *</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.radicationNumber}
              onChange={(e) => setForm((f) => ({ ...f, radicationNumber: e.target.value }))}
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
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">URL evidencia</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.evidenceUrl ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, evidenceUrl: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar
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
  return (
    <p className="text-xs text-amber-700">
      El alcance quedó bloqueado tras la validación inicial de Planeación.{' '}
      <Link to={`/projects/${projectId}?tab=summary`} className="font-bold underline">
        Ver radicación
      </Link>
    </p>
  );
}
