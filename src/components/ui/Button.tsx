import type { HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, motion as motionTokens } from './tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-br from-[#FF6B00] to-[#FF852D] text-white shadow-[0_4px_14px_0_rgba(255,107,0,0.32)] hover:from-[#E66000] hover:to-[#FF6B00] hover:shadow-[0_6px_18px_0_rgba(255,107,0,0.36)]',
  secondary:
    'border border-slate-200/80 bg-white/90 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
  ghost: 'text-slate-500 hover:bg-orange-50/70 hover:text-orange-600',
  subtle: 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
  danger: 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100',
};

const sizes: Record<string, string> = {
  sm: 'rounded-xl px-4 py-2 text-xs font-semibold',
  md: 'rounded-xl px-5 py-2.5 text-xs font-semibold',
  lg: 'rounded-xl px-7 py-3.5 text-sm font-bold',
};

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled,
  ...motionProps
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { scale: 1.01 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5',
        motionTokens.default,
        variants[variant],
        sizes[size],
        isDisabled && 'cursor-not-allowed opacity-60',
        className,
      )}
      {...motionProps}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {children as React.ReactNode}
    </motion.button>
  );
}
