import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, set, onValue } from "https://gstatic.com";

// Vercel leerá automáticamente el VALUE que pegaste en su panel
const firebaseConfig = {
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://console.firebase.google.com/"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ElectionProvider } from './context/ElectionContext';
import { Header } from './components/Header';
import { DashboardPonderado } from './components/DashboardPonderado';
import { BocaDeUrnaTabla } from './components/BocaDeUrnaTabla';

export default function App() {
  return (
    <ElectionProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Navigation Bar */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Top Weighted Dashboard & Tendency */}
          <DashboardPonderado />

          {/* Boca de Urna by Category (Quien votó y quien no) */}
          <BocaDeUrnaTabla />
        </main>

        {/* Subtle Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
          ESMN · Sistema de Boca de Urna y Ponderación Electoral (Docentes 35% · Estudiantes 35% · TAE 15% · Graduados 15%)
        </footer>
      </div>
    </ElectionProvider>
  );
}
