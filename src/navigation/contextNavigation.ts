import type { Location } from 'react-router-dom';

export type NavigationState = {
  from?: string;
};

const scrollPositions = new Map<string, number>();

export function getLocationKey(pathname: string, search = ''): string {
  return pathname + search;
}

export function buildFromLocation(location: Pick<Location, 'pathname' | 'search'>): string {
  return getLocationKey(location.pathname, location.search);
}

export function appendReturnTo(destination: string, returnTo: string): string {
  const hashIndex = destination.indexOf('#');
  const hash = hashIndex >= 0 ? destination.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? destination.slice(0, hashIndex) : destination;
  const queryIndex = withoutHash.indexOf('?');
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const params = new URLSearchParams(queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '');
  params.set('returnTo', returnTo);
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ''}${hash}`;
}

export function resolveBackTarget(location: Location, fallback: string): string {
  const state = location.state as NavigationState | null;
  if (state?.from && state.from.startsWith('/')) {
    return state.from;
  }

  const returnTo = new URLSearchParams(location.search).get('returnTo');
  if (returnTo) {
    try {
      const decoded = decodeURIComponent(returnTo);
      if (decoded.startsWith('/')) return decoded;
    } catch {
      if (returnTo.startsWith('/')) return returnTo;
    }
  }

  return fallback;
}

export function saveScrollPosition(key: string, scrollY = window.scrollY): void {
  scrollPositions.set(key, scrollY);
}

export function peekScrollPosition(key: string): number | undefined {
  const value = scrollPositions.get(key);
  return value === undefined ? undefined : value;
}

export function consumeScrollPosition(key: string): number | undefined {
  const value = scrollPositions.get(key);
  if (value === undefined) return undefined;
  scrollPositions.delete(key);
  return value;
}

export function restoreScrollForKey(key: string): void {
  const y = consumeScrollPosition(key);
  if (y === undefined) return;
  requestAnimationFrame(() => {
    window.scrollTo({ top: y, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  });
}
