export type Postura = 'A favor' | 'Inclinado/a' | 'Indeciso/a' | 'Otra opción' | 'Sin contactar';

export type ProbabilidadVoto = 'Alta' | 'Media' | 'Baja';

export type BocaUrnaOpcion = 'Nuestra Lista' | 'Otra Lista' | 'Blanco' | 'No contesta' | 'No encuestado';

export interface Docente {
  id: number;
  nroEmpl?: string;
  nombre: string;
  dni?: string;
  responsable: string;
  postura: Postura;
  probabilidadVotar: ProbabilidadVoto;
  yaVoto: boolean;
  horaVoto?: string; // e.g. "10:45"
  bocaDeUrna?: BocaUrnaOpcion;
  ultimoContacto?: string; // YYYY-MM-DD
  notas?: string;
  avisoMovilizacion?: 'Pendiente' | 'Llamado' | 'En camino' | 'Votó' | 'No asistirá';
  departamento?: string;
  telefono?: string;
  votoPadronOriginal?: boolean;
}

export interface MiembroEquipo {
  id: string;
  nombre: string;
  rol?: string;
  telefono?: string;
  color?: string;
}

export interface BocaUrnaConteoRapido {
  nuestraLista: number;
  otraLista: number;
  enBlanco: number;
  anulado: number;
  noSabeNoContesta: number;
}

export interface RegistroHorario {
  hora: string; // "08:00", "09:00", etc.
  votosAcumulados: number;
  votosHora: number;
}

export interface ParametrosTendencia {
  porcentajeInclinados: number; // Por defecto 75%
  porcentajeIndecisosAFavor: number; // Por defecto 30%
  porcentajeSinContactarAFavor: number; // Por defecto 20%
  metaVotosVictoria: number; // Por defecto calculada
}
