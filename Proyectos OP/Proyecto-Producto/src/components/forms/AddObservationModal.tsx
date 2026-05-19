import { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Role } from '../../types/domain';
import { useAuth } from '../../features/auth/AuthContext';
import { cn } from '../ui/tokens';

interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  subjectId?: string;
  relatedEntity?: string;
}

export function AddObservationModal({ isOpen, onClose, projectId, subjectId, relatedEntity }: AddObservationModalProps) {
  const { addObservation } = useOperations();
  const { showToast } = useToast();
  const { role } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ text: '', entity: relatedEntity || '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    addObservation(projectId, {
      id: `obs-${Date.now()}`,
      projectId,
      subjectId,
      author: role === 'PRODUCT' ? 'Product Owner' : 'Factory Owner',
      role: role as Role,
      text: form.text,
      status: 'ABIERTA',
      relatedEntity: form.entity || 'General',
      createdAt: new Date().toISOString(),
    });

    showToast('Observacion registrada correctamente');
    setSaving(false);
    onClose();
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all';
  const labelClass = 'block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Observacion" description="Registra una novedad o requerimiento sobre el proyecto." size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Entidad Relacionada</label>
          <input className={inputClass} value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} placeholder="Ej: Materia, Syllabus, Semestre..." />
        </div>
        <div>
          <label className={labelClass}>Texto de la Observacion</label>
          <textarea required className={cn(inputClass, 'min-h-[120px] resize-none')} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Describe la observacion en detalle..." />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <motion.button type="submit" disabled={saving} whileHover={!saving ? { scale: 1.02 } : {}} whileTap={!saving ? { scale: 0.98 } : {}} className={cn('flex items-center gap-2 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all', saving ? 'bg-slate-300 cursor-not-allowed' : 'liquid-button')}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            {saving ? 'Registrando...' : 'Registrar Observacion'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}
