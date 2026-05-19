import type { ProjectStatus } from '../../types/domain';
import { projectStatusLabels } from '../../utils/status';
import { Card, type CardVariant } from '../ui/Card';
import { motion } from 'motion/react';
import { fadeUp, softScale } from '../motion/presets';

const stateInfo: Record<ProjectStatus, { meaning: string; enables: string; blocks: string; next: string }> = {
  PENDING_SYLLABUS: {
    meaning: 'Product aun debe completar o validar insumos academicos.',
    enables: 'Permite preparar planeacion cuando los documentos esten completos.',
    blocks: 'Bloquea produccion completa de Fabrica.',
    next: 'Listo fabrica',
  },
  READY_FOR_PRODUCTION: {
    meaning: 'Fabrica puede iniciar produccion con los documentos disponibles.',
    enables: 'Habilita checklist, produccion y seguimiento por materia.',
    blocks: 'Nada critico si los documentos fuente son suficientes.',
    next: 'En produccion',
  },
  IN_PRODUCTION: {
    meaning: 'Fabrica esta construyendo entregables academicos.',
    enables: 'Permite mover items a entregado cuando esten listos.',
    blocks: 'Revision y LMS hasta completar entregables.',
    next: 'En revision',
  },
  IN_REVIEW: {
    meaning: 'Los entregables esperan validacion o aprobacion.',
    enables: 'Permite aprobar, devolver o preparar LMS.',
    blocks: 'Entrega LMS si aparecen observaciones abiertas.',
    next: 'Entregado LMS',
  },
  FEEDBACK_PENDING: {
    meaning: 'Hay observaciones o correcciones pendientes.',
    enables: 'Permite correccion controlada antes de continuar.',
    blocks: 'Bloquea cierre, revision final o LMS hasta resolver.',
    next: 'En revision',
  },
  DELIVERED_TO_LMS: {
    meaning: 'La entrega fue realizada al LMS.',
    enables: 'Permite validar cierre operacional.',
    blocks: 'Cambios posteriores sin trazabilidad.',
    next: 'Cerrado',
  },
  CLOSED: {
    meaning: 'El flujo esta cerrado operacionalmente.',
    enables: 'Consulta y auditoria institucional.',
    blocks: 'No se esperan acciones operativas.',
    next: 'Sin siguiente estado',
  },
};

export function WorkflowStateExplainer({ status, variant = 'subjectPanel' }: { status: ProjectStatus; variant?: CardVariant }) {
  const info = stateInfo[status];
  return (
    <motion.div {...fadeUp}>
    <Card variant={variant} className="p-4 shadow-[0_14px_40px_-34px_rgba(15,23,42,0.35)] sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Pipeline explicado</p>
      <h2 className="mt-1 text-sm font-black text-slate-950">{projectStatusLabels[status]}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Info label="Que significa" value={info.meaning} />
        <Info label="Que habilita" value={info.enables} />
        <Info label="Que bloquea" value={info.blocks} />
        <Info label="Siguiente estado" value={info.next} />
      </div>
    </Card>
    </motion.div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <motion.div {...softScale} className="rounded-2xl bg-slate-50/80 p-3 transition-all hover:bg-white hover:shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-700">{value}</p>
    </motion.div>
  );
}
