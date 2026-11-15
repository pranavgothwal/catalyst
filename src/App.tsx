import React, { useState } from 'react';
import { useCare } from './context/CareContext';
import { ElderTodayView } from './components/ElderTodayView';
import { FamilyCoordinationView } from './components/FamilyCoordinationView';
import { CaregiverShiftView } from './components/CaregiverShiftView';
import { SharedTimelineView } from './components/SharedTimelineView';
import { PersonaSwitcher } from './components/PersonaSwitcher';
import { DemoClockControl } from './components/DemoClockControl';
import { History, LayoutDashboard } from 'lucide-react';
import { CareLoop } from './types';

export const App: React.FC = () => {
  const { currentProfile, careLoops } = useCare();
  const [activeMainTab, setActiveMainTab] = useState<'role_view' | 'timeline'>('role_view');

  const openLoopsCount = careLoops.filter((l: CareLoop) => l.status !== 'resolved').length;

  return (
    <div className="min-h-screen flex flex-col bg-ivory-100 text-forest-900 selection:bg-sage-200">
      {/* Top Banner: One-Click Persona & Role Switcher */}
      <PersonaSwitcher />

      {/* Main Navigation Subheader */}
      <header className="bg-ivory-50 border-b border-forest-900/10 px-4 py-3 sticky top-[57px] z-30 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-forest-900 hidden sm:inline">
              Viewing as:
            </span>
            <span className="text-xs font-bold uppercase tracking-wider bg-sage-200 text-forest-900 px-3 py-1 rounded-xl">
              {currentProfile.role.toUpperCase()} — {currentProfile.fullName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMainTab('role_view')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeMainTab === 'role_view'
                  ? 'bg-forest-900 text-ivory-100 shadow'
                  : 'text-forest-800 hover:text-forest-950 hover:bg-ivory-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Role View
            </button>
            <button
              onClick={() => setActiveMainTab('timeline')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeMainTab === 'timeline'
                  ? 'bg-forest-900 text-ivory-100 shadow'
                  : 'text-forest-800 hover:text-forest-950 hover:bg-ivory-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Care Timeline
            </button>
          </div>
        </div>
      </header>

      {/* Main Role-Aware Workspace */}
      <main className="flex-1 pb-24">
        {activeMainTab === 'timeline' ? (
          <SharedTimelineView />
        ) : (
          <>
            {currentProfile.role === 'elder' && <ElderTodayView />}
            {currentProfile.role === 'family' && <FamilyCoordinationView />}
            {currentProfile.role === 'caregiver' && <CaregiverShiftView />}
          </>
        )}
      </main>

      {/* Persistent Deterministic Demo Clock Controller */}
      <DemoClockControl />

      {/* Accessible Footer */}
      <footer className="border-t border-forest-900/10 py-6 px-4 bg-ivory-50 text-xs text-forest-800/70 text-center space-y-1">
        <p className="font-semibold text-forest-900">
          AlwaysWithYOU — Human-centred Care Continuity System
        </p>
        <p>
          Care that stays with you, every step of the way. Built for Google Hackathon.
        </p>
      </footer>
    </div>
  );
};
