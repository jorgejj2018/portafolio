# Portafolio · Jorge Quintero

Portafolio web en formato *entrevista*: cada capítulo empieza con la pregunta que haría quien quiere trabajar
conmigo ("What has he shipped?") y una sola nube de partículas 3D responde transformándose en mi foto real, mis
avatares, el código, Mercatto y al final mi nombre. La versión anterior sigue publicada en `/old/`.

Para buscadores y asistentes de IA el sitio publica el mismo contenido en formato legible por máquinas:
JSON-LD (schema.org `Person`) dentro de la página, `/profile.json` y `/llms.txt`, todo generado desde `src/data/perfil.ts`.

Hecho con **Astro**, **React**, **TypeScript**, **Three.js**, **GSAP** (ScrollTrigger y SplitText), **Motion** y **Tailwind CSS**.

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:4321/portafolio/
npm run build     # genera dist/
npm run preview
```

Requiere Node 22.12 o superior.

## Estructura

```text
src/
├── components/
│   ├── layout/      Header, medidor de profundidad
│   ├── sections/    Hero, About, Stack, Projects, Timeline, Contact
│   ├── ui/          AvatarPose, SectionHeading
│   ├── react/       ProjectExplorer, Counter, MobileMenu (Motion)
│   └── three/       World: el pozo 3D del fondo
├── data/perfil.ts   todo el contenido (textos, proyectos, enlaces)
├── lib/             animaciones de scroll con GSAP, rutas base
├── types/           tipos compartidos
├── layouts/         Base.astro
└── pages/index.astro
public/avatar/       poses del avatar sin fondo
```

`npm run check` valida los tipos de TypeScript y Astro; `npm run build` lo ejecuta antes de construir.

Para agregar una sección al recorrido, crea un componente en `sections/` con `data-station` y súmalo a `niveles` en `perfil.ts`.

## Despliegue

El flujo `.github/workflows/deploy.yml` construye el sitio en cada push a `main` y lo publica en la rama
`gh-pages`, que es la que ya sirve https://jorgejj2018.github.io/portafolio/.

Si lo publicas en otro lugar (Netlify, Vercel o un dominio propio) define `BASE_PATH=/` y `SITE=https://tu-dominio`
al construir.
