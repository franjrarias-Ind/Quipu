import React, { useState, useMemo } from 'react';
import { useElection } from '../context/ElectionContext';
import { NOMBRES_PADRON_COMPLETO } from '../data/initialPadron';
import { Users, UserPlus, Trash2, ArrowRightLeft, Shield } from 'lucide-react';

export const EquipoView: React.FC = () => {
  const { equipo, docentes, agregarMiembroEquipo, eliminarMiembroEquipo, reasignarResponsableMasivo } = useElection();
  
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(NOMBRES_PADRON_COMPLETO[0] || '');
  const [nuevoRol, setNuevoRol] = useState('');

  // Reasignación masiva
  const todosLosResponsablesActivos = useMemo(() => {
    const set = new Set<string>();
    docentes.forEach(d => {
      if (d.responsable) set.add(d.responsable);
    });
    return Array.from(set).sort((a, b) => a.localeCompare('es'));
  }, [docentes]);

  const [reassignFrom, setReassignFrom] = useState(todosLosResponsablesActivos[0] || '');
  const [reassignTo, setReassignTo] = useState(NOMBRES_PADRON_COMPLETO[0] || '');
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState<string | null>(null);

  const handleCrearMiembro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docenteSeleccionado) return;

    agregarMiembroEquipo({
      nombre: docenteSeleccionado,
      rol: nuevoRol.trim() || 'Responsable de Punteo',
    });

    setNuevoRol('');
    setReassignSuccessMsg(`✓ Se agregó a "${docenteSeleccionado}" como coordinador/responsable.`);
    setTimeout(() => setReassignSuccessMsg(null), 4000);
  };

  const handleReasignar = () => {
    if (!reassignFrom || !reassignTo || reassignFrom === reassignTo) return;
    const count = docentes.filter(d => d.responsable === reassignFrom).length;
    reasignarResponsableMasivo(reassignFrom, reassignTo);
    setReassignSuccessMsg(`✓ Se transfirieron los ${count} docentes de "${reassignFrom}" a "${reassignTo}".`);
    setTimeout(() => setReassignSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner Guide - Matching PDF Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-xs space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">
            Paso 1 del Instructivo: Gestión de Responsables de la ESMN
          </h2>
        </div>
        <p className="text-slate-400 leading-relaxed">
          <b>Todo el padrón de 284 docentes está habilitado</b> como opción para ser asignado como responsable en cualquier momento. 
          Asegúrate de asignar <b>un único responsable por cada docente</b> para evitar visitas duplicadas.
        </p>
      </div>

      {reassignSuccessMsg && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold shadow">
          {reassignSuccessMsg}
        </div>
      )}

      {/* Grid of Team Members and their assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipo.map(m => {
          const asignados = docentes.filter(d => d.responsable === m.nombre);
          const totalAsignados = asignados.length;
          const votaron = asignados.filter(d => d.yaVoto).length;
          const contactados = asignados.filter(d => d.postura !== 'Sin contactar').length;
          const pendientesMovilizar = asignados.filter(d => !d.yaVoto && (d.postura === 'A favor' || d.postura === 'Inclinado/a')).length;
          const pctAsignados = docentes.length > 0 ? ((totalAsignados / docentes.length) * 100).toFixed(0) : '0';

          return (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{m.nombre}</h3>
                    <span className="text-xs text-indigo-400 font-medium">{m.rol || 'Responsable'}</span>
                  </div>
                  {equipo.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Quitar a ${m.nombre} del panel de coordinadores?`)) {
                          eliminarMiembroEquipo(m.id);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Quitar responsable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Assignment Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Asignados:</span>
                    <strong className="text-white text-lg font-mono">{totalAsignados}</strong>
                    <span className="text-slate-500 text-[10px] ml-1">({pctAsignados}% del padrón)</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Contactados:</span>
                    <strong className="text-blue-400 text-lg font-mono">{contactados}</strong>
                    <span className="text-slate-500 text-[10px] ml-1">/ {totalAsignados}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Ya Votaron:</span>
                    <strong className="text-emerald-400 text-lg font-mono">{votaron}</strong>
                    <span className="text-slate-500 text-[10px] ml-1">en urna</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-amber-400 block text-[11px]">A buscar hoy:</span>
                    <strong className="text-amber-300 text-lg font-mono">{pendientesMovilizar}</strong>
                    <span className="text-slate-500 text-[10px] ml-1">pendientes</span>
                  </div>
                </div>
              </div>

              {/* Workload bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Avance de votación de sus docentes:</span>
                  <span className="font-mono text-white font-bold">
                    {totalAsignados > 0 ? ((votaron / totalAsignados) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalAsignados > 0 ? (votaron / totalAsignados) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Add Team Member & Bulk Reassign */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Add Member Form - Select from the 284 teachers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Sumar Responsable desde el Padrón Oficial</span>
          </h3>

          <form onSubmit={handleCrearMiembro} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Seleccionar Docente del Padrón (284 personas):</label>
              <select
                value={docenteSeleccionado}
                onChange={e => setDocenteSeleccionado(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {NOMBRES_PADRON_COMPLETO.map(nombre => (
                  <option key={nombre} value={nombre}>{nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Rol o Tarea:</label>
              <input
                type="text"
                placeholder="Ej. Fiscal General / Punteo Turno Mañana"
                value={nuevoRol}
                onChange={e => setNuevoRol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-sm text-xs mt-2"
            >
              + Habilitar como Responsable Coordinador
            </button>
          </form>
        </div>

        {/* Bulk Reassign */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            <span>Reasignación Masiva de Docentes</span>
          </h3>
          <p className="text-xs text-slate-400">
            Transfiere todos los docentes de un responsable a otro docente del padrón.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Transferir docentes de:</label>
              <select
                value={reassignFrom}
                onChange={e => setReassignFrom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
              >
                {todosLosResponsablesActivos.map(nombre => (
                  <option key={nombre} value={nombre}>{nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Hacia nuevo responsable (Padrón completo):</label>
              <select
                value={reassignTo}
                onChange={e => setReassignTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
              >
                {NOMBRES_PADRON_COMPLETO.map(nombre => (
                  <option key={nombre} value={nombre}>{nombre}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleReasignar}
              disabled={reassignFrom === reassignTo}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-sm text-xs mt-2"
            >
              Transferir Todos los Docentes
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
