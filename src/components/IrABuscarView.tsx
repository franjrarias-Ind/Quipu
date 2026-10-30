import React, { useState, useMemo } from 'react';
import { useElection } from '../context/ElectionContext';
import { Docente } from '../types/election';
import { 
  Flame, 
  CheckCircle, 
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const IrABuscarView: React.FC = () => {
  const { docentes, marcarVoto, actualizarDocente } = useElection();
  
  const [selectedResponsable, setSelectedResponsable] = useState<string>('todos');
  const [selectedPostura, setSelectedPostura] = useState<string>('todos'); // 'todos', 'A favor', 'Inclinado/a'
  const [selectedProbabilidad, setSelectedProbabilidad] = useState<string>('todos');

  // Filtrar solo los que NO han votado y son "A favor" o "Inclinado/a"
  const simpatizantesSinVotar = useMemo(() => {
    return docentes.filter(d => {
      if (d.yaVoto) return false;
      const esSimpatizante = d.postura === 'A favor' || d.postura === 'Inclinado/a';
      if (!esSimpatizante) return false;

      if (selectedResponsable !== 'todos' && d.responsable !== selectedResponsable) return false;
      if (selectedPostura !== 'todos' && d.postura !== selectedPostura) return false;
      if (selectedProbabilidad !== 'todos' && d.probabilidadVotar !== selectedProbabilidad) return false;

      return true;
    }).sort((a, b) => {
      // Ordenar por prioridad: Probabilidad Baja primero (necesitan más recordatorio urgente), luego Media, luego Alta
      const ordenProb: Record<string, number> = { Baja: 1, Media: 2, Alta: 3 };
      if (ordenProb[a.probabilidadVotar] !== ordenProb[b.probabilidadVotar]) {
        return ordenProb[a.probabilidadVotar] - ordenProb[b.probabilidadVotar];
      }
      return a.id - b.id;
    });
  }, [docentes, selectedResponsable, selectedPostura, selectedProbabilidad]);

  // Lista de responsables que tienen simpatizantes pendientes
  const responsablesConPendientes = useMemo(() => {
    const set = new Set<string>();
    docentes.forEach(d => {
      if (!d.yaVoto && (d.postura === 'A favor' || d.postura === 'Inclinado/a') && d.responsable) {
        set.add(d.responsable);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare('es'));
  }, [docentes]);

  const totalAFavorFaltan = docentes.filter(d => !d.yaVoto && d.postura === 'A favor').length;
  const totalInclinadosFaltan = docentes.filter(d => !d.yaVoto && d.postura === 'Inclinado/a').length;

  const handleMarcarVotoDesdeAqui = (id: number) => {
    marcarVoto(id, true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.5 },
    });
  };

  const handleCambiarEstadoMovilizacion = (id: number, nuevoEstado: Docente['avisoMovilizacion']) => {
    actualizarDocente(id, { avisoMovilizacion: nuevoEstado });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border border-amber-600/50 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-300 rounded-xl">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Operativo "Ir a Buscar" · Movilización de Simpatizantes
                </h2>
                <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full">
                  {totalAFavorFaltan + totalInclinadosFaltan} Pendientes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-200/80 mt-0.5">
                Tal como indica el punteo: los docentes "A favor" e "Inclinados" que aún no votaron son la prioridad para contactar antes del cierre de mesas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block">A favor faltantes:</span>
              <strong className="text-emerald-400 font-mono text-base">{totalAFavorFaltan}</strong>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-400 block">Inclinados faltantes:</span>
              <strong className="text-blue-400 font-mono text-base">{totalInclinadosFaltan}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Filtrar por:</span>
          </div>

          {/* Por Responsable */}
          <select
            value={selectedResponsable}
            onChange={e => setSelectedResponsable(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="todos">Todos los responsables</option>
            {responsablesConPendientes.map(nombre => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>

          {/* Por Postura */}
          <select
            value={selectedPostura}
            onChange={e => setSelectedPostura(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="todos">A favor + Inclinados</option>
            <option value="A favor">Solo "A favor"</option>
            <option value="Inclinado/a">Solo "Inclinado/a"</option>
          </select>

          {/* Por Probabilidad */}
          <select
            value={selectedProbabilidad}
            onChange={e => setSelectedProbabilidad(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="todos">Todas las probabilidades</option>
            <option value="Baja">Prioridad Urgente (Probabilidad Baja)</option>
            <option value="Media">Probabilidad Media</option>
            <option value="Alta">Probabilidad Alta</option>
          </select>
        </div>

        <span className="text-slate-400">
          Listando <strong className="text-amber-300 font-mono">{simpatizantesSinVotar.length}</strong> docentes a contactar
        </span>
      </div>

      {/* List of Mobilization Cards */}
      {simpatizantesSinVotar.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">¡Padrón de simpatizantes al día!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No quedan docentes "A favor" o "Inclinados" pendientes de votar bajo los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {simpatizantesSinVotar.map(doc => {
            const esProbBaja = doc.probabilidadVotar === 'Baja';

            return (
              <div 
                key={doc.id}
                className={`bg-slate-900 border rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 transition ${
                  esProbBaja ? 'border-amber-500/70 bg-gradient-to-b from-amber-950/20 to-slate-900' : 'border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      #{doc.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.postura === 'A favor' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {doc.postura}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.probabilidadVotar === 'Baja'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : doc.probabilidadVotar === 'Media'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        Prob. {doc.probabilidadVotar}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-white text-sm">
                    {doc.nombre}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400">
                    {doc.dni && <span>DNI: <strong className="text-slate-300 font-mono">{doc.dni}</strong></span>}
                    {doc.nroEmpl && <span>· Legajo: <strong className="text-slate-300 font-mono">{doc.nroEmpl}</strong></span>}
                  </div>
                  <p className="text-xs text-slate-300">
                    👤 Responsable: <strong className="text-indigo-300">{doc.responsable}</strong>
                  </p>

                  {/* Notes if any */}
                  {doc.notas && (
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-amber-200/90 italic">
                      💬 "{doc.notas}"
                    </div>
                  )}
                </div>

                {/* Tracking Status Pill (Pendiente / Contactado / En camino / No asistirá) */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Estado de contacto:</span>
                    <select
                      value={doc.avisoMovilizacion || 'Pendiente'}
                      onChange={e => handleCambiarEstadoMovilizacion(doc.id, e.target.value as Docente['avisoMovilizacion'])}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="Pendiente">⏳ Pendiente</option>
                      <option value="Llamado">📞 Contactado</option>
                      <option value="En camino">🚗 En camino</option>
                      <option value="No asistirá">❌ No asistirá</option>
                    </select>
                  </div>

                  {/* 1-click Mark Voted Button */}
                  <button
                    onClick={() => handleMarcarVotoDesdeAqui(doc.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs shadow-md cursor-pointer active:scale-98"
                    title="Confirmar que emitió el voto en mesa"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>¡CONFIRMAR VOTO EN MESA!</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
