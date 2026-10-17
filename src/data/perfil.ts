// Todo el contenido del portafolio vive aquí. Edita este archivo para actualizar textos,
// proyectos o enlaces sin tocar los componentes. El sitio está en inglés.

import type { Especializacion, GrupoStack, Hito, Nivel, Perfil, Proyecto, Dato } from '../types';

export const perfil: Perfil = {
  nombre: 'Jorge Quintero',
  rol: 'Forward Deployed Engineer · Fintech',
  ubicacion: 'Medellín, Colombia',
  lema: 'I turn your idea into software that drives your business.',
  resumen: 'Software, APIs and integrations that scale: React, Next.js, Spring Boot, GCP and AI agents.',
  disponible: true,
  enlaces: {
    github: 'https://github.com/jorgejj2018',
    linkedin: 'https://www.linkedin.com/in/jorgeadj/',
    x: 'https://twitter.com/jorge_adj',
    email: 'alejandrojj2018@gmail.com',
    upwork: 'https://www.upwork.com/freelancers/~01576f660e4b4b0efd',
  },
};

/** Por qué algunos repos son privados; se muestra junto al botón de pedir acceso. */
export const motivoPrivado =
  'Some repositories are private because they hold code for real businesses in production and my own commercial products. Email me and I will gladly give you access.';

/** Enlace de correo para pedir acceso a un repo privado. */
export const pedirAcceso = (proyecto: string) =>
  `mailto:${perfil.enlaces.email}?subject=${encodeURIComponent(`Access request: ${proyecto} repository`)}&body=${encodeURIComponent(`Hi Jorge, I saw ${proyecto} on your portfolio and would like access to the repository. My GitHub username is: `)}`;

/** Roles que rotan en la portada con efecto de texto que se "decodifica". */
export const roles = [
  'Forward Deployed Engineer',
  'Full Stack Developer',
  'APIs & Integrations',
  'Fintech Software Engineer',
  'AI Agents Builder',
];

/** Palabras de las cintas en movimiento. */
export const cintas = {
  tecnologias: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Spring Boot', 'Java', 'GCP', 'Vertex AI', 'Astro', 'Tailwind CSS', 'Firebase', 'REST APIs'],
  ideas: ['Ideas into software', 'APIs that scale', 'Integrations', 'Fintech', 'AI agents', 'Clean code', 'Shipped to production'],
};

/**
 * La historia del sitio es la construcción de un software: entre sección y sección
 * aparece el comando de cada paso y su salida, que se despliega con el scroll.
 */
export const pasosBuild = {
  about: { paso: 'init', comando: 'git init jorge-quintero', salida: ['Initialized repository: writing code since 2019', 'Author: Jorge Quintero <Medellín, Colombia>'] },
  stack: { paso: 'install', comando: 'npm install react next spring-boot gcp ai-agents', salida: ['added 24 packages in 7 years', '0 vulnerabilities, ready to build'] },
  specializations: { paso: 'learn', comando: 'npm run learn -- --deep', salida: ['typescript   ✓ type-safe by default', 'next.js      ✓ full stack react', 'node.js      ✓ apis that hold up'] },
  projects: { paso: 'build', comando: 'npm run build', salida: ['✓ Mercatto SaaS     live in production', '✓ VentasTell        ✓ Voix de la Beauté   ✓ Geek Platform'] },
  journey: { paso: 'log', comando: 'git log --oneline', salida: ['2026  Forward Deployed Engineer', '2025  Software Developer · 2021 Junior · 2019 first commit'] },
  contact: { paso: 'deploy', comando: 'npm run deploy -- --prod', salida: ['Uploading… 100%', '✓ Build complete. Deployed to production.'] },
} as const;

export const sobreMi = {
  parrafos: [
    'I am a developer with 7+ years of experience building web applications with React, Next.js and JavaScript. Today I work as a Forward Deployed Engineer in fintech: close to the business, turning real needs into software, APIs and integrations that scale.',
    'I enjoy the whole path from idea to product: interfaces and reusable components, API integrations, and backend work with Java and Spring Boot. I have worked in Agile teams alongside backend developers, QA engineers, product teams and business stakeholders, which made me a better teammate and communicator, not just a better coder.',
    'I chose software because it lets me turn ideas into something real while I keep discovering what I am capable of. I love learning, sharing knowledge and taking on challenges that help me build reliable, valuable products, like Mercatto SaaS, my own sales platform for supermarkets and fruit & vegetable stores.',
  ],
  datos: [
    { valor: 7, sufijo: '+', etiqueta: 'years building for the web' },
    { valor: 40, sufijo: '+', etiqueta: 'repositories on GitHub' },
    { valor: 12, etiqueta: 'licenses & certifications' },
  ] satisfies Dato[],
};

export const stack: GrupoStack[] = [
  {
    grupo: 'Frontend',
    items: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Astro', 'Redux', 'Tailwind CSS', 'styled-components', 'Material UI'],
  },
  {
    grupo: 'Backend & data',
    items: ['Node.js', 'Express', 'Java', 'Spring Boot', 'REST APIs', 'Relational databases', 'Firebase', 'Cloud Functions'],
  },
  {
    grupo: 'Cloud, AI & tooling',
    items: ['Google Cloud (GCP)', 'Vertex AI', 'AI agents', 'Git & GitHub', 'Vite', 'Postman', 'node:test', 'Netlify'],
  },
];

/** Repos con nombre de tecnología: se presentan como líneas de especialización. */
export const especializaciones: Especializacion[] = [
  {
    tecnologia: 'TypeScript',
    sigla: 'TS',
    titulo: 'Type-safe by default',
    texto: 'Strict typing across front and back end: shared models, typed APIs and fewer surprises in production.',
    temas: ['Generics', 'Type narrowing', 'Typed APIs', 'tsconfig'],
    repo: 'https://github.com/jorgejj2018/TypeScript',
    privado: true,
  },
  {
    tecnologia: 'Next.js',
    sigla: 'NX',
    titulo: 'Full stack React',
    texto: 'Server rendering, file-based routing and API routes to ship fast, SEO-friendly React apps.',
    temas: ['App Router', 'SSR & SSG', 'API routes', 'Deploys'],
    repo: 'https://github.com/jorgejj2018/NextJs',
    privado: true,
  },
  {
    tecnologia: 'Node.js',
    sigla: 'JS',
    titulo: 'APIs that hold up',
    texto: 'REST services with Express: auth, validation, centralized error handling and automated tests.',
    temas: ['Express', 'REST', 'Auth & roles', 'node:test'],
    repo: 'https://github.com/jorgejj2018/nodeJs-',
    privado: true,
  },
];

export const proyectos: Proyecto[] = [
  {
    nombre: 'Mercatto SaaS',
    anio: 2026,
    descripcion:
      'Point-of-sale and sales management SaaS for supermarkets and fruit & vegetable stores. Each business registers its own company, employees sign in with Google or Apple, and new staff wait for admin approval.',
    tags: ['React', 'Vite', 'SaaS', 'Multi-tenant', 'Google & Apple sign-in'],
    repo: 'https://github.com/jorgejj2018/Mercatto',
    privado: true,
    demo: 'https://mercattosas.netlify.app/login',
    destacado: true,
  },
  {
    nombre: 'Voix de la Beauté',
    anio: 2026,
    descripcion:
      'Beauty editorial platform with an admin panel, user roles and its own REST API on Firebase Functions written in TypeScript.',
    tags: ['React', 'Vite', 'Tailwind CSS', 'Firebase', 'TypeScript'],
    repo: 'https://github.com/jorgejj2018/Voix-de-la-Beaut',
  },
  {
    nombre: 'VentasTell',
    anio: 2025,
    descripcion: 'Sales software for a store that sells mobile phones and technology: products, customers and every sale in one place.',
    tags: ['React', 'JavaScript', 'Sales'],
    repo: 'https://github.com/jorgejj2018/ventasTell',
    privado: true,
  },
  {
    nombre: 'Geek Platform',
    anio: 2021,
    descripcion: 'Learning platform built as a team during the Academia Geek bootcamp, working in sprints with React, Redux and Firebase.',
    tags: ['React', 'Redux', 'Firebase', 'Teamwork'],
    repo: 'https://github.com/ivanandresdiaz/geekPlatformDev',
  },
];

export const trayectoria: Hito[] = [
  {
    anio: '2019',
    titulo: 'Web developer intern · Cesde',
    texto: 'First professional role: front and back end pages with HTML5, CSS3, JavaScript, PHP, MySQL and Bootstrap.',
  },
  {
    anio: '2020',
    titulo: 'Software Valley talent award',
    texto: "Recognized by the Medellín mayor's office for my training on Coursera within the city's Software Valley program.",
  },
  {
    anio: '2021',
    titulo: 'Academia Geek · Junior Software Developer',
    texto: 'Front-end bootcamp with React and Design Thinking, then my first developer job, where I grew for four years.',
  },
  {
    anio: '2025',
    titulo: 'Software Developer · Mente',
    texto: 'Building and integrating products in fintech, plus Google certifications in Vertex AI Studio.',
  },
  {
    anio: '2026',
    titulo: 'Forward Deployed Engineer · Mercatto SaaS',
    texto: 'Software, APIs and integrations that scale for the business, and my own SaaS live in production.',
  },
];

export const niveles: Nivel[] = [
  { id: 'home', nombre: 'Home' },
  { id: 'about', nombre: 'About' },
  { id: 'stack', nombre: 'Stack' },
  { id: 'specializations', nombre: 'Specializations' },
  { id: 'projects', nombre: 'Projects' },
  { id: 'journey', nombre: 'Journey' },
  { id: 'contact', nombre: 'Contact' },
];
