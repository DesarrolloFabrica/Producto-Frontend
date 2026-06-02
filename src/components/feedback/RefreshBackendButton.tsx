import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../ui/tokens';
import { useRefreshProjectBackend } from '../../features/queries/useRefreshProjectBackend';
import { useToast } from '../ui/ToastProvider';

type RefreshBackendButtonProps = {
  projectId: string | undefined;
  semesterIds?: string[];
  subjectIds?: string[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'secondary' | 'ghost';
  className?: string;
  label?: string;
  successMessage?: string;
};

export function RefreshBackendButton({
  projectId,
  semesterIds,
  subjectIds,
  size = 'sm',
  variant = 'secondary',
  className,
  label = 'Actualizar datos',
  successMessage = 'Datos actualizados desde el servidor.',
}: RefreshBackendButtonProps) {
  const { showToast } = useToast();
  const { refresh, isRefreshing, canRefresh } = useRefreshProjectBackend(projectId);

  if (!canRefresh) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('gap-2', className)}
      disabled={isRefreshing}
      onClick={() => {
        void refresh({
          semesterIds,
          subjectIds,
          onSuccess: () => showToast(successMessage),
          onError: (message) => showToast(message, 'error'),
        });
      }}
    >
      <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
      {isRefreshing ? 'Actualizando…' : label}
    </Button>
  );
}
