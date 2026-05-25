import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveBackTarget, saveScrollPosition, buildFromLocation } from './contextNavigation';

/**
 * Navegación de retorno contextual.
 * Prioridad: location.state.from → query returnTo → fallback estable.
 */
export function useContextBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();

  const backTarget = useMemo(
    () => resolveBackTarget(location, fallback),
    [location, fallback],
  );

  const goBack = useCallback(() => {
    saveScrollPosition(buildFromLocation(location));
    navigate(backTarget);
  }, [navigate, backTarget, location]);

  return { goBack, backTarget };
}
