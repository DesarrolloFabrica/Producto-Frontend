const DEFAULT_API_URL = 'http://localhost:3000';

function readUseMocks(): boolean {
  const raw = import.meta.env.VITE_USE_MOCKS;
  if (raw === undefined || raw === '') return false;
  return raw === 'true' || raw === '1';
}

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_API_URL,
  useMocks: readUseMocks(),
};
