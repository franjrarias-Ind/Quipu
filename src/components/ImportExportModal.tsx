import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { Docente } from '../types/election';
import { Download, Upload, RotateCcw, Sparkles, Check, AlertTriangle, FileText, Database } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { 
    docentes, 
    exportarCSV, 
    importarDatos, 
    reiniciarJornada, 
    reiniciarTodoPadrón, 
    cargarSimulacionComicios 
  } = useElection();

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'mantenimiento'>('export');
  const [csvPasteText, setCsvPasteText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(docentes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ESMN_Padron_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          importarDatos(parsed);
          setImportStatus(`✓ Se importaron exitosamente ${parsed.length} docentes desde el archivo JSON.`);
          confetti({ particleCount: 50, spread: 60 });
        } else {
          setImportStatus('Error: El formato JSON no contiene una lista válida de docentes.');
        }
      } catch (err) {
        setImportStatus('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportCSVText = () => {
    if (!csvPasteText.trim()) return;

    try {
      const lines = csvPasteText.trim().split('\n');
      if (lines.length < 2) {
        setImportStatus('Error: El texto pegado debe tener encabezados y al menos una fila.');
        return;
      }

      // Parsea CSV simple
      const newDocentes: Docente[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map(s => s.replace(/^"|"$/g, '').trim());
        
        if (parts.length >= 2) {
          const id = Number(parts[0]) || i;
          const nroEmpl = parts[1] || '';
          const nombre = parts[2] || `Docente ${i}`;
          const dni = parts[3] || '';
          const responsable = parts[4] || 'Sin asignar';
          const postura = (parts[5] as Docente['postura']) || 'Sin contactar';
          const prob = (parts[6] as Docente['probabilidadVotar']) || 'Media';
          const yaVoto = parts[7] === 'SI' || parts[7] === 'VERDADERO' || parts[7] === 'true';

          newDocentes.push({
            id,
            nroEmpl,
            nombre,
            dni,
            responsable,
            postura: ['A favor', 'Inclinado/a', 'Indeciso/a', 'Otra opción', 'Sin contactar'].includes(postura) ? postura : 'Sin contactar',
            probabilidadVotar: ['Alta', 'Media', 'Baja'].includes(prob) ? prob : 'Media',
            yaVoto,
            horaVoto: yaVoto ? '10:00' : undefined,
            bocaDeUrna: 'No encuestado',
            notas: parts[8] || undefined,
            avisoMovilizacion: yaVoto ? 'Votó' : 'Pendiente',
          });
        }
      }

      if (newDocentes.length > 0) {
        importarDatos(newDocentes);
        setImportStatus(`✓ Se importaron ${newDocentes.length} docentes desde el texto CSV.`);
        setCsvPasteText('');
        confetti({ particleCount: 50, spread: 60 });
      }
    } catch (e) {
      setImportStatus('Error al procesar el texto CSV.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Datos, Exportación y Respaldos ESMN
              </h2>
              <p className="text-xs text-slate-400">
                Gestión de planilla, sincronización con Excel y herramientas de simulacro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status notification */}
        {importStatus && (
          <div className="bg-blue-950/70 border border-blue-500/50 text-blue-200 text-xs p-3 rounded-xl flex items-center justify-between">
            <span>{importStatus}</span>
            <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'export' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Exportar Padrón y Resultados
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'import' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Importar o Actualizar
          </button>
          <button
            onClick={() => setActiveTab('mantenimiento')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'mantenimiento' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Herramientas y Simulacro
          </button>
        </div>

        {/* Tab 1: Export */}
        {activeTab === 'export' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Descargá el estado actual del punteo y la boca de urna para abrir en Excel o compartir con los fiscales generales:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={exportarCSV}
                className="p-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-700/80 text-left transition flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition" />
                </div>
                <div>
                  <strong className="text-white block text-sm font-semibold mb-1">
                    Exportar Planilla CSV (Excel)
                  </strong>
                  <span className="text-slate-400 text-[11px] leading-relaxed">
                    Incluye los 284 docentes con postura, si ya votó, hora de voto, notas y responsable.
                  </span>
                </div>
              </button>

              <button
                onClick={handleExportJSON}
                className="p-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-700/80 text-left transition flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                  <FileText className="w-5 h-5 group-hover:-translate-y-0.5 transition" />
                </div>
                <div>
                  <strong className="text-white block text-sm font-semibold mb-1">
                    Copia de Seguridad JSON
                  </strong>
                  <span className="text-slate-400 text-[11px] leading-relaxed">
                    Respaldo completo de la base de datos para restaurar en otro dispositivo o navegador.
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Import */}
        {activeTab === 'import' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">
                Opción A: Subir archivo JSON de respaldo
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSONFile}
                className="w-full text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-700"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-slate-300 font-semibold">
                Opción B: Pegar datos CSV (formato separado por comas)
              </label>
              <textarea
                rows={4}
                value={csvPasteText}
                onChange={e => setCsvPasteText(e.target.value)}
                placeholder="ID,Nombre,Departamento,Responsable,Postura,Probabilidad,PadronOriginal,YaVoto,Notas&#10;1,Arias Juan,Piano,Martín,A favor,Alta,SI,NO,Pidió propuesta escrita"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono text-[11px] focus:outline-none"
              />
              <button
                onClick={handleImportCSVText}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl transition cursor-pointer text-xs"
              >
                Cargar texto CSV
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Maintenance & Simulation */}
        {activeTab === 'mantenimiento' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <strong className="text-white block font-semibold text-sm mb-0.5">
                  Simulación de Jornada Electoral
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Carga un estado realista con el 54% del padrón ya votado y respuestas de boca de urna, ideal para ver cómo funcionan las curvas y gráficos de tendencia.
                </p>
              </div>
              <button
                onClick={() => {
                  cargarSimulacionComicios();
                  setImportStatus('✓ Simulación cargada: 54% de docentes ya votaron.');
                  confetti({ particleCount: 50 });
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-2 rounded-xl shrink-0 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ejecutar Simulación</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <strong className="text-amber-300 block font-semibold text-sm mb-0.5">
                  Reiniciar Votos del Día a Cero
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Limpia la columna "¿Votó?" y los contadores de boca de urna para arrancar el día de votación desde cero. Mantiene los contactos, responsables y notas previas del punteo.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Poner los votos emitidos hoy en cero?')) {
                    reiniciarJornada();
                    setImportStatus('✓ Votos de la jornada reiniciados a cero.');
                  }
                }}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold px-3 py-2 rounded-xl shrink-0 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Jornada</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-start justify-between gap-3">
              <div>
                <strong className="text-rose-300 block font-semibold text-sm mb-0.5">
                  Restablecer Padrón de Fábrica (284 docentes ESMN)
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Restablece todos los datos al estado original inicial de la Escuela Superior de Música de Neuquén.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Restablecer todo el padrón al estado inicial?')) {
                    reiniciarTodoPadrón();
                    setImportStatus('✓ Padrón restablecido a 284 docentes originales.');
                  }
                }}
                className="bg-rose-900/60 hover:bg-rose-800 text-white font-semibold px-3 py-2 rounded-xl shrink-0 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restablecer Todo</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
