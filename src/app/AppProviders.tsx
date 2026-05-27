import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { OperationsProvider } from '../features/operations/OperationsContext';
import { ContextPanelProvider } from '../features/context-panel/ContextPanelProvider';
import { ToastProvider } from '../components/ui/ToastProvider';

/** Providers de dominio montados dentro del árbol de React Router (layout raíz). */
export function AppProviders({ children }: { children?: ReactNode }) {
  return (
    <OperationsProvider>
      <ContextPanelProvider>
        <ToastProvider>{children ?? <Outlet />}</ToastProvider>
      </ContextPanelProvider>
    </OperationsProvider>
  );
}
