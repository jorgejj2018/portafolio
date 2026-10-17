import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const EASE = 'expo.out';
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/** Menú de celular y tablet vertical. */
function menu() {
  const btn = $('[data-v2-menu-btn]');
  const panel = $('[data-v2-menu]');
  if (!btn || !panel) return;
  const toggle = (abrir: boolean) => {
    panel.classList.toggle('hidden', !abrir);
    btn.setAttribute('aria-expanded', String(abrir));
    btn.setAttribute('aria-label', abrir ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => toggle(panel.classList.contains('hidden')));
  $$('[data-v2-menu-link]').forEach((a) => a.addEventListener('click', () => toggle(false)));
}

/** El encabezado toma fondo al hacer scroll para que el texto siempre se lea. */
function header() {
  const h = $('[data-v2-header]');
  if (!h) return;
  ScrollTrigger.create({
    start: 40,
    end: 'max',
    onToggle: (self) => {
      h.classList.toggle('bg-paper/85', self.isActive);
      h.classList.toggle('backdrop-blur-md', self.isActive);
      h.classList.toggle('shadow-[0_1px_0_var(--color-line)]', self.isActive);
    },
  });
}

/** Vista previa en vivo de Mercatto: la app a tamaño escritorio, reducida para caber. */
function miniaturas() {
  $$('[data-mini]').forEach((box) => {
    new ResizeObserver(([e]) => box.style.setProperty('--s', String(e.contentRect.width / 1280))).observe(box);
  });
}

/** Entrada de la portada: el título sube línea por línea y el arco crece detrás del avatar. */
function portada() {
  const title = $('[data-v2-title]');
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  if (title) {
    const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    tl.from(split.lines, { yPercent: 105, duration: 1.2, stagger: 0.1 });
  }
  tl.from('[data-v2-arch]', { scaleY: 0, transformOrigin: 'bottom', duration: 1.3, ease: 'expo.inOut' }, 0)
    .from('[data-v2-sun]', { scale: 0, duration: 1.2 }, 0.4)
    .from('[data-v2-avatar]', { yPercent: 12, opacity: 0, duration: 1.3 }, 0.5)
    .from('[data-v2-float]', { y: 20, opacity: 0, scale: 0.9, duration: 0.9, stagger: 0.15, ease: 'back.out(1.8)' }, 1)
    .from('main > section:first-child [data-v2-in]', { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.4);

  // Las tarjetas flotan suavemente y el avatar se desplaza un poco con el scroll
  $$('[data-v2-float]').forEach((el, i) =>
    gsap.to(el, { y: i % 2 ? 10 : -10, duration: 2.6 + i, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 }),
  );
  gsap.to('[data-v2-avatar]', {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: { trigger: '[data-v2-hero-art]', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/** Títulos de sección: cada línea sube desde una máscara. */
function titulos() {
  $$('[data-v2-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.1,
          stagger: 0.08,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  });
}

/** Bloques sueltos y grupos de tarjetas. */
function apariciones() {
  ScrollTrigger.batch($$('[data-v2-in]').filter((el) => !el.closest('main > section:first-child')), {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.from(batch, { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: EASE }),
  });
  $$('[data-v2-stagger]').forEach((grupo) =>
    gsap.from($$('[data-v2-item]', grupo), {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: EASE,
      scrollTrigger: { trigger: grupo, start: 'top 88%', once: true },
    }),
  );
}

/** Captura de Mercatto: se endereza al entrar. Foto de "sobre mí": se descubre desde abajo. */
function imagenes() {
  const shot = $('[data-v2-shot]');
  if (shot)
    gsap.fromTo(
      shot,
      { rotate: -3, scale: 0.92, y: 40 },
      { rotate: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: shot, start: 'top 95%', end: 'top 45%', scrub: 0.6 } },
    );
  const foto = $('[data-v2-photo]');
  if (foto)
    gsap.from(foto, {
      clipPath: 'inset(100% 0 0 0 round 999px 999px 24px 24px)',
      duration: 1.4,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: foto, start: 'top 85%', once: true },
    });
  const sticker = $('[data-v2-sticker]');
  if (sticker)
    gsap.from(sticker, {
      scale: 0,
      rotate: -20,
      duration: 1,
      ease: 'back.out(2)',
      delay: 0.6,
      scrollTrigger: { trigger: foto ?? sticker, start: 'top 85%', once: true },
    });
}

/** Proceso: la línea se dibuja con el scroll y cada paso se enciende al alcanzarlo. */
function proceso() {
  const linea = $('[data-v2-process-line]');
  if (linea)
    gsap.to(linea, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: linea, start: 'top 80%', end: 'top 35%', scrub: 0.5 } });
  $$('[data-v2-step]').forEach((paso, i) => {
    const dot = $('[data-v2-dot]', paso);
    gsap.from(paso, { y: 30, opacity: 0, duration: 0.9, delay: i * 0.08, ease: EASE, scrollTrigger: { trigger: paso, start: 'top 88%', once: true } });
    if (dot)
      gsap.to(dot, {
        backgroundColor: '#1c1f23',
        color: '#f3efe7',
        duration: 0.4,
        scrollTrigger: { trigger: paso, start: 'top 60%', toggleActions: 'play none none reverse' },
      });
  });
}

/** Bloque de contacto: crece un poco al entrar. */
function contacto() {
  const el = $('[data-v2-contact]');
  if (el) gsap.from(el, { scale: 0.94, borderRadius: '4rem', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 50%', scrub: 0.6 } });
}

export function initV2() {
  menu();
  header();
  miniaturas();
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    portada();
    titulos();
    apariciones();
    imagenes();
    proceso();
    contacto();
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
