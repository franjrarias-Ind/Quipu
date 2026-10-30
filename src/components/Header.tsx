/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { Vote, Sparkles, RotateCcw, Download, CheckCircle2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { resumen, simularVotacion, reiniciarVotacion, votantes, cloudSyncStatus } = useElection();
  const [copied, setCopied] = useState(false);

  const exportarCSV = () => {
    const headers = ['Categoria', 'Nro', 'Nombre', 'DNI', 'Postura', 'Ya Voto', 'Hora Voto'];
    const rows = votantes.map(v => [
      v.categoria.toUpperCase(),
      v.nro,
      `"${v.nombre}"`,
      v.dni,
      `"${v.postura}"`,
      v.yaVoto ? 'SI' : 'NO',
      v.horaVoto || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `boca_de_urna_esmn_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Boca de Urna ESMN
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ponderación Estatutaria
              </span>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                  cloudSyncStatus === 'guardando'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : cloudSyncStatus === 'conectado'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Sincronización multiusuario en tiempo real con Firebase Firestore"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    cloudSyncStatus === 'guardando'
                      ? 'bg-amber-400 animate-ping'
                      : cloudSyncStatus === 'conectado'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                <span>
                  {cloudSyncStatus === 'guardando'
                    ? 'Sincronizando...'
                    : cloudSyncStatus === 'conectado'
                    ? 'En vivo (10 usuarios)'
                    : 'Modo local'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Docentes 35% · Estudiantes 35% · TAE 15% · Graduados 15%
            </p>
          </div>
        </div>

        {/* Global Turnout Badge & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <span className="text-slate-400">Padrón total:</span>
            <span className="font-semibold text-white">{resumen.totalElectores} electores</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Votaron:</span>
            <span className="font-bold text-emerald-400">{resumen.totalVotaron} ({resumen.participacionGlobal}%)</span>
          </div>

          <button
            onClick={simularVotacion}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer"
            title="Carga una simulación de votos a lo largo del día para pruebas"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simular votos</span>
          </button>

          <button
            onClick={exportarCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Descargar padrón con estados de votación en formato CSV"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copied ? 'Descargado' : 'Exportar CSV'}</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('¿Deseas reiniciar todos los votos de la jornada a 0?')) {
                reiniciarVotacion();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/50 transition-colors cursor-pointer"
            title="Reiniciar todos los votos registrados a no votó"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
