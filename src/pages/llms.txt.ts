import { perfilMaquina } from '../data/perfil';

/** /llms.txt: resumen en texto plano para asistentes de IA que revisan el sitio. */
export const GET = () => {
  const p = perfilMaquina();
  const lineas = [
    `# ${p.name}`,
    '',
    `> ${p.role} based in ${p.location}. ${p.summary}`,
    '',
    '## About',
    ...p.about.map((a) => `- ${a}`),
    '',
    '## Highlights',
    ...Object.entries(p.highlights).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Skills',
    ...Object.entries(p.skills).map(([k, v]) => `- ${k}: ${v.join(', ')}`),
    '',
    '## Projects',
    ...p.projects.map((x) => `- ${x.name} (${x.year}): ${x.description}${x.live ? ` Live: ${x.live}` : ''}`),
    '',
    '## Experience',
    ...p.experience.map((x) => `- ${x.year} · ${x.title}: ${x.description}`),
    '',
    '## Contact',
    `- Email: ${p.contact.email}`,
    `- LinkedIn: ${p.contact.linkedin}`,
    `- GitHub: ${p.contact.github}`,
    `- Upwork: ${p.contact.upwork}`,
    `- X: ${p.contact.x}`,
    '',
  ];
  return new Response(lineas.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
