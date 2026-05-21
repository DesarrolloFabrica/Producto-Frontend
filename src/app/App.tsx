import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { OperationsProvider } from '../features/operations/OperationsContext';
import { ContextPanelProvider } from '../features/context-panel/ContextPanelProvider';
import { ToastProvider } from '../components/ui/ToastProvider';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <OperationsProvider>
        <ContextPanelProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ContextPanelProvider>
      </OperationsProvider>
    </AuthProvider>
  );
}
