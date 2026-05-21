import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from './tokens';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50 }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-sm',
                toast.type === 'success' && 'bg-emerald-50/95 border-emerald-200 text-emerald-800',
                toast.type === 'error' && 'bg-red-50/95 border-red-200 text-red-800',
                toast.type === 'info' && 'bg-blue-50/95 border-blue-200 text-blue-800',
              )}
            >
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
              {toast.type === 'info' && <AlertCircle className="h-5 w-5 shrink-0" />}
              <p className="text-sm font-semibold flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
