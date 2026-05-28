import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { homePathForRole } from './roleNavigation';
import {
  resolveBackTarget,
  saveScrollPosition,
  buildFromLocation,
  stripReturnToQuery,
  pathsMatchForBack,
  parseAppPath,
} from './contextNavigation';

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
    const current = buildFromLocation(location);
    const cleanFallback = stripReturnToQuery(fallback);
    let target = backTarget;

    if (pathsMatchForBack(target, current)) {
      target = cleanFallback;
    }

    saveScrollPosition(current);
    const { pathname, search } = parseAppPath(target);
    navigate({ pathname, search: search || undefined }, { replace: true, state: null });
  }, [navigate, backTarget, location, fallback]);

  return { goBack, backTarget };
}
