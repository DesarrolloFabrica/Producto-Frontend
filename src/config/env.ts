const DEFAULT_API_URL = 'http://localhost:3000';

function readUseMocks(): boolean {
  const raw = import.meta.env.VITE_USE_MOCKS;
  if (raw === undefined || raw === '') return false;
  return raw === 'true' || raw === '1';
}

function readFlag(name: string): boolean {
  const raw = import.meta.env[name];
  return raw === 'true' || raw === '1';
}

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_API_URL,
  useMocks: readUseMocks(),
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '',
  googleAuthEnabled: readFlag('VITE_GOOGLE_AUTH_ENABLED'),
  devEmailLoginEnabled: readFlag('VITE_DEV_EMAIL_LOGIN_ENABLED'),
  institutionalFlowMode:
    (import.meta.env.VITE_INSTITUTIONAL_FLOW_MODE as 'full' | 'reduced' | undefined) === 'reduced'
      ? 'reduced'
      : 'full',
  /** @deprecated UI no longer uses email/password; kept for internal compatibility */
  emailPasswordLoginEnabled: readFlag('VITE_EMAIL_PASSWORD_LOGIN_ENABLED'),
};

export function isReducedInstitutionalFlow(): boolean {
  return env.institutionalFlowMode === 'reduced';
}
