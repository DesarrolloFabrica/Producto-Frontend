import { env } from '../config/env';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

function toUrl(path: string) {
  const base = env.apiUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function readToken(): string | null {
  try {
    return localStorage.getItem('producto_access_token');
  } catch {
    return null;
  }
}

function emitUnauthorized() {
  // Consumer (AuthContext) can listen to this to force logout.
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = readToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(toUrl(path), {
    method,
    headers,
    cache: 'no-store',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 304) {
    const err: ApiError = {
      status: 304,
      message: 'La respuesta en caché no incluye datos. Recarga la página.',
    };
    throw err;
  }

  if (res.status === 401) {
    emitUnauthorized();
  }

  if (!res.ok) {
    const payload = await parseJsonSafe(res);
    const rawMessage =
      typeof payload === 'object' && payload && 'message' in payload
        ? (payload as { message: unknown }).message
        : undefined;
    const message = Array.isArray(rawMessage)
      ? rawMessage.map(String).join('. ')
      : rawMessage !== undefined
        ? String(rawMessage)
        : `Request failed (${res.status})`;
    const err: ApiError = { status: res.status, message, details: payload };
    throw err;
  }

  // Some endpoints may return empty body.
  const data = await parseJsonSafe(res);
  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
