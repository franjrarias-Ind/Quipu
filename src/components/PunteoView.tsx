import React, { useState, useMemo } from 'react';
import { useElection } from '../context/ElectionContext';
import { Docente, Postura, ProbabilidadVoto } from '../types/election';
import { NOMBRES_PADRON_COMPLETO } from '../data/initialPadron';
import { 
  Search, 
  Filter, 
  Edit3, 
  CheckSquare, 
  Square, 
  Calendar, 
  MessageSquare, 
  User, 
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Layers
} from 'lucide-react';

export const PunteoView: React.FC = () => {
  const { 
    docentes, 
    equipo, 
    actualizarPostura, 
    actualizarProbabilidad, 
    actualizarResponsable, 
    marcarVoto, 
    actualizarNota,
    actualizarDocente 
  } = useElection();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostura, setSelectedPostura] = useState<string>('todos');
  const [selectedResponsable, setSelectedResponsable] = useState<string>('todos');
  const [selectedVoto, setSelectedVoto] = useState<string>('todos');
  const [selectedProbabilidad, setSelectedProbabilidad] = useState<string>('todos');
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Toda la lista de los 284 docentes del padrón disponible para asignar como responsable
  const todosLosResponsables = useMemo(() => {
    const list = Array.from(new Set([
      ...equipo.map(e => e.nombre),
      ...NOMBRES_PADRON_COMPLETO
    ]));
    return list.sort((a, b) => a.localeCompare('es'));
  }, [equipo]);

  // Lista de responsables que actualmente tienen al menos un docente asignado (para filtro superior)
  const responsablesConAsignados = useMemo(() => {
    const set = new Set<string>();
    docentes.forEach(d => {
      if (d.responsable) set.add(d.responsable);
    });
    return Array.from(set).sort((a, b) => a.localeCompare('es'));
  }, [docentes]);

  // Filtering
  const filteredDocentes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return docentes.filter(d => {
      if (selectedPostura !== 'todos' && d.postura !== selectedPostura) return false;
      if (selectedResponsable !== 'todos' && d.responsable !== selectedResponsable) return false;
      if (selectedProbabilidad !== 'todos' && d.probabilidadVotar !== selectedProbabilidad) return false;
      if (selectedVoto === 'si' && !d.yaVoto) return false;
      if (selectedVoto === 'no' && d.yaVoto) return false;

      if (!term) return true;

      const matchId = String(d.id) === term;
      const matchNombre = d.nombre.toLowerCase().includes(term);
      const matchDni = (d.dni || '').toLowerCase().includes(term);
      const matchEmpl = (d.nroEmpl || '').toLowerCase().includes(term);
      const matchResp = d.responsable.toLowerCase().includes(term);
      const matchNotas = (d.notas || '').toLowerCase().includes(term);

      return matchId || matchNombre || matchDni || matchEmpl || matchResp || matchNotas;
    });
  }, [docentes, searchTerm, selectedPostura, selectedResponsable, selectedVoto, selectedProbabilidad]);

  const handleOpenNoteModal = (doc: Docente) => {
    setEditingDocente(doc);
    setEditingNoteText(doc.notas || '');
  };

  const handleSaveNote = () => {
    if (editingDocente) {
      actualizarNota(editingDocente.id, editingNoteText);
      setEditingDocente(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner Guide - Matching PDF Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white text-sm">Metodología de Punteo Docente ESMN:</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                Padrón Oficial: 284 docentes
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              • <b>Responsable:</b> Una sola persona por docente para evitar visitas duplicadas.
              • <b>Prioridad de contacto:</b> Docentes <i>Indecisos/as</i> e <i>Inclinados/as</i>.
              • <b>Prob. de votar:</b> Un docente "A favor" con probabilidad baja necesita recordatorio o traslado.
              • <b>Notas:</b> Solo temas pedagógicos/institucionales de la escuela, nunca comentarios personales.
            </p>
          </div>
        </div>
      </div>

      {/* Control & Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, área o nota..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Counts */}
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Mostrando: <strong className="text-white font-mono">{filteredDocentes.length}</strong> de {docentes.length}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">Votaron: <strong className="font-mono">{filteredDocentes.filter(d => d.yaVoto).length}</strong></span>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
          
          {/* Postura filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Postura:</label>
            <select
              value={selectedPostura}
              onChange={e => setSelectedPostura(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="todos">Todas las posturas</option>
              <option value="A favor">A favor (Verde)</option>
              <option value="Inclinado/a">Inclinado/a (Celeste)</option>
              <option value="Indeciso/a">Indeciso/a (Amarillo)</option>
              <option value="Otra opción">Otra opción (Rojo)</option>
              <option value="Sin contactar">Sin contactar (Gris)</option>
            </select>
          </div>

          {/* Responsable filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Responsable:</label>
            <select
              value={selectedResponsable}
              onChange={e => setSelectedResponsable(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="todos">Todos los responsables</option>
              {responsablesConAsignados.map(nombre => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))}
            </select>
          </div>

          {/* Probabilidad filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Prob. de Votar:</label>
            <select
              value={selectedProbabilidad}
              onChange={e => setSelectedProbabilidad(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="todos">Cualquier probabilidad</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja (Alerta)</option>
            </select>
          </div>

          {/* Voto filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">¿Ya Votó hoy?:</label>
            <select
              value={selectedVoto}
              onChange={e => setSelectedVoto(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="todos">Todos (Votaron y faltan)</option>
              <option value="no">Faltan votar</option>
              <option value="si">Ya votaron (En urna)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Spreadsheet / Punteo Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-300 font-semibold sticky top-0 z-20 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-2 w-12 text-center">N°</th>
                <th className="py-3 px-2 text-center font-mono">N° Empl</th>
                <th className="py-3 px-3 min-w-[210px]">Apellido y Nombre</th>
                <th className="py-3 px-2 font-mono">DNI</th>
                <th className="py-3 px-3 min-w-[200px]">Responsable (Padrón Completo)</th>
                <th className="py-3 px-3 min-w-[130px]">Postura (Paso 3)</th>
                <th className="py-3 px-3 min-w-[100px]">Prob. Voto</th>
                <th className="py-3 px-3 min-w-[90px] text-center bg-blue-950/40 border-x border-blue-900/50">¿Votó?</th>
                <th className="py-3 px-3 min-w-[240px]">Notas de Punteo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredDocentes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                    No hay docentes que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredDocentes.map(doc => {
                  const esAFavor = doc.postura === 'A favor';
                  const esAlertaBaja = esAFavor && doc.probabilidadVotar === 'Baja' && !doc.yaVoto;

                  return (
                    <tr 
                      key={doc.id}
                      className={`hover:bg-slate-850/80 transition ${
                        doc.yaVoto ? 'bg-emerald-950/15' : esAlertaBaja ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* N° Orden */}
                      <td className="py-2.5 px-2 font-mono text-center text-slate-500 font-bold">
                        {doc.id}
                      </td>

                      {/* N° Empleado */}
                      <td className="py-2.5 px-2 font-mono text-center text-slate-400 text-[11px]">
                        {doc.nroEmpl || '-'}
                      </td>

                      {/* Nombre */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">
                          {doc.nombre}
                        </div>
                      </td>

                      {/* DNI */}
                      <td className="py-2.5 px-2 font-mono text-slate-300 text-[11px]">
                        {doc.dni || '-'}
                      </td>

                      {/* Responsable dropdown (Todo el padrón habilitado) */}
                      <td className="py-2.5 px-3">
                        <select
                          value={doc.responsable}
                          onChange={e => actualizarResponsable(doc.id, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="Sin asignar">-- Sin asignar --</option>
                          {todosLosResponsables.map(nombre => (
                            <option key={nombre} value={nombre}>{nombre}</option>
                          ))}
                        </select>
                      </td>

                      {/* Postura dropdown (con colores según PDF) */}
                      <td className="py-2.5 px-3">
                        <select
                          value={doc.postura}
                          onChange={e => actualizarPostura(doc.id, e.target.value as Postura)}
                          className={`w-full font-semibold text-xs rounded-lg px-2 py-1 border focus:outline-none ${
                            doc.postura === 'A favor' 
                              ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300' 
                              : doc.postura === 'Inclinado/a'
                              ? 'bg-blue-950/70 border-blue-600 text-blue-300'
                              : doc.postura === 'Indeciso/a'
                              ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                              : doc.postura === 'Otra opción'
                              ? 'bg-rose-950/70 border-rose-600 text-rose-300'
                              : 'bg-slate-950 border-slate-700 text-slate-400'
                          }`}
                        >
                          <option value="A favor">A favor</option>
                          <option value="Inclinado/a">Inclinado/a</option>
                          <option value="Indeciso/a">Indeciso/a</option>
                          <option value="Otra opción">Otra opción</option>
                          <option value="Sin contactar">Sin contactar</option>
                        </select>
                      </td>

                      {/* Probabilidad */}
                      <td className="py-2.5 px-3">
                        <select
                          value={doc.probabilidadVotar}
                          onChange={e => actualizarProbabilidad(doc.id, e.target.value as ProbabilidadVoto)}
                          className={`w-full text-xs rounded-lg px-2 py-1 border focus:outline-none ${
                            doc.probabilidadVotar === 'Alta'
                              ? 'bg-slate-950 border-slate-700 text-emerald-300'
                              : doc.probabilidadVotar === 'Media'
                              ? 'bg-slate-950 border-slate-700 text-amber-300'
                              : 'bg-slate-950 border-rose-800 text-rose-400 font-bold'
                          }`}
                        >
                          <option value="Alta">Alta</option>
                          <option value="Media">Media</option>
                          <option value="Baja">Baja</option>
                        </select>
                      </td>

                      {/* ¿Votó hoy? - Checkbox directo del día de elección */}
                      <td className="py-2.5 px-3 text-center bg-blue-950/20 border-x border-blue-900/30">
                        <button
                          onClick={() => marcarVoto(doc.id, !doc.yaVoto)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                            doc.yaVoto 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm' 
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          {doc.yaVoto ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>SÍ {doc.horaVoto ? `(${doc.horaVoto})` : ''}</span>
                            </>
                          ) : (
                            <span>NO</span>
                          )}
                        </button>
                      </td>

                      {/* Notas breves de punteo */}
                      <td className="py-2.5 px-3">
                        <div 
                          onClick={() => handleOpenNoteModal(doc)}
                          className="cursor-pointer group flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
                        >
                          <span className={`truncate max-w-[220px] text-xs ${
                            doc.notas ? 'text-slate-300' : 'text-slate-500 italic'
                          }`}>
                            {doc.notas || '+ Agregar nota breve...'}
                          </span>
                          <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note Editing Modal */}
      {editingDocente && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Nota de Punteo: {editingDocente.nombre}
                </h3>
                <p className="text-xs text-slate-400">
                  Responsable: {editingDocente.responsable}
                </p>
              </div>
              <button
                onClick={() => setEditingDocente(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Escribí la nota de contacto (temas institucionales, inquietudes de cátedra):
              </label>
              <textarea
                rows={4}
                value={editingNoteText}
                onChange={e => setEditingNoteText(e.target.value)}
                placeholder="Ejemplo del PDF: 'Le preocupa la carga horaria de los cargos de pregrado. Pidió ver la propuesta escrita. Volver a hablar la semana próxima.'"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quick Templates */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold block">Respuestas frecuentes para agregar rápido:</span>
              <div className="flex flex-wrap gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setEditingNoteText(prev => prev ? `${prev} · Comprometió el voto temprano.` : 'Comprometió el voto temprano.')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
                >
                  + Viene temprano
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNoteText(prev => prev ? `${prev} · Necesita que le pasemos a buscar.` : 'Necesita que le pasemos a buscar.')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
                >
                  + Necesita transporte
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNoteText(prev => prev ? `${prev} · Pidió propuesta escrita sobre concursos docentes.` : 'Pidió propuesta escrita sobre concursos docentes.')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
                >
                  + Consulta concursos
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingDocente(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow"
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
