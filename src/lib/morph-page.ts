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
  { tipo: 'imagen', src: img.foto, escritorio: { alto: 0.58 }, movil: { alto: 0.3, y: 0.25, fondoMax: 0.455 } },
  { tipo: 'imagen', src: img.tresCuartos },
  { tipo: 'texto', lineas: ['</>'], escritorio: { alto: 0.34 }, movil: { alto: 0.16, y: 0.25 } },
  { tipo: 'imagen', src: img.lado },
  { tipo: 'imagen', src: img.mercatto, ignorarClaros: true, escritorio: { alto: 0.5, anchoMax: 0.42 }, movil: { alto: 0.26, y: 0.24, anchoMax: 0.9 } },
  { tipo: 'imagen', src: img.arriba },
  { tipo: 'imagen', src: img.hero, escritorio: { alto: 0.8 }, movil: { alto: 0.36, y: 0.21 } },
  { tipo: 'texto', lineas: ['JORGE', 'QUINTERO.'], escritorio: { x: 0, y: 0.17, alto: 0.4, anchoMax: 0.7, fondoMax: 0.54 }, movil: { x: 0, y: 0.25, alto: 0.24, anchoMax: 0.86 } },
];

/** Si el equipo no tiene WebGL, cada capítulo muestra su imagen normal. */
function respaldo(img: Imagenes) {
  const lista = [img.foto, img.tresCuartos, null, img.lado, img.mercatto, img.arriba, img.hero, null];
  $$('[data-escena]').forEach((sec, i) => {
    const src = lista[i];
    const panel = $('.panel-escena', sec);
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
  secciones.forEach((sec, k) => {
    if (k === 0) return;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 85%',
      end: 'top 20%',
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
        if (nombre) nombre.textContent = $(`[data-cap="${sec.id}"] .cap-label`)?.textContent ?? sec.id;
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
  $$('.panel-escena').forEach((panel) => {
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

/** Ficha de 30 segundos, copiar al portapapeles y aviso breve. */
function interfaz() {
  const ficha = $<HTMLDialogElement>('[data-ficha]');
  $$('[data-abrir-ficha]').forEach((b) => b.addEventListener('click', () => ficha?.showModal()));
  $$('[data-cerrar-ficha]').forEach((b) => b.addEventListener('click', () => ficha?.close()));
  // Tocar fuera de la ficha la cierra
  ficha?.addEventListener('click', (e) => e.target === ficha && ficha.close());

  const toast = $('[data-toast]');
  let t: number | undefined;
  const avisar = (msg: string) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(t);
    t = window.setTimeout(() => toast.classList.remove('is-on'), 2200);
  };
  $$('[data-copiar]').forEach((b) =>
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copiar ?? '');
        avisar('Copied to clipboard');
      } catch {
        avisar('Could not copy. Please select the text.');
      }
    }),
  );
}

export function iniciarPortafolio() {
  interfaz();
  const canvas = $<HTMLCanvasElement>('[data-morph]');
  const img = JSON.parse(canvas?.dataset.imagenes ?? '{}') as Imagenes;
  capitulos();
  try {
    if (!canvas) throw new Error('sin canvas');
    const escena = new EscenaMorph(canvas, objetivos(img));
    (window as unknown as { __morph: EscenaMorph }).__morph = escena;
    const loader = $('[data-loader]');
    escena.listo.then(() => {
      conectarScroll(escena);
      ScrollTrigger.refresh();
      if (loader) loader.style.opacity = '0';
      // Entrada: las partículas viajan desde una galaxia hasta formar la primera figura
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.to(escena, { intro: 1, duration: reduce ? 0 : 2.6, ease: 'power2.out' });
    });
  } catch {
    canvas?.remove();
    respaldo(img);
  }
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => textos());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
