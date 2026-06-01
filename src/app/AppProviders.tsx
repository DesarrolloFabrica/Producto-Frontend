import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastProvider } from '../components/ui/ToastProvider';

/** Providers de dominio montados dentro del árbol de React Router (layout raíz). */
export function AppProviders({ children }: { children?: ReactNode }) {
  return <ToastProvider>{children ?? <Outlet />}</ToastProvider>;
}
