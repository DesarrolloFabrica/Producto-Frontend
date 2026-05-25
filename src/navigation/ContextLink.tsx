import { Link, useLocation, type LinkProps } from 'react-router-dom';
import { appendReturnTo, buildFromLocation, saveScrollPosition } from './contextNavigation';

type ContextLinkProps = Omit<LinkProps, 'to'> & {
  to: string;
};

/**
 * Enlace interno que registra la ruta actual como origen de retorno.
 */
export function ContextLink({ to, state, onClick, ...props }: ContextLinkProps) {
  const location = useLocation();
  const from = buildFromLocation(location);
  const destination = appendReturnTo(to, from);

  return (
    <Link
      to={destination}
      state={{ ...(typeof state === 'object' && state !== null ? state : {}), from }}
      onClick={(event) => {
        saveScrollPosition(from);
        onClick?.(event);
      }}
      {...props}
    />
  );
}
