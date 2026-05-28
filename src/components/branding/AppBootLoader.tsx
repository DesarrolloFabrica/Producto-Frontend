import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AppLogo } from './AppLogo';

const BOOT_MESSAGES = [
  'Preparando operación académica…',
  'Sincronizando datos institucionales…',
] as const;

interface AppBootLoaderProps {
  degraded?: boolean;
  exiting?: boolean;
}

export function AppBootLoader({ degraded = false, exiting = false }: AppBootLoaderProps) {
  const reduceMotion = useReducedMotion();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (degraded) return;
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % BOOT_MESSAGES.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [degraded]);

  const message = degraded ? 'Cargando información…' : BOOT_MESSAGES[messageIndex];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6"
      role="status"
      aria-busy={!exiting}
      aria-live="polite"
      aria-label="Cargando plataforma"
      initial={false}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.75, ease: 'easeInOut' }}
    >
      <div className="relative flex w-full max-w-lg flex-col items-center">
        <motion.div
          aria-hidden
          className="absolute -inset-24 rounded-full bg-orange-400/12 blur-3xl sm:-inset-32"
          animate={
            reduceMotion || exiting
              ? { opacity: 0.3 }
              : { opacity: [0.2, 0.5, 0.2], scale: [0.92, 1.08, 0.92] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
          }
        />
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
          animate={
            reduceMotion || exiting
              ? { opacity: exiting ? 0 : 1, scale: 1, y: 0 }
              : { opacity: 1, scale: 1, y: [0, -6, 0] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.85, ease: 'easeOut' },
                  scale: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
                  y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.85 },
                }
          }
          className="relative z-[1] w-full flex justify-center"
        >
          <AppLogo variant="primary" size="hero" className="flex w-full justify-center" />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: exiting ? 0 : 1, y: exiting ? 4 : 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative z-[1] mt-12 text-center text-base font-medium text-slate-500"
        >
          {message}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
