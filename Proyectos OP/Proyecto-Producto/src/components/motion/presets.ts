export const motionTimings = {
  fast: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
  base: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  slow: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
};

export const fadeUp = {
  initial: { opacity: 0, y: 10, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: motionTimings.base },
  exit: { opacity: 0, y: 6, filter: 'blur(2px)', transition: motionTimings.fast },
};

export const softScale = {
  whileHover: { y: -2, scale: 1.005, transition: motionTimings.fast },
  whileTap: { scale: 0.995, transition: motionTimings.fast },
};

export const staggerContainer = {
  initial: 'hidden',
  animate: 'show',
  variants: {
    hidden: {},
    show: { transition: { staggerChildren: 0.045 } },
  },
};

export const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 8, filter: 'blur(2px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: motionTimings.base },
  },
};

export const smoothCollapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: motionTimings.base },
  exit: { height: 0, opacity: 0, transition: motionTimings.fast },
};

export const drawerTransition = {
  initial: { opacity: 0, x: 24, filter: 'blur(3px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: motionTimings.slow },
  exit: { opacity: 0, x: 18, filter: 'blur(3px)', transition: motionTimings.fast },
};
