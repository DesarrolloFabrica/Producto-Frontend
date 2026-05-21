import { useState } from 'react';
import { motion } from 'motion/react';
import { Link as LinkIcon, Loader2 } from 'lucide-react';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { LinkResourceType } from '../../types/domain';
import { cn } from '../ui/tokens';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function AddLinkModal({ isOpen, onClose, projectId }: AddLinkModalProps) {
  const { addProjectLink } = useOperations();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', type: 'SYLLABUS' as LinkResourceType });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    addProjectLink(projectId, {
      id: `lnk-${Date.now()}`,
      title: form.title,
      url: form.url,
      type: form.type,
      uploadedBy: 'PRODUCT',
      createdAt: new Date().toISOString(),
    });

    showToast('Link agregado correctamente');
    setSaving(false);
    onClose();
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all';
  const labelClass = 'block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Link" description="Comparte documentos fuente con el equipo de Fabrica." size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Titulo del Link</label>
          <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Syllabus Semestre 1" />
        </div>
        <div>
          <label className={labelClass}>URL</label>
          <input required type="url" className={inputClass} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <label className={labelClass}>Tipo</label>
          <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LinkResourceType })}>
            <option value="SYLLABUS">Syllabus</option>
            <option value="CURRICULUM">Curriculo</option>
            <option value="DRIVE_FOLDER">Carpeta Drive</option>
            <option value="BRIEF">Brief</option>
            <option value="REFERENCE">Referencia</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <motion.button type="submit" disabled={saving} whileHover={!saving ? { scale: 1.02 } : {}} whileTap={!saving ? { scale: 0.98 } : {}} className={cn('flex items-center gap-2 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all', saving ? 'bg-slate-300 cursor-not-allowed' : 'liquid-button')}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
            {saving ? 'Agregando...' : 'Agregar Link'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}
