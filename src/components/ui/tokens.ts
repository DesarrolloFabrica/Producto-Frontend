export const surface = {
  card: 'bg-white/80 backdrop-blur-[10px] border border-white/50 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]',
  elevated: 'bg-white/95 backdrop-blur-[10px] border border-white/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.03)]',
  glass: 'glass-card',
  muted: 'bg-slate-50 border border-slate-100',
  subjectPanel:
    'border border-orange-100/90 bg-white/95 shadow-[0_4px_24px_rgba(15,23,42,0.04),0_18px_48px_rgba(249,115,22,0.1)]',
  nested:
    'border border-orange-100/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-orange-50/60',
  projectRow:
    'bg-white border border-[rgba(0,0,0,0.02)] shadow-[0_1px_3px_0_rgba(0,0,0,0.01),0_1px_2px_0_rgba(0,0,0,0.006)]',
};

export const radius = {
  card: 'rounded-[20px]',
  panel: 'rounded-[48px]',
  control: 'rounded-[12px]',
  subjectPanel: 'rounded-[28px]',
  nested: 'rounded-[22px]',
  elevated: 'rounded-[24px]',
  inner: 'rounded-[16px]',
};

export const text = {
  eyebrow: 'text-[10px] uppercase tracking-widest font-black text-orange-500',
  title: 'text-slate-950 font-black tracking-tight',
  muted: 'text-slate-400',
};

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
