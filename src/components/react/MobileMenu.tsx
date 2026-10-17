import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Nivel } from '../../types';

/** Menú a pantalla completa para teléfonos (iPhone y Android). */
export default function MobileMenu({ niveles }: { niveles: Nivel[] }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = abierto ? 'hidden' : '';
    const cerrar = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        aria-label={abierto ? 'Close menu' : 'Open menu'}
        className="relative z-[60] grid size-11 place-items-center rounded-full border border-cream/15 lg:hidden"
      >
        <span className="relative block h-3 w-5">
          <motion.span
            className="absolute inset-x-0 top-0 h-0.5 rounded bg-cream"
            animate={abierto ? { top: 5, rotate: 45 } : { top: 0, rotate: 0 }}
          />
          <motion.span
            className="absolute inset-x-0 bottom-0 h-0.5 rounded bg-cream"
            animate={abierto ? { bottom: 5, rotate: -45 } : { bottom: 0, rotate: 0 }}
          />
        </span>
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.nav
            id="menu-movil"
            aria-label="Menu"
            className="fixed inset-0 z-50 flex flex-col justify-center bg-shirt px-[max(1.5rem,env(safe-area-inset-left))] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:hidden"
            initial={{ clipPath: 'circle(0% at calc(100% - 2.6rem) 2rem)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 2.6rem) 2rem)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 2.6rem) 2rem)' }}
            transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
          >
            <ol className="space-y-1">
              {niveles.map((n, i) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
                >
                  <a
                    href={`#${n.id}`}
                    onClick={() => setAbierto(false)}
                    className="flex items-baseline gap-4 py-2 font-display text-4xl font-bold text-cream"
                  >
                    {n.nombre}
                  </a>
                </motion.li>
              ))}
            </ol>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
