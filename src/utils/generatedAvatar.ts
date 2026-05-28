/** Estilos DiceBear neutros (ilustración profesional, sin fotos reales). */
export type GeneratedAvatarStyle = 'notionists-neutral' | 'initials';

const DEFAULT_STYLE: GeneratedAvatarStyle = 'notionists-neutral';

export function getGeneratedAvatarUrl(
  seed: string,
  options?: { size?: number; style?: GeneratedAvatarStyle },
): string {
  const style = options?.style ?? DEFAULT_STYLE;
  const size = options?.size ?? 64;
  const safeSeed = encodeURIComponent(seed.trim() || 'usuario');
  return `https://api.dicebear.com/9.x/${style}/png?seed=${safeSeed}&size=${size}`;
}
