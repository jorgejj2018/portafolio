import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

// En iOS y Android la barra del navegador cambia la altura al hacer scroll;
// esto evita que las animaciones salten cada vez que aparece o desaparece.
ScrollTrigger.config({ ignoreMobileResize: true });

const EASE = 'expo.out';

// La máscara de entrada de las fotos sobresale de la imagen para no recortar el brillo del borde
// en un rectángulo; al terminar se borra (clearProps) para que no quede ningún recuadro.
const REVEAL_FROM = 'inset(100% -20% -20% -20%)';
const REVEAL_TO = 'inset(-20% -20% -20% -20%)';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/** Entrada de la portada: título letra por letra, luego el resto y el avatar. */
function heroIntro() {
  const title = $('[data-hero-title]');
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  if (title) {
    const split = SplitText.create(title, { type: 'chars,lines', mask: 'lines' });
    tl.from(split.chars, { yPercent: 110, duration: 1.1, stagger: 0.035 });
  }
  tl.fromTo(
    '[data-hero-avatar] [data-pose-img]',
    { clipPath: REVEAL_FROM },
    { clipPath: REVEAL_TO, duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath' },
    0.1,
  )
    .from('[data-hero-avatar] [data-pose-glow]', { scale: 0.4, opacity: 0, duration: 1.6 }, 0.3)
    .from('[data-hero-item]', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.45)
    .from('[data-hero-badge]', { scale: 0.6, opacity: 0, duration: 0.7, ease: 'back.out(2)' }, 1.1);
}

/** Al salir de la portada el avatar se aleja y el texto se desvanece (ligado al scroll). */
function heroOut() {
  const hero = $('[data-hero]');
  if (!hero) return;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  tl.to('[data-hero-avatar]', { yPercent: -12, scale: 0.9, opacity: 0.25, ease: 'none' }, 0).to(
    '[data-hero-copy]',
    { yPercent: -8, opacity: 0, ease: 'none' },
    0,
  );
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

/** Poses del avatar: se revelan de abajo hacia arriba y flotan levemente con el scroll. */
function poses() {
  $$('[data-pose]')
    .filter((fig) => !fig.closest('[data-hero-avatar]'))
    .forEach((fig) => {
      const img = $('[data-pose-img]', fig);
      const glow = $('[data-pose-glow]', fig);
      const amount = Number(fig.dataset.parallax ?? 0.12);
      gsap
        .timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } })
        .fromTo(img, { clipPath: REVEAL_FROM }, { clipPath: REVEAL_TO, duration: 1.2, ease: 'expo.inOut', clearProps: 'clipPath' })
        .from(glow, { scale: 0.5, opacity: 0, duration: 1.4, ease: EASE }, 0.2);
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

/** Barra de avance y enlace activo del menú. */
function depth() {
  const line = $('[data-depth-line]');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      if (line) line.style.transform = `scaleX(${self.progress})`;
    },
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

/** Texto gigante del contacto: se rellena de color a medida que entra en pantalla. */
function megaText() {
  const el = $('[data-mega]');
  if (!el) return;
  gsap.fromTo(
    el,
    { '--fill': 0 },
    { '--fill': 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 55%', scrub: 0.5 } },
  );
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
        gsap.set('[data-mega]', { '--fill': 100 });
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
      megaText();
    },
  );

  // Las fuentes cambian la altura del texto: recalcular cuando terminen de cargar
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
