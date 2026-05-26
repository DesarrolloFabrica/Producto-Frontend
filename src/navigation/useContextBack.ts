import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { homePathForRole } from './roleNavigation';
import { resolveBackTarget, saveScrollPosition, buildFromLocation } from './contextNavigation';

/**
 * Navegación de retorno contextual.
 * Prioridad: location.state.from → query returnTo → fallback del rol actual.
 */
export function useContextBack(explicitFallback?: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const fallback = explicitFallback ?? homePathForRole(role);

  const backTarget = useMemo(
    () => resolveBackTarget(location, fallback, role),
    [location, fallback, role],
  );

  const goBack = useCallback(() => {
    saveScrollPosition(buildFromLocation(location));
    navigate(backTarget);
  }, [navigate, backTarget, location]);

  return { goBack, backTarget };
}
