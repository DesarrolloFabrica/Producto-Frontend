import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/ToastProvider';
import { formatDate } from '../../utils/formatters';
import { projectRadicationApi } from '../../services/projectRadicationApi';

export function PlanningRadicationPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [returnModal, setReturnModal] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const workQuery = useQuery({
    queryKey: ['planning-radication-work'],
    queryFn: () => projectRadicationApi.planningWork(),
  });

  const handleValidate = async (projectId: string) => {
    setBusyId(projectId);
    try {
      await projectRadicationApi.validate(projectId);
      showToast('Radicado validado y solicitud finalizada');
      await queryClient.invalidateQueries({ queryKey: ['planning-radication-work'] });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al validar', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleReturn = async () => {
    if (!returnModal || returnReason.trim().length < 10) {
      showToast('El motivo debe tener al menos 10 caracteres', 'error');
      return;
    }
    setBusyId(returnModal);
    try {
      await projectRadicationApi.returnRadication(returnModal, { returnReason: returnReason.trim() });
      showToast('Radicado devuelto a Product');
      setReturnModal(null);
      setReturnReason('');
      await queryClient.invalidateQueries({ queryKey: ['planning-radication-work'] });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al devolver', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const items = workQuery.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-6">
      <PageHeader
        eyebrow="Planeación"
        title="Solicitudes radicadas"
        description="Validar radicados registrados por Product y cerrar la solicitud."
      />

      {workQuery.isLoading && (
        <Card className="p-8 text-center text-sm text-slate-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </Card>
      )}

      {!workQuery.isLoading && items.length === 0 && (
        <Card className="p-8 text-center text-sm text-slate-500">No hay solicitudes pendientes de validación de radicado.</Card>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.projectId} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">{item.school}</p>
                <h3 className="text-lg font-black text-slate-900">{item.program}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Radicado: <strong>{item.radicationNumber ?? '—'}</strong>
                  {item.radicatedAt ? ` · ${formatDate(item.radicatedAt)}` : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Alcance: {item.scopeSubjectsApproved}/{item.scopeSubjectsTotal} materias
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/projects/${item.projectId}`}
                  className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  Ver proyecto
                </Link>
                <Button
                  variant="secondary"
                  disabled={busyId === item.projectId}
                  onClick={() => {
                    setReturnModal(item.projectId);
                    setReturnReason('');
                  }}
                >
                  Devolver
                </Button>
                <Button
                  disabled={busyId === item.projectId}
                  onClick={() => void handleValidate(item.projectId)}
                >
                  {busyId === item.projectId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Validar radicado y finalizar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
          <Button onClick={() => void handleReturn()} disabled={busyId !== null}>
            Devolver
          </Button>
        </div>
      </Modal>
    </div>
  );
}
