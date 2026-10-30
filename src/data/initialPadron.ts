import { Docente, MiembroEquipo } from '../types/election';
import { PADRON_OFICIAL_ESMN } from './officialPadronData';

// Lista completa de los 284 docentes del padrón como opciones de responsables
export const NOMBRES_PADRON_COMPLETO: string[] = PADRON_OFICIAL_ESMN.map(d => d.nombre);

// Equipo base inicial sugerido para coordinar
export const EQUIPO_INICIAL: MiembroEquipo[] = [
  { id: '1', nombre: 'ARIAS, FRANCISCO', rol: 'Coordinador General', color: '#3b82f6' },
  { id: '2', nombre: 'ABRACH, LUISINA', rol: 'Punteo y Fiscalización', color: '#10b981' },
  { id: '3', nombre: 'ALBORNOZ, LUIS MARCELO', rol: 'Punteo y Guardia', color: '#8b5cf6' },
  { id: '4', nombre: 'ALLENDE SALAZAR, AGUSTINA ROCIO', rol: 'Punteo y Movilización', color: '#f59e0b' },
  { id: '5', nombre: 'BARCO, RODRIGO EZEQUIEL', rol: 'Boca de Urna', color: '#ec4899' },
  { id: '6', nombre: 'CORNELI, LUCIA', rol: 'Fiscal General', color: '#06b6d4' },
];

export function generarPadronDocenteInicial(): Docente[] {
  // Lista inicial de responsables principales para asignar al inicio
  const respPrincipales = EQUIPO_INICIAL.map(m => m.nombre);

  const posturasList: Array<Docente['postura']> = [
    'A favor', 'A favor', 'A favor',
    'Inclinado/a', 'Inclinado/a',
    'Indeciso/a', 'Indeciso/a',
    'Otra opción',
    'Sin contactar'
  ];

  const notasEjemplos = [
    'Le preocupa la carga horaria de los cargos de pregrado. Pidió ver la propuesta escrita. Volver a hablar la semana próxima.',
    'Totalmente de acuerdo con el reclamo presupuestario de las cátedras de ensamble.',
    'Pidió información sobre concursos de titularización docente y antigüedad.',
    'Suele venir a votar a primera hora antes de sus clases de las 10:00.',
    'Planteó necesidad de mantenimiento en pianos del auditorio mayor.',
    'Preguntó por el proyecto de ampliación de aulas de acústica e instrumentos de viento.',
    'Comprometió el voto temprano. Se ofreció para avisar a colegas.',
    'Indeciso entre las dos propuestas; valorar charla sobre estabilidad horaria.',
    'Acompaña la lista con entusiasmo. Priorizar recordatorio de mesa.',
    'Preocupación por superposición horaria y designaciones interinas.',
    'Buena recepción del folleto de propuestas docentes.',
    'Se reúne con alumnos por la tarde; votaría después de las 14 hs.',
    'Preguntó por compra de insumos y recursos para la escuela.',
    'Acompaña pero viaja desde Plottier / Centenario, coordinar horario.',
    'Consultó por las horas institucionales y comisiones de carrera.'
  ];

  return PADRON_OFICIAL_ESMN.map((item, idx) => {
    // Asignación inicial de responsable entre los primeros coordinadores
    const responsable = respPrincipales[idx % respPrincipales.length];

    const posturaIndex = (idx * 13) % posturasList.length;
    let postura = posturasList[posturaIndex];
    
    // Casos ejemplares del instructivo PDF
    if (idx === 0) postura = 'A favor';
    if (idx === 1) postura = 'Inclinado/a';
    if (idx === 2) postura = 'Indeciso/a';
    if (idx === 3) postura = 'A favor';
    if (idx === 4) postura = 'Sin contactar';
    if (idx === 14) postura = 'A favor'; // Francisco Arias

    const probList: Array<Docente['probabilidadVotar']> = ['Alta', 'Media', 'Baja'];
    const probabilidadVotar = probList[(idx * 7 + 2) % 3];

    const tieneContacto = postura !== 'Sin contactar';
    const diaContacto = 20 + (idx % 8);
    const ultimoContacto = tieneContacto ? `2026-10-${diaContacto.toString().padStart(2, '0')}` : undefined;
    const notas = tieneContacto && (idx % 2 === 0 || idx < 15) 
      ? notasEjemplos[idx % notasEjemplos.length] 
      : undefined;

    return {
      id: item.id,
      nroEmpl: item.nroEmpl,
      nombre: item.nombre,
      dni: item.dni,
      responsable,
      postura,
      probabilidadVotar,
      yaVoto: false,
      bocaDeUrna: 'No encuestado',
      ultimoContacto,
      notas,
      avisoMovilizacion: 'Pendiente',
    };
  });
}
