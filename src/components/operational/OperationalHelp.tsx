import { HelpCircle } from 'lucide-react';
import { Card, type CardVariant } from '../ui/Card';

const helpText = {
  pipeline: 'El pipeline muestra la etapa del flujo Product a Fabrica. Cada estado habilita o bloquea acciones distintas.',
  notifications: 'Leer una notificacion no resuelve la accion. Usa Gestionar o Ver proyecto para atender el pendiente operativo.',
  audit: 'Auditoria explica que cambio, quien lo hizo y como impacta el proceso institucional.',
  context: 'Vista rapida muestra contexto sin salir del flujo. Gestionar abre la pantalla completa para actualizar checklist, documentos y observaciones.',
  comments: 'Observaciones son pendientes operativos; comentarios son conversacion de seguimiento y coordinacion.',
};

export function OperationalHelp({ topic, text, variant = 'subjectPanel' }: { topic?: keyof typeof helpText; text?: string; variant?: CardVariant }) {
  return (
    <Card variant={variant} className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
          <HelpCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Ayuda operacional</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{text ?? (topic ? helpText[topic] : helpText.context)}</p>
        </div>
      </div>
    </Card>
  );
}
