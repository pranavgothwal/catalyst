import React from 'react';
import { useCare } from '../context/CareContext';
import { Users, HeartHandshake, Shield, Sparkles } from 'lucide-react';

export const PersonaSwitcher: React.FC = () => {
  const { currentProfile, profiles, switchProfile } = useCare();

  return (
    <div className="bg-forest-900 border-b border-forest-800 text-ivory-100 py-2.5 px-4 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-sage-500/20 border border-sage-500/40 flex items-center justify-center text-sage-200">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-ivory-100">
                AlwaysWithYOU
              </span>
              <span className="text-[10px] bg-sage-600/40 text-sage-200 px-2 py-0.5 rounded-full border border-sage-500/30 font-medium">
                Care Loops Platform
              </span>
            </div>
            <p className="text-[11px] text-sage-200 hidden sm:block">
              Care that stays with you, every step of the way.
            </p>
          </div>
        </div>

        {/* 1-Click Role Switcher */}
        <div className="flex items-center gap-1.5 bg-forest-800/80 p-1 rounded-xl border border-forest-800">
          <span className="text-xs text-sage-200 px-2 font-medium hidden md:inline">
            Role Persona:
          </span>
          {profiles.map((p) => {
            const isActive = currentProfile.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => switchProfile(p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sage-600 text-ivory-100 shadow-md scale-100'
                    : 'text-sage-200 hover:text-ivory-100 hover:bg-forest-800/50'
                }`}
                title={p.fullName}
              >
                <img
                  src={p.avatar}
                  alt={p.fullName}
                  className="w-5 h-5 rounded-full object-cover border border-ivory-100/30"
                />
                <span>{p.fullName.split(' ')[0]}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                    isActive ? 'bg-forest-900/60 text-ivory-100' : 'bg-forest-950/40 text-sage-200'
                  }`}
                >
                  {p.role}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
