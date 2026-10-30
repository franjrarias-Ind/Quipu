import React, { useState, useMemo } from 'react';
import { useElection } from '../context/ElectionContext';
import { 
  TrendingUp, 
  Award, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Flame, 
  HelpCircle, 
  PieChart, 
  Sliders, 
  ArrowUpRight,
  Vote,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardTendenciaProps {
  onGoToBocaUrna: () => void;
  onGoToIrABuscar: () => void;
}

export const DashboardTendencia: React.FC<DashboardTendenciaProps> = ({ onGoToBocaUrna, onGoToIrABuscar }) => {
  const { docentes, conteoRapidoBocaUrna, parametros, actualizarParametros } = useElection();
  const [showConfigSliders, setShowConfigSliders] = useState(false);

  // Estadísticas del padrón (284 docentes)
  const totalPadron = docentes.length;
  const yaVotaron = docentes.filter(d => d.yaVoto).length;
  const faltanVotar = totalPadron - yaVotaron;
  const porcentajeParticipacion = totalPadron > 0 ? (yaVotaron / totalPadron) * 100 : 0;

  // Desglose de posturas totales
  const totalAFavor = docentes.filter(d => d.postura === 'A favor').length;
  const totalInclinados = docentes.filter(d => d.postura === 'Inclinado/a').length;
  const totalIndecisos = docentes.filter(d => d.postura === 'Indeciso/a').length;
  const totalOtraOpcion = docentes.filter(d => d.postura === 'Otra opción').length;
  const totalSinContactar = docentes.filter(d => d.postura === 'Sin contactar').length;

  // Desglose entre los que YA VOTARON
  const votaronAFavor = docentes.filter(d => d.yaVoto && d.postura === 'A favor').length;
  const votaronInclinados = docentes.filter(d => d.yaVoto && d.postura === 'Inclinado/a').length;
  const votaronIndecisos = docentes.filter(d => d.yaVoto && d.postura === 'Indeciso/a').length;
  const votaronOtraOpcion = docentes.filter(d => d.yaVoto && d.postura === 'Otra opción').length;
  const votaronSinContactar = docentes.filter(d => d.yaVoto && d.postura === 'Sin contactar').length;

  // Desglose entre los que FALTAN VOTAR
  const faltanAFavor = docentes.filter(d => !d.yaVoto && d.postura === 'A favor').length;
  const faltanInclinados = docentes.filter(d => !d.yaVoto && d.postura === 'Inclinado/a').length;
  const faltanIndecisos = docentes.filter(d => !d.yaVoto && d.postura === 'Indeciso/a').length;

  // Boca de urna nominal (los que fueron encuestados en padrón)
  const bocaNominalNuestra = docentes.filter(d => d.yaVoto && d.bocaDeUrna === 'Nuestra Lista').length;
  const bocaNominalOtra = docentes.filter(d => d.yaVoto && d.bocaDeUrna === 'Otra Lista').length;
  const bocaNominalBlanco = docentes.filter(d => d.yaVoto && d.bocaDeUrna === 'Blanco').length;
  const bocaNominalNoSabe = docentes.filter(d => d.yaVoto && d.bocaDeUrna === 'No contesta').length;

  // Total de Boca de Urna combinada (Nominal + Conteo Rápido de mesa)
  const exitNuestraTotal = bocaNominalNuestra + conteoRapidoBocaUrna.nuestraLista;
  const exitOtraTotal = bocaNominalOtra + conteoRapidoBocaUrna.otraLista;
  const exitBlancoTotal = bocaNominalBlanco + conteoRapidoBocaUrna.enBlanco;
  const exitTotalSondeo = exitNuestraTotal + exitOtraTotal + exitBlancoTotal + conteoRapidoBocaUrna.anulado;

  const pctExitNuestra = exitTotalSondeo > 0 ? (exitNuestraTotal / exitTotalSondeo) * 100 : 0;
  const pctExitOtra = exitTotalSondeo > 0 ? (exitOtraTotal / exitTotalSondeo) * 100 : 0;

  // CÁLCULO DE PROYECCIÓN DE VOTOS PARA NUESTRA LISTA
  // 1. Votos en urna seguros (A favor que votaron)
  const votosSegurosEnUrna = votaronAFavor;
  
  // 2. Votos estimados ya emitidos (A favor + % Inclinados + % Indecisos + % Sin Contactar)
  const votosEmitidosEstimados = Math.round(
    votaronAFavor * 1.0 +
    votaronInclinados * (parametros.porcentajeInclinados / 100) +
    votaronIndecisos * (parametros.porcentajeIndecisosAFavor / 100) +
    votaronSinContactar * (parametros.porcentajeSinContactarAFavor / 100)
  );

  // 3. Proyección final estimada si se mantiene la participación o si van a votar los contactados
  // Proyección de votantes finales totales: si ya votaron X, proyectamos una participación final típica de 80% (o la actual si supera)
  const participacionFinalEstimadaPct = Math.max(78, Math.min(95, porcentajeParticipacion + (100 - porcentajeParticipacion) * 0.5));
  const votantesFinalesEstimados = Math.max(yaVotaron, Math.round(totalPadron * (participacionFinalEstimadaPct / 100)));
  const votosNecesariosParaGanar = Math.floor(votantesFinalesEstimados / 2) + 1;

  // Escenario Base / Más Probable al cierre:
  // Votos ya emitidos + simpatizantes que faltan votar con probabilidad ponderada
  const proyectadosFaltantesAFavor = Math.round(
    docentes.filter(d => !d.yaVoto && d.postura === 'A favor').reduce((acc, d) => {
      const p = d.probabilidadVotar === 'Alta' ? 0.90 : d.probabilidadVotar === 'Media' ? 0.65 : 0.35;
      return acc + p;
    }, 0)
  );

  const proyectadosFaltantesInclinados = Math.round(
    docentes.filter(d => !d.yaVoto && d.postura === 'Inclinado/a').reduce((acc, d) => {
      const p = d.probabilidadVotar === 'Alta' ? 0.80 : d.probabilidadVotar === 'Media' ? 0.50 : 0.25;
      return acc + (p * (parametros.porcentajeInclinados / 100));
    }, 0)
  );

  const proyeccionTotalFinal = votosEmitidosEstimados + proyectadosFaltantesAFavor + proyectadosFaltantesInclinados;
  
  // Escenario Piso (Muy Conservador)
  const escenarioPiso = votosSegurosEnUrna + Math.round(faltanAFavor * 0.7);

  // Escenario Techo (Optimista con movilización completa)
  const escenarioTecho = Math.round(
    votaronAFavor +
    (votaronInclinados * 0.9) +
    (votaronIndecisos * 0.5) +
    faltanAFavor +
    (faltanInclinados * 0.85) +
    (faltanIndecisos * 0.4)
  );

  // Porcentaje estimado de la lista sobre votos emitidos
  const porcentajeNuestraSobreEmitidos = yaVotaron > 0 ? (votosEmitidosEstimados / yaVotaron) * 100 : 0;

  // Desglose por Responsables del Padrón
  const responsablesStats = useMemo(() => {
    const map: Record<string, { total: number; votaron: number; aFavor: number; aFavorVotaron: number }> = {};
    docentes.forEach(d => {
      const resp = d.responsable || 'Sin asignar';
      if (!map[resp]) {
        map[resp] = { total: 0, votaron: 0, aFavor: 0, aFavorVotaron: 0 };
      }
      map[resp].total += 1;
      if (d.yaVoto) map[resp].votaron += 1;
      if (d.postura === 'A favor' || d.postura === 'Inclinado/a') {
        map[resp].aFavor += 1;
        if (d.yaVoto) map[resp].aFavorVotaron += 1;
      }
    });

    return Object.entries(map).map(([nombre, stat]) => ({
      nombre,
      ...stat,
      participacionPct: stat.total > 0 ? (stat.votaron / stat.total) * 100 : 0,
      pendientesAFavor: stat.aFavor - stat.aFavorVotaron,
    })).sort((a, b) => b.pendientesAFavor - a.pendientesAFavor);
  }, [docentes]);

  // Curva de votos por hora aproximada
  const horasRegistradas = useMemo(() => {
    const horasMap: Record<string, number> = {
      '08:00': 0, '09:00': 0, '10:00': 0, '11:00': 0, '12:00': 0,
      '13:00': 0, '14:00': 0, '15:00': 0, '16:00': 0, '17:00': 0, '18:00': 0
    };

    docentes.forEach(d => {
      if (d.yaVoto && d.horaVoto) {
        const h = d.horaVoto.split(':')[0] + ':00';
        if (horasMap[h] !== undefined) {
          horasMap[h] += 1;
        } else {
          horasMap['10:00'] += 1;
        }
      }
    });

    let acumulado = 0;
    return Object.entries(horasMap).map(([hora, cant]) => {
      acumulado += cant;
      return { hora, cantidad: cant, acumulado };
    });
  }, [docentes]);

  const dispararVictoria = () => {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.4 },
    });
  };

  const yaAlcanzoMeta = proyeccionTotalFinal >= votosNecesariosParaGanar;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Alert / Situation summary */}
      <div className={`p-4 rounded-2xl border transition shadow-sm ${
        yaAlcanzoMeta 
          ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border-emerald-500/40' 
          : 'bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 border-blue-500/30'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-3 rounded-xl ${
              yaAlcanzoMeta ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {yaAlcanzoMeta ? '🎉 Tendencia Favorable con Mayoría Proyectada' : '📊 Monitoreo de Tendencia y Control de Mesa'}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Padrón 284 docentes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {yaVotaron === 0 
                  ? 'La mesa acaba de abrir o no hay votos registrados hoy. Registrá votos desde la pestaña Boca de Urna o cargá una simulación.'
                  : `Se emitieron ${yaVotaron} votos (${porcentajeParticipacion.toFixed(1)}%). Nuestra lista proyecta ${proyeccionTotalFinal} votos (Meta estimada: ${votosNecesariosParaGanar} votos).`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {yaAlcanzoMeta && (
              <button
                onClick={dispararVictoria}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Celebrar Meta</span>
              </button>
            )}
            <button
              onClick={onGoToBocaUrna}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Vote className="w-4 h-4" />
              <span>Registrar Voto en Mesa</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Participación en Urna */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Participación en Urna</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{yaVotaron}</span>
            <span className="text-sm text-slate-400">/ {totalPadron}</span>
            <span className="ml-auto text-sm font-bold text-blue-400 font-mono">
              {porcentajeParticipacion.toFixed(1)}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, porcentajeParticipacion)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>Faltan votar: <b className="text-slate-200">{faltanVotar}</b></span>
            <span>Meta de cierre: ~{votantesFinalesEstimados}</span>
          </p>
        </div>

        {/* Card 2: Votos Estimados en Urna Hoy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Votos Ya en Urna (Est.)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">{votosEmitidosEstimados}</span>
            <span className="text-xs text-slate-400">votos nuestros</span>
            <span className="ml-auto text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
              {yaVotaron > 0 ? `${porcentajeNuestraSobreEmitidos.toFixed(0)}%` : '0%'} de votos
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>A favor confirmados:</span>
              <span className="font-bold text-emerald-300 font-mono">{votaronAFavor}</span>
            </div>
            <div className="flex justify-between">
              <span>Inclinados/as que votaron:</span>
              <span className="font-medium text-slate-300 font-mono">{votaronInclinados}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Proyección Final & Meta */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Proyección Total Final</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">{proyeccionTotalFinal}</span>
            <span className="text-xs text-slate-400">/ Meta {votosNecesariosParaGanar}</span>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
              proyeccionTotalFinal >= votosNecesariosParaGanar 
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' 
                : 'bg-amber-900/60 text-amber-300 border border-amber-700'
            }`}>
              {proyeccionTotalFinal >= votosNecesariosParaGanar ? 'Mayoría ✓' : `Faltan ${votosNecesariosParaGanar - proyeccionTotalFinal}`}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Escenario Piso (mínimo):</span>
              <span className="font-mono text-slate-300">{escenarioPiso}</span>
            </div>
            <div className="flex justify-between">
              <span>Escenario Techo (óptimo):</span>
              <span className="font-mono text-emerald-400">{escenarioTecho}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Operativo Ir a Buscar */}
        <div 
          onClick={onGoToIrABuscar}
          className="bg-slate-900 hover:bg-slate-850 border border-amber-600/40 rounded-2xl p-5 shadow-sm relative overflow-hidden cursor-pointer group transition"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              A Buscar Urgente
            </span>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-300 font-mono">
              {faltanAFavor + faltanInclinados}
            </span>
            <span className="text-xs text-slate-400">simpatizantes</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-2">
            {faltanAFavor} A favor y {faltanInclinados} Inclinados aún no se acercaron a votar.
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:text-amber-300">
            <span>Abrir lista de movilización</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Boca de Urna / Exit Poll + Comparativa de Escenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Boca de Urna & Tendencia Electoral Visual */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Vote className="w-5 h-5 text-indigo-400" />
                <span>Sondeo Boca de Urna & Tendencia Comparada</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Muestreo a la salida de las mesas de votación y proyección sobre votos emitidos
              </p>
            </div>
            
            <button
              onClick={() => setShowConfigSliders(!showConfigSliders)}
              className="text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 self-start cursor-pointer transition"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>{showConfigSliders ? 'Ocultar Ponderaciones' : 'Ajustar Ponderaciones'}</span>
            </button>
          </div>

          {/* Configuration Sliders (Collapsible) */}
          {showConfigSliders && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-4">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Parámetros de Conversión de Voto para la Proyección:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>% Inclinados a favor:</span>
                    <span className="font-mono font-bold text-indigo-300">{parametros.porcentajeInclinados}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="95"
                    step="5"
                    value={parametros.porcentajeInclinados}
                    onChange={e => actualizarParametros({ porcentajeInclinados: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>% Indecisos a favor:</span>
                    <span className="font-mono font-bold text-amber-300">{parametros.porcentajeIndecisosAFavor}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={parametros.porcentajeIndecisosAFavor}
                    onChange={e => actualizarParametros({ porcentajeIndecisosAFavor: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>% Sin contactar a favor:</span>
                    <span className="font-mono font-bold text-slate-300">{parametros.porcentajeSinContactarAFavor}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={parametros.porcentajeSinContactarAFavor}
                    onChange={e => actualizarParametros({ porcentajeSinContactarAFavor: Number(e.target.value) })}
                    className="w-full accent-slate-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Boca de Urna Summary Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Nuestra Lista: <strong className="text-white text-sm ml-1 font-mono">{pctExitNuestra.toFixed(1)}%</strong>
                <span className="text-slate-400">({exitNuestraTotal} respuestas)</span>
              </span>
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                Otra Lista / Rival: <strong className="text-rose-400 text-sm ml-1 font-mono">{pctExitOtra.toFixed(1)}%</strong>
                <span className="text-slate-400">({exitOtraTotal} respuestas)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-1"></span>
              </span>
            </div>

            {/* Split Progress Bar */}
            <div className="h-6 w-full bg-slate-800 rounded-xl overflow-hidden flex shadow-inner border border-slate-700/60 text-[11px] font-bold text-white leading-6 text-center">
              {exitTotalSondeo > 0 ? (
                <>
                  <div 
                    style={{ width: `${pctExitNuestra}%` }}
                    className="bg-blue-600 flex items-center justify-center transition-all duration-500 overflow-hidden"
                  >
                    {pctExitNuestra > 12 && `${pctExitNuestra.toFixed(0)}%`}
                  </div>
                  {exitBlancoTotal > 0 && (
                    <div 
                      style={{ width: `${(exitBlancoTotal / exitTotalSondeo) * 100}%` }}
                      className="bg-slate-500 flex items-center justify-center transition-all duration-500 overflow-hidden"
                      title={`Blanco / Anulado: ${exitBlancoTotal}`}
                    >
                      B
                    </div>
                  )}
                  <div 
                    style={{ width: `${pctExitOtra}%` }}
                    className="bg-rose-600 flex items-center justify-center transition-all duration-500 overflow-hidden"
                  >
                    {pctExitOtra > 12 && `${pctExitOtra.toFixed(0)}%`}
                  </div>
                </>
              ) : (
                <div className="w-full text-slate-400 font-normal italic flex items-center justify-center">
                  Sin respuestas de boca de urna aún. Registrá sondeos en la pestaña Boca de Urna.
                </div>
              )}
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Muestra total encuestada a boca de urna: <b>{exitTotalSondeo}</b> docentes</span>
              <span>Blanco / Nulos: <b>{exitBlancoTotal + conteoRapidoBocaUrna.anulado}</b></span>
            </div>
          </div>

          {/* Votos Emitidos: Desglose por postura de origen */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Composición de los {yaVotaron} votos emitidos según punteo previo:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold block">A favor</span>
                <span className="text-xl font-black text-emerald-300 font-mono">{votaronAFavor}</span>
                <span className="text-[10px] text-slate-400 block">de {totalAFavor} ({((votaronAFavor/totalAFavor)*100 || 0).toFixed(0)}%)</span>
              </div>

              <div className="bg-blue-950/40 border border-blue-800/60 p-2.5 rounded-lg">
                <span className="text-[10px] text-blue-400 uppercase font-semibold block">Inclinado/a</span>
                <span className="text-xl font-black text-blue-300 font-mono">{votaronInclinados}</span>
                <span className="text-[10px] text-slate-400 block">de {totalInclinados} ({((votaronInclinados/totalInclinados)*100 || 0).toFixed(0)}%)</span>
              </div>

              <div className="bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-lg">
                <span className="text-[10px] text-amber-400 uppercase font-semibold block">Indeciso/a</span>
                <span className="text-xl font-black text-amber-300 font-mono">{votaronIndecisos}</span>
                <span className="text-[10px] text-slate-400 block">de {totalIndecisos} ({((votaronIndecisos/totalIndecisos)*100 || 0).toFixed(0)}%)</span>
              </div>

              <div className="bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg">
                <span className="text-[10px] text-rose-400 uppercase font-semibold block">Otra opción</span>
                <span className="text-xl font-black text-rose-300 font-mono">{votaronOtraOpcion}</span>
                <span className="text-[10px] text-slate-400 block">de {totalOtraOpcion} ({((votaronOtraOpcion/totalOtraOpcion)*100 || 0).toFixed(0)}%)</span>
              </div>

              <div className="bg-slate-900 border border-slate-700/60 p-2.5 rounded-lg col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sin contactar</span>
                <span className="text-xl font-black text-slate-300 font-mono">{votaronSinContactar}</span>
                <span className="text-[10px] text-slate-400 block">de {totalSinContactar}</span>
              </div>
            </div>
          </div>

          {/* Curva Horaria de Sufragio */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Ritmo de votación por franja horaria:</span>
              <span className="text-slate-400 font-normal text-[11px]">8:00 hs a 18:00 hs</span>
            </h4>
            <div className="grid grid-cols-11 gap-1 h-24 items-end pt-4 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
              {horasRegistradas.map((item, idx) => {
                const maxHora = Math.max(...horasRegistradas.map(h => h.cantidad), 1);
                const heightPct = Math.round((item.cantidad / maxHora) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                    <div 
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                      className={`w-full rounded-t transition-all ${
                        item.cantidad > 0 ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-slate-800'
                      }`}
                    />
                    <span className="text-[9px] text-slate-400 mt-1 font-mono truncate w-full text-center">
                      {item.hora.split(':')[0]}h
                    </span>
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                      {item.cantidad} votos ({item.acumulado} acum.)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Priority Responsibles to Mobilize */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Responsables con Votos x Traer</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Integrantes del padrón con más simpatizantes pendientes de emitir su voto
              </p>
            </div>

            <div className="divide-y divide-slate-800/80 mt-3 max-h-[380px] overflow-y-auto pr-1">
              {responsablesStats.slice(0, 8).map((resp, idx) => (
                <div key={idx} className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200 truncate max-w-[180px]" title={resp.nombre}>
                      👤 {resp.nombre}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-amber-400">
                      {resp.pendientesAFavor > 0 ? `${resp.pendientesAFavor} x venir` : 'Al día ✓'}
                    </span>
                  </div>
                  
                  {/* Progress bar of turnout for this responsible */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${resp.participacionPct >= 60 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, resp.participacionPct)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Votaron: {resp.votaron} de {resp.total} ({resp.participacionPct.toFixed(0)}%)</span>
                    <span>A favor en urna: {resp.aFavorVotaron}/{resp.aFavor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={onGoToIrABuscar}
              className="w-full bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 text-amber-300 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Ver Lista Nominal "Ir a Buscar"</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
