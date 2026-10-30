/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, set, onValue } from "https://gstatic.com";
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

// Configuración de Firebase - Utiliza la URL de Vercel
const firebaseConfig = {
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL || "TU_URL_DE_FIREBASE_AQUI"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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

export function normalizePostura(raw: any): Postura {
  if (typeof raw !== 'string') return 'Indecisos';
  const s = raw.trim().toLowerCase();
  if (s.includes('quipu') || s.includes('favor') || s === 'nuestra') return 'Quipu';
  if (s.includes('copla') || s.includes('contra')) return 'Copla';
  return 'Indecisos';
}

const PESOS_ESTATUTARIOS: Record<ClaustroCategoria, number> = {
  docente: 0.35,
  docente_fobam: 0,
  estudiante: 0.35,
  tae: 0.15,
  graduado: 0.15,
  orquesta: 0,
};

function generateInitialVotantes(): Votante[] {
  const all: Votante[] = [];
  const getInitialPostura = (index: number, cat: ClaustroCategoria): Postura => {
    const mod = (index * 11 + (cat === 'docente' ? 3 : cat === 'docente_fobam' ? 7 : cat === 'tae' ? 1 : 5)) % 100;
    if (mod < 48) return 'Quipu';
    if (mod < 76) return 'Indecisos';
    return 'Copla';
  };

  PADRON_DOCENTES.forEach((d, idx) => {
    all.push({ id: `doc-${d.id}`, nro: d.id, categoria: 'docente', nombre: d.nombre, dni: d.dni, nroEmpl: d.nroEmpl, postura: getInitialPostura(idx, 'docente'), yaVoto: false });
  });
  PADRON_DOCENTES_FOBAM.forEach((f, idx) => {
    all.push({ id: `fobam-${f.id}`, nro: f.id, categoria: 'docente_fobam', subclaustro: f.subclaustro, nombre: f.nombre, dni: f.dni, postura: getInitialPostura(idx, 'docente_fobam'), yaVoto: false });
  });
  PADRON_ESTUDIANTES.forEach((e, idx) => {
    all.push({ id: `est-${e.id}`, nro: e.id, categoria: 'estudiante', subclaustro: e.subclaustro, nombre: e.nombre, dni: e.dni, postura: getInitialPostura(idx, 'estudiante'), yaVoto: false });
  });
  PADRON_TAE.forEach((t, idx) => {
    all.push({ id: `tae-${t.id}`, nro: t.id, categoria: 'tae', nombre: t.nombre, dni: t.dni, nroEmpl: t.nroEmpl, postura: getInitialPostura(idx, 'tae'), yaVoto: false });
  });
  PADRON_GRADUADOS.forEach((g, idx) => {
    all.push({ id: `grad-${g.id}`, nro: g.id, categoria: 'graduado', subclaustro: g.subclaustro, nombre: g.nombre, dni: g.dni, postura: getInitialPostura(idx, 'graduado'), yaVoto: false });
  });
  PADRON_ORQUESTAS.forEach((o, idx) => {
    all.push({ id: `orq-${o.id}`, nro: o.id, categoria: 'orquesta', subclaustro: o.subclaustro, nombre: o.nombre, dni: o.dni, postura: getInitialPostura(idx, 'orquesta'), yaVoto: false });
  });

  return all;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categoriaActiva, setCategoriaActiva] = useState<ClaustroCategoria>('docente');
  const [modoVistaTendencia, setModoVistaTendencia] = useState<'estatutaria' | 'directa'>('estatutaria');
  const [votantes, setVotantes] = useState<Votante[]>([]);

  // ESCUCHADOR EN TIEMPO REAL
  useEffect(() => {
    const dbRef = ref(db, 'boca_de_urna/votantes');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data)) {
        setVotantes(data.map((v: any) => ({
          ...v,
          postura: normalizePostura(v.postura),
        })));
      } else {
        const iniciales = generateInitialVotantes();
        set(dbRef, iniciales);
        setVotantes(iniciales);
      }
    });

    return () => unsubscribe();
  }, []);

  const guardarEnFirebase = (nuevosVotantes: Votante[]) => {
    set(ref(db, 'boca_de_urna/votantes'), nuevosVotantes);
  };

  const toggleVoto = (id: string) => {
    const now = new Date();
    const hora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const actualizados = votantes.map(v => {
      if (v.id === id) {
        const nextState = !v.yaVoto;
        return { ...v, yaVoto: nextState, horaVoto: nextState ? hora : undefined };
      }
      return v;
    });
    setVotantes(actualizados);
    guardarEnFirebase(actualizados);
  };

  const cambiarPostura = (id: string, postura: Postura) => {
    const actualizados = votantes.map(v => (v.id === id ? { ...v, postura } : v));
    setVotantes(actualizados);
    guardarEnFirebase(actualizados);
  };

  const simularVotacion = () => {
    const horas = ['08:20', '09:15', '10:05', '11:20', '12:45', '14:15', '15:30', '16:45'];
    const actualizados = votantes.map((v, i) => {
      let threshold = 0.52;
      if (v.categoria === 'docente') threshold = 0.68;
      else if (v.categoria === 'docente_fobam') threshold = 0.55;
      else if (v.categoria === 'tae') threshold = 0.78;
      else if (v.categoria === 'graduado') threshold = 0.50;
      else if (v.categoria === 'orquesta') threshold = 0.65;

      const willVote = ((i * 13 + 7) % 100) / 100 < threshold;
      const hora = horas[(i * 3) % horas.length];
      return { ...v, yaVoto: willVote, horaVoto: willVote ? (v.horaVoto || hora) : undefined };
    });
    setVotantes(actualizados);
    guardarEnFirebase(actualizados);
  };

  const reiniciarVotacion = () => {
    const actualizados = votantes.map(v => ({ ...v, yaVoto: false, horaVoto: undefined }));
    setVotantes(actualizados);
    guardarEnFirebase(actualizados);
  };

  const reiniciarTodo = () => {
    const fresh = generateInitialVotantes();
    setVotantes(fresh);
    guardarEnFirebase(fresh);
  };

  const resumen = useMemo<ResumenPonderado>(() => {
    const categorias: ClaustroCategoria[] = ['docente', 'docente_fobam', 'estudiante', 'tae', 'graduado', 'orquesta'];
    const porClaustro: Record<ClaustroCategoria, ClaustroEstadistica> = {} as any;

    let ponderacionNuestra = 0; let ponderacionLaCopla = 0; let pesoTotalEstatutario = 0;
    let totalElectores = 0; let totalVotaron = 0; let votosGlobalesNuestra = 0; let votosGlobalesLaCopla = 0;

    categorias.forEach(cat => {
      const list = votantes.filter(v => v.categoria === cat);
      const totalPadron = list.length;
      const votaronList = list.filter(v => v.yaVoto);
      const cantVotaron = votaronList.length;

      totalElectores += totalPadron;
      totalVotaron += cantVotaron;

      const partPct = totalPadron > 0 ? (cantVotaron / totalPadron) * 100 : 0;
      const poolParaTendencia = cantVotaron > 0 ? votaronList : list;

      let scoreNuestra = 0; let scoreLaCopla = 0;
      poolParaTendencia.forEach(v => {
        if (v.postura === 'Quipu') scoreNuestra += 1;
        if (v.postura === 'Copla') scoreLaCopla += 1;
      });

      const totalValidosTendencia = scoreNuestra + scoreLaCopla;
      const pctNuestra = totalValidosTendencia > 0 ? (scoreNuestra / totalValidosTendencia) * 100 : 0;
      const pctLaCopla = totalValidosTendencia > 0 ? (scoreLaCopla / totalValidosTendencia) * 100 : 0;

      votosGlobalesNuestra += scoreNuestra;
      votosGlobalesLaCopla += scoreLaCopla;

      const peso = PESOS_ESTATUTARIOS[cat];
      if (peso > 0 && totalValidosTendencia > 0) {
        ponderacionNuestra += pctNuestra * peso;
        ponderacionLaCopla += pctLaCopla * peso;
        pesoTotalEstatutario += peso;
      }

      porClaustro[cat] = {
        categoria: cat,
        nombreClaustro: cat === 'docente' ? 'Docentes' : cat === 'docente_fobam' ? 'Docentes FoBaM' : cat === 'estudiante' ? 'Estudiantes' : cat === 'tae' ? 'Personal TAE' : cat === 'graduado' ? 'Graduados' : 'Orquestas',
        totalPadron,
        totalVotaron: cantVotaron,
        participacionPorcentaje: partPct,
        votosQuipu: scoreNuestra,
        votosCopla: scoreLaCopla,
        porcentajeQuipu: pctNuestra,
        porcentajeCopla: pctLaCopla
      };
    });

    const denEstatutario = pesoTotalEstatutario > 0 ? pesoTotalEstatutario : 1;
    const finalPondNuestra = ponderacionNuestra / denEstatutario;
    const finalPondLaCopla = ponderacionLaCopla / denEstatutario;

    const totalGlobalValidos = votosGlobalesNuestra + votosGlobalesLaCopla;
    const finalDirNuestra = totalGlobalValidos > 0 ? (votosGlobalesNuestra / totalGlobalValidos) * 100 : 0;
    const finalDirLaCopla = totalGlobalValidos > 0 ? (votosGlobalesLaCopla / totalGlobalValidos) * 100 : 0;

    return {
      porClaustro,
      totalElectores,
      totalVotaron,
      participacionGlobalPorcentaje: totalElectores > 0 ? (totalVotaron / totalElectores) * 100 : 0,
      ponderadoQuipu: finalPondNuestra,
      ponderadoCopla: finalPondLaCopla,
      directoQuipu: finalDirNuestra,
      directoCopla: finalDirLaCopla
    };
  }, [votantes]);

  return (
    <ElectionContext.Provider value={{
      votantes, resumen, categoriaActiva, setCategoriaActiva,
      modoVistaTendencia, setModoVistaTendencia, toggleVoto,
      cambiarPostura, simularVotacion, reiniciarVotacion, reiniciarTodo
    }}>
      {children}
