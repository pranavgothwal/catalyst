import React, { useState } from 'react';
import { useCare } from '../context/CareContext';
import { Clock, Play, RotateCcw, FastForward, AlertTriangle } from 'lucide-react';

export const DemoClockControl: React.FC = () => {
  const { demoTime, advanceMinutes, resetDemoClock, isClockSimulated, careLoops } = useCare();
  const [isOpen, setIsOpen] = useState(true);

  const formattedTime = demoTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = demoTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const openLoopsCount = careLoops.filter((l) => l.status !== 'resolved').length;

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-forest-900 border-2 border-forest-800 text-ivory-100 rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-2.5 hover:bg-forest-800 transition-all cursor-pointer backdrop-blur-md bg-opacity-95"
          title="Click to open Demo Clock controls"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isClockSimulated ? 'bg-amber-500' : 'bg-sage-500'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isClockSimulated ? 'bg-amber-500' : 'bg-sage-500'
              }`}
            ></span>
          </span>
          <Clock className="w-4 h-4 text-sage-200" />
          <span className="text-xs font-bold text-ivory-100">{formattedTime}</span>
          {openLoopsCount > 0 && (
            <span className="bg-amber-500 text-ivory-100 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {openLoopsCount}
            </span>
          )}
        </button>
      ) : (
        <div className="bg-forest-900 border-2 border-forest-800 text-ivory-100 rounded-2xl shadow-2xl p-4 w-72 sm:w-80 backdrop-blur-md bg-opacity-95 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-forest-800">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isClockSimulated ? 'bg-amber-500' : 'bg-sage-500'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isClockSimulated ? 'bg-amber-500' : 'bg-sage-500'
                  }`}
                ></span>
              </span>
              <span className="font-bold text-xs uppercase tracking-wider text-sage-200">
                Deterministic Demo Clock
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-sage-200 hover:text-ivory-100 underline"
            >
              Minimize
            </button>
          </div>

          <div className="pt-3 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-black text-ivory-100 tracking-tight flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-sage-200" />
                  {formattedTime}
                </div>
                <div className="text-xs text-sage-200">{formattedDate}</div>
              </div>
              {openLoopsCount > 0 && (
                <div className="flex items-center gap-1 bg-terracotta-500/20 text-terracotta-500 px-2.5 py-1 rounded-full text-xs font-bold border border-terracotta-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {openLoopsCount} Active Loop{openLoopsCount > 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="text-[11px] text-sage-200 leading-snug">
              Advances the state engine: dose grace periods, triggers Care Loops, and escalates
              lapses deterministically.
            </div>

            {/* Quick Advance Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => advanceMinutes(15)}
                className="bg-forest-800 hover:bg-forest-950 text-ivory-100 text-xs font-semibold py-2 px-2.5 rounded-xl border border-sage-500/30 transition-all flex items-center justify-center gap-1 hover:border-sage-500 active:scale-95"
              >
                <FastForward className="w-3 h-3 text-sage-200" />
                +15m
              </button>
              <button
                onClick={() => advanceMinutes(45)}
                className="bg-forest-800 hover:bg-forest-950 text-amber-500 text-xs font-semibold py-2 px-2.5 rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-1 hover:border-amber-500 active:scale-95"
              >
                <Play className="w-3 h-3" />
                +45m (Miss)
              </button>
              <button
                onClick={() => advanceMinutes(120)}
                className="bg-forest-800 hover:bg-forest-950 text-terracotta-500 text-xs font-semibold py-2 px-2.5 rounded-xl border border-terracotta-500/40 transition-all flex items-center justify-center gap-1 hover:border-terracotta-500 active:scale-95"
              >
                <AlertTriangle className="w-3 h-3" />
                +2h (Escalate)
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-sage-200">
                {isClockSimulated ? 'Simulated clock active' : 'Live initial clock'}
              </span>
              <button
                onClick={resetDemoClock}
                className="text-xs text-sage-200 hover:text-ivory-100 flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                Reset 9:15 AM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
