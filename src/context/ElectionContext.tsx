import React, { createContext, useContext, useState, useEffect } from 'react';
import { Docente, MiembroEquipo, BocaUrnaConteoRapido, ParametrosTendencia, Postura, ProbabilidadVoto } from '../types/election';
import { generarPadronDocenteInicial, EQUIPO_INICIAL } from '../data/initialPadron';

interface ElectionContextType {
  docentes: Docente[];
  equipo: MiembroEquipo[];
  conteoRapidoBocaUrna: BocaUrnaConteoRapido;
  parametros: ParametrosTendencia;
  marcarVoto: (id: number, yaVoto: boolean) => void;
  actualizarDocente: (id: number, updates: Partial<Docente>) => void;
  actualizarPostura: (id: number, postura: Postura) => void;
  actualizarProbabilidad: (id: number, probabilidad: ProbabilidadVoto) => void;
  actualizarResponsable: (id: number, responsable: string) => void;
  actualizarBocaUrna: (id: number, opcion: Docente['bocaDeUrna']) => void;
  actualizarNota: (id: number, notas: string) => void;
  incrementarConteoRapido: (opcion: keyof BocaUrnaConteoRapido) => void;
  decrementarConteoRapido: (opcion: keyof BocaUrnaConteoRapido) => void;
  actualizarParametros: (params: Partial<ParametrosTendencia>) => void;
  agregarMiembroEquipo: (miembro: Omit<MiembroEquipo, 'id'>) => void;
  eliminarMiembroEquipo: (id: string) => void;
  reasignarResponsableMasivo: (deResponsable: string, aResponsable: string) => void;
  cargarSimulacionComicios: () => void;
  reiniciarJornada: () => void;
  reiniciarTodoPadrón: () => void;
  importarDatos: (docentesNuevos: Docente[], equipoNuevo?: MiembroEquipo[]) => void;
  exportarCSV: () => void;
}

const STORAGE_KEY = 'esmn_punteo_docente_data_v4';

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [docentes, setDocentes] = useState<Docente[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_docentes`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading saved docentes', e);
    }
    return generarPadronDocenteInicial();
  });

  const [equipo, setEquipo] = useState<MiembroEquipo[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_equipo`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading saved team', e);
    }
    return EQUIPO_INICIAL;
  });

  const [conteoRapidoBocaUrna, setConteoRapidoBocaUrna] = useState<BocaUrnaConteoRapido>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_boca_urna`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading exit poll quick count', e);
    }
    return {
      nuestraLista: 0,
      otraLista: 0,
      enBlanco: 0,
      anulado: 0,
      noSabeNoContesta: 0,
    };
  });

  const [parametros, setParametros] = useState<ParametrosTendencia>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_params`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading params', e);
    }
    return {
      porcentajeInclinados: 75,
      porcentajeIndecisosAFavor: 35,
      porcentajeSinContactarAFavor: 20,
      metaVotosVictoria: 143, // 50% + 1 del padrón total de 284
    };
  });

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_docentes`, JSON.stringify(docentes));
    } catch (e) {
      console.error('Could not save docentes', e);
    }
  }, [docentes]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_equipo`, JSON.stringify(equipo));
    } catch (e) {
      console.error('Could not save equipo', e);
    }
  }, [equipo]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_boca_urna`, JSON.stringify(conteoRapidoBocaUrna));
    } catch (e) {
      console.error('Could not save boca urna', e);
    }
  }, [conteoRapidoBocaUrna]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_params`, JSON.stringify(parametros));
    } catch (e) {
      console.error('Could not save params', e);
    }
  }, [parametros]);

  const marcarVoto = (id: number, yaVoto: boolean) => {
    const ahora = new Date();
    const horaStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    
    setDocentes(prev =>
      prev.map(d => {
        if (d.id === id) {
          return {
            ...d,
            yaVoto,
            horaVoto: yaVoto ? horaStr : undefined,
            avisoMovilizacion: yaVoto ? 'Votó' : d.avisoMovilizacion === 'Votó' ? 'Pendiente' : d.avisoMovilizacion,
          };
        }
        return d;
      })
    );
  };

  const actualizarDocente = (id: number, updates: Partial<Docente>) => {
    setDocentes(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const actualizarPostura = (id: number, postura: Postura) => {
    setDocentes(prev =>
      prev.map(d =>
        d.id === id
          ? {
              ...d,
              postura,
              ultimoContacto: new Date().toISOString().split('T')[0],
            }
          : d
      )
    );
  };

  const actualizarProbabilidad = (id: number, probabilidadVotar: ProbabilidadVoto) => {
    setDocentes(prev =>
      prev.map(d =>
        d.id === id
          ? {
              ...d,
              probabilidadVotar,
              ultimoContacto: d.ultimoContacto || new Date().toISOString().split('T')[0],
            }
          : d
      )
    );
  };

  const actualizarResponsable = (id: number, responsable: string) => {
    setDocentes(prev => prev.map(d => (d.id === id ? { ...d, responsable } : d)));
  };

  const actualizarBocaUrna = (id: number, bocaDeUrna: Docente['bocaDeUrna']) => {
    setDocentes(prev => prev.map(d => (d.id === id ? { ...d, bocaDeUrna } : d)));
  };

  const actualizarNota = (id: number, notas: string) => {
    setDocentes(prev =>
      prev.map(d =>
        d.id === id
          ? {
              ...d,
              notas,
              ultimoContacto: new Date().toISOString().split('T')[0],
            }
          : d
      )
    );
  };

  const incrementarConteoRapido = (opcion: keyof BocaUrnaConteoRapido) => {
    setConteoRapidoBocaUrna(prev => ({
      ...prev,
      [opcion]: prev[opcion] + 1,
    }));
  };

  const decrementarConteoRapido = (opcion: keyof BocaUrnaConteoRapido) => {
    setConteoRapidoBocaUrna(prev => ({
      ...prev,
      [opcion]: Math.max(0, prev[opcion] - 1),
    }));
  };

  const actualizarParametros = (params: Partial<ParametrosTendencia>) => {
    setParametros(prev => ({ ...prev, ...params }));
  };

  const agregarMiembroEquipo = (miembro: Omit<MiembroEquipo, 'id'>) => {
    const nuevo: MiembroEquipo = {
      ...miembro,
      id: String(Date.now()),
    };
    setEquipo(prev => [...prev, nuevo]);
  };

  const eliminarMiembroEquipo = (id: string) => {
    setEquipo(prev => prev.filter(m => m.id !== id));
  };

  const reasignarResponsableMasivo = (deResponsable: string, aResponsable: string) => {
    setDocentes(prev =>
      prev.map(d => (d.responsable === deResponsable ? { ...d, responsable: aResponsable } : d))
    );
  };

  // Simulación realista de jornada de votación en marcha (52% de participación)
  const cargarSimulacionComicios = () => {
    const horasSimuladas = ['08:15', '08:45', '09:10', '09:40', '10:05', '10:35', '11:15', '11:50', '12:20', '13:00', '13:40', '14:15', '14:50'];
    let exitNuestra = 0;
    let exitOtra = 0;
    let exitBlanco = 0;

    const nuevos = docentes.map((doc, idx) => {
      // Simular que el ~54% ya votó
      // Quienes tienen postura A favor o Inclinado con probabilidad Alta votan más temprano
      const probabilidadVotado =
        doc.postura === 'A favor' && doc.probabilidadVotar === 'Alta' ? 0.85 :
        doc.postura === 'A favor' ? 0.65 :
        doc.postura === 'Inclinado/a' ? 0.55 :
        doc.postura === 'Otra opción' ? 0.50 : 0.35;

      const votoEfectuado = ((idx * 37) % 100) < (probabilidadVotado * 100);
      const horaVoto = votoEfectuado ? horasSimuladas[idx % horasSimuladas.length] : undefined;

      let bocaDeUrna: Docente['bocaDeUrna'] = 'No encuestado';
      if (votoEfectuado && idx % 3 === 0) {
        if (doc.postura === 'A favor') {
          bocaDeUrna = 'Nuestra Lista';
          exitNuestra++;
        } else if (doc.postura === 'Otra opción') {
          bocaDeUrna = 'Otra Lista';
          exitOtra++;
        } else if (doc.postura === 'Inclinado/a') {
          bocaDeUrna = idx % 4 === 0 ? 'Otra Lista' : 'Nuestra Lista';
          if (bocaDeUrna === 'Nuestra Lista') exitNuestra++; else exitOtra++;
        } else {
          bocaDeUrna = 'Blanco';
          exitBlanco++;
        }
      }

      return {
        ...doc,
        yaVoto: votoEfectuado,
        horaVoto,
        bocaDeUrna,
        avisoMovilizacion: votoEfectuado ? ('Votó' as const) : ((idx % 5 === 0) ? ('En camino' as const) : ('Pendiente' as const)),
      };
    });

    setDocentes(nuevos);
    setConteoRapidoBocaUrna({
      nuestraLista: exitNuestra + 24,
      otraLista: exitOtra + 16,
      enBlanco: exitBlanco + 3,
      anulado: 1,
      noSabeNoContesta: 7,
    });
  };

  const reiniciarJornada = () => {
    setDocentes(prev =>
      prev.map(d => ({
        ...d,
        yaVoto: false,
        horaVoto: undefined,
        bocaDeUrna: 'No encuestado',
        avisoMovilizacion: 'Pendiente',
      }))
    );
    setConteoRapidoBocaUrna({
      nuestraLista: 0,
      otraLista: 0,
      enBlanco: 0,
      anulado: 0,
      noSabeNoContesta: 0,
    });
  };

  const reiniciarTodoPadrón = () => {
    const inicial = generarPadronDocenteInicial();
    setDocentes(inicial);
    setEquipo(EQUIPO_INICIAL);
    setConteoRapidoBocaUrna({
      nuestraLista: 0,
      otraLista: 0,
      enBlanco: 0,
      anulado: 0,
      noSabeNoContesta: 0,
    });
  };

  const importarDatos = (docentesNuevos: Docente[], equipoNuevo?: MiembroEquipo[]) => {
    if (docentesNuevos && docentesNuevos.length > 0) {
      setDocentes(docentesNuevos);
    }
    if (equipoNuevo && equipoNuevo.length > 0) {
      setEquipo(equipoNuevo);
    }
  };

  const exportarCSV = () => {
    const headers = [
      'N°',
      'N° Empl',
      'Apellido y Nombre',
      'DNI',
      'Responsable',
      'Postura',
      'Probabilidad Voto',
      '¿Votó?',
      'Hora Voto',
      'Boca de Urna Sondeo',
      'Último Contacto',
      'Notas',
    ];

    const rows = docentes.map(d => [
      d.id,
      d.nroEmpl || '',
      `"${d.nombre.replace(/"/g, '""')}"`,
      d.dni || '',
      `"${d.responsable.replace(/"/g, '""')}"`,
      `"${d.postura}"`,
      `"${d.probabilidadVotar}"`,
      d.yaVoto ? 'SI' : 'NO',
      d.horaVoto || '',
      `"${d.bocaDeUrna || ''}"`,
      d.ultimoContacto || '',
      `"${(d.notas || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Punteo_ESMN_Boca_De_Urna_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ElectionContext.Provider
      value={{
        docentes,
        equipo,
        conteoRapidoBocaUrna,
        parametros,
        marcarVoto,
        actualizarDocente,
        actualizarPostura,
        actualizarProbabilidad,
        actualizarResponsable,
        actualizarBocaUrna,
        actualizarNota,
        incrementarConteoRapido,
        decrementarConteoRapido,
        actualizarParametros,
        agregarMiembroEquipo,
        eliminarMiembroEquipo,
        reasignarResponsableMasivo,
        cargarSimulacionComicios,
        reiniciarJornada,
        reiniciarTodoPadrón,
        importarDatos,
        exportarCSV,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
};
