/**
 * Imagen hecha de partículas sobre un <canvas>.
 *
 * Cada píxel visible (cada `paso` px) se convierte en una partícula con su color.
 * `progreso` va de 0 (partículas dispersas, invisibles) a 1 (imagen armada):
 * al subir se ensamblan y al bajar se disuelven como polvo hacia arriba.
 * Con el mouse encima, las partículas cercanas se apartan y vuelven a su sitio.
 */

type Opciones = {
  /** Distancia entre partículas, en px de pantalla */
  paso?: number;
  /** Zona desde donde salen las partículas (por ejemplo, el editor de código). Si no hay, salen dispersas alrededor */
  origen?: HTMLElement | null;
  /** Se llama cuando la imagen termina de armarse o deja de estarlo */
  onCompleto?: (completo: boolean) => void;
};

const RETRASO_MAX = 0.45;

export class ImagenParticulas {
  private ctx: CanvasRenderingContext2D;
  private buffer: ImageData | null = null;
  // Por partícula: casaX, casaY, inicioX, inicioY, retraso, r, g, b, desvioX, desvioY
  private datos = new Float32Array(0);
  private total = 0;
  private progreso = 0;
  private lado = 2;
  private mouse = { x: -1e4, y: -1e4, activo: false };
  private animando = false;
  private completo = false;
  private listo: Promise<void>;

  constructor(
    private canvas: HTMLCanvasElement,
    private img: HTMLImageElement,
    private opciones: Opciones = {},
  ) {
    this.ctx = canvas.getContext('2d', { willReadFrequently: false })!;
    this.listo = (img.complete && img.naturalWidth ? Promise.resolve() : img.decode().catch(() => undefined)).then(() => this.muestrear());

    let ancho = 0;
    new ResizeObserver(() => {
      // Solo rehacer si cambió el ancho (en móviles la barra del navegador cambia el alto)
      if (Math.abs(canvas.clientWidth - ancho) < 2) return;
      ancho = canvas.clientWidth;
      this.listo = this.listo
        .then(() => this.muestrear())
        .then(() => {
          this.dibujar();
        });
    }).observe(canvas);

    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const zona = canvas.parentElement ?? canvas;
      zona.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - r.left;
        this.mouse.y = e.clientY - r.top;
        this.mouse.activo = true;
        this.animar();
      });
      zona.addEventListener('pointerleave', () => {
        this.mouse.activo = false;
        this.mouse.x = this.mouse.y = -1e4;
        this.animar();
      });
    }
  }

  /** Lee la imagen y crea las partículas en la posición que ocupa la foto dentro del canvas. */
  private muestrear() {
    const cw = this.canvas.clientWidth;
    const ch = this.canvas.clientHeight;
    if (!cw || !ch || !this.img.naturalWidth) return;
    this.canvas.width = Math.round(cw);
    this.canvas.height = Math.round(ch);
    this.buffer = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    const rc = this.canvas.getBoundingClientRect();
    const ri = this.img.getBoundingClientRect();
    const ox = ri.left - rc.left;
    const oy = ri.top - rc.top;
    const iw = Math.max(1, Math.round(ri.width));
    const ih = Math.max(1, Math.round(ri.height));

    const tmp = document.createElement('canvas');
    tmp.width = iw;
    tmp.height = ih;
    const tctx = tmp.getContext('2d')!;
    tctx.drawImage(this.img, 0, 0, iw, ih);
    const px = tctx.getImageData(0, 0, iw, ih).data;

    // Más partículas en pantallas grandes, sin pasar de ~9000 para que vaya fluido en móviles
    let paso = this.opciones.paso ?? 3;
    while ((iw / paso) * (ih / paso) > 9000) paso += 1;
    this.lado = Math.max(2, Math.round(paso * 0.85));

    const origen = this.opciones.origen?.getBoundingClientRect();
    const lista: number[] = [];
    for (let y = 0; y < ih; y += paso) {
      for (let x = 0; x < iw; x += paso) {
        const i = (y * iw + x) * 4;
        if (px[i + 3] < 140) continue;
        const hx = ox + x;
        const hy = oy + y;
        let sx: number;
        let sy: number;
        if (origen) {
          // Salen del editor de código
          sx = origen.left - rc.left + Math.random() * origen.width;
          sy = origen.top - rc.top + Math.random() * origen.height;
        } else {
          // Dispersas alrededor y un poco más arriba, como polvo
          const ang = Math.random() * Math.PI * 2;
          const dist = (0.25 + Math.random() * 0.75) * Math.max(cw, ch) * 0.55;
          sx = hx + Math.cos(ang) * dist;
          sy = hy + Math.sin(ang) * dist - ch * 0.18;
        }
        // Se arman de abajo hacia arriba con algo de azar
        const retraso = (1 - y / ih) * 0.25 + Math.random() * (RETRASO_MAX - 0.25);
        lista.push(hx, hy, sx, sy, retraso, px[i], px[i + 1], px[i + 2], 0, 0);
      }
    }
    this.datos = new Float32Array(lista);
    this.total = lista.length / 10;
  }

  /** Cambia el avance (0 a 1) y vuelve a dibujar. */
  set(progreso: number) {
    const p = Math.min(1, Math.max(0, progreso));
    if (p === this.progreso && this.buffer) return;
    this.progreso = p;
    this.listo.then(() => this.dibujar());
  }

  private animar() {
    if (this.animando) return;
    this.animando = true;
    const paso = () => {
      const sigue = this.dibujar();
      if (sigue) requestAnimationFrame(paso);
      else this.animando = false;
    };
    requestAnimationFrame(paso);
  }

  /** Dibuja un cuadro. Devuelve true si todavía hay partículas moviéndose por el mouse. */
  private dibujar(): boolean {
    const buf = this.buffer;
    if (!buf) return false;
    const d = buf.data;
    d.fill(0);
    const W = buf.width;
    const H = buf.height;
    const p = this.progreso;
    const s = this.lado;
    const { x: mx, y: my } = this.mouse;
    const radio = 70;
    let moviendo = false;

    for (let n = 0; n < this.total; n++) {
      const k = n * 10;
      const ret = this.datos[k + 4];
      const t = Math.min(1, Math.max(0, (p - ret) / (1 - RETRASO_MAX)));
      if (t <= 0) continue;
      const e = 1 - Math.pow(1 - t, 3);
      let x = this.datos[k + 2] + (this.datos[k] - this.datos[k + 2]) * e;
      let y = this.datos[k + 3] + (this.datos[k + 1] - this.datos[k + 3]) * e;

      // Repulsión del mouse, con regreso suave
      let dx = this.datos[k + 8];
      let dy = this.datos[k + 9];
      if (this.mouse.activo) {
        const vx = x - mx;
        const vy = y - my;
        const dist2 = vx * vx + vy * vy;
        if (dist2 < radio * radio) {
          const f = (1 - Math.sqrt(dist2) / radio) * 14;
          const inv = 1 / (Math.sqrt(dist2) || 1);
          dx += vx * inv * f;
          dy += vy * inv * f;
        }
      }
      dx *= 0.86;
      dy *= 0.86;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) moviendo = true;
      else dx = dy = 0;
      this.datos[k + 8] = dx;
      this.datos[k + 9] = dy;
      x += dx;
      y += dy;

      const a = Math.round(255 * Math.min(1, t * 1.6));
      const r = this.datos[k + 5];
      const g = this.datos[k + 6];
      const b = this.datos[k + 7];
      const x0 = x | 0;
      const y0 = y | 0;
      for (let yy = y0; yy < y0 + s; yy++) {
        if (yy < 0 || yy >= H) continue;
        let i = (yy * W + x0) * 4;
        for (let xx = x0; xx < x0 + s; xx++, i += 4) {
          if (xx < 0 || xx >= W) continue;
          d[i] = r;
          d[i + 1] = g;
          d[i + 2] = b;
          d[i + 3] = a;
        }
      }
    }
    this.ctx.putImageData(buf, 0, 0);

    // Con la imagen armada y sin mouse encima se muestra la foto nítida
    const completo = p >= 0.999 && !moviendo && !this.mouse.activo;
    if (completo !== this.completo) {
      this.completo = completo;
      this.opciones.onCompleto?.(completo);
    }
    return moviendo || this.mouse.activo;
  }
}
