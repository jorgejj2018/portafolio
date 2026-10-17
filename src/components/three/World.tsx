import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Mundo de fondo: un pozo vertical por el que la cámara desciende al hacer scroll.
// Cada sección de la página es un nivel marcado por un anillo.

const COLORS = {
  shirt: new THREE.Color('#1e2129'),
  raised: new THREE.Color('#2e3442'),
  cream: new THREE.Color('#f3ecdf'),
  blue: new THREE.Color('#4f7cff'),
  ice: new THREE.Color('#a9c1ff'),
};

const LEVEL = 16; // distancia vertical entre niveles

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export default function World() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(COLORS.shirt);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(COLORS.shirt, 18, 62);
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(COLORS.ice, 2.2);
    key.position.set(-8, 10, 6);
    scene.add(key);
    const warm = new THREE.DirectionalLight(COLORS.cream, 0.9);
    warm.position.set(10, -4, 8);
    scene.add(warm);

    const rand = rng(11);
    const levels = document.querySelectorAll('[data-station]').length || 6;
    const depth = (levels - 1) * LEVEL;

    // Anillos de nivel: un anillo azul, un círculo punteado crema y marcas como de instrumento
    const ringMat = new THREE.MeshBasicMaterial({ color: COLORS.blue, transparent: true, opacity: 0.55 });
    const tickMat = new THREE.LineBasicMaterial({ color: COLORS.cream, transparent: true, opacity: 0.35 });
    const dashMat = new THREE.LineDashedMaterial({ color: COLORS.cream, dashSize: 0.25, gapSize: 0.45, transparent: true, opacity: 0.3 });
    for (let i = 0; i < levels; i++) {
      const g = new THREE.Group();
      g.position.set(0, -i * LEVEL - 6, -6);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(11, 0.035, 6, 160), ringMat);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);

      const circle = new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 181 }, (_, k) => {
          const a = (k / 180) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * 12.6, 0, Math.sin(a) * 12.6);
        }),
      );
      const dashed = new THREE.Line(circle, dashMat);
      dashed.computeLineDistances();
      g.add(dashed);

      const ticks: THREE.Vector3[] = [];
      for (let k = 0; k < 72; k++) {
        const a = (k / 72) * Math.PI * 2;
        const len = k % 6 === 0 ? 0.9 : 0.35;
        ticks.push(new THREE.Vector3(Math.cos(a) * 11.4, 0, Math.sin(a) * 11.4));
        ticks.push(new THREE.Vector3(Math.cos(a) * (11.4 + len), 0, Math.sin(a) * (11.4 + len)));
      }
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), tickMat));
      scene.add(g);
    }

    // Columna guía vertical
    const guide = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 10, -6), new THREE.Vector3(0, -depth - 30, -6)]);
    const guideLine = new THREE.Line(
      guide,
      new THREE.LineDashedMaterial({ color: COLORS.blue, dashSize: 0.6, gapSize: 0.6, transparent: true, opacity: 0.35 }),
    );
    guideLine.computeLineDistances();
    scene.add(guideLine);

    // Fragmentos geométricos a los lados del pozo
    const shardMat = new THREE.MeshStandardMaterial({ color: COLORS.raised, flatShading: true, roughness: 0.55, metalness: 0.15 });
    const edgeMat = new THREE.LineBasicMaterial({ color: COLORS.ice, transparent: true, opacity: 0.25 });
    const shards: { obj: THREE.Object3D; speed: number }[] = [];
    const shapes = [
      new THREE.OctahedronGeometry(1, 0),
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0),
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
    ];
    for (let k = 0; k < (mobile ? 14 : 26); k++) {
      const geo = shapes[k % shapes.length];
      const m = new THREE.Mesh(geo, shardMat);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
      const side = k % 2 ? 1 : -1;
      m.position.set(side * (13 + rand() * 9), 6 - rand() * (depth + 20), -14 + rand() * 12);
      m.scale.setScalar(0.6 + rand() * 1.6);
      m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      scene.add(m);
      shards.push({ obj: m, speed: 0.05 + rand() * 0.12 });
    }

    // Polvo que sube, para sentir el descenso
    const count = mobile ? 600 : 1400;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const top = 12;
    const span = depth + 40;
    for (let k = 0; k < count; k++) {
      pos[k * 3] = (rand() - 0.5) * 60;
      pos[k * 3 + 1] = top - rand() * span;
      pos[k * 3 + 2] = -24 + rand() * 30;
      const c = rand() > 0.3 ? COLORS.cream : COLORS.ice;
      col.set([c.r, c.g, c.b], k * 3);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true }),
    );
    scene.add(dust);

    // Scroll → nivel actual (con pausa en cada sección para leer tranquilo)
    let centers: number[] = [];
    const measure = () => {
      centers = Array.from(document.querySelectorAll<HTMLElement>('[data-station]')).map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + r.height / 2;
      });
    };
    measure();
    const progress = () => {
      if (centers.length < 2) return 0;
      const c = window.scrollY + window.innerHeight / 2;
      if (c <= centers[0]) return 0;
      for (let i = 0; i < centers.length - 1; i++) {
        if (c < centers[i + 1]) {
          const f = (c - centers[i]) / (centers[i + 1] - centers[i]);
          return i + smoothstep(0.15, 0.85, f);
        }
      }
      return centers.length - 1;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      measure();
    };
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    let t = progress();
    let raf = 0;
    let running = true;
    const timer = new THREE.Timer();
    const look = new THREE.Vector3();

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      const target = progress();
      t = reduceMotion ? target : t + (target - t) * Math.min(1, dt * 3);

      const narrow = window.innerWidth < 768;
      const y = -t * LEVEL;
      camera.position.set(narrow ? 0 : 4, y + 1, narrow ? 30 : 24);
      look.set(narrow ? 0 : 4, y - 5, -6);
      camera.lookAt(look);

      if (!reduceMotion) {
        shards.forEach(({ obj, speed }) => {
          obj.rotation.y += speed * dt;
          obj.rotation.x += speed * 0.5 * dt;
        });
        const p = dustGeo.attributes.position as THREE.BufferAttribute;
        for (let k = 0; k < count; k++) {
          let yy = p.getY(k) + dt * 0.35;
          if (yy > top) yy -= span;
          p.setY(k, yy);
        }
        p.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    tick();

    const onVisibility = () => {
      running = !document.hidden;
      if (running) {
        timer.update();
        tick();
      } else cancelAnimationFrame(raf);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 -z-10" aria-hidden="true" />;
}
