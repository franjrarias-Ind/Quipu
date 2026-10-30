/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClaustroCategoria =
  | 'docente'
  | 'estudiante'
  | 'tae'
  | 'graduado'
  | 'orquesta';

export type Postura = 'Quipu' | 'No sabe' | 'Copla';

export interface Votante {
  id: string; // e.g. "doc-1", "fobam-12", "orq-4"
  nro: number;
  categoria: ClaustroCategoria;
  subclaustro?: string; // 'Pregrado', 'Grado', 'PADRÓN FOBAM', etc.
  nombre: string;
  dni: string;
  nroEmpl?: string;
  postura: Postura;
  yaVoto: boolean;
  horaVoto?: string; // e.g. "11:24"
}

export interface ClaustroEstadistica {
  categoria: ClaustroCategoria;
  nombre: string;
  pesoPonderacion: number; // e.g. 0.35, 0.15, etc.
  totalPadron: number;
  totalVotaron: number;
  porcentajeParticipacion: number;
  votosNuestraLista: number;
  votosLaCopla: number;
  porcentajeNuestraLista: number;
  porcentajeLaCopla: number;
}

export interface ResumenPonderado {
  porcentajeGeneralNuestra: number;
  porcentajeGeneralLaCopla: number;
  totalElectores: number;
  totalVotaron: number;
  participacionGlobal: number;
  votosGlobalesNuestra: number;
  votosGlobalesLaCopla: number;
  porcentajeGlobalDirectoNuestra: number;
  porcentajeGlobalDirectoLaCopla: number;
  porClaustro: Record<ClaustroCategoria, ClaustroEstadistica>;
}
