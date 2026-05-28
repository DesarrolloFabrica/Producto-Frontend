import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { OperationsProvider } from '../features/operations/OperationsContext';
import { ToastProvider } from '../components/ui/ToastProvider';

/** Providers de dominio montados dentro del árbol de React Router (layout raíz). */
export function AppProviders({ children }: { children?: ReactNode }) {
  return (
    <OperationsProvider>
      <ToastProvider>{children ?? <Outlet />}</ToastProvider>
    </OperationsProvider>
  );
}
