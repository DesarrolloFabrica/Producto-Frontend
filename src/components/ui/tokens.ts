export const surface = {
  card: 'bg-white/80 backdrop-blur-[10px] border border-white/50 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]',
  glassSubtle:
    'bg-white/75 backdrop-blur-[10px] border border-white/40 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06),0_8px_24px_-8px_rgba(15,23,42,0.04)]',
  elevated:
    'bg-white/95 backdrop-blur-[12px] border border-white/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.03)]',
  panel:
    'bg-white/92 backdrop-blur-md border border-slate-200/50 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12),0_2px_8px_-2px_rgba(15,23,42,0.06)]',
  glass: 'glass-surface',
  roleGlass: 'role-glass-panel',
  roleGlassInset: 'role-glass-inset',
  roleGlassTab: 'role-glass-tab-track',
  roleGlassTableHead: 'bg-white/35 backdrop-blur-[8px] border-b border-white/45',
  solid: 'bg-white border border-slate-200/60 shadow-sm',
  table: 'bg-white/30 backdrop-blur-[8px] border-b border-white/45',
  muted: 'bg-slate-50 border border-slate-100',
  subjectPanel:
    'border border-orange-100/90 bg-white/90 backdrop-blur-[8px] shadow-[0_4px_24px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(249,115,22,0.08)]',
  nested:
    'border border-orange-100/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-orange-50/60',
  projectRow:
    'bg-white border border-[rgba(0,0,0,0.02)] shadow-[0_1px_3px_0_rgba(0,0,0,0.01),0_1px_2px_0_rgba(0,0,0,0.006)]',
};

export const shadow = {
  card: 'shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]',
  elevated: 'shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12),0_2px_8px_-2px_rgba(15,23,42,0.06)]',
  hover: 'shadow-[0_12px_40px_-12px_rgba(15,23,42,0.14)]',
};

export const motion = {
  default: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
  hoverLift: 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)]',
};

export const radius = {
  control: 'rounded-xl',
  inner: 'rounded-2xl',
  card: 'rounded-[20px]',
  elevated: 'rounded-3xl',
  subjectPanel: 'rounded-[28px]',
  nested: 'rounded-[22px]',
  panel: 'rounded-[32px]',
  shell: 'rounded-2xl',
};

export const text = {
  eyebrow: 'text-[11px] uppercase tracking-widest font-bold text-orange-500',
  label: 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400',
  caption: 'text-[11px] font-semibold uppercase tracking-wide',
  title: 'text-slate-950 font-black tracking-tight',
  muted: 'text-slate-400',
  body: 'text-sm font-medium text-slate-600 leading-relaxed',
};

export const control = {
  filterInput:
    'h-8 w-full rounded-lg border-0 bg-white/55 px-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 shadow-none ring-1 ring-slate-200/50 backdrop-blur-sm transition-[box-shadow,background-color,ring-color] focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-orange-400/25',
  filterSelect:
    'h-8 w-full cursor-pointer appearance-none rounded-lg border-0 bg-white/55 px-2.5 text-[13px] font-medium text-slate-700 shadow-none ring-1 ring-slate-200/50 backdrop-blur-sm transition-[box-shadow,background-color,ring-color] focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-orange-400/25',
  filterLabel: 'block text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400/90',
};

export type RoleAccent = 'product' | 'factory' | 'planning' | 'lms';

export const roleAccent = {
  product: {
    dot: 'bg-orange-500',
    eyebrow: 'text-orange-500',
    ring: 'ring-orange-200/60',
    border: 'border-orange-100',
    bg: 'bg-orange-50',
  },
  factory: {
    dot: 'bg-amber-500',
    eyebrow: 'text-amber-600',
    ring: 'ring-amber-200/60',
    border: 'border-amber-100',
    bg: 'bg-amber-50',
  },
  planning: {
    dot: 'bg-orange-500',
    eyebrow: 'text-orange-500',
    ring: 'ring-orange-200/60',
    border: 'border-orange-100',
    bg: 'bg-orange-50',
  },
  lms: {
    dot: 'bg-orange-500',
    eyebrow: 'text-orange-500',
    ring: 'ring-orange-200/60',
    border: 'border-orange-100',
    bg: 'bg-orange-50',
  },
} as const;

export const tableRow = 'transition-colors duration-150 hover:bg-white/45';

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
