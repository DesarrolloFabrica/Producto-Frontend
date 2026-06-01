import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { queryClient } from '../features/queries/queryClient';
import { env } from '../config/env';
import { router } from './routes';

function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  const googleEnabled = env.googleAuthEnabled && Boolean(env.googleClientId);

  if (googleEnabled) {
    return (
      <GoogleOAuthProvider clientId={env.googleClientId}>
        <AppProviders />
      </GoogleOAuthProvider>
    );
  }

  return <AppProviders />;
}
