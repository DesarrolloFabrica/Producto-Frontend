import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useContextBack } from './useContextBack';

type ContextBackLinkProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  fallback: string;
  children: ReactNode;
};

export function ContextBackLink({ fallback, children, className, type = 'button', ...props }: ContextBackLinkProps) {
  const { goBack } = useContextBack(fallback);

  return (
    <button type={type} onClick={goBack} className={className} {...props}>
      {children}
    </button>
  );
}
