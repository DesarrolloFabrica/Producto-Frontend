import type { Location } from 'react-router-dom';
import type { Role } from '../types/domain';
import { homePathForRole, isPathAllowedForRole } from './roleNavigation';

export type NavigationState = {
  from?: string;
  fromSemesterOperations?: boolean;
  semesterId?: string;
};

/** Quita returnTo de una ruta para evitar cadenas de retorno que bloquean la navegación. */
export function stripReturnToQuery(path: string): string {
  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = withoutHash.indexOf('?');
  if (queryIndex < 0) return `${withoutHash}${hash}`;
  const pathname = withoutHash.slice(0, queryIndex);
  const params = new URLSearchParams(withoutHash.slice(queryIndex + 1));
  params.delete('returnTo');
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ''}${hash}`;
}

export function pathsMatchForBack(a: string, b: string): boolean {
  return stripReturnToQuery(a) === stripReturnToQuery(b);
}

/** Separa pathname y search para navigate() sin arrastrar ?returnTo=. */
export function parseAppPath(path: string): { pathname: string; search: string } {
  const stripped = stripReturnToQuery(path);
  const hashIndex = stripped.indexOf('#');
  const withoutHash = hashIndex >= 0 ? stripped.slice(0, hashIndex) : stripped;
  const queryIndex = withoutHash.indexOf('?');
  if (queryIndex < 0) {
    return { pathname: withoutHash || '/', search: '' };
  }
  return {
    pathname: withoutHash.slice(0, queryIndex) || '/',
    search: withoutHash.slice(queryIndex),
  };
}

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
  params.set('returnTo', stripReturnToQuery(returnTo));
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ''}${hash}`;
}

export function resolveBackTarget(
  location: Location,
  fallback: string,
  role: Role | null = null,
): string {
  const safeFallback = isPathAllowedForRole(fallback, role) ? fallback : homePathForRole(role);

  const state = location.state as NavigationState | null;
  if (state?.from && state.from.startsWith('/') && isPathAllowedForRole(state.from, role)) {
    return stripReturnToQuery(state.from);
  }

  const returnTo = new URLSearchParams(location.search).get('returnTo');
  if (returnTo) {
    try {
      const decoded = decodeURIComponent(returnTo);
      if (decoded.startsWith('/') && isPathAllowedForRole(decoded, role)) {
        return stripReturnToQuery(decoded);
      }
    } catch {
      if (returnTo.startsWith('/') && isPathAllowedForRole(returnTo, role)) {
        return stripReturnToQuery(returnTo);
      }
    }
  }

  return stripReturnToQuery(safeFallback);
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
