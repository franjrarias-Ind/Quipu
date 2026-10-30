/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ElectionProvider } from './context/ElectionContext';
import { Header } from './components/Header';
import { DashboardTendencia } from './components/DashboardTendencia';
import { BocaDeUrnaView } from './components/BocaDeUrnaView';
import { PunteoView } from './components/PunteoView';
import { IrABuscarView } from './components/IrABuscarView';
import { EquipoView } from './components/EquipoView';
import { ImportExportModal } from './components/ImportExportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tendencia' | 'bocaUrna' | 'punteo' | 'irABuscar' | 'equipo'>('tendencia');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ElectionProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        
        {/* Navigation & Live Header */}
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenModal={() => setIsModalOpen(true)} 
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {activeTab === 'tendencia' && (
            <DashboardTendencia 
              onGoToBocaUrna={() => setActiveTab('bocaUrna')} 
              onGoToIrABuscar={() => setActiveTab('irABuscar')} 
            />
          )}

          {activeTab === 'bocaUrna' && (
            <BocaDeUrnaView />
          )}

          {activeTab === 'punteo' && (
            <PunteoView />
          )}

          {activeTab === 'irABuscar' && (
            <IrABuscarView />
          )}

          {activeTab === 'equipo' && (
            <EquipoView />
          )}
        </main>

        {/* Persistent Footer with operational tips */}
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-3 text-xs mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300 font-medium">ESMN · Punteo Docente & Boca de Urna</span>
              <span>— Datos guardados localmente en este navegador</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Padrón: 284 docentes</span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
              >
                Copia de Seguridad / Exportar CSV
              </button>
            </div>
          </div>
        </footer>

        {/* Import/Export & Simulation Modal */}
        <ImportExportModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />

      </div>
    </ElectionProvider>
  );
}
