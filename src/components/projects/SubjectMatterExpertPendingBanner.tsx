import { useState } from 'react';
import { UserCheck, Loader2 } from 'lucide-react';
import type { VirtualizationProject } from '../../types/domain';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { isPendingExternalSubjectMatterExpert } from '../../utils/projectSme';

interface SubjectMatterExpertPendingBannerProps {
  project: VirtualizationProject;
  onConfirm: () => Promise<void>;
}

export function SubjectMatterExpertPendingBanner({
  project,
  onConfirm,
}: SubjectMatterExpertPendingBannerProps) {
  const [confirming, setConfirming] = useState(false);

  if (!isPendingExternalSubjectMatterExpert(project)) {
    return null;
  }

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Card className="rounded-[20px] border-violet-200 bg-violet-50/80 p-5 shadow-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-violet-800">
            <UserCheck className="h-5 w-5 shrink-0" />
            <h3 className="text-sm font-black">Solicitud pendiente por experto temático externo</h3>
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed text-violet-900/80">
            Esta solicitud aún no corre plazo de entrega. Al confirmar experto, se activará y se
            calcularán 22 días hábiles.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 bg-violet-600 hover:bg-violet-700"
          disabled={confirming}
          onClick={() => void handleConfirm()}
        >
          {confirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Confirmando...
            </>
          ) : (
            'Confirmar experto temático'
          )}
        </Button>
      </div>
    </Card>
  );
}
