import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ImagenParticulas } from './particles';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

// En iOS y Android la barra del navegador cambia la altura al hacer scroll;
// esto evita que las animaciones salten cada vez que aparece o desaparece.
ScrollTrigger.config({ ignoreMobileResize: true });

const EASE = 'expo.out';

/**
 * Posición de scroll para un borde del elemento, sin pasar del máximo de la página:
 * al final del sitio (el cierre) el recorrido no alcanza para "bottom 45%" en celulares.
 */
const alcanzable = (el: Element, borde: 'top' | 'bottom', pct: number, margen = 0) => () => {
  const r = el.getBoundingClientRect();
  const y = (borde === 'top' ? r.top : r.bottom) + scrollY - innerHeight * pct;
  return Math.max(0, Math.min(y, ScrollTrigger.maxScroll(window) - 1 - margen));
};

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

let heroParticulas: ImagenParticulas | null = null;
let heroSalida = 1;
let introLista = false;

/**
 * Entrada de la portada: el título sube letra por letra, el código se escribe línea por línea,
 * "compila" y sus partículas salen del editor para formar la foto real.
 */
function heroIntro() {
  const title = $('[data-hero-title]');
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  if (title) {
    const split = SplitText.create(title, { type: 'chars,lines', mask: 'lines' });
    tl.from(split.chars, { yPercent: 110, duration: 1.1, stagger: 0.035 });
  }
  tl.from('[data-hero-item]', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.35).from(
    '[data-hero-code]',
    { y: 30, opacity: 0, duration: 0.9 },
    0.2,
  );

  // Cada línea se "escribe": se destapa de izquierda a derecha a saltos, un carácter a la vez
  let t = 0.7;
  $$('[data-code-line]').forEach((line) => {
    const chars = Math.max(1, (line.textContent ?? '').trim().length);
    const dur = Math.min(0.9, chars * 0.022);
    tl.to(line, { clipPath: 'inset(0 0% 0 0)', duration: dur, ease: `steps(${chars})` }, t);
    t += dur + 0.05;
  });

  const msg = $('[data-code-msg]');
  const dot = $('[data-code-dot]');
  tl.add(() => {
    if (msg) msg.textContent = 'compiled in 1.2s · rendering jorge.webp';
    dot?.classList.replace('bg-amber-400', 'bg-emerald-400');
  }, t + 0.1);

  const foto = $<HTMLImageElement>('[data-hero-photo]');
  const canvas = $<HTMLCanvasElement>('[data-hero-canvas]');
  if (!foto || !canvas) return;
  const particulas = new ImagenParticulas(canvas, foto, {
    paso: 3,
    origen: $('[data-hero-code] ol'),
    onCompleto: (completo) => {
      foto.style.opacity = completo ? '1' : '0';
      canvas.style.opacity = completo ? '0' : '1';
    },
  });
  heroParticulas = particulas;
  const estado = { p: 0 };
  tl.to(estado, { p: 1, duration: 2.2, ease: 'power2.inOut', onUpdate: () => particulas.set(estado.p * heroSalida) }, t + 0.2)
    .from('[data-hero-avatar] [data-pose-glow]', { scale: 0.4, opacity: 0, duration: 1.6 }, t + 0.6)
    .set('[data-hero-badge]', { opacity: 1 }, t + 2.1)
    .from('[data-hero-badge]', { scale: 0.6, duration: 0.7, ease: 'back.out(2)' }, t + 2.1)
    .add(() => {
      introLista = true;
      particulas.set(heroSalida);
    });
}

/** Al salir de la portada la foto se disuelve en partículas y el texto se desvanece (ligado al scroll). */
function heroOut() {
  const hero = $('[data-hero]');
  if (!hero) return;
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
      heroSalida = 1 - gsap.utils.clamp(0, 1, (self.progress - 0.15) / 0.6);
      if (introLista) heroParticulas?.set(heroSalida);
    },
  });
  gsap.to('[data-hero-copy]', {
    yPercent: -8,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
}

/** Títulos de sección: cada línea sube desde una máscara. */
function headings() {
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1,
          stagger: 0.09,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }),
    });
  });
}

/** Párrafos y bloques sueltos. */
function reveals() {
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.from(batch, { y: 28, opacity: 0, duration: 0.9, stagger: 0.1, ease: EASE }),
  });
}

/** Grupos de tarjetas que entran escalonadas. */
function staggers() {
  $$('[data-stagger]').forEach((group) => {
    gsap.from($$('[data-stagger-item]', group), {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.12,
      ease: EASE,
      scrollTrigger: { trigger: group, start: 'top 85%', once: true },
    });
  });
}

/**
 * Poses del avatar: se arman con partículas al entrar en pantalla y se disuelven como polvo al salir,
 * siguiendo el scroll en ambos sentidos. Flotan levemente con el scroll.
 */
function poses() {
  $$('[data-pose]')
    .filter((fig) => !fig.closest('[data-hero-avatar]'))
    .forEach((fig) => {
      const img = $<HTMLImageElement>('[data-pose-img]', fig);
      const canvas = $<HTMLCanvasElement>('[data-pose-canvas]', fig);
      const glow = $('[data-pose-glow]', fig);
      const amount = Number(fig.dataset.parallax ?? 0.12);
      if (!img || !canvas) return;
      img.style.opacity = '0';
      const particulas = new ImagenParticulas(canvas, img, {
        paso: 3,
        onCompleto: (completo) => {
          img.style.opacity = completo ? '1' : '0';
          canvas.style.opacity = completo ? '0' : '1';
        },
      });
      let entrada = 0;
      let salida = 0;
      const actualizar = () => {
        const p = entrada * (1 - salida);
        particulas.set(p);
        if (glow) glow.style.opacity = String(p);
      };
      ScrollTrigger.create({
        trigger: fig,
        start: alcanzable(fig, 'top', 0.95, 120),
        end: alcanzable(fig, 'top', 0.45),
        onUpdate: (self) => {
          entrada = self.progress;
          actualizar();
        },
      });
      // El avatar del cierre se queda armado: es el final de la historia
      if (!fig.closest('[data-final]'))
        ScrollTrigger.create({
          trigger: fig,
          start: 'bottom 35%',
          end: 'bottom -5%',
          onUpdate: (self) => {
            salida = self.progress;
            actualizar();
          },
        });
      if (amount > 0) {
        gsap.fromTo(
          fig,
          { yPercent: amount * 100 },
          {
            yPercent: -amount * 100,
            ease: 'none',
            scrollTrigger: { trigger: fig.parentElement ?? fig, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }
    });
}

/** Pasos del build entre secciones: la línea baja, el comando se escribe y la salida aparece, todo con el scroll. */
function seams() {
  $$('[data-seam]').forEach((seam) => {
    const cmd = $('[data-seam-cmd]', seam);
    const chars = Math.max(1, (cmd?.textContent ?? '').length);
    gsap
      .timeline({
        scrollTrigger: { trigger: seam, start: 'top 85%', end: 'bottom 55%', scrub: 0.5 },
        defaults: { ease: 'none' },
      })
      .from($('[data-seam-line]', seam), { scaleY: 0, duration: 0.6 })
      .to(cmd, { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: `steps(${chars})` })
      .to($$('[data-seam-out]', seam), { opacity: 1, duration: 0.3, stagger: 0.35 }, '+=0.15');
  });
}

/**
 * Cierre: la palabra final se completa letra por letra con el scroll. Las letras que faltan
 * muestran símbolos de código que cambian; al final aparecen mis datos fila por fila.
 */
function finalWord() {
  const word = $('[data-final-word]');
  if (!word) return;
  const letras = $$('[data-char]', word);
  const simbolos = '01<>/{}[]#$;=';
  // Cada letra guarda su ancho real para que los símbolos no muevan la palabra mientras cambian
  const fijarAnchos = () =>
    letras.forEach((el) => {
      el.style.width = '';
      const t = el.textContent;
      el.textContent = el.dataset.char!;
      el.style.width = `${el.getBoundingClientRect().width}px`;
      el.textContent = t;
    });
  fijarAnchos();
  document.fonts?.ready.then(fijarAnchos);
  addEventListener('resize', fijarAnchos);
  let progreso = 0;
  let tick = 0;
  const pintar = () => {
    const fijas = Math.round(progreso * letras.length);
    letras.forEach((el, i) => {
      const fija = i < fijas;
      el.classList.toggle('is-set', fija);
      el.textContent = fija ? el.dataset.char! : simbolos[(i * 7 + tick) % simbolos.length];
    });
  };
  // Mientras se completa, los símbolos cambian solos para que se sienta vivo
  const latido = () => {
    tick++;
    if (tick % 4 === 0 && progreso < 1) pintar();
  };
  ScrollTrigger.create({
    trigger: word,
    start: alcanzable(word, 'top', 0.85, 160),
    end: alcanzable(word, 'bottom', 0.45),
    onUpdate: (self) => {
      // Al llegar al fondo de la página el nombre queda completo aunque el recorrido no alcance
      const alFondo = scrollY + innerHeight >= document.documentElement.scrollHeight - 8;
      progreso = alFondo ? 1 : Math.max(progreso, self.progress);
      pintar();
    },
    onLeave: () => {
      progreso = 1;
      pintar();
    },
    onToggle: (self) => (self.isActive ? gsap.ticker.add(latido) : gsap.ticker.remove(latido)),
  });
  // También se completa si se llega al final sin pasar por la zona (por ejemplo, con un enlace)
  addEventListener('scroll', () => {
    if (progreso < 1 && scrollY + innerHeight >= document.documentElement.scrollHeight - 8) {
      progreso = 1;
      pintar();
    }
  }, { passive: true });
  pintar();
  gsap.from('[data-final-done]', { opacity: 0, x: -12, duration: 0.8, ease: EASE, scrollTrigger: { trigger: word, start: 'top 85%', once: true } });
  gsap.from('[data-final-row]', {
    opacity: 0,
    x: -10,
    duration: 0.5,
    stagger: 0.07,
    ease: EASE,
    scrollTrigger: { trigger: '[data-final-word]', start: 'top 75%', once: true },
  });
}

/** Línea de tiempo: la línea se dibuja con el scroll y cada hito se enciende al alcanzarlo. */
function timeline() {
  const list = $('[data-timeline]');
  if (!list) return;
  gsap.to('[data-timeline-line]', {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: list, start: 'top 70%', end: 'bottom 60%', scrub: 0.4 },
  });
  $$('[data-timeline-item]', list).forEach((item) => {
    const dot = $('[data-timeline-dot]', item);
    gsap.from(item, {
      x: -16,
      opacity: 0.25,
      duration: 0.8,
      ease: EASE,
      scrollTrigger: { trigger: item, start: 'top 72%', toggleActions: 'play none none reverse' },
    });
    if (dot)
      gsap.to(dot, {
        backgroundColor: '#4f7cff',
        scale: 1.4,
        duration: 0.4,
        scrollTrigger: { trigger: item, start: 'top 72%', toggleActions: 'play none none reverse' },
      });
  });
}

/** Barra de avance, estado del build y enlace activo del menú. */
function depth() {
  const line = $('[data-depth-line]');
  const build = $('[data-build]');
  const pasos = JSON.parse(build?.dataset.buildPasos ?? '[]') as { id: string; paso: string }[];
  const label = $('[data-build-label]');
  const pct = $('[data-build-pct]');
  let paso = 'start';
  let avance = 0;
  const pintarBuild = () => {
    if (!build) return;
    const listo = avance > 0.985;
    if (label) label.textContent = listo ? 'deployed · ready' : `build · ${paso}`;
    if (pct) pct.textContent = listo ? '' : `${Math.round(avance * 100)}%`;
    $('[data-build-spin]', build)?.classList.toggle('hidden', listo);
    $('[data-build-ok]', build)?.classList.toggle('hidden', !listo);
  };
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      if (line) line.style.transform = `scaleX(${self.progress})`;
      avance = self.progress;
      pintarBuild();
    },
  });
  pasos.forEach(({ id, paso: nombre }) => {
    const section = document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: ({ isActive }) => {
        if (!isActive) return;
        paso = nombre;
        pintarBuild();
      },
    });
  });
  $$('[data-station]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: ({ isActive }) => {
        if (!isActive) return;
        $$('[data-nav]').forEach((a) => a.setAttribute('aria-current', String(a.dataset.nav === section.id)));
      },
    });
  });
}

/** Vista previa en vivo: el navegador se endereza en 3D mientras entra en pantalla. */
function showcase() {
  const frame = $('[data-showcase]');
  if (!frame) return;
  gsap.fromTo(
    frame,
    { rotateX: 28, scale: 0.86, y: 60, opacity: 0.3 },
    {
      rotateX: 0,
      scale: 1,
      y: 0,
      opacity: 1,
      ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 35%', scrub: 0.6 },
    },
  );
}

/** Rol de la portada: cambia cada pocos segundos con un efecto de texto que se "decodifica". */
function roles() {
  const el = $('[data-roles]');
  if (!el) return;
  const lista = JSON.parse(el.dataset.roles ?? '[]') as string[];
  if (lista.length < 2) return;
  const tl = gsap.timeline({ repeat: -1, delay: 2.4 });
  lista.forEach((_, i) => {
    const siguiente = lista[(i + 1) % lista.length];
    tl.to(el, { duration: 1.1, scrambleText: { text: siguiente, chars: '01<>/{}[]#$', speed: 0.5 }, ease: 'none' }).to({}, { duration: 2.2 });
  });
}

/** Cintas infinitas: avanzan solas y aceleran (e inclinan) según la velocidad del scroll. */
function marquees() {
  const cintas = $$('[data-marquee]');
  if (!cintas.length) return;
  const loops = cintas.map((cinta) => {
    const track = $('[data-marquee-track]', cinta)!;
    const dir = Number(cinta.dataset.marquee) || 1;
    const tween = gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 });
    return { track, tween };
  });
  const skew = gsap.quickTo(
    loops.map((l) => l.track),
    'skewX',
    { duration: 0.5, ease: 'power3' },
  );
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const v = self.getVelocity();
      const boost = 1 + Math.min(Math.abs(v) / 400, 6);
      loops.forEach(({ tween }) => gsap.to(tween, { timeScale: (v < 0 ? -1 : 1) * boost, duration: 0.2, overwrite: true }));
      skew(gsap.utils.clamp(-12, 12, v / -250));
    },
  });
  // Al dejar de hacer scroll, las cintas vuelven a su ritmo normal
  ScrollTrigger.addEventListener('scrollEnd', () => {
    loops.forEach(({ tween }) => gsap.to(tween, { timeScale: 1, duration: 1.2 }));
    skew(0);
  });
  // Las bandas cruzadas se desplazan un poco en horizontal mientras pasan
  $$('[data-bands]').forEach((band, i) => {
    gsap.fromTo(
      band,
      { xPercent: i % 2 ? 4 : -4 },
      { xPercent: i % 2 ? -4 : 4, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

/** Luz que sigue al cursor por todo el sitio. */
function cursorLight() {
  const luz = $('[data-cursor-light]');
  if (!luz) return;
  const x = gsap.quickTo(luz, 'x', { duration: 0.8, ease: 'power3' });
  const y = gsap.quickTo(luz, 'y', { duration: 0.8, ease: 'power3' });
  gsap.set(luz, { x: innerWidth / 2, y: innerHeight / 3 });
  addEventListener('pointermove', (e) => {
    x(e.clientX);
    y(e.clientY);
  });
}

/** Botones magnéticos: se dejan atraer por el cursor y vuelven con un rebote. */
function magnetic() {
  $$('[data-magnetic]').forEach((el) => {
    el.style.transitionProperty = 'color, background-color, border-color';
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.35);
      y((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
    });
  });
}

/** Luz de fondo que sigue al cursor en las tarjetas (solo con mouse). */
function backlight() {
  $$('.backlit').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

export function initScrollAnimations() {
  depth();
  const mm = gsap.matchMedia();
  mm.add(
    { motion: '(prefers-reduced-motion: no-preference)', mouse: '(hover: hover) and (pointer: fine)' },
    (ctx) => {
      const { motion, mouse } = ctx.conditions as { motion: boolean; mouse: boolean };
      if (mouse) backlight();
      if (mouse && motion) {
        cursorLight();
        magnetic();
      }
      if (!motion) {
        gsap.set('[data-timeline-line]', { scaleY: 1 });
        // Sin animaciones: todo aparece ya terminado
        gsap.set('[data-code-line], [data-seam-cmd]', { clipPath: 'none' });
        gsap.set('[data-seam-out], [data-hero-photo], [data-hero-badge]', { opacity: 1 });
        const msg = $('[data-code-msg]');
        if (msg) msg.textContent = 'compiled · jorge.webp';
        $$('[data-char]').forEach((el) => el.classList.add('is-set'));
        return;
      }
      heroIntro();
      heroOut();
      headings();
      reveals();
      staggers();
      poses();
      timeline();
      showcase();
      roles();
      marquees();
      seams();
      finalWord();
    },
  );

  // Las fuentes cambian la altura del texto: recalcular cuando terminen de cargar
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
