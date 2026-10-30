/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useElection } from '../context/ElectionContext';
import { ClaustroCategoria, Postura } from '../types/election';
import { Search, CheckCircle2, X, ChevronLeft, ChevronRight } from 'lucide-react';

export const BocaDeUrnaTabla: React.FC = () => {
  const {
    votantes,
    categoriaActiva,
    setCategoriaActiva,
    toggleVoto,
    cambiarPostura,
    resumen
  } = useElection();

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroVoto, setFiltroVoto] = useState<'todos' | 'voto' | 'no_voto'>('todos');
  const [filtroPostura, setFiltroPostura] = useState<string>('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(50);

  const votantesCategoria = useMemo(() => {
    return votantes.filter(v => v.categoria === categoriaActiva);
  }, [votantes, categoriaActiva]);

  const votantesFiltrados = useMemo(() => {
    return votantesCategoria.filter(v => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesNombre = v.nombre.toLowerCase().includes(query);
        const matchesDni = v.dni.toLowerCase().includes(query);
        if (!matchesNombre && !matchesDni) return false;
      }

      if (filtroVoto === 'voto' && !v.yaVoto) return false;
      if (filtroVoto === 'no_voto' && v.yaVoto) return false;

      if (filtroPostura !== 'todos' && v.postura !== filtroPostura) return false;

      return true;
    });
  }, [votantesCategoria, searchTerm, filtroVoto, filtroPostura]);

  const totalPaginas = Math.ceil(votantesFiltrados.length / itemsPorPagina) || 1;
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas);

  const paginados = useMemo(() => {
    const inicio = (paginaValida - 1) * itemsPorPagina;
    return votantesFiltrados.slice(inicio, inicio + itemsPorPagina);
  }, [votantesFiltrados, paginaValida, itemsPorPagina]);

  const categorias: { key: ClaustroCategoria; label: string; badge: string }[] = [
    { key: 'docente', label: 'Docentes', badge: '35%' },
    { key: 'estudiante', label: 'Estudiantes', badge: '35%' },
    { key: 'tae', label: 'Personal TAE', badge: '15%' },
    { key: 'graduado', label: 'Graduados', badge: '15%' },
    { key: 'orquesta', label: 'Orquestas', badge: '26' },
  ];

  const getPosturaStyle = (p: Postura) => {
    switch (p) {
      case 'Quipu':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold';
      case 'Copla':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-bold';
      case 'No sabe':
      default:
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-medium';
    }
  };

  const cStats = resumen.porClaustro[categoriaActiva] || {
    nombre: '',
    totalPadron: 0,
    totalVotaron: 0
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* 1. Claustros Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto bg-slate-950/60 p-1.5 gap-1.5">
        {categorias.map(cat => {
          const isAct = categoriaActiva === cat.key;
          const stat = resumen.porClaustro[cat.key];

          return (
            <button
              key={cat.key}
              onClick={() => {
                setCategoriaActiva(cat.key);
                setPaginaActual(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                isAct
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isAct ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {cat.badge}
              </span>
              {stat && (
                <span className={`text-[11px] ${isAct ? 'text-blue-100 font-semibold' : 'text-slate-500'}`}>
                  ({stat.totalVotaron}/{stat.totalPadron})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPaginaActual(1);
            }}
            placeholder={`Buscar por apellido, nombre o DNI en ${cStats.nombre}...`}
            className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 pl-10 pr-8 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Voto filter */}
          <div className="flex bg-slate-800/90 border border-slate-700 rounded-xl p-1 text-xs">
            <button
              onClick={() => {
                setFiltroVoto('todos');
                setPaginaActual(1);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filtroVoto === 'todos' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({votantesCategoria.length})
            </button>
            <button
              onClick={() => {
                setFiltroVoto('voto');
                setPaginaActual(1);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                filtroVoto === 'voto' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <span>Votaron</span>
              <span className="font-bold">({cStats.totalVotaron})</span>
            </button>
            <button
              onClick={() => {
                setFiltroVoto('no_voto');
                setPaginaActual(1);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                filtroVoto === 'no_voto' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Pendientes</span>
              <span className="font-bold">({cStats.totalPadron - cStats.totalVotaron})</span>
            </button>
          </div>

          {/* Postura filter */}
          <select
            value={filtroPostura}
            onChange={e => {
              setFiltroPostura(e.target.value);
              setPaginaActual(1);
            }}
            className="bg-slate-800/90 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="todos">Todas las posturas</option>
            <option value="Quipu">Quipu</option>
            <option value="No sabe">No sabe</option>
            <option value="Copla">Copla</option>
          </select>
        </div>
      </div>

      {/* 3. The Boca de Urna Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Apellido y Nombre</th>
              <th className="py-3 px-4 w-32">DNI</th>
              <th className="py-3 px-4 w-48">Postura / Voto</th>
              <th className="py-3 px-4 w-52 text-center">¿Votó? (Boca de Urna)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No se encontraron votantes con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginados.map(v => (
                <tr
                  key={v.id}
                  className={`transition-colors ${
                    v.yaVoto
                      ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Order Number */}
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">
                    {v.nro}
                  </td>

                  {/* Name and Tags */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-200">
                        {v.nombre}
                      </span>
                      {v.subclaustro && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {v.subclaustro}
                        </span>
                      )}
                      {v.nroEmpl && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          (Leg. {v.nroEmpl})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* DNI */}
                  <td className="py-3 px-4 font-mono text-xs text-slate-300">
                    {v.dni}
                  </td>

                  {/* Postura dropdown with "En contra" and "La Copla" */}
                  <td className="py-3 px-4">
                    <select
                      value={v.postura}
                      onChange={e => cambiarPostura(v.id, e.target.value as Postura)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${getPosturaStyle(
                        v.postura
                      )}`}
                    >
                      <option value="Quipu" className="bg-slate-900 text-emerald-400 font-semibold">Quipu</option>
                      <option value="No sabe" className="bg-slate-900 text-amber-300 font-medium">No sabe</option>
                      <option value="Copla" className="bg-slate-900 text-rose-400 font-bold">Copla</option>
                    </select>
                  </td>

                  {/* Big Toggle Voto Button */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleVoto(v.id)}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        v.yaVoto
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 ring-1 ring-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                      title={v.yaVoto ? 'Click para desmarcar' : 'Click para registrar que ya votó'}
                    >
                      {v.yaVoto ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>YA VOTÓ</span>
                          {v.horaVoto && (
                            <span className="text-[10px] font-normal opacity-90">
                              ({v.horaVoto})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full border border-slate-500" />
                          <span>REGISTRAR VOTO</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination & Footer */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Mostrando {paginados.length > 0 ? (paginaValida - 1) * itemsPorPagina + 1 : 0} a{' '}
          {Math.min(paginaValida * itemsPorPagina, votantesFiltrados.length)} de{' '}
          <span className="font-semibold text-slate-200">{votantesFiltrados.length}</span> votantes
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Mostrar:</span>
            <select
              value={itemsPorPagina}
              onChange={e => {
                setItemsPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={600}>Todos</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              disabled={paginaValida <= 1}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-300">
              {paginaValida} / {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
              disabled={paginaValida >= totalPaginas}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
