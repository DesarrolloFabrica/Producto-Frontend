/** Extrae la URL de foto de perfil del ID token de Google (JWT). */
export function extractGoogleAvatarUrl(credential: string): string | null {
  try {
    const [, payloadSegment] = credential.split('.');
    if (!payloadSegment) return null;

    const payload = JSON.parse(atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/'))) as {
      picture?: unknown;
    };

    return typeof payload.picture === 'string' && payload.picture.length > 0
      ? payload.picture
      : null;
  } catch {
    return null;
  }
}
