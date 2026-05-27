import type React from 'react';
import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CornerDownLeft, FileCheck2, Factory, GraduationCap, UploadCloud } from 'lucide-react';
import type { OperationalActionV2 } from '../../../types/operationalWorkflow';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../components/ui/tokens';
import { actionLabelV2 } from '../rules/workflowRulesV2';

export type ModalRequestV2 =
  | { action: OperationalActionV2; subjectId: string }
  | null;

function actionMeta(action: OperationalActionV2): { icon: React.ComponentType<any>; title: string; description: string; requiresComment: boolean } {
  switch (action) {
    case 'PLANNING_VALIDATE_INITIAL':
      return { icon: FileCheck2, title: 'Validar solicitud inicial', description: 'Planeación confirma que la solicitud tiene datos correctos para iniciar el pipeline.', requiresComment: false };
    case 'PLANNING_RETURN_INITIAL':
      return { icon: CornerDownLeft, title: 'Devolver solicitud a Product', description: 'La devolución requiere un comentario claro con el motivo y el ajuste esperado.', requiresComment: true };
    case 'FACTORY_START_PRODUCTION':
      return { icon: Factory, title: 'Iniciar producción', description: 'Fábrica inicia producción operacional para esta asignatura.', requiresComment: false };
    case 'FACTORY_DELIVER_CONTENT':
      return { icon: CheckCircle2, title: 'Entregar contenido', description: 'Marca la producción como lista para validación de Planeación.', requiresComment: false };
    case 'PLANNING_VALIDATE_PRODUCTION':
      return { icon: FileCheck2, title: 'Validar produccion', description: 'Planeación valida entrega, estructura y evidencias de producción.', requiresComment: false };
    case 'PLANNING_RETURN_PRODUCTION':
      return { icon: CornerDownLeft, title: 'Devolver a Fábrica', description: 'La devolución requiere motivo y el ajuste esperado.', requiresComment: true };
    case 'LMS_START_UPLOAD':
      return { icon: UploadCloud, title: 'Iniciar carga LMS', description: 'LMS inicia carga/publicación por asignatura.', requiresComment: false };
    case 'LMS_CONFIRM_UPLOAD':
      return { icon: CheckCircle2, title: 'Confirmar publicacion', description: 'Confirma carga/publicación y deja evidencia/referencia si aplica.', requiresComment: false };
    case 'PLANNING_VALIDATE_LMS':
      return { icon: FileCheck2, title: 'Validar LMS y credenciales', description: 'Planeación valida publicación, enlaces y credenciales (si aplica).', requiresComment: false };
    case 'PLANNING_RETURN_LMS':
      return { icon: CornerDownLeft, title: 'Devolver a LMS', description: 'Requiere comentario con hallazgo y corrección requerida.', requiresComment: true };
    case 'PRODUCT_START_ACADEMIC_REVIEW':
      return { icon: GraduationCap, title: 'Iniciar revisión académica', description: 'Product entra a la fase de checklist académico existente y observaciones.', requiresComment: false };
    case 'PRODUCT_REQUEST_CHANGES':
      return { icon: AlertCircle, title: 'Solicitar correcciones', description: 'Simula solicitud de correcciones académicas a Fábrica (sin tocar observaciones reales).', requiresComment: true };
    case 'PRODUCT_APPROVE_ACADEMIC':
      return { icon: FileCheck2, title: 'Aprobar revisión académica', description: 'Marca la revisión como aprobada y pasa a radicación final.', requiresComment: false };
    default:
      return { icon: FileCheck2, title: actionLabelV2(action), description: 'Acción operativa.', requiresComment: false };
  }
}

export function TransitionModalsV2({
  request,
  onClose,
  onConfirm,
}: {
  request: ModalRequestV2;
  onClose: () => void;
  onConfirm: (params: { subjectId: string; action: OperationalActionV2; comment: string; evidenceUrl: string }) => void;
}) {
  const [comment, setComment] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const meta = useMemo(() => (request ? actionMeta(request.action) : null), [request]);
  const Icon = meta?.icon ?? FileCheck2;
  const isOpen = Boolean(request);

  const requiresComment = Boolean(meta?.requiresComment);
  const commentError = requiresComment && !comment.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setComment('');
        setEvidenceUrl('');
        onClose();
      }}
      title={meta?.title ?? 'Accion'}
      description={meta?.description}
      size="md"
    >
      {request ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200/70">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900">{actionLabelV2(request.action)}</p>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600">
                  Esta acción opera solo en estado demo/local. No ejecuta endpoints reales.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Comentario {requiresComment ? '(obligatorio)' : '(opcional)'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className={cn(
                'w-full resize-none rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors',
                commentError ? 'border-rose-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100',
              )}
              placeholder={requiresComment ? 'Describe el motivo y el ajuste esperado...' : 'Agrega contexto si aplica...'}
            />
            {commentError ? (
              <p className="text-xs font-bold text-rose-600">Debes registrar un comentario para devolver una etapa.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evidencia / link (opcional)</label>
            <input
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              placeholder="https://drive.google.com/... o enlace LMS"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setComment('');
                setEvidenceUrl('');
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (requiresComment && !comment.trim()) return;
                onConfirm({
                  subjectId: request.subjectId,
                  action: request.action,
                  comment: comment.trim(),
                  evidenceUrl: evidenceUrl.trim(),
                });
                setComment('');
                setEvidenceUrl('');
                onClose();
              }}
              disabled={Boolean(requiresComment && !comment.trim())}
            >
              Confirmar
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
