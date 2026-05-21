import { useState } from 'react';
import { motion } from 'motion/react';
import { Save, Loader2 } from 'lucide-react';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../ui/ToastProvider';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import type { Priority, VirtualizationProject } from '../../types/domain';
import { cn } from '../ui/tokens';

interface EditProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: VirtualizationProject;
}

export function EditProjectDrawer({ isOpen, onClose, project }: EditProjectDrawerProps) {
  const { updateProject } = useOperations();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    school: project.school,
    program: project.program,
    modality: project.modality,
    priority: project.priority,
    expectedDeliveryDate: project.expectedDeliveryDate,
    productOwner: project.productOwner,
    factoryOwner: project.factoryOwner,
    observations: project.observations,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const updates: Partial<VirtualizationProject> = { ...form };
    updateProject(project.id, updates);
    showToast('Proyecto actualizado correctamente');
    setSaving(false);
    onClose();
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all';
  const labelClass = 'block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400';

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Editar Proyecto" description="Modifica informacion general del proyecto.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Escuela</label>
          <input required className={inputClass} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Programa</label>
          <input required className={inputClass} value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Modalidad</label>
            <select className={inputClass} value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}>
              <option>Virtual</option>
              <option>Distancia</option>
              <option>Presencial</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Prioridad</label>
            <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Critica</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Fecha Entrega Esperada</label>
          <input required type="date" className={inputClass} value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Product Owner</label>
            <input required className={inputClass} value={form.productOwner} onChange={(e) => setForm({ ...form, productOwner: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Factory Owner</label>
            <input required className={inputClass} value={form.factoryOwner} onChange={(e) => setForm({ ...form, factoryOwner: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Observaciones</label>
          <textarea className={cn(inputClass, 'min-h-[100px] resize-none')} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <motion.button type="submit" disabled={saving} whileHover={!saving ? { scale: 1.02 } : {}} whileTap={!saving ? { scale: 0.98 } : {}} className={cn('flex items-center gap-2 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all', saving ? 'bg-slate-300 cursor-not-allowed' : 'liquid-button')}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </motion.button>
        </div>
      </form>
    </Drawer>
  );
}
