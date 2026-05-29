import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import type { OperationalObservation, Role } from '../../types/domain';
import { formatDate } from '../../utils/formatters';
import {
  observationBadgeLabels,
  observationStatusLabels,
  type ObservationDeliverableBadgeState,
} from './observationDeliverableHelpers';

type DeliverableObservationsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  deliverableLabel: string;
  observations: OperationalObservation[];
  badgeState: ObservationDeliverableBadgeState;
  role: Role;
  saving?: boolean;
  /** Texto sugerido al abrir tras marcar el entregable como rechazado. */
  draftSuggestion?: string | null;
  openedFromReject?: boolean;
  onCreateObservation: (text: string) => Promise<void>;
  onValidateObservation?: (observation: OperationalObservation) => Promise<void>;
  onMarkCorrectionApplied?: (observation: OperationalObservation) => Promise<void>;
};

export function DeliverableObservationsDrawer({
  isOpen,
  onClose,
  deliverableLabel,
  observations,
  badgeState,
  role,
  saving = false,
  draftSuggestion = null,
  openedFromReject = false,
  onCreateObservation,
  onValidateObservation,
  onMarkCorrectionApplied,
}: DeliverableObservationsDrawerProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const hasPendingDraft = observations.some(
    (obs) => obs.status === 'ABIERTA' && obs.notificationStatus === 'PENDING',
  );

  useEffect(() => {
    if (!isOpen) {
      setText('');
      setError('');
      return;
    }
    if (draftSuggestion && !hasPendingDraft) {
      setText(draftSuggestion);
    }
  }, [isOpen, draftSuggestion, hasPendingDraft]);

  const handleCreate = async () => {
    if (hasPendingDraft) {
      setError('Ya hay un borrador para este entregable. Envíalo con el lote o complétalo antes de agregar otro.');
      return;
    }
    if (!text.trim()) {
      setError('Escribe la observación.');
      return;
    }
    setError('');
    await onCreateObservation(text.trim());
    setText('');
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={openedFromReject ? 'Observación por rechazo' : 'Observaciones'}
      description={
        openedFromReject
          ? `${deliverableLabel} · Registra qué debe corregir Fábrica. Se guardará como borrador hasta que envíes el lote.`
          : `${deliverableLabel} · ${observationBadgeLabels[badgeState]}`
      }
    >
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        {observations.length === 0 ? (
          <p className="text-sm text-slate-500">Sin observaciones para este entregable.</p>
        ) : (
          <div className="space-y-3">
            {observations.map((observation) => (
              <div key={observation.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {observationStatusLabels[observation.status] ?? observation.status}
                    {observation.notificationStatus === 'PENDING' ? ' · borrador' : ''}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDate(observation.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-800">{observation.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {role === 'PRODUCT' && observation.status === 'EN_CORRECCION' && onValidateObservation && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={saving}
                      onClick={() => void onValidateObservation(observation)}
                    >
                      Validar corrección
                    </Button>
                  )}
                  {role === 'FABRICA' &&
                    observation.status === 'ABIERTA' &&
                    observation.notificationStatus !== 'PENDING' &&
                    onMarkCorrectionApplied && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={saving}
                      onClick={() => void onMarkCorrectionApplied(observation)}
                    >
                      Marcar corregida
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {role === 'PRODUCT' && (
          <div className="mt-auto border-t border-slate-100 pt-4">
            {hasPendingDraft ? (
              <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-900">
                Este entregable ya tiene un borrador pendiente. Cuando termines todas las revisiones, usa
                &quot;Enviar observaciones a Fábrica&quot; para notificar a Fábrica en un solo envío.
              </p>
            ) : (
              <>
                <p className="mb-2 text-xs font-bold text-slate-700">Nueva observación (borrador)</p>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  rows={3}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Describe qué debe corregir Fábrica..."
                />
                {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
                <div className="mt-3 flex justify-end">
                  <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Guardar borrador
                  </Button>
                </div>
              </>
            )}
            <p className="mt-2 text-[10px] text-slate-400">
              Los borradores no notifican a Fábrica hasta que presiones &quot;Enviar observaciones a Fábrica&quot;
              en la barra inferior.
            </p>
          </div>
        )}
      </div>
    </Drawer>
  );
}
