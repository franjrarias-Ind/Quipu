import React, { useState, useMemo } from 'react';
import { useElection } from '../context/ElectionContext';
import { Docente, BocaUrnaOpcion } from '../types/election';
import { 
  Search, 
  CheckCircle, 
  RotateCcw, 
  Vote, 
  Plus, 
  Minus, 
  Clock, 
  Sparkles,
  AlertCircle,
  Filter,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const BocaDeUrnaView: React.FC = () => {
  const { 
    docentes, 
    marcarVoto, 
    actualizarBocaUrna,
    conteoRapidoBocaUrna, 
    incrementarConteoRapido, 
    decrementarConteoRapido 
  } = useElection();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'todos' | 'noVotaron' | 'yaVotaron'>('todos');
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Filtrado ultra rápido
  const filteredDocentes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return docentes.filter(d => {
      // Filtro de estado
      if (filterState === 'noVotaron' && d.yaVoto) return false;
      if (filterState === 'yaVotaron' && !d.yaVoto) return false;

      if (!term) return true;

      // Buscar por ID, nombre, DNI, N° Legajo, responsable
      const matchId = String(d.id) === term;
      const matchNombre = d.nombre.toLowerCase().includes(term);
      const matchDni = (d.dni || '').toLowerCase().includes(term);
      const matchEmpl = (d.nroEmpl || '').toLowerCase().includes(term);
      const matchResp = d.responsable.toLowerCase().includes(term);

      return matchId || matchNombre || matchDni || matchEmpl || matchResp;
    });
  }, [docentes, searchTerm, filterState]);

  // Últimos 8 que votaron
  const ultimosVotaron = useMemo(() => {
    return docentes
      .filter(d => d.yaVoto && d.horaVoto)
      .slice(-8)
      .reverse();
  }, [docentes]);

  const handleMarcarVoto = (doc: Docente, nuevoEstado: boolean) => {
    marcarVoto(doc.id, nuevoEstado);
    if (nuevoEstado) {
      setLastActionMessage(`✓ Se registró el voto de ${doc.nombre} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`);
      if (doc.postura === 'A favor') {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.6 },
        });
      }
    } else {
      setLastActionMessage(`↩ Se deshizo el voto de ${doc.nombre}`);
    }

    setTimeout(() => {
      setLastActionMessage(null);
    }, 4000);
  };

  const getPosturaBadge = (postura: Docente['postura']) => {
    switch (postura) {
      case 'A favor':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">A favor</span>;
      case 'Inclinado/a':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Inclinado/a</span>;
      case 'Indeciso/a':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Indeciso/a</span>;
      case 'Otra opción':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Otra opción</span>;
      default:
        return <span className="bg-slate-700/60 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-full">Sin contactar</span>;
    }
  };

  // Resumen del sondeo express
  const totalExpress = conteoRapidoBocaUrna.nuestraLista + conteoRapidoBocaUrna.otraLista + conteoRapidoBocaUrna.enBlanco;
  const pctExpressNuestra = totalExpress > 0 ? ((conteoRapidoBocaUrna.nuestraLista / totalExpress) * 100).toFixed(1) : '0';
  const pctExpressOtra = totalExpress > 0 ? ((conteoRapidoBocaUrna.otraLista / totalExpress) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Action Notification Banner */}
      {lastActionMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{lastActionMessage}</span>
          </div>
          <button 
            onClick={() => setLastActionMessage(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* TOP SECTION: Quick Boca de Urna Counter (Express Counter for volunteers outside) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Vote className="w-5 h-5 text-indigo-400" />
              <span>Contador Express de Boca de Urna (A pie de escuela)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Para fiscales que encuestan a docentes al salir del cuarto oscuro sin buscar por nombre
            </p>
          </div>
          <div className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/80 text-slate-300 flex items-center gap-2">
            <span>Total sondeos rápidos: <b className="font-mono text-white">{totalExpress}</b></span>
            <span className="text-indigo-400 font-bold font-mono">({pctExpressNuestra}% Nuestra / {pctExpressOtra}% Otra)</span>
          </div>
        </div>

        {/* Buttons Grid for Fast Tap Counting */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Nuestra Lista */}
          <div className="bg-gradient-to-b from-blue-900/40 to-slate-900 border-2 border-blue-600/70 rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Nuestra Lista</span>
            <span className="text-3xl font-black text-white font-mono my-1">
              {conteoRapidoBocaUrna.nuestraLista}
            </span>
            <div className="flex items-center gap-2 w-full mt-1">
              <button
                onClick={() => decrementarConteoRapido('nuestraLista')}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                title="Restar 1"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  incrementarConteoRapido('nuestraLista');
                  confetti({ particleCount: 20, spread: 35, origin: { y: 0.7 } });
                }}
                className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1 transition shadow cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+1 Voto</span>
              </button>
            </div>
          </div>

          {/* Otra Lista */}
          <div className="bg-gradient-to-b from-rose-900/30 to-slate-900 border border-rose-800/60 rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Otra Lista / Opositora</span>
            <span className="text-3xl font-black text-rose-200 font-mono my-1">
              {conteoRapidoBocaUrna.otraLista}
            </span>
            <div className="flex items-center gap-2 w-full mt-1">
              <button
                onClick={() => decrementarConteoRapido('otraLista')}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                title="Restar 1"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => incrementarConteoRapido('otraLista')}
                className="flex-1 h-9 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold flex items-center justify-center gap-1 transition shadow cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+1 Voto</span>
              </button>
            </div>
          </div>

          {/* Blanco / Anulado */}
          <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Blanco / Anulado</span>
            <span className="text-3xl font-black text-slate-300 font-mono my-1">
              {conteoRapidoBocaUrna.enBlanco + conteoRapidoBocaUrna.anulado}
            </span>
            <div className="flex items-center gap-2 w-full mt-1">
              <button
                onClick={() => decrementarConteoRapido('enBlanco')}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                title="Restar 1"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => incrementarConteoRapido('enBlanco')}
                className="flex-1 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium flex items-center justify-center gap-1 transition shadow cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+1 Blanco</span>
              </button>
            </div>
          </div>

          {/* No contesta */}
          <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Prefiere no decir</span>
            <span className="text-3xl font-black text-slate-400 font-mono my-1">
              {conteoRapidoBocaUrna.noSabeNoContesta}
            </span>
            <div className="flex items-center gap-2 w-full mt-1">
              <button
                onClick={() => decrementarConteoRapido('noSabeNoContesta')}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer"
                title="Restar 1"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => incrementarConteoRapido('noSabeNoContesta')}
                className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center justify-center gap-1 transition shadow cursor-pointer text-sm border border-slate-700"
              >
                <Plus className="w-4 h-4" />
                <span>+1 NS/NC</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SEARCH AND DIRECT TABLE VOTING (Nominal Check-in) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Header and Search bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Control de Urna Nominal (¿Votó en mesa?)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Buscá por Apellido, Nombre o N° de orden para tildar el voto en tiempo real
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar docente o N° de orden..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500"
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
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Mostrar:
            </span>
            <button
              onClick={() => setFilterState('todos')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterState === 'todos' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({docentes.length})
            </button>
            <button
              onClick={() => setFilterState('noVotaron')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterState === 'noVotaron' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Faltan votar ({docentes.filter(d => !d.yaVoto).length})
            </button>
            <button
              onClick={() => setFilterState('yaVotaron')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterState === 'yaVotaron' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Ya votaron ({docentes.filter(d => d.yaVoto).length})
            </button>
          </div>

          <span className="text-slate-400 text-[11px]">
            {filteredDocentes.length} docentes listados
          </span>
        </div>

        {/* List of Teachers to Mark Vote */}
        <div className="divide-y divide-slate-800/80 max-h-[520px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40">
          {filteredDocentes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No se encontraron docentes con el término "{searchTerm}".
            </div>
          ) : (
            filteredDocentes.map(doc => {
              return (
                <div 
                  key={doc.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    doc.yaVoto ? 'bg-emerald-950/20' : 'hover:bg-slate-850'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold bg-slate-800 text-slate-300 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-700/60">
                      #{doc.id}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {doc.nombre}
                        </span>
                        {getPosturaBadge(doc.postura)}
                        {doc.yaVoto && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {doc.horaVoto || 'Votó'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        {doc.dni && <span>🪪 DNI: <strong className="text-slate-300 font-mono">{doc.dni}</strong></span>}
                        {doc.nroEmpl && <span>🏷️ Legajo: <strong className="text-slate-300 font-mono">{doc.nroEmpl}</strong></span>}
                        <span>👤 Resp: <strong className="text-slate-300">{doc.responsable}</strong></span>
                        {doc.notas && (
                          <span className="text-amber-300/80 italic truncate max-w-xs" title={doc.notas}>
                            💬 "{doc.notas}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions (Mark Vote + Exit Poll Survey) */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    
                    {/* If voted, allow recording exit poll choice */}
                    {doc.yaVoto && (
                      <select
                        value={doc.bocaDeUrna || 'No encuestado'}
                        onChange={e => actualizarBocaUrna(doc.id, e.target.value as BocaUrnaOpcion)}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                        title="Registrar respuesta voluntaria a salida de urna"
                      >
                        <option value="No encuestado">Sondeo: No encuestado</option>
                        <option value="Nuestra Lista">Sondeo: Nuestra Lista</option>
                        <option value="Otra Lista">Sondeo: Otra Lista</option>
                        <option value="Blanco">Sondeo: Blanco / Nulo</option>
                        <option value="No contesta">Sondeo: No contesta</option>
                      </select>
                    )}

                    {/* Big Action Button */}
                    {doc.yaVoto ? (
                      <button
                        onClick={() => handleMarcarVoto(doc, false)}
                        className="bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                        title="Deshacer marca de voto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Deshacer</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarcarVoto(doc, true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>¡VOTÓ!</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RECENT VOTERS FEED */}
      {ultimosVotaron.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Últimos votos registrados en vivo:</span>
          </h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {ultimosVotaron.map(d => (
              <div 
                key={d.id} 
                className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2"
              >
                <span className="font-mono text-emerald-400 font-bold">{d.horaVoto}</span>
                <span className="text-white font-medium">{d.nombre}</span>
                {getPosturaBadge(d.postura)}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
