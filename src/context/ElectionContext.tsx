/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';

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
  cloudSyncStatus: 'conectado' | 'guardando' | 'offline';
}

const STORAGE_KEY = 'esmn_boca_urna_ponderada_v12';

export function normalizePostura(raw: any): Postura {
  if (typeof raw !== 'string') return 'No sabe';
  const s = raw.trim().toLowerCase();
  if (s.includes('quipu') || s.includes('favor') || s === 'nuestra') return 'Quipu';
  if (s.includes('copla') || s.includes('contra')) return 'Copla';
  return 'No sabe';
}

export function normalizeVotante(v: any): Votante {
  let cat: ClaustroCategoria = 'docente';
  let sub = v.subclaustro;

  if (v.categoria === 'docente_fobam') {
    cat = 'docente';
    sub = v.subclaustro || 'FoBaM';
  } else if (v.categoria === 'orquesta') {
    cat = 'docente';
    sub = v.subclaustro || 'Orquesta';
  } else if (['docente', 'estudiante', 'tae', 'graduado'].includes(v.categoria)) {
    cat = v.categoria as ClaustroCategoria;
  }

  return {
    ...v,
    categoria: cat,
    subclaustro: sub,
    postura: normalizePostura(v.postura),
  };
}

// Statutory weights (35% Docentes, 35% Estudiantes, 15% TAE, 15% Graduados)
const PESOS_ESTATUTARIOS: Record<ClaustroCategoria, number> = {
  docente: 0.35,
  estudiante: 0.35,
  tae: 0.15,
  graduado: 0.15,
};

const NOMBRES_CLAUSTRO: Record<ClaustroCategoria, string> = {
  docente: 'Docentes',
  estudiante: 'Estudiantes',
  tae: 'Personal TAE',
  graduado: 'Graduados',
};

const ALL_CATEGORIAS: ClaustroCategoria[] = [
  'docente',
  'estudiante',
  'tae',
  'graduado',
];

function generateInitialVotantes(): Votante[] {
  const all: Votante[] = [];

  // Realistic seed distribution
  const getInitialPostura = (index: number): Postura => {
    const mod = (index * 11 + 3) % 100;
    if (mod < 48) return 'Quipu';
    if (mod < 76) return 'No sabe';
    return 'Copla';
  };

  // 1. Docentes ESMN (284)
  PADRON_DOCENTES.forEach((d, idx) => {
    all.push({
      id: `doc-${d.id}`,
      nro: d.id,
      categoria: 'docente',
      subclaustro: 'Docentes',
      nombre: d.nombre,
      dni: d.dni,
      nroEmpl: d.nroEmpl,
      postura: getInitialPostura(idx),
      yaVoto: false,
    });
  });

  // 2. Docentes FoBaM (238) - Juntos en el ítem Docentes
  PADRON_DOCENTES_FOBAM.forEach((f, idx) => {
    all.push({
      id: `fobam-${f.id}`,
      nro: 284 + f.id,
      categoria: 'docente',
      subclaustro: 'FoBaM',
      nombre: f.nombre,
      dni: f.dni,
      postura: getInitialPostura(284 + idx),
      yaVoto: false,
    });
  });

  // 3. Orquestas (26) - Juntos en el ítem Docentes
  PADRON_ORQUESTAS.forEach((o, idx) => {
    all.push({
      id: `orq-${o.id}`,
      nro: 522 + o.id,
      categoria: 'docente',
      subclaustro: 'Orquesta',
      nombre: o.nombre,
      dni: o.dni,
      postura: getInitialPostura(522 + idx),
      yaVoto: false,
    });
  });

  // 4. Estudiantes (512)
  PADRON_ESTUDIANTES.forEach((e, idx) => {
    all.push({
      id: `est-${e.id}`,
      nro: e.id,
      categoria: 'estudiante',
      subclaustro: e.subclaustro,
      nombre: e.nombre,
      dni: e.dni,
      postura: getInitialPostura(548 + idx),
      yaVoto: false,
    });
  });

  // 5. TAE (61)
  PADRON_TAE.forEach((t, idx) => {
    all.push({
      id: `tae-${t.id}`,
      nro: t.id,
      categoria: 'tae',
      nombre: t.nombre,
      dni: t.dni,
      nroEmpl: t.nroEmpl,
      postura: getInitialPostura(1060 + idx),
      yaVoto: false,
    });
  });

  // 6. Graduados (100)
  PADRON_GRADUADOS.forEach((g, idx) => {
    all.push({
      id: `grad-${g.id}`,
      nro: g.id,
      categoria: 'graduado',
      subclaustro: g.subclaustro,
      nombre: g.nombre,
      dni: g.dni,
      postura: getInitialPostura(1121 + idx),
      yaVoto: false,
    });
  });

  return all;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categoriaActiva, setCategoriaActiva] = useState<ClaustroCategoria>('docente');
  const [modoVistaTendencia, setModoVistaTendencia] = useState<'estatutaria' | 'directa'>('estatutaria');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'conectado' | 'guardando' | 'offline'>('conectado');

  const [votantes, setVotantes] = useState<Votante[]>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('esmn_boca_urna_ponderada_v10') ||
        localStorage.getItem('esmn_boca_urna_ponderada_v9');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 1000) {
          return parsed.map(normalizeVotante);
        }
      }
    } catch {
      // Fallback
    }
    return generateInitialVotantes();
  });

  // Local storage cache backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(votantes));
    } catch {
      // ignore
    }
  }, [votantes]);

  // Real-time synchronization with Firestore across all 10 users
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'claustros'),
      snapshot => {
        if (!snapshot.empty) {
          const remoteMap = new Map<string, Votante>();
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data && Array.isArray(data.votantes)) {
              data.votantes.forEach((v: any) => {
                const norm = normalizeVotante(v);
                remoteMap.set(norm.id, norm);
              });
            }
          });

          if (remoteMap.size > 0) {
            setVotantes(prev => {
              return prev.map(v => remoteMap.get(v.id) || v);
            });
            setCloudSyncStatus('conectado');
          }
        }
      },
      error => {
        setCloudSyncStatus('offline');
        console.warn('Firestore snapshot listener warning:', error);
      }
    );

    return () => unsub();
  }, []);

  const sincronizarCategoriaEnNube = useCallback(async (cat: ClaustroCategoria, catVoters: Votante[]) => {
    setCloudSyncStatus('guardando');
    try {
      // Sanitización: elimina campos undefined (como horaVoto) incompatibles con Firestore
      const safeVoters = JSON.parse(JSON.stringify(catVoters));

      await setDoc(doc(db, 'claustros', cat), {
        categoria: cat,
        votantes: safeVoters,
        updatedAt: new Date().toISOString(),
      });
      setCloudSyncStatus('conectado');
    } catch (err) {
      console.warn('Error guardando en Firestore:', err);
      setCloudSyncStatus('offline');
    }
  }, []);

  const toggleVoto = (id: string) => {
    const now = new Date();
    const hora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let catAfectada: ClaustroCategoria | null = null;
    const actualizados = votantes.map(v => {
      if (v.id === id) {
        catAfectada = v.categoria;
        const nextState = !v.yaVoto;
        return {
          ...v,
          yaVoto: nextState,
          horaVoto: nextState ? hora : undefined,
        };
      }
      return v;
    });

    setVotantes(actualizados);
    if (catAfectada) {
      const votersOfCat = actualizados.filter(v => v.categoria === catAfectada);
      sincronizarCategoriaEnNube(catAfectada, votersOfCat);
    }
  };

  const cambiarPostura = (id: string, postura: Postura) => {
    let catAfectada: ClaustroCategoria | null = null;
    const actualizados = votantes.map(v => {
      if (v.id === id) {
        catAfectada = v.categoria;
        return { ...v, postura };
      }
      return v;
    });

    setVotantes(actualizados);
    if (catAfectada) {
      const votersOfCat = actualizados.filter(v => v.categoria === catAfectada);
      sincronizarCategoriaEnNube(catAfectada, votersOfCat);
    }
  };

  const simularVotacion = () => {
    const horas = ['08:20', '09:15', '10:05', '11:20', '12:45', '14:15', '15:30', '16:45'];
    const actualizados = votantes.map((v, i) => {
      let threshold = 0.52;
      if (v.categoria === 'docente') threshold = 0.68;
      else if (v.categoria === 'tae') threshold = 0.78;
      else if (v.categoria === 'graduado') threshold = 0.50;

      const willVote = ((i * 13 + 7) % 100) / 100 < threshold;
      const hora = horas[(i * 3) % horas.length];
      return {
        ...v,
        yaVoto: willVote,
        horaVoto: willVote ? (v.horaVoto || hora) : undefined,
      };
    });

    setVotantes(actualizados);
    ALL_CATEGORIAS.forEach(cat => {
      sincronizarCategoriaEnNube(cat, actualizados.filter(v => v.categoria === cat));
    });
  };

  const reiniciarVotacion = () => {
    const actualizados = votantes.map(v => ({
      ...v,
      yaVoto: false,
      horaVoto: undefined,
    }));
    setVotantes(actualizados);
    ALL_CATEGORIAS.forEach(cat => {
      sincronizarCategoriaEnNube(cat, actualizados.filter(v => v.categoria === cat));
    });
  };

  const reiniciarTodo = () => {
    const fresh = generateInitialVotantes();
    setVotantes(fresh);
    localStorage.removeItem(STORAGE_KEY);
    ALL_CATEGORIAS.forEach(cat => {
      sincronizarCategoriaEnNube(cat, fresh.filter(v => v.categoria === cat));
    });
  };

  const resumen = useMemo<ResumenPonderado>(() => {
    const porClaustro: Record<ClaustroCategoria, ClaustroEstadistica> = {} as any;

    let ponderacionNuestra = 0;
    let ponderacionLaCopla = 0;
    let pesoTotalEstatutario = 0;

    let totalElectores = 0;
    let totalVotaron = 0;
    let votosGlobalesNuestra = 0;
    let votosGlobalesLaCopla = 0;

    ALL_CATEGORIAS.forEach(cat => {
      const list = votantes.filter(v => v.categoria === cat);
      const totalPadron = list.length;
      const votaronList = list.filter(v => v.yaVoto);
      const cantVotaron = votaronList.length;

      totalElectores += totalPadron;
      totalVotaron += cantVotaron;

      const partPct = totalPadron > 0 ? (cantVotaron / totalPadron) * 100 : 0;
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
          case 'No sabe':
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
        cloudSyncStatus,
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
