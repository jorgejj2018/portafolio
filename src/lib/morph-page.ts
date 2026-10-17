import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { EscenaMorph, type Objetivo } from './morph';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

type Imagenes = Record<'foto' | 'tresCuartos' | 'lado' | 'mercatto' | 'arriba' | 'hero', string>;

/** Figura de cada capítulo, en el mismo orden que las secciones de la página. */
const objetivos = (img: Imagenes): Objetivo[] => [
  { tipo: 'imagen', src: img.foto, escritorio: { alto: 0.58 }, movil: { alto: 0.34, y: 0.24 } },
  { tipo: 'imagen', src: img.tresCuartos },
  { tipo: 'texto', lineas: ['</>'], escritorio: { alto: 0.34 }, movil: { alto: 0.18, y: 0.26 } },
  { tipo: 'imagen', src: img.lado },
  { tipo: 'imagen', src: img.mercatto, ignorarClaros: true, escritorio: { alto: 0.5, anchoMax: 0.46 }, movil: { alto: 0.26, y: 0.25 } },
  { tipo: 'imagen', src: img.arriba },
  { tipo: 'imagen', src: img.hero, escritorio: { alto: 0.8 }, movil: { alto: 0.42, y: 0.22 } },
  { tipo: 'texto', lineas: ['JORGE', 'QUINTERO.'], escritorio: { x: 0, y: 0.17, alto: 0.44, anchoMax: 0.7 }, movil: { x: 0, y: 0.24, alto: 0.3, anchoMax: 0.88 } },
];

/** Si el equipo no tiene WebGL, cada capítulo muestra su imagen normal. */
function respaldo(img: Imagenes) {
  const lista = [img.foto, img.tresCuartos, null, img.lado, img.mercatto, img.arriba, img.hero, null];
  $$('[data-escena]').forEach((sec, i) => {
    const src = lista[i];
    const panel = $('[data-panel]', sec);
    if (!src || !panel) return;
    const el = document.createElement('img');
    el.src = src;
    el.alt = '';
    el.className = 'mb-6 max-h-64 w-auto rounded-2xl';
    panel.prepend(el);
  });
}

/** La nube cambia de figura mientras cada capítulo entra en pantalla. */
function conectarScroll(escena: EscenaMorph) {
  const secciones = $$('[data-escena]');
  const avance = new Array(secciones.length).fill(0);
  const actualizar = () => escena.setProgreso(avance.reduce((a, b) => a + b, 0));
  // En celular la figura vive arriba: se arma mientras el capítulo nuevo sube hasta ella.
  // En escritorio la ventana es más corta para que cada figura se quede formada más tiempo.
  const movil = innerWidth < 1024;
  secciones.forEach((sec, k) => {
    if (k === 0) return;
    ScrollTrigger.create({
      trigger: sec,
      start: movil ? 'top bottom' : 'top 68%',
      end: movil ? 'top 45%' : 'top 36%',
      onUpdate: (self) => {
        avance[k] = self.progress;
        actualizar();
      },
    });
  });
}

/** Capítulo actual: índice lateral, etiqueta del encabezado y barra de avance. */
function capitulos() {
  const secciones = $$('[data-escena]');
  const num = $('[data-cap-num]');
  const nombre = $('[data-cap-nombre]');
  const barra = $('[data-barra]');
  secciones.forEach((sec, i) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top center',
      end: 'bottom center',
      onToggle: ({ isActive }) => {
        if (!isActive) return;
        $$('[data-cap]').forEach((a) => a.setAttribute('aria-current', String(a.dataset.cap === sec.id)));
        if (num) num.textContent = String(i + 1).padStart(2, '0');
        if (nombre) nombre.textContent = $(`[data-cap="${sec.id}"]`)?.dataset.nombre ?? sec.id;
      },
    });
  });
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => barra && (barra.style.transform = `scaleX(${self.progress})`),
  });
}

/** El texto de cada capítulo entra cuando llega su figura. */
function textos() {
  $$('[data-titulo]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.1,
          stagger: 0.08,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        }),
    });
  });
  $$('[data-panel]').forEach((panel) => {
    const hijos = Array.from(panel.children).filter((c) => !c.hasAttribute('data-titulo'));
    gsap.from(hijos, {
      y: 26,
      opacity: 0,
      duration: 0.9,
      stagger: 0.07,
      ease: 'expo.out',
      scrollTrigger: { trigger: panel, start: 'top 85%', once: true },
    });
  });
}

/**
 * Cada pregunta se escribe sola cuando entra en pantalla, como si alguien la tecleara.
 * El texto completo ya está en el HTML para lectores de pantalla y buscadores.
 */
function preguntas() {
  $$('[data-prompt]').forEach((el) => {
    const texto = el.textContent?.trim() ?? '';
    el.setAttribute('aria-label', texto);
    el.innerHTML = '';
    const span = document.createElement('span');
    span.dataset.promptTexto = '';
    span.setAttribute('aria-hidden', 'true');
    // Reserva el ancho final para que la barra no cambie de tamaño mientras se escribe
    const fantasma = document.createElement('span');
    fantasma.textContent = texto;
    fantasma.style.cssText = 'visibility:hidden;grid-area:1/1';
    span.style.gridArea = '1/1';
    const caja = document.createElement('span');
    caja.style.cssText = 'display:inline-grid;min-width:0';
    caja.setAttribute('aria-hidden', 'true');
    caja.append(span, fantasma);
    el.append(caja);
    const estado = { n: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        el.classList.add('escribiendo');
        gsap.to(estado, {
          n: texto.length,
          duration: Math.min(1.4, 0.035 * texto.length),
          ease: 'none',
          onUpdate: () => (span.textContent = texto.slice(0, Math.round(estado.n))),
          onComplete: () => gsap.delayedCall(0.8, () => el.classList.remove('escribiendo')),
        });
      },
    });
  });
}

/**
 * En celular y tablet la figura está arriba y las respuestas suben por encima de ella:
 * la nube se atenúa mientras una respuesta la tapa y vuelve a brillar entre capítulos.
 */
function atenuarNube(canvas: HTMLCanvasElement) {
  const paneles = $$('[data-panel]');
  let pendiente = false;
  const medir = () => {
    pendiente = false;
    if (innerWidth >= 1024) {
      canvas.style.opacity = '1';
      return;
    }
    const zona = innerHeight * 0.48;
    let tapado = 0;
    for (const p of paneles) {
      const r = p.getBoundingClientRect();
      const arriba = Math.max(r.top, 0);
      const abajo = Math.min(r.bottom, zona);
      if (abajo > arriba) tapado = Math.max(tapado, (abajo - arriba) / zona);
    }
    canvas.style.opacity = String(1 - Math.min(1, tapado * 1.6) * 0.8);
  };
  const pedir = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(medir);
  };
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  medir();
}

/** Botón para copiar el correo, con confirmación en el mismo botón. */
function copiarCorreo() {
  $$('[data-copiar]').forEach((btn) => {
    const etiqueta = $('[data-copiar-texto]', btn);
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copiar ?? '');
        if (etiqueta) etiqueta.textContent = 'Copied ✓';
      } catch {
        location.href = `mailto:${btn.dataset.copiar}`;
        return;
      }
      setTimeout(() => etiqueta && (etiqueta.textContent = 'Copy email'), 2000);
    });
  });
}

export function iniciarPortafolio() {
  const canvas = $<HTMLCanvasElement>('[data-morph]');
  const img = JSON.parse(canvas?.dataset.imagenes ?? '{}') as Imagenes;
  capitulos();
  copiarCorreo();
  if (canvas) atenuarNube(canvas);
  try {
    if (!canvas) throw new Error('sin canvas');
    const escena = new EscenaMorph(canvas, objetivos(img));
    escena.listo.then(() => {
      conectarScroll(escena);
      ScrollTrigger.refresh();
    });
  } catch {
    canvas?.remove();
    respaldo(img);
  }
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    textos();
    preguntas();
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
