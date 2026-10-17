/**
 * Escena de partículas que se transforman.
 *
 * Las mismas partículas forman, una tras otra, cada "objetivo": la foto real, los avatares,
 * la captura de Mercatto o un texto. `setProgreso(s)` recibe un número continuo
 * (0 = primer objetivo, 1 = segundo…) y las partículas viajan entre ellos con una
 * explosión suave a mitad de camino. El mouse las aparta y la nube gira hacia él.
 */
import * as THREE from 'three';

type Encuadre = {
  /** Centro horizontal, como fracción del ancho visible (0 = centro, 0.25 = a la derecha) */
  x: number;
  /** Centro vertical, como fracción del alto visible (positivo = arriba) */
  y: number;
  /** Alto deseado, como fracción del alto visible */
  alto: number;
  /** Ancho máximo, como fracción del ancho visible */
  anchoMax: number;
  /** Hasta dónde puede bajar la figura (fracción del alto, desde arriba): ahí empieza el texto */
  fondoMax?: number;
};

export type Objetivo =
  | { tipo: 'imagen'; src: string; escritorio?: Partial<Encuadre>; movil?: Partial<Encuadre>; ignorarClaros?: boolean }
  | { tipo: 'texto'; lineas: string[]; escritorio?: Partial<Encuadre>; movil?: Partial<Encuadre> };

type Muestra = {
  /** Posiciones normalizadas: alto 1, centradas en 0 */
  pos: Float32Array;
  col: Float32Array;
  aspecto: number;
  escritorio: Encuadre;
  movil: Encuadre;
};

const ENCUADRE_ESCRITORIO: Encuadre = { x: 0.26, y: 0, alto: 0.66, anchoMax: 0.42, fondoMax: 0.97 };
const ENCUADRE_MOVIL: Encuadre = { x: 0, y: 0.23, alto: 0.34, anchoMax: 0.86, fondoMax: 0.485 };

const VERT = /* glsl */ `
  attribute vec3 color;
  uniform float uSize;
  uniform float uPixelRatio;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (10.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.18, d);
    gl_FragColor = vec4(vColor, a);
  }
`;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class EscenaMorph {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  private grupo = new THREE.Group();
  private geo = new THREE.BufferGeometry();
  private material: THREE.ShaderMaterial;
  private muestras: Muestra[] = [];
  private n: number;
  private aleatorio: Float32Array; // dirección de la explosión por partícula
  private desvio: Float32Array; // empujón del mouse, que se va soltando
  private progreso = 0;
  private puntero = { x: 0, y: 0, mundoX: 1e4, mundoY: 1e4, activo: false };
  private giro = { x: 0, y: 0 };
  private visible = true;
  private reloj = new THREE.Clock();
  /** Entrada: de 0 (galaxia dispersa) a 1 (primera figura armada) */
  intro = 0;
  private galaxia: Float32Array;
  listo: Promise<void>;

  constructor(
    private canvas: HTMLCanvasElement,
    objetivos: Objetivo[],
  ) {
    const movil = matchMedia('(max-width: 767px)').matches;
    this.n = movil ? 11000 : 24000;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.camera.position.z = 10;
    this.scene.add(this.grupo);

    this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.n * 3), 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.n * 3), 3));
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { uSize: { value: movil ? 2.8 : 2.7 }, uPixelRatio: { value: this.renderer.getPixelRatio() } },
    });
    this.grupo.add(new THREE.Points(this.geo, this.material));
    this.grupo.add(this.estrellas());

    this.aleatorio = new Float32Array(this.n * 4);
    for (let i = 0; i < this.n; i++) {
      const v = new THREE.Vector3().randomDirection();
      this.aleatorio.set([v.x, v.y, v.z, Math.random() * Math.PI * 2], i * 4);
    }
    this.desvio = new Float32Array(this.n * 2);
    // Galaxia inicial: un disco inclinado desde donde se arma la primera figura
    this.galaxia = new Float32Array(this.n * 3);
    for (let i = 0; i < this.n; i++) {
      const r = 1.2 + Math.pow(Math.random(), 0.6) * 5;
      const a = Math.random() * Math.PI * 2 + r * 0.9;
      this.galaxia.set([Math.cos(a) * r, Math.sin(a) * r * 0.35 + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.5], i * 3);
    }

    this.listo = Promise.all(objetivos.map((o) => this.muestrear(o))).then((m) => {
      this.muestras = m;
    });

    this.redimensionar();
    addEventListener('resize', () => this.redimensionar());
    addEventListener('pointermove', (e) => {
      this.puntero.x = (e.clientX / innerWidth) * 2 - 1;
      this.puntero.y = -(e.clientY / innerHeight) * 2 + 1;
      this.puntero.activo = e.pointerType === 'mouse';
    });
    document.addEventListener('visibilitychange', () => (this.visible = !document.hidden));
    this.renderer.setAnimationLoop(() => this.cuadro());
  }

  setProgreso(s: number) {
    this.progreso = Math.max(0, Math.min(this.muestras.length - 1 || 0, s));
  }

  /** Polvo de fondo, lejos de la cámara, para dar profundidad. */
  private estrellas() {
    const g = new THREE.BufferGeometry();
    const n = 700;
    const p = new Float32Array(n * 3);
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p.set([(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 18, -6 - Math.random() * 14], i * 3);
      const b = 0.35 + Math.random() * 0.4;
      c.set([b * 0.66, b * 0.76, b], i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return new THREE.Points(g, this.material);
  }

  /** Convierte una imagen o un texto en N puntos con su color. */
  private async muestrear(o: Objetivo): Promise<Muestra> {
    const W = 260;
    let canvas: HTMLCanvasElement;
    if (o.tipo === 'imagen') {
      const img = new Image();
      img.src = o.src;
      await img.decode();
      const H = Math.round((W * img.naturalHeight) / img.naturalWidth);
      canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.getContext('2d')!.drawImage(img, 0, 0, W, H);
    } else {
      await document.fonts.load('400 120px "Instrument Serif"').catch(() => undefined);
      canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const fs = 120;
      ctx.font = `400 ${fs}px "Instrument Serif", Georgia, serif`;
      const ancho = Math.max(...o.lineas.map((l) => ctx.measureText(l).width));
      canvas.width = Math.ceil(ancho + 20);
      canvas.height = Math.ceil(fs * 0.95 * o.lineas.length + 30);
      ctx.font = `400 ${fs}px "Instrument Serif", Georgia, serif`;
      ctx.textBaseline = 'top';
      o.lineas.forEach((l, i) => {
        const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
        g.addColorStop(0, '#f3ecdf');
        g.addColorStop(1, '#a9c1ff');
        ctx.fillStyle = g;
        ctx.fillText(l, 10, 12 + i * fs * 0.95);
      });
    }
    const w = canvas.width;
    const h = canvas.height;
    const data = canvas.getContext('2d')!.getImageData(0, 0, w, h).data;
    const validos: number[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (data[i + 3] < 128) continue;
        // En capturas de pantalla, el blanco del fondo se aclara para que se vea la interfaz
        if (o.tipo === 'imagen' && o.ignorarClaros && data[i] + data[i + 1] + data[i + 2] > 735 && Math.random() < 0.9) continue;
        validos.push(i);
      }
    }
    const pos = new Float32Array(this.n * 3);
    const col = new Float32Array(this.n * 3);
    for (let k = 0; k < this.n; k++) {
      const i = validos[(Math.random() * validos.length) | 0] ?? 0;
      const px = (i / 4) % w;
      const py = Math.floor(i / 4 / w);
      // Un poco más de brillo: sobre el fondo oscuro los tonos de la camiseta se perdían
      const claro = o.tipo === 'imagen' && o.ignorarClaros && data[i] + data[i + 1] + data[i + 2] > 735;
      const k2 = claro ? 0.32 : 1;
      const r = Math.min(1, (data[i] / 255) * 1.18 + 0.05) * k2;
      const g = Math.min(1, (data[i + 1] / 255) * 1.18 + 0.05) * k2;
      const b = Math.min(1, (data[i + 2] / 255) * 1.18 + 0.07) * k2;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      pos[k * 3] = ((px + Math.random()) / h) - w / h / 2;
      pos[k * 3 + 1] = 0.5 - (py + Math.random()) / h;
      pos[k * 3 + 2] = (lum - 0.5) * 0.12 + (Math.random() - 0.5) * 0.02;
      col[k * 3] = r;
      col[k * 3 + 1] = g;
      col[k * 3 + 2] = b;
    }
    return {
      pos,
      col,
      aspecto: w / h,
      escritorio: { ...ENCUADRE_ESCRITORIO, ...o.escritorio },
      movil: { ...ENCUADRE_MOVIL, ...o.movil },
    };
  }

  private vista = { w: 1, h: 1, movil: false };

  private redimensionar() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const altoVisible = 2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    // Figura al lado del texto en pantallas anchas o en horizontal; arriba del texto en vertical
    const lateral = w >= 1024 || (w >= 640 && w / h >= 1.2);
    this.vista = { w: altoVisible * this.camera.aspect, h: altoVisible, movil: !lateral };
  }

  /** Centro y escala (en unidades del mundo) de una muestra según la pantalla. */
  private encuadre(m: Muestra) {
    const e = this.vista.movil ? m.movil : m.escritorio;
    // El encabezado ocupa ~76 px arriba: la figura nunca debe quedar debajo de él
    const hdr = 76 / Math.max(1, this.canvas.clientHeight);
    let y = e.y;
    if (!this.vista.movil && e.x !== 0) y -= hdr / 2;
    const fondo = e.fondoMax ?? 0.97;
    // arriba = 0.5 - y - a/2 ≥ hdr   ·   abajo = 0.5 - y + a/2 ≤ fondo
    const a = Math.max(0.05, Math.min(e.alto, 2 * (0.5 - y - hdr), 2 * (fondo - 0.5 + y)));
    const alto = Math.min(a * this.vista.h, (e.anchoMax * this.vista.w) / m.aspecto);
    return { x: e.x * this.vista.w, y: y * this.vista.h, alto };
  }

  /** Rectángulo (en px de pantalla) que ocupa la figura actual. Útil para pruebas de diseño. */
  cajaPantalla() {
    const m = this.muestras[Math.round(this.progreso)];
    if (!m) return null;
    const e = this.encuadre(m);
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const ancho = e.alto * m.aspecto;
    const aPx = (u: number) => (u / this.vista.w) * W;
    const cx = W / 2 + aPx(e.x);
    const cy = H / 2 - (e.y / this.vista.h) * H;
    const hh = (e.alto / this.vista.h) * H;
    return { left: cx - aPx(ancho) / 2, right: cx + aPx(ancho) / 2, top: cy - hh / 2, bottom: cy + hh / 2 };
  }

  private cuadro() {
    if (!this.visible || !this.muestras.length) return;
    const t = this.reloj.getElapsedTime();
    const s = this.progreso;
    const a = Math.floor(s);
    const b = Math.min(a + 1, this.muestras.length - 1);
    const f = s - a;
    const e = easeInOut(f);
    const explosion = Math.sin(Math.PI * f) * (this.vista.movil ? 0.9 : 1.4);
    const A = this.muestras[a];
    const B = this.muestras[b];
    const ea = this.encuadre(A);
    const eb = this.encuadre(B);
    const cx = ea.x + (eb.x - ea.x) * e;
    const cy = ea.y + (eb.y - ea.y) * e;

    // La nube gira un poco hacia el mouse; en táctil se mece sola
    const objX = this.puntero.activo ? this.puntero.y * 0.12 : Math.sin(t * 0.4) * 0.05;
    const objY = this.puntero.activo ? this.puntero.x * 0.3 : Math.sin(t * 0.3) * 0.18;
    this.giro.x += (objX - this.giro.x) * 0.05;
    this.giro.y += (objY - this.giro.y) * 0.05;
    this.grupo.rotation.set(this.giro.x, this.giro.y, 0);

    // Puntero en coordenadas del mundo (plano z = 0)
    const px = this.puntero.activo ? (this.puntero.x * this.vista.w) / 2 : 1e4;
    const py = this.puntero.activo ? (this.puntero.y * this.vista.h) / 2 : 1e4;
    const radio = 0.55;

    const pos = this.geo.attributes.position.array as Float32Array;
    const col = this.geo.attributes.color.array as Float32Array;
    for (let i = 0; i < this.n; i++) {
      const k = i * 3;
      const r = i * 4;
      let x = cx + A.pos[k] * ea.alto + (B.pos[k] * eb.alto - A.pos[k] * ea.alto) * e;
      let y = cy + A.pos[k + 1] * ea.alto + (B.pos[k + 1] * eb.alto - A.pos[k + 1] * ea.alto) * e;
      let z = A.pos[k + 2] + (B.pos[k + 2] - A.pos[k + 2]) * e;
      // Explosión a mitad de la transición y respiración leve en reposo
      x += this.aleatorio[r] * explosion;
      y += this.aleatorio[r + 1] * explosion;
      z += this.aleatorio[r + 2] * explosion * 1.5 + Math.sin(t * 1.3 + this.aleatorio[r + 3]) * 0.02;

      // Repulsión del mouse con regreso suave
      let dx = this.desvio[i * 2];
      let dy = this.desvio[i * 2 + 1];
      const vx = x - px;
      const vy = y - py;
      const d2 = vx * vx + vy * vy;
      if (d2 < radio * radio) {
        const d = Math.sqrt(d2) || 1e-3;
        const fza = (1 - d / radio) * 0.06;
        dx += (vx / d) * fza;
        dy += (vy / d) * fza;
      }
      dx *= 0.92;
      dy *= 0.92;
      this.desvio[i * 2] = dx;
      this.desvio[i * 2 + 1] = dy;

      if (this.intro < 1) {
        // Entrada: cada partícula viaja desde la galaxia, con un pequeño retraso propio
        const d = Math.min(1, Math.max(0, this.intro * 1.5 - (this.aleatorio[r + 3] / (Math.PI * 2)) * 0.5));
        const q = easeInOut(d);
        x = this.galaxia[k] + (x - this.galaxia[k]) * q;
        y = this.galaxia[k + 1] + (y - this.galaxia[k + 1]) * q;
        z = this.galaxia[k + 2] + (z - this.galaxia[k + 2]) * q;
      }
      pos[k] = x + dx * 4;
      pos[k + 1] = y + dy * 4;
      pos[k + 2] = z;
      col[k] = A.col[k] + (B.col[k] - A.col[k]) * e;
      col[k + 1] = A.col[k + 1] + (B.col[k + 1] - A.col[k + 1]) * e;
      col[k + 2] = A.col[k + 2] + (B.col[k + 2] - A.col[k + 2]) * e;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
}
