/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useElection } from '../context/ElectionContext';
import { ClaustroCategoria } from '../types/election';
import {
  Users,
  GraduationCap,
  Briefcase,
  Award,
  TrendingUp,
  CheckCircle,
  Music,
  BookOpen
} from 'lucide-react';

export const DashboardPonderado: React.FC = () => {
  const {
    resumen,
    categoriaActiva,
    setCategoriaActiva,
    modoVistaTendencia,
    setModoVistaTendencia,
  } = useElection();

  const getClaustroIcon = (cat: ClaustroCategoria) => {
    switch (cat) {
      case 'docente':
        return <Briefcase className="w-4 h-4 text-amber-400" />;
      case 'estudiante':
        return <GraduationCap className="w-4 h-4 text-blue-400" />;
      case 'tae':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'graduado':
        return <Award className="w-4 h-4 text-purple-400" />;
      case 'orquesta':
        return <Music className="w-4 h-4 text-rose-400" />;
    }
  };

  const getBadgeInfo = (cat: ClaustroCategoria) => {
    switch (cat) {
      case 'docente':
        return { label: '35% peso', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'estudiante':
        return { label: '35% peso', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'tae':
        return { label: '15% peso', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'graduado':
        return { label: '15% peso', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'orquesta':
        return { label: 'Orquesta', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
  };

  const categorias: ClaustroCategoria[] = [
    'docente',
    'estudiante',
    'tae',
    'graduado',
    'orquesta',
  ];

  const pctNuestra =
    modoVistaTendencia === 'estatutaria'
      ? resumen.porcentajeGeneralNuestra
      : resumen.porcentajeGlobalDirectoNuestra;

  const pctCopla =
    modoVistaTendencia === 'estatutaria'
      ? resumen.porcentajeGeneralLaCopla
      : resumen.porcentajeGlobalDirectoLaCopla;

  return (
    <div className="space-y-4">
      {/* 1. Gran Barra de Tendencia Ponderada: QUIPU vs Copla */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                TENDENCIA BOCA DE URNA: QUIPU VS COPLA
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {modoVistaTendencia === 'estatutaria'
                ? 'Ponderación estatutaria: 35% Docentes · 35% Estudiantes · 15% TAE · 15% Graduados'
                : 'Conteo directo sumando todos los padrones (Docentes, FoBaM, Estudiantes, TAE, Graduados, Orquestas)'}
            </p>
          </div>

          {/* Toggle Modo Vista */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs flex">
              <button
                onClick={() => setModoVistaTendencia('estatutaria')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  modoVistaTendencia === 'estatutaria'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ponderada (35/35/15/15)
              </button>
              <button
                onClick={() => setModoVistaTendencia('directa')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  modoVistaTendencia === 'directa'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Total Directo
              </button>
            </div>

            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                pctNuestra >= 50
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {pctNuestra >= 50 ? '● Ventaja QUIPU' : '● Ventaja Copla'}
            </span>
          </div>
        </div>

        {/* Big Percentage Compare */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-slate-800/70 border border-emerald-500/30 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  QUIPU
                </span>
                <span className="text-[11px] text-slate-400">
                  {modoVistaTendencia === 'directa' && `${resumen.votosGlobalesNuestra} votos proyectados`}
                </span>
              </div>
              <span className="text-2xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
                {pctNuestra.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-rose-500/30 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                  Copla
                </span>
                <span className="text-[11px] text-slate-400">
                  {modoVistaTendencia === 'directa' && `${resumen.votosGlobalesLaCopla} votos proyectados`}
                </span>
              </div>
              <span className="text-2xl sm:text-4xl font-extrabold text-rose-400 tracking-tight">
                {pctCopla.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Visual Dual Progress Bar */}
        <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-l-full"
            style={{ width: `${Math.min(100, Math.max(0, pctNuestra))}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, pctCopla))}%` }}
          />
          {/* 50% Marker */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/70 shadow-sm" title="50% Umbral" />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
          <span className="text-emerald-400 font-medium">0% QUIPU</span>
          <span className="text-white/70 font-bold">50% Mayoría</span>
          <span className="text-rose-400 font-medium">100% Copla</span>
        </div>
      </div>

      {/* 2. Tarjetas de los 5 Claustros y Padrones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categorias.map(cat => {
          const c = resumen.porClaustro[cat];
          const isSelected = categoriaActiva === cat;
          const badge = getBadgeInfo(cat);

          return (
            <div
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/95 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1 rounded-lg bg-slate-800 border border-slate-700">
                    {getClaustroIcon(cat)}
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white leading-tight">
                  {c.nombre}
                </h3>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Votaron:</span>
                  <span className="font-semibold text-white">
                    {c.totalVotaron}/{c.totalPadron}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${c.porcentajeParticipacion}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-semibold">{c.porcentajeNuestraLista}%</span>
                  <span className="text-slate-500 text-[10px]">vs</span>
                  <span className="text-rose-400 font-semibold">{c.porcentajeLaCopla}%</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>QUIPU</span>
                  <span>Copla</span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-2 pt-1 text-[10px] text-blue-400 font-semibold flex items-center justify-center gap-1 border-t border-blue-500/20">
                  <CheckCircle className="w-2.5 h-2.5" />
                  <span>Viendo padrón</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
