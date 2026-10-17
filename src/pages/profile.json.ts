import { perfilMaquina } from '../data/perfil';

/** /profile.json: el mismo contenido del sitio en JSON, para herramientas automáticas. */
export const GET = () => new Response(JSON.stringify(perfilMaquina(), null, 2), { headers: { 'Content-Type': 'application/json' } });
