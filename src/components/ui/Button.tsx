import type { HTMLMotionProps } from 'motion/react';
import { motion } from 'motion/react';
import { cn } from './tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-br from-[#FF6B00] to-[#FF852D] text-white shadow-[0_4px_14px_0_rgba(255,107,0,0.39)] hover:from-[#E66000] hover:to-[#FF6B00]',
  secondary:
    'border border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F1F5F9]',
  ghost: 'text-slate-500 hover:bg-orange-50/70 hover:text-orange-600',
  subtle: 'text-slate-500 hover:bg-orange-50/40 hover:text-slate-800',
  danger: 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100',
};

const sizes: Record<string, string> = {
  sm: 'rounded-[12px] px-4 py-2 text-xs font-bold',
  md: 'rounded-[12px] px-5 py-2.5 text-xs font-bold',
  lg: 'rounded-[12px] px-7 py-3.5 text-sm font-black',
};

export function Button({ children, className, variant = 'primary', size = 'md', type = 'button', ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      className={cn('inline-flex items-center justify-center gap-1.5 transition-all', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
