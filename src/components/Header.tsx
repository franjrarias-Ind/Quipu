import React, { useState, useEffect } from 'react';
import { useElection } from '../context/ElectionContext';
import { 
  BarChart3, 
  Vote, 
  TableProperties, 
  UserCheck, 
  Users, 
  Download, 
  Upload, 
  Sparkles, 
  RotateCcw,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeaderProps {
  activeTab: 'tendencia' | 'bocaUrna' | 'punteo' | 'irABuscar' | 'equipo';
  setActiveTab: (tab: 'tendencia' | 'bocaUrna' | 'punteo' | 'irABuscar' | 'equipo') => void;
  onOpenModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenModal }) => {
  const { docentes, cargarSimulacionComicios, reiniciarJornada, exportarCSV } = useElection();
  const [horaActual, setHoraActual] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHoraActual(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalPadron = docentes.length;
  const yaVotaron = docentes.filter(d => d.yaVoto).length;
  const porcentajeParticipacion = totalPadron > 0 ? ((yaVotaron / totalPadron) * 100).toFixed(1) : '0';

  // Faltan ir a buscar: A favor e Inclinado/a que aún no votaron
  const faltanIrABuscar = docentes.filter(
    d => !d.yaVoto && (d.postura === 'A favor' || d.postura === 'Inclinado/a')
  ).length;

  const aFavorVotaron = docentes.filter(d => d.yaVoto && d.postura === 'A favor').length;
  const aFavorTotal = docentes.filter(d => d.postura === 'A favor').length;

  const handleConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.2 },
    });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Title and School Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-xl shadow-md border border-indigo-400/30">
              🎵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  ESMN · Punteo & Boca de Urna
                </h1>
                <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full border border-blue-500/30 font-medium">
                  284 Docentes
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  EN VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Escuela Superior de Música de Neuquén · Padrón Oficial Definitivo
              </p>
            </div>
          </div>

          {/* Real-time metrics pills & fast actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Clock */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{horaActual || '08:00:00'}</span>
            </div>

            {/* Turnout Pill */}
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-2">
              <span className="text-slate-400">Participación:</span>
              <span className="font-bold text-white font-mono">{yaVotaron}/{totalPadron}</span>
              <span className="bg-indigo-900/60 text-indigo-300 font-bold px-1.5 py-0.5 rounded text-[11px]">
                {porcentajeParticipacion}%
              </span>
            </div>

            {/* Supporters Voted Pill */}
            <div className="bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-emerald-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>A favor ya votaron:</span>
              <span className="font-bold text-emerald-200">{aFavorVotaron}/{aFavorTotal}</span>
            </div>

            {/* Mobilization urgent alert */}
            {faltanIrABuscar > 0 && (
              <button
                onClick={() => setActiveTab('irABuscar')}
                className="bg-amber-950/50 hover:bg-amber-900/50 border border-amber-700/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-amber-300 font-medium transition cursor-pointer"
                title="Ver lista de simpatizantes que aún no votaron"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Ir a buscar:</span>
                <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[11px]">
                  {faltanIrABuscar}
                </span>
              </button>
            )}

            {/* Demo & Export Buttons */}
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              <button
                onClick={() => {
                  cargarSimulacionComicios();
                  handleConfetti();
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition shadow-sm text-xs cursor-pointer"
                title="Carga una jornada electoral representativa al 54% de avance para ver tendencias en vivo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simular Avance</span>
              </button>

              <button
                onClick={exportarCSV}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg transition border border-slate-700 cursor-pointer"
                title="Descargar padrón y boca de urna en CSV (Excel)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onOpenModal}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg transition border border-slate-700 cursor-pointer"
                title="Importar padrón o configuración"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  if (confirm('¿Deseas reiniciar los votos emitidos de hoy a 0 para comenzar una nueva jornada electoral? (Los datos de punteo docente se conservarán).')) {
                    reiniciarJornada();
                  }
                }}
                className="text-slate-400 hover:text-rose-400 hover:bg-slate-800 p-1.5 rounded-lg transition"
                title="Reiniciar jornada de comicios (votos a cero)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 mt-3 pt-2 border-t border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('tendencia')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'tendencia'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tablero & Tendencia</span>
          </button>

          <button
            onClick={() => setActiveTab('bocaUrna')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'bocaUrna'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Boca de Urna / Mesa</span>
          </button>

          <button
            onClick={() => setActiveTab('punteo')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'punteo'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>Punteo Docente ({totalPadron})</span>
          </button>

          <button
            onClick={() => setActiveTab('irABuscar')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'irABuscar'
                ? 'bg-amber-600 text-white shadow'
                : 'text-amber-400/90 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Operativo Ir a Buscar</span>
            {faltanIrABuscar > 0 && (
              <span className="bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {faltanIrABuscar}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('equipo')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'equipo'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Equipo ({docentes.reduce((acc, curr) => acc.add(curr.responsable), new Set()).size})</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
