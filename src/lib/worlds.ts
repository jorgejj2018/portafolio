/**
 * Versión "Mundos": cada sección es un mundo. Al llegar a la siguiente, su mundo se abre como
 * un portal circular sobre el anterior (que se acerca y se apaga, como si lo atravesaras).
 * El avatar viaja de un lado a otro y cambia de pose; al final se cierra con el nombre.
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

/** Igual que en styles/worlds.css: avatar al lado de la tarjeta en pantallas anchas o en horizontal. */
const LATERAL = '(min-width: 1024px), (min-width: 640px) and (min-aspect-ratio: 6/5)';

type Pose = 'hero' | 'tres' | 'lado' | 'arriba' | 'sonrisa';
type Avatar = { x: number; y: number; s: number; o: number; pose: Pose };
const POSES: Pose[] = ['hero', 'tres', 'lado', 'arriba', 'sonrisa'];

/**
 * Dónde está el avatar en cada sección. En pantallas anchas se pone del lado contrario a la
 * tarjeta, mirando hacia ella; en celulares sube para quedar encima de la tarjeta.
 */
function avatarPorSeccion(lateral: boolean): Avatar[] {
  // En celular el avatar queda arriba (debajo del encabezado) y la tarjeta empieza debajo de él
  const lado = (x: number, pose: Pose): Avatar => (lateral ? { x, y: 0, s: 1, o: 1, pose } : { x: 0, y: -52, s: 1, o: 1, pose });
  return [
    { x: 0, y: 20, s: 0.8, o: 0, pose: 'hero' }, // origen: aún no aparece
    lado(26, 'hero'), // la web (tarjeta a la izquierda)
    lado(-26, 'tres'), // React (tarjeta a la derecha, el avatar mira hacia ella)
    lado(26, 'sonrisa'), // TypeScript y Next.js
    lado(-26, 'hero'), // Java y Spring Boot (de frente, mirando hacia la tarjeta)
    lado(26, 'arriba'), // nube e IA: mira hacia arriba
    { x: 0, y: 10, s: 0.8, o: 0, pose: 'arriba' }, // producción: la app toma el escenario
    { x: 0, y: 10, s: 0.8, o: 0, pose: 'hero' }, // final: tiene su propio avatar
  ];
}

const props = (a: Avatar) => ({ x: `${a.x}vw`, y: `${a.y}svh`, scale: a.s, opacity: a.o });

/** Portales entre mundos y el viaje del avatar, todo ligado al scroll. */
function viaje(lateral: boolean) {
  const secciones = $$('main > section');
  const mundos = $$('[data-world]');
  const anillo = $('[data-ring]');
  const avatar = $('[data-avatar]');
  const poses = POSES.map((p) => $(`[data-pose="${p}"]`));
  const pantalla = $('[data-screen]');
  const estados = avatarPorSeccion(lateral);

  const centro = lateral ? '50% 50%' : '50% 40%';
  mundos.forEach((m, i) => gsap.set(m, { clipPath: i === 0 ? 'none' : `circle(0vmax at ${centro})`, scale: 1, opacity: 1 }));
  gsap.set(avatar, props(estados[0]));
  poses.forEach((p, i) => gsap.set(p, { opacity: POSES[i] === estados[0].pose ? 1 : 0 }));
  gsap.set(anillo, { top: lateral ? '50%' : '40%' });
  if (pantalla) gsap.set(pantalla, { x: lateral ? '-23vw' : 0, rotate: 12, scale: 0.8 });

  for (let k = 1; k < secciones.length && k < mundos.length; k++) {
    const a = estados[k - 1];
    const b = estados[k];
    const tl = gsap.timeline({
      defaults: { ease: 'none', immediateRender: false },
      scrollTrigger: { trigger: secciones[k], start: 'top bottom', end: 'top 15%', scrub: 0.7 },
    });
    // El nuevo mundo se abre en círculo; el anterior se acerca y se apaga
    tl.fromTo(mundos[k], { clipPath: `circle(0vmax at ${centro})` }, { clipPath: `circle(120vmax at ${centro})`, ease: 'power2.in' }, 0)
      .fromTo(mundos[k - 1], { scale: 1, opacity: 1 }, { scale: 1.35, opacity: 0.25 }, 0)
      .fromTo(anillo, { width: '0vmax', height: '0vmax', opacity: 0 }, { width: '240vmax', height: '240vmax', opacity: 1, ease: 'power2.in' }, 0)
      .to(anillo, { opacity: 0, duration: 0.25 }, 0.75);
    // El avatar se encoge al cruzar el portal y reaparece en su nuevo lugar
    tl.fromTo(avatar, props(a), { ...props(a), scale: a.s * 0.75, opacity: a.o * 0.3, duration: 0.5 }, 0).fromTo(
      avatar,
      { ...props(b), scale: b.s * 0.75, opacity: b.o * 0.3 },
      { ...props(b), duration: 0.5 },
      0.5,
    );
    poses.forEach((p, i) => {
      const antes = POSES[i] === a.pose ? 1 : 0;
      const despues = POSES[i] === b.pose ? 1 : 0;
      if (antes !== despues) tl.fromTo(p, { opacity: antes }, { opacity: despues, duration: 0.05 }, 0.5);
    });
    // En producción, la app real se endereza mientras entras
    if (pantalla && mundos[k].contains(pantalla)) tl.fromTo(pantalla, { rotate: 12, scale: 0.8 }, { rotate: 0, scale: 1 }, 0.2);
  }
}

/** Los símbolos de cada mundo se reparten al azar y flotan. */
function simbolos() {
  $$('.w-symbol').forEach((s) => {
    gsap.set(s, { left: `${gsap.utils.random(4, 88)}%`, top: `${gsap.utils.random(10, 85)}%`, rotate: gsap.utils.random(-12, 12) });
    gsap.to(s, { y: gsap.utils.random(-40, 40), x: gsap.utils.random(-30, 30), duration: gsap.utils.random(5, 9), ease: 'sine.inOut', yoyo: true, repeat: -1 });
  });
}

/** Textos: títulos que suben por líneas, tarjetas que entran y el nombre final letra por letra. */
function textos() {
  $$('[data-split]').forEach((el) =>
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, { yPercent: 105, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    }),
  );
  $$('[data-card]').forEach((c) =>
    gsap.from(c, { y: 50, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%', once: true } }),
  );
  const nombre = $('[data-name]');
  if (nombre) {
    const split = SplitText.create(nombre, { type: 'chars', mask: 'chars' });
    gsap
      .timeline({ scrollTrigger: { trigger: nombre, start: 'top 85%', once: true } })
      .from(split.chars, { yPercent: 110, duration: 1.1, stagger: 0.04, ease: 'expo.out' })
      .from('[data-finale-avatar]', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.2)
      .from('[data-contact-card]', { x: 40, opacity: 0, duration: 1, ease: 'expo.out' }, 0.4);
  }
}

/** Capítulo actual (encabezado e índice) y barra de avance. */
function capitulo() {
  const num = $('[data-now-num]');
  const nombre = $('[data-now]');
  const barra = $('[data-progress]');
  $$('main > section').forEach((s, i) =>
    ScrollTrigger.create({
      trigger: s,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: ({ isActive }) => {
        if (!isActive) return;
        if (num) num.textContent = String(i + 1).padStart(2, '0');
        if (nombre) nombre.textContent = s.dataset.chapter ?? '';
        $$('[data-index]').forEach((a) => a.setAttribute('aria-current', String(a.dataset.index === s.id)));
      },
    }),
  );
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => barra && (barra.style.transform = `scaleX(${s.progress})`) });
}

/** Enlaces internos con desplazamiento suave y botón de copiar el correo. */
function interfaz(lenis: Lenis | null) {
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const destino = $(a.getAttribute('href')!);
      if (!destino || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(destino, { duration: 2 });
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

export function iniciarMundos() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis: Lenis | null = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  interfaz(lenis);
  capitulo();
  simbolos();
  // 'all' siempre coincide: así el viaje se rehace al girar el celular o cambiar el tamaño
  gsap.matchMedia().add({ lateral: LATERAL, siempre: 'all' }, (ctx) => viaje(Boolean(ctx.conditions?.lateral)));
  if (!reduce) textos();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
