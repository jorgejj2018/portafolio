import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

type Props = { valor: number; sufijo?: string; desde?: number };

/** Número que cuenta hasta su valor la primera vez que entra en pantalla. */
export default function Counter({ valor, sufijo = '', desde }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const visto = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !visto || reduce) return;
    const inicio = desde ?? (valor > 1000 ? valor - 40 : 0);
    const controles = animate(inicio, valor, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = `${Math.round(v)}${sufijo}`),
    });
    return () => controles.stop();
  }, [visto, reduce, valor, sufijo, desde]);

  // El valor final se renderiza en el HTML para que se lea aunque no corra JavaScript
  return (
    <span ref={ref} className="tabular-nums">
      {valor}
      {sufijo}
    </span>
  );
}
