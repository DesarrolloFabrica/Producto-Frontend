import { useCallback } from 'react';
import { useLocation, useNavigate, type NavigateOptions } from 'react-router-dom';
import {
  appendReturnTo,
  buildFromLocation,
  saveScrollPosition,
  type NavigationState,
} from './contextNavigation';

/**
 * Navegación hacia adelante preservando origen (state.from + returnTo en URL para F5).
 */
export function useContextNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  const contextNavigate = useCallback(
    (to: string, options?: NavigateOptions) => {
      const from = buildFromLocation(location);
      saveScrollPosition(from);
      const destination = appendReturnTo(to, from);
      const state: NavigationState = {
        ...(typeof options?.state === 'object' && options.state !== null
          ? (options.state as NavigationState)
          : {}),
        from,
      };
      navigate(destination, { ...options, state });
    },
    [navigate, location],
  );

  return contextNavigate;
}
