export type Enlaces = {
  github: string;
  linkedin: string;
  x: string;
  email: string;
  upwork: string;
};

export type Perfil = {
  nombre: string;
  rol: string;
  ubicacion: string;
  lema: string;
  resumen: string;
  disponible: boolean;
  enlaces: Enlaces;
};

export type Dato = { valor: number; sufijo?: string; etiqueta: string };

export type GrupoStack = { grupo: string; items: string[] };

export type Proyecto = {
  nombre: string;
  anio: number;
  descripcion: string;
  tags: string[];
  repo: string;
  demo?: string;
  destacado?: boolean;
  /** Repo privado: en vez de enlazar el código se pide acceso por correo */
  privado?: boolean;
};

export type Especializacion = {
  tecnologia: string;
  sigla: string;
  titulo: string;
  texto: string;
  temas: string[];
  repo: string;
  privado?: boolean;
};

export type Hito ={ anio: string; titulo: string; texto: string };

export type Nivel = { id: string; nombre: string };

/** Poses del avatar disponibles en public/avatar */
export type Pose =
  | 'hero'
  | 'perfil-tres-cuartos'
  | 'perfil-lado'
  | 'busto-sonrisa'
  | 'busto-frente'
  | 'busto-mirando-arriba';
