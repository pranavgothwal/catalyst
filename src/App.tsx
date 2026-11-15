import React, { useState } from 'react';
import { useCare } from './context/CareContext';
import { ElderTodayView } from './components/ElderTodayView';
import { FamilyCoordinationView } from './components/FamilyCoordinationView';
import { CaregiverShiftView } from './components/CaregiverShiftView';
import { SharedTimelineView } from './components/SharedTimelineView';
import { DemoClockControl } from './components/DemoClockControl';
import {
  History,
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  HeartHandshake,
  Menu,
  X,
} from 'lucide-react';
import { CareLoop } from './types';

export const App: React.FC = () => {
  const { currentProfile, careLoops, profiles, switchProfile } = useCare();
  const [activeView, setActiveView] = useState<'role_view' | 'timeline'>('role_view');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openLoopsCount = careLoops.filter((l: CareLoop) => l.status !== 'resolved').length;

  const roleIcon =
    currentProfile.role === 'elder'
      ? LayoutDashboard
      : currentProfile.role === 'family'
      ? AlertTriangle
      : ClipboardList;

  const roleViewLabel =
    currentProfile.role === 'elder'
      ? 'Today'
      : currentProfile.role === 'family'
      ? 'Care Loops'
      : 'My Shift';

  const roleBadgeColor =
    currentProfile.role === 'elder'
      ? 'bg-sage-600/30 text-sage-200'
      : currentProfile.role === 'family'
      ? 'bg-amber-500/20 text-amber-200'
      : 'bg-blue-500/20 text-blue-200';

  const NavItems = () => (
    <>
      <button
        onClick={() => {
          setActiveView('role_view');
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          activeView === 'role_view'
            ? 'bg-sage-600/30 text-ivory-100'
            : 'text-sage-200 hover:bg-forest-800/50 hover:text-ivory-100'
        }`}
      >
        {React.createElement(roleIcon, { className: 'w-4 h-4 flex-shrink-0' })}
        <span>{roleViewLabel}</span>
        {activeView === 'role_view' && currentProfile.role === 'family' && openLoopsCount > 0 && (
          <span className="ml-auto bg-amber-500 text-ivory-100 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {openLoopsCount}
          </span>
        )}
      </button>
      <button
        onClick={() => {
          setActiveView('timeline');
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          activeView === 'timeline'
            ? 'bg-sage-600/30 text-ivory-100'
            : 'text-sage-200 hover:bg-forest-800/50 hover:text-ivory-100'
        }`}
      >
        <History className="w-4 h-4 flex-shrink-0" />
        <span>Care Timeline</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-ivory-100 text-forest-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-forest-950/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-forest-900 flex flex-col z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-forest-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sage-500/20 border border-sage-500/40 flex items-center justify-center text-sage-200 flex-shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-ivory-100 tracking-tight">AlwaysWithYOU</div>
              <div className="text-[10px] text-sage-300">Care that stays with you</div>
            </div>
            <button
              className="ml-auto md:hidden text-sage-300 hover:text-ivory-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current context */}
        <div className="px-5 py-3 border-b border-forest-800">
          <div className="text-[10px] text-sage-400 uppercase tracking-widest mb-1.5">Care Recipient</div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sage-600/40 border border-sage-500/30 flex items-center justify-center text-xs font-bold text-sage-200">
              S
            </div>
            <div>
              <div className="text-xs font-bold text-ivory-100">Sheela Verma</div>
              <div className="text-[10px] text-sage-300">82 · Mumbai</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="text-[10px] text-sage-400 uppercase tracking-widest px-3 mb-2">Navigation</div>
          <NavItems />
        </nav>

        {/* Persona switcher */}
        <div className="border-t border-forest-800 p-3 space-y-1">
          <div className="text-[10px] text-sage-400 uppercase tracking-widest px-2 mb-2">Switch Persona</div>
          {profiles.map((p) => {
            const isActive = currentProfile.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => switchProfile(p.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
                  isActive ? 'bg-sage-600/30 ring-1 ring-sage-500/50' : 'hover:bg-forest-800/50'
                }`}
              >
                <img
                  src={p.avatar}
                  alt={p.fullName}
                  className="w-7 h-7 rounded-full object-cover border border-ivory-100/20 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`;
                  }}
                />
                <div className="flex-1 text-left min-w-0">
                  <div
                    className={`text-xs font-bold truncate ${isActive ? 'text-ivory-100' : 'text-sage-200'}`}
                  >
                    {p.fullName.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-sage-400 capitalize">{p.role}</div>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-sage-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-forest-900 border-b border-forest-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="text-sage-300 hover:text-ivory-100 p-1">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-sm text-ivory-100">AlwaysWithYOU</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${roleBadgeColor}`}>
          {currentProfile.role}
        </span>
      </div>

      {/* Main content */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-8 min-h-screen">
        {activeView === 'timeline' ? (
          <SharedTimelineView />
        ) : (
          <>
            {currentProfile.role === 'elder' && <ElderTodayView />}
            {currentProfile.role === 'family' && <FamilyCoordinationView />}
            {currentProfile.role === 'caregiver' && <CaregiverShiftView />}
          </>
        )}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-forest-900 border-t border-forest-800 flex">
        <button
          onClick={() => setActiveView('role_view')}
          className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-[10px] font-bold transition-colors ${
            activeView === 'role_view' ? 'text-sage-300' : 'text-sage-500'
          }`}
        >
          {React.createElement(roleIcon, { className: 'w-5 h-5' })}
          {roleViewLabel}
        </button>
        <button
          onClick={() => setActiveView('timeline')}
          className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-[10px] font-bold transition-colors ${
            activeView === 'timeline' ? 'text-sage-300' : 'text-sage-500'
          }`}
        >
          <History className="w-5 h-5" />
          Timeline
        </button>
      </div>

      {/* Demo clock - floating */}
      <DemoClockControl />

      {/* Footer - only visible on desktop */}
      <footer className="hidden md:block md:ml-64 border-t border-forest-900/10 py-4 px-6 bg-ivory-50 text-xs text-forest-800/70 text-center">
        <p className="font-semibold text-forest-900">AlwaysWithYOU — Human-centred Care Continuity System</p>
      </footer>
    </div>
  );
};
