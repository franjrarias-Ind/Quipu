import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, set, onValue } from "https://gstatic.com";

const firebaseConfig = {
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ClaustroCategoria,
  Postura,
  Votante,
  ResumenPonderado,
  ClaustroEstadistica
} from '../types/election';
import {
  PADRON_DOCENTES,
  PADRON_DOCENTES_FOBAM,
  PADRON_ESTUDIANTES,
  PADRON_TAE,
  PADRON_GRADUADOS,
  PADRON_ORQUESTAS
} from '../data/padronesData';

interface ElectionContextType {
  votantes: Votante[];
  resumen: ResumenPonderado;
  categoriaActiva: ClaustroCategoria;
  setCategoriaActiva: (cat: ClaustroCategoria) => void;
  modoVistaTendencia: 'estatutaria' | 'directa';
  setModoVistaTendencia: (modo: 'estatutaria' | 'directa') => void;
  toggleVoto: (id: string) => void;
  cambiarPostura: (id: string, postura: Postura) => void;
  simularVotacion: () => void;
  reiniciarVotacion: () => void;
  reiniciarTodo: () => void;
}

const STORAGE_KEY = 'esmn_boca_urna_ponderada_v9';

export function normalizePostura(raw: any): Postura {
  if (typeof raw !== 'string') return 'Indecisos';
  const s = raw.trim().toLowerCase();
  if (s.includes('quipu') || s.includes('favor') || s === 'nuestra') return 'Quipu';
  if (s.includes('copla') || s.includes('contra')) return 'Copla';
  return 'Indecisos';
}

// Statutory weights (35% Docentes, 35% Estudiantes, 15% TAE, 15% Graduados)
const PESOS_ESTATUTARIOS: Record<ClaustroCategoria, number> = {
  docente: 0.35,
  docente_fobam: 0,
  estudiante: 0.35,
  tae: 0.15,
  graduado: 0.15,
  orquesta: 0,
};

const NOMBRES_CLAUSTRO: Record<ClaustroCategoria, string> = {
  docente: 'Docentes',
  docente_fobam: 'Docentes FoBaM',
  estudiante: 'Estudiantes',
  tae: 'Personal TAE',
  graduado: 'Graduados',
  orquesta: 'Orquestas',
};

function generateInitialVotantes(): Votante[] {
  const all: Votante[] = [];

  // Realistic seed distribution
  const getInitialPostura = (index: number, cat: ClaustroCategoria): Postura => {
    const mod = (index * 11 + (cat === 'docente' ? 3 : cat === 'docente_fobam' ? 7 : cat === 'tae' ? 1 : 5)) % 100;
    if (mod < 48) return 'Quipu';
    if (mod < 76) return 'Indecisos';
    return 'Copla';
  };

  // 1. Docentes (284)
  PADRON_DOCENTES.forEach((d, idx) => {
    all.push({
      id: `doc-${d.id}`,
      nro: d.id,
      categoria: 'docente',
      nombre: d.nombre,
      dni: d.dni,
      nroEmpl: d.nroEmpl,
      postura: getInitialPostura(idx, 'docente'),
      yaVoto: false,
    });
  });

  // 2. Docentes FoBaM (238)
  PADRON_DOCENTES_FOBAM.forEach((f, idx) => {
    all.push({
      id: `fobam-${f.id}`,
      nro: f.id,
      categoria: 'docente_fobam',
      subclaustro: f.subclaustro,
      nombre: f.nombre,
      dni: f.dni,
      postura: getInitialPostura(idx, 'docente_fobam'),
      yaVoto: false,
    });
  });

  // 3. Estudiantes (512)
  PADRON_ESTUDIANTES.forEach((e, idx) => {
    all.push({
      id: `est-${e.id}`,
      nro: e.id,
      categoria: 'estudiante',
      subclaustro: e.subclaustro,
      nombre: e.nombre,
      dni: e.dni,
      postura: getInitialPostura(idx, 'estudiante'),
      yaVoto: false,
    });
  });

  // 4. TAE (61)
  PADRON_TAE.forEach((t, idx) => {
    all.push({
      id: `tae-${t.id}`,
      nro: t.id,
      categoria: 'tae',
      nombre: t.nombre,
      dni: t.dni,
      nroEmpl: t.nroEmpl,
      postura: getInitialPostura(idx, 'tae'),
      yaVoto: false,
    });
  });

  // 5. Graduados (100)
  PADRON_GRADUADOS.forEach((g, idx) => {
    all.push({
      id: `grad-${g.id}`,
      nro: g.id,
      categoria: 'graduado',
      subclaustro: g.subclaustro,
      nombre: g.nombre,
      dni: g.dni,
      postura: getInitialPostura(idx, 'graduado'),
      yaVoto: false,
    });
  });

  // 6. Orquestas (26)
  PADRON_ORQUESTAS.forEach((o, idx) => {
    all.push({
      id: `orq-${o.id}`,
      nro: o.id,
      categoria: 'orquesta',
      subclaustro: o.subclaustro,
      nombre: o.nombre,
      dni: o.dni,
      postura: getInitialPostura(idx, 'orquesta'),
      yaVoto: false,
    });
  });

  return all;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categoriaActiva, setCategoriaActiva] = useState<ClaustroCategoria>('docente');
  const [modoVistaTendencia, setModoVistaTendencia] = useState<'estatutaria' | 'directa'>('estatutaria');

  const [votantes, setVotantes] = useState<Votante[]>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('esmn_boca_urna_ponderada_v8') ||
        localStorage.getItem('esmn_boca_urna_ponderada_v7');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 1000) {
          return parsed.map((v: any) => ({
            ...v,
            postura: normalizePostura(v.postura),
          }));
        }
      }
    } catch {
      // Fallback
    }
    return generateInitialVotantes();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(votantes));
    } catch {
      // ignore
    }
  }, [votantes]);

  const toggleVoto = (id: string) => {
    const now = new Date();
    const hora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setVotantes(prev =>
      prev.map(v => {
        if (v.id === id) {
          const nextState = !v.yaVoto;
          return {
            ...v,
            yaVoto: nextState,
            horaVoto: nextState ? hora : undefined,
          };
        }
        return v;
      })
    );
  };

  const cambiarPostura = (id: string, postura: Postura) => {
    setVotantes(prev =>
      prev.map(v => (v.id === id ? { ...v, postura } : v))
    );
  };

  const simularVotacion = () => {
    const horas = ['08:20', '09:15', '10:05', '11:20', '12:45', '14:15', '15:30', '16:45'];
    setVotantes(prev =>
      prev.map((v, i) => {
        let threshold = 0.52;
        if (v.categoria === 'docente') threshold = 0.68;
        else if (v.categoria === 'docente_fobam') threshold = 0.55;
        else if (v.categoria === 'tae') threshold = 0.78;
        else if (v.categoria === 'graduado') threshold = 0.50;
        else if (v.categoria === 'orquesta') threshold = 0.65;

        const willVote = ((i * 13 + 7) % 100) / 100 < threshold;
        const hora = horas[(i * 3) % horas.length];
        return {
          ...v,
          yaVoto: willVote,
          horaVoto: willVote ? (v.horaVoto || hora) : undefined,
        };
      })
    );
  };

  const reiniciarVotacion = () => {
    setVotantes(prev =>
      prev.map(v => ({
        ...v,
        yaVoto: false,
        horaVoto: undefined,
      }))
    );
  };

  const reiniciarTodo = () => {
    const fresh = generateInitialVotantes();
    setVotantes(fresh);
    localStorage.removeItem(STORAGE_KEY);
  };

  const resumen = useMemo<ResumenPonderado>(() => {
    const categorias: ClaustroCategoria[] = [
      'docente',
      'docente_fobam',
      'estudiante',
      'tae',
      'graduado',
      'orquesta'
    ];
    const porClaustro: Record<ClaustroCategoria, ClaustroEstadistica> = {} as any;

    let ponderacionNuestra = 0;
    let ponderacionLaCopla = 0;
    let pesoTotalEstatutario = 0;

    let totalElectores = 0;
    let totalVotaron = 0;
    let votosGlobalesNuestra = 0;
    let votosGlobalesLaCopla = 0;

    categorias.forEach(cat => {
      const list = votantes.filter(v => v.categoria === cat);
      const totalPadron = list.length;
      const votaronList = list.filter(v => v.yaVoto);
      const cantVotaron = votaronList.length;

      totalElectores += totalPadron;
      totalVotaron += cantVotaron;

      const partPct = totalPadron > 0 ? (cantVotaron / totalPadron) * 100 : 0;

      // Base voters for trend:
      // If people have voted, calculate based on voted; otherwise calculate baseline from all
      const poolParaTendencia = cantVotaron > 0 ? votaronList : list;

      let scoreNuestra = 0;
      let scoreLaCopla = 0;

      poolParaTendencia.forEach(v => {
        switch (v.postura) {
          case 'Quipu':
            scoreNuestra += 1.0;
            break;
          case 'Copla':
            scoreLaCopla += 1.0;
            break;
          case 'Indecisos':
          default:
            scoreNuestra += 0.50;
            scoreLaCopla += 0.50;
            break;
        }
      });

      const totalScore = scoreNuestra + scoreLaCopla;
      const pctNuestra = totalScore > 0 ? (scoreNuestra / totalScore) * 100 : 50;
      const pctLaCopla = totalScore > 0 ? (scoreLaCopla / totalScore) * 100 : 50;

      votosGlobalesNuestra += scoreNuestra;
      votosGlobalesLaCopla += scoreLaCopla;

      const peso = PESOS_ESTATUTARIOS[cat] || 0;

      porClaustro[cat] = {
        categoria: cat,
        nombre: NOMBRES_CLAUSTRO[cat],
        pesoPonderacion: peso,
        totalPadron,
        totalVotaron: cantVotaron,
        porcentajeParticipacion: Math.round(partPct * 10) / 10,
        votosNuestraLista: Math.round(scoreNuestra * 10) / 10,
        votosLaCopla: Math.round(scoreLaCopla * 10) / 10,
        porcentajeNuestraLista: Math.round(pctNuestra * 10) / 10,
        porcentajeLaCopla: Math.round(pctLaCopla * 10) / 10,
      };

      if (peso > 0) {
        ponderacionNuestra += peso * pctNuestra;
        ponderacionLaCopla += peso * pctLaCopla;
        pesoTotalEstatutario += peso;
      }
    });

    const factorEstatutario = pesoTotalEstatutario > 0 ? 1 / pesoTotalEstatutario : 1;
    const finalPctNuestra = Math.round(ponderacionNuestra * factorEstatutario * 10) / 10;
    const finalPctLaCopla = Math.round((100 - finalPctNuestra) * 10) / 10;

    const totalVotosDirectos = votosGlobalesNuestra + votosGlobalesLaCopla;
    const pctDirectoNuestra = totalVotosDirectos > 0
      ? Math.round((votosGlobalesNuestra / totalVotosDirectos) * 1000) / 10
      : 50;
    const pctDirectoLaCopla = Math.round((100 - pctDirectoNuestra) * 10) / 10;

    return {
      porcentajeGeneralNuestra: finalPctNuestra,
      porcentajeGeneralLaCopla: finalPctLaCopla,
      totalElectores,
      totalVotaron,
      participacionGlobal: totalElectores > 0 ? Math.round((totalVotaron / totalElectores) * 1000) / 10 : 0,
      votosGlobalesNuestra: Math.round(votosGlobalesNuestra * 10) / 10,
      votosGlobalesLaCopla: Math.round(votosGlobalesLaCopla * 10) / 10,
      porcentajeGlobalDirectoNuestra: pctDirectoNuestra,
      porcentajeGlobalDirectoLaCopla: pctDirectoLaCopla,
      porClaustro,
    };
  }, [votantes]);

  return (
    <ElectionContext.Provider
      value={{
        votantes,
        resumen,
        categoriaActiva,
        setCategoriaActiva,
        modoVistaTendencia,
        setModoVistaTendencia,
        toggleVoto,
        cambiarPostura,
        simularVotacion,
        reiniciarVotacion,
        reiniciarTodo,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => {
  const ctx = useContext(ElectionContext);
  if (!ctx) {
    throw new Error('useElection must be used within ElectionProvider');
  }
  return ctx;
};
