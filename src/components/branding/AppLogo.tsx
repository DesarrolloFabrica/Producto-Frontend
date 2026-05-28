import type { HTMLAttributes, ReactNode } from 'react';
import { BRAND_ALT, brandAssets } from '../../assets/brand';
import { cn } from '../ui/tokens';

export type AppLogoVariant = 'primary' | 'mark' | 'compact';
export type AppLogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'login';

interface AppLogoProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AppLogoVariant;
  size?: AppLogoSize;
  children?: ReactNode;
}

const imageSizeClasses: Record<AppLogoSize, { primary: string; mark: string }> = {
  sm: { primary: 'h-9 w-auto max-w-[120px]', mark: 'h-8 w-8' },
  md: { primary: 'h-14 w-auto max-w-[180px]', mark: 'h-11 w-11' },
  lg: { primary: 'h-24 w-auto max-w-[300px] sm:h-28 sm:max-w-[340px]', mark: 'h-16 w-16' },
  xl: { primary: 'h-32 w-auto max-w-[380px] sm:h-40 sm:max-w-[440px]', mark: 'h-20 w-20' },
  hero: {
    primary:
      'h-36 w-auto max-w-[min(100%,20rem)] sm:h-44 sm:max-w-[26rem] lg:h-52 lg:max-w-[30rem]',
    mark: 'h-24 w-24',
  },
  login: {
    primary: 'h-[5.75rem] w-auto max-w-[13.5rem] sm:h-[6.5rem] sm:max-w-[15.5rem]',
    mark: 'h-16 w-16',
  },
};

export function AppLogo({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: AppLogoProps) {
  const sizes = imageSizeClasses[size];

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2.5', className)} {...props}>
        <img
          src={brandAssets.logoFocaMark}
          alt=""
          aria-hidden
          className={cn('shrink-0 object-contain', sizes.mark)}
        />
        {children ?? (
          <div className="hidden leading-none sm:block">
            <p className="text-sm font-black tracking-tight text-slate-950">Operación Académica</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.28em] text-slate-400">CUN</p>
          </div>
        )}
      </div>
    );
  }

  const src = variant === 'mark' ? brandAssets.logoFocaMark : brandAssets.logoFocaCun;
  const imgClass = variant === 'mark' ? sizes.mark : sizes.primary;

  return (
    <div className={cn('inline-flex', className)} {...props}>
      <img
        src={src}
        alt={BRAND_ALT}
        className={cn('object-contain', imgClass)}
      />
    </div>
  );
}
