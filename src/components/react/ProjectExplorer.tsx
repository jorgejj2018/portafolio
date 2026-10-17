import { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import type { Proyecto } from '../../types';
import { motivoPrivado, pedirAcceso } from '../../data/perfil';

const TODOS = 'All';

export default function ProjectExplorer({ proyectos }: { proyectos: Proyecto[] }) {
  const [filtro, setFiltro] = useState(TODOS);
  const reduce = useReducedMotion();

  const tags = useMemo(() => {
    const conteo = new Map<string, number>();
    proyectos.forEach((p) => p.tags.forEach((t) => conteo.set(t, (conteo.get(t) ?? 0) + 1)));
    const frecuentes = [...conteo.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
    return [TODOS, ...frecuentes.map(([t]) => t)];
  }, [proyectos]);

  const visibles = filtro === TODOS ? proyectos : proyectos.filter((p) => p.tags.includes(filtro));

  return (
    <LayoutGroup>
      {/* Filtros: en móvil se desplazan en horizontal en vez de apilarse */}
      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        role="group"
        aria-label="Filter projects by technology"
      >
        {tags.map((t) => {
          const activo = filtro === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setFiltro(t)}
              aria-pressed={activo}
              className={`relative min-h-11 shrink-0 rounded-full border px-4 font-mono text-xs transition-colors ${
                activo ? 'border-transparent text-white' : 'border-cream/15 text-cream-dim hover:border-cream/40 hover:text-cream'
              }`}
            >
              {activo && (
                <motion.span
                  layoutId="filtro-activo"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{t}</span>
            </button>
          );
        })}
      </div>

      <motion.ul layout className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibles.map((p, i) => (
            <motion.li
              layout
              key={p.nombre}
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduce ? undefined : { y: -4 }}
              className={`panel group flex flex-col rounded-2xl p-6 transition-colors hover:border-accent/60 ${
                p.destacado && filtro === TODOS && i === 0 ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-xl font-bold text-cream">{p.nombre}</h3>
                <span className="shrink-0 font-mono text-xs text-ice">{p.anio}</span>
              </div>
              <p className="mt-3 max-w-prose flex-1 text-[0.95rem] leading-relaxed text-cream-dim">{p.descripcion}</p>
              <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-cream/60">
                {p.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="mt-5 flex gap-2 border-t border-cream/10 pt-3 text-sm font-semibold">
                {p.privado ? (
                  <a className="inline-flex min-h-11 items-center gap-2 pr-3 text-cream hover:text-ice" href={pedirAcceso(p.nombre)} title={motivoPrivado}>
                    <LockIcon /> Request code access
                  </a>
                ) : (
                  <a className="inline-flex min-h-11 items-center pr-3 text-cream hover:text-ice" href={p.repo} target="_blank" rel="noopener">
                    Code ↗
                  </a>
                )}
                {p.demo && (
                  <a className="inline-flex min-h-11 items-center px-3 text-ice hover:text-cream" href={p.demo} target="_blank" rel="noopener">
                    Live demo ↗
                  </a>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </LayoutGroup>
  );
}

/** Candado para los repos privados. */
function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
