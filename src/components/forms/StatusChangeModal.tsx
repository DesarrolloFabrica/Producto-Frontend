import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { ProjectStatus } from '../../types/domain';
import { projectStatusLabels } from '../../utils/status';
import { cn } from '../ui/tokens';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentStatus: ProjectStatus;
}

const statusOptions: ProjectStatus[] = ['PENDING_SYLLABUS', 'READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'IN_REVIEW', 'DELIVERED_TO_LMS', 'FEEDBACK_PENDING', 'CLOSED'];

export function StatusChangeModal({ isOpen, onClose, projectId, currentStatus }: StatusChangeModalProps) {
  const { updateProjectStatus } = useOperations();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(currentStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === currentStatus) {
      onClose();
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    updateProjectStatus(projectId, selectedStatus);
    showToast(`Estado actualizado a: ${projectStatusLabels[selectedStatus]}`);
    setSaving(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Estado" description="Selecciona el nuevo estado operacional del proyecto." size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={cn(
                'flex items-center justify-between rounded-2xl border p-4 text-left transition-all',
                selectedStatus === status ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-100' : 'border-slate-100 bg-white hover:border-slate-200',
                status === currentStatus && 'opacity-50 cursor-not-allowed',
              )}
              disabled={status === currentStatus}
            >
              <span className="text-sm font-bold text-slate-900">{projectStatusLabels[status]}</span>
              {selectedStatus === status && <ArrowRight className="h-5 w-5 text-orange-500" />}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <motion.button type="submit" disabled={saving || selectedStatus === currentStatus} whileHover={!(saving || selectedStatus === currentStatus) ? { scale: 1.02 } : {}} whileTap={!(saving || selectedStatus === currentStatus) ? { scale: 0.98 } : {}} className={cn('flex items-center gap-2 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all', (saving || selectedStatus === currentStatus) ? 'bg-slate-300 cursor-not-allowed' : 'liquid-button')}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Cambio'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}
