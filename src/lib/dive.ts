/**
 * Versión "Inmersión": cada sección define cómo se ve el escenario (avatar, agua, oscuridad,
 * captura de Mercatto) y el scroll interpola entre una y la siguiente.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/** Igual que en styles/dive.css: avatar al lado del texto en pantallas anchas o en horizontal. */
const LATERAL = '(min-width: 1024px), (min-width: 640px) and (min-aspect-ratio: 6/5)';

type Pose = 'hero' | 'tres' | 'lado' | 'arriba';
/** x, y en vw/vh; r en grados; s escala; o opacidad */
type Avatar = { x: number; y: number; r: number; s: number; o: number; pose: Pose };
type Objeto = { x: number; y: number; r: number; s: number; o: number };
type Estado = { avatar: Avatar; objeto: Objeto; agua: number; oscuro: number; burbujas: number };

const OCULTO: Objeto = { x: 0, y: 40, r: 18, s: 0.8, o: 0 };

/** Un estado por sección, en el orden en que aparecen en la página. */
function estados(lateral: boolean): Estado[] {
  const e = (avatar: Avatar, agua: number, oscuro: number, extra: Partial<Estado> = {}): Estado => ({
    avatar,
    objeto: OCULTO,
    agua,
    oscuro,
    burbujas: 0.3,
    ...extra,
  });
  return [
    // superficie
    e({ x: 0, y: 4, r: -8, s: 1, o: 1, pose: 'hero' }, 0, 0),
    // tres frases mientras se hunde y gira
    e({ x: 0, y: 2, r: 5, s: 0.92, o: 1, pose: 'hero' }, -80, 0.05),
    e({ x: 0, y: 0, r: -3, s: 0.92, o: 1, pose: 'tres' }, -80, 0.12),
    e({ x: 0, y: 0, r: 2, s: 0.95, o: 1, pose: 'tres' }, -80, 0.18),
    // cifras
    e({ x: 0, y: 0, r: -5, s: 0.9, o: lateral ? 1 : 0.85, pose: 'lado' }, -80, 0.25),
    // stack
    e(lateral ? { x: 24, y: 0, r: 3, s: 0.85, o: 1, pose: 'lado' } : { x: 0, y: -16, r: 0, s: 0.7, o: 0.22, pose: 'lado' }, -80, 0.35, {
      burbujas: 1,
    }),
    // frase antes del trabajo
    e({ x: 0, y: 6, r: -6, s: 0.72, o: 0.5, pose: 'arriba' }, -80, 0.42),
    // trabajo: el avatar se va y Mercatto sube girando hasta quedar derecho
    e({ x: 0, y: 10, r: -6, s: 0.6, o: 0, pose: 'arriba' }, -80, 0.45, {
      objeto: lateral ? { x: -23, y: 0, r: 0, s: 1, o: 1 } : { x: 0, y: -25, r: 0, s: 1, o: 0.35 },
    }),
    // trayectoria
    e(lateral ? { x: 28, y: 4, r: 4, s: 0.8, o: 0.9, pose: 'arriba' } : { x: 0, y: 12, r: 0, s: 0.75, o: 0.16, pose: 'arriba' }, -80, 0.6),
    // frase final: vuelve a subir
    e({ x: 0, y: -4, r: 0, s: 0.9, o: 0.9, pose: 'hero' }, -80, 0.3),
    // contacto: sale a la superficie y el amanecer vuelve a verse
    e({ x: 0, y: -80, r: 0, s: 0.8, o: 0, pose: 'hero' }, 0, 0),
  ];
}

const POSES: Pose[] = ['hero', 'tres', 'lado', 'arriba'];

function aplicarEstado(s: Estado) {
  const v = (n: number, u: string) => `${n}${u}`;
  return {
    avatar: { x: v(s.avatar.x, 'vw'), y: v(s.avatar.y, 'vh'), rotation: s.avatar.r, scale: s.avatar.s, opacity: s.avatar.o },
    poses: POSES.map((p) => ({ opacity: p === s.avatar.pose ? 1 : 0 })),
    objeto: { x: v(s.objeto.x, 'vw'), y: v(s.objeto.y, 'vh'), rotation: s.objeto.r, scale: s.objeto.s, opacity: s.objeto.o },
    agua: { y: v(s.agua, 'vh') },
    etapa: { '--deep': s.oscuro },
    burbujas: { opacity: s.burbujas },
  };
}

/** Escenario ligado al scroll: entre sección y sección se interpola el estado. */
function escenario(lateral: boolean) {
  const secciones = $$('main > section');
  const lista = estados(lateral).slice(0, secciones.length);
  const avatar = $('[data-avatar]');
  const poses = POSES.map((p) => $(`[data-pose="${p}"]`));
  const objeto = $('[data-object]');
  const agua = $$('[data-water], [data-surface]');
  const etapa = $('.dive-stage');
  const burbujas = $('[data-bubbles]');

  const inicial = aplicarEstado(lista[0]);
  gsap.set(avatar, inicial.avatar);
  poses.forEach((p, i) => gsap.set(p, inicial.poses[i]));
  gsap.set(objeto, inicial.objeto);
  gsap.set(agua, inicial.agua);
  gsap.set(etapa, inicial.etapa);
  gsap.set(burbujas, inicial.burbujas);

  for (let k = 1; k < lista.length; k++) {
    const a = aplicarEstado(lista[k - 1]);
    const b = aplicarEstado(lista[k]);
    const tl = gsap.timeline({
      defaults: { ease: 'none', immediateRender: false },
      scrollTrigger: { trigger: secciones[k], start: 'top bottom', end: 'top top', scrub: 0.8 },
    });
    tl.fromTo(avatar, a.avatar, b.avatar, 0)
      .fromTo(objeto, a.objeto, b.objeto, 0)
      .fromTo(agua, a.agua, b.agua, 0)
      .fromTo(etapa, a.etapa, b.etapa, 0)
      .fromTo(burbujas, a.burbujas, b.burbujas, 0);
    poses.forEach((p, i) => {
      if (a.poses[i].opacity !== b.poses[i].opacity) tl.fromTo(p, a.poses[i], b.poses[i], 0);
    });
  }
}

/** Burbujas con nombres de tecnologías que suben sin parar. */
function burbujas() {
  const caja = $('[data-bubbles]');
  if (!caja) return;
  const palabras = JSON.parse(caja.dataset.palabras ?? '[]') as string[];
  const n = innerWidth < 640 ? 7 : palabras.length;
  palabras.slice(0, n).forEach((p, i) => {
    const b = document.createElement('span');
    b.className = 'dive-bubble';
    b.textContent = p;
    b.style.left = `${4 + ((i * 37) % 88)}%`;
    caja.appendChild(b);
    gsap.fromTo(
      b,
      { y: 0, x: 0 },
      {
        y: () => -(innerHeight + 120),
        x: () => gsap.utils.random(-40, 40),
        duration: gsap.utils.random(14, 24),
        ease: 'none',
        repeat: -1,
        delay: -gsap.utils.random(0, 24),
      },
    );
  });
}

/** Textos: el título de la portada y las frases aparecen palabra por palabra con el scroll. */
function textos() {
  const titulo = $('[data-hero-title]');
  if (titulo) {
    const split = SplitText.create(titulo, { type: 'chars,words', mask: 'chars' });
    gsap.from(split.chars, { yPercent: 110, duration: 1.2, stagger: 0.03, ease: 'expo.out', delay: 0.2 });
  }
  gsap.from('.dive-hero-lead, .dive-hero-note, .dive-hero-scroll', { opacity: 0, y: 20, duration: 1, stagger: 0.1, delay: 0.9, ease: 'expo.out' });

  $$('[data-phrase]').forEach((f) => {
    const split = SplitText.create(f, { type: 'words' });
    gsap
      .timeline({ scrollTrigger: { trigger: f, start: 'top 85%', end: 'bottom 15%', scrub: 0.5 } })
      .fromTo(split.words, { opacity: 0.08, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', stagger: 0.1, duration: 0.5 })
      .to(split.words, { opacity: 0, y: -20, stagger: 0.04, duration: 0.4 }, '+=0.6');
  });

  $$('[data-panel]').forEach((p) =>
    gsap.from(p, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 85%', once: true } }),
  );
}

/** Tarjetas de cifras: entran desde el costado y su número cuenta. */
function cifras() {
  $$('[data-card]').forEach((c, i) => {
    const num = $('[data-count]', c);
    const fin = Number(num?.dataset.count ?? 0);
    gsap.from(c, {
      x: i % 2 ? -40 : 40,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: c, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
    if (num) {
      const o = { v: 0 };
      gsap.to(o, {
        v: fin,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => (num.textContent = String(Math.round(o.v))),
        scrollTrigger: { trigger: c, start: 'top 85%', once: true },
      });
    }
  });
}

/** Trayectoria: el año avanza con el scroll y se enciende el hito que corresponde. */
function trayectoria() {
  const sec = $('[data-journey]');
  const anio = $('[data-year]');
  const hitos = $$('[data-milestone]');
  if (!sec || !anio || !hitos.length) return;
  const años = hitos.map((h) => Number(h.dataset.anio));
  const desde = años[0];
  const hasta = años[años.length - 1];
  const pintar = (p: number) => {
    const y = Math.round(desde + (hasta - desde) * p);
    anio.textContent = String(y);
    let activo = 0;
    años.forEach((a, i) => a <= y && (activo = i));
    hitos.forEach((h, i) => h.classList.toggle('is-on', i === activo));
  };
  pintar(0);
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: (s) => pintar(s.progress) });
}

/** Menú, copiar el correo y aviso breve. */
function interfaz(lenis: Lenis | null) {
  const btn = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  const abrir = (si: boolean) => {
    if (!menu || !btn) return;
    menu.hidden = !si;
    btn.setAttribute('aria-expanded', String(si));
    btn.textContent = si ? 'Close' : 'Menu';
    if (si) lenis?.stop();
    else lenis?.start();
  };
  btn?.addEventListener('click', () => abrir(!!menu?.hidden));
  $$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => abrir(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && abrir(false));

  // Los enlaces internos se desplazan suave con Lenis
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const destino = $(a.getAttribute('href')!);
      if (!destino || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(destino, { duration: 1.6 });
    }),
  );

  const toast = $('[data-toast]');
  let t: number | undefined;
  $$('[data-copiar]').forEach((b) =>
    b.addEventListener('click', async () => {
      let msg = 'Copied to clipboard';
      try {
        await navigator.clipboard.writeText(b.dataset.copiar ?? '');
      } catch {
        msg = 'Could not copy. Please select the text.';
      }
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('is-on');
      clearTimeout(t);
      t = window.setTimeout(() => toast.classList.remove('is-on'), 2200);
    }),
  );
}

export function iniciarInmersion() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis: Lenis | null = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  interfaz(lenis);
  burbujas();
  trayectoria();
  const mm = gsap.matchMedia();
  // 'all' siempre coincide: así el escenario se rehace al pasar de vertical a horizontal y viceversa
  mm.add({ lateral: LATERAL, siempre: 'all' }, (ctx) => {
    escenario(Boolean(ctx.conditions?.lateral));
  });
  if (!reduce) {
    textos();
    cifras();
  }
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
