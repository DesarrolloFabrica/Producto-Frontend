import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  consumeScrollPosition,
  getLocationKey,
  saveScrollPosition,
} from './contextNavigation';

/**
 * Guarda scroll al salir de una ruta y lo restaura al volver (misma pathname+search).
 */
export function ScrollRestoration() {
  const location = useLocation();
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const currentKey = getLocationKey(location.pathname, location.search);

    if (previousKeyRef.current) {
      saveScrollPosition(previousKeyRef.current);
    }

    const saved = consumeScrollPosition(currentKey);
    if (saved !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved, left: 0, behavior: 'auto' });
      });
    }

    previousKeyRef.current = currentKey;
  }, [location.pathname, location.search]);

  return null;
}
