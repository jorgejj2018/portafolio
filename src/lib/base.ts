/** Ruta base del sitio (por ejemplo "/portafolio/") siempre terminada en "/". */
export const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

export const asset = (path: string) => `${BASE}${path.replace(/^\//, '')}`;
