import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { ContextBackLink } from '../../navigation/ContextBackLink';

interface DeepLinkNotFoundProps {
  title?: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  onRetry?: () => void;
}

export function DeepLinkNotFound({
  title = 'No se pudo cargar esta vista',
  description = 'El recurso no está disponible o aún no se ha sincronizado con el servidor.',
  backTo = '/projects',
  backLabel = 'Ir a solicitudes',
  onRetry,
}: DeepLinkNotFoundProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <h2 className="mt-3 text-base font-black text-slate-950">{title}</h2>
        <p className="mt-2 text-sm font-medium text-rose-700">{description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
              Reintentar
            </Button>
          )}
          <ContextBackLink fallback={backTo} className="inline-block">
            <Button type="button" size="sm">{backLabel}</Button>
          </ContextBackLink>
        </div>
      </div>
    </div>
  );
}
