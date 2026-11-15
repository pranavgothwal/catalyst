import React, { useState } from 'react';
import { useCare } from '../context/CareContext';
import { CaregiverHandover, CareLoop } from '../types';
import {
  ClipboardCheck,
  PlayCircle,
  StopCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  HeartPulse,
  Send,
  UserCheck,
  FileText,
} from 'lucide-react';

export const CaregiverShiftView: React.FC = () => {
  const {
    currentProfile,
    handovers,
    triggerShiftHandover,
    acceptShiftHandover,
    careLoops,
    doseInstances,
    recordDoseCheckIn,
    resolveCareLoop,
    demoTime,
  } = useCare();

  const [isShiftActive, setIsShiftActive] = useState(true);
  const [departingNotes, setDepartingNotes] = useState('');
  const [observationText, setObservationText] = useState('');
  const [observationsList, setObservationsList] = useState<string[]>([
    'Checked morning vitals: Blood Pressure 124/82, Pulse 74.',
    'Assisted Sheela with 20 minutes gentle living room walking.',
  ]);

  const [activeLoopResolveId, setActiveLoopResolveId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  // Assigned loops for Sunita or unassigned
  const caregiverLoops = careLoops.filter(
    (l) => l.status !== 'resolved' && (l.ownerId === currentProfile.id || !l.ownerId)
  );

  const pendingHandover = handovers.find((h) => !h.acceptedAt);

  const handleAddObservation = () => {
    if (!observationText.trim()) return;
    setObservationsList((prev) => [...prev, observationText]);
    setObservationText('');
  };

  const handleEndShift = () => {
    triggerShiftHandover(observationsList, departingNotes);
    setIsShiftActive(false);
  };

  const handleResolveCaregiverLoop = (loopId: string) => {
    if (!resolveNote.trim()) return;
    resolveCareLoop(loopId, resolveNote, 'in_person_visit');
    setActiveLoopResolveId(null);
    setResolveNote('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest-900/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-forest-900 tracking-tight">
              Caregiver Shift Hub
            </h1>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isShiftActive ? 'bg-sage-200 text-sage-800' : 'bg-ivory-300 text-forest-800'
              }`}
            >
              {isShiftActive ? 'Shift in Progress' : 'Off Duty'}
            </span>
          </div>
          <p className="text-sm text-forest-800/80 mt-1">
            Logged in as {currentProfile.fullName} (Professional Caregiver)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isShiftActive ? (
            <button
              onClick={() => setIsShiftActive(false)}
              className="bg-terracotta-500 hover:bg-terracotta-600 text-ivory-100 text-xs font-bold py-2.5 px-4 rounded-xl shadow flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Prepare Shift Handover
            </button>
          ) : (
            <button
              onClick={() => setIsShiftActive(true)}
              className="bg-forest-900 hover:bg-forest-950 text-ivory-100 text-xs font-bold py-2.5 px-4 rounded-xl shadow flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Resume Active Shift
            </button>
          )}
        </div>
      </div>

      {/* Explicit Handover Acceptance Banner */}
      {pendingHandover && !pendingHandover.acceptedAt && (
        <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-3xl space-y-3 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                Incoming Shift Handover Available
              </span>
              <h3 className="text-lg font-extrabold text-forest-900">
                Shift Brief from {pendingHandover.departingCaregiverName}
              </h3>
              <p className="text-sm text-forest-800">{pendingHandover.briefText}</p>
              <div className="pt-2 text-xs text-forest-800/80 space-y-1">
                <div>
                  <strong>Active Loops:</strong> {pendingHandover.unresolvedLoopsCount}
                </div>
                <div>
                  <strong>Observations:</strong> {pendingHandover.observations.join('; ')}
                </div>
              </div>
            </div>
            <button
              onClick={() => acceptShiftHandover(pendingHandover.id)}
              className="bg-forest-900 hover:bg-forest-950 text-ivory-100 text-xs font-bold py-3 px-5 rounded-2xl shadow transition-all flex items-center gap-2 shrink-0 active:scale-95"
            >
              <UserCheck className="w-4 h-4 text-sage-200" />
              Accept Handover & Take Duty
            </button>
          </div>
        </div>
      )}

      {/* Grid: Open Responsibilities & Shift Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Assigned Care Loops & Medications */}
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold text-forest-900 flex items-center justify-between">
              <span>Assigned Care Loops ({caregiverLoops.length})</span>
            </h2>

            {caregiverLoops.length === 0 ? (
              <div className="p-6 bg-ivory-50 rounded-3xl border border-forest-900/10 text-center text-xs text-forest-800/70">
                No open Care Loops requiring caregiver attention right now.
              </div>
            ) : (
              caregiverLoops.map((loop) => (
                <div
                  key={loop.id}
                  className="p-5 bg-ivory-50 rounded-3xl border-2 border-forest-900/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider bg-forest-900 text-ivory-100 px-2.5 py-0.5 rounded-full">
                      {loop.status}
                    </span>
                    <span className="text-xs text-forest-800/70">
                      Deadline:{' '}
                      {new Date(loop.deadline).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-forest-900">{loop.title}</h4>
                    <p className="text-xs text-forest-800 mt-1">{loop.description}</p>
                  </div>

                  {activeLoopResolveId === loop.id ? (
                    <div className="pt-2 space-y-2 bg-ivory-100 p-3 rounded-2xl border border-forest-900/10">
                      <label className="text-xs font-bold text-forest-900 block">
                        Caregiver Observation & Resolution Notes
                      </label>
                      <input
                        type="text"
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        placeholder="e.g. In-person visit: Assisted Sheela with Telmisartan dose."
                        className="w-full text-xs p-2 rounded-xl border border-forest-900/20 bg-ivory-50"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveLoopResolveId(null)}
                          className="py-1.5 px-3 bg-ivory-200 text-forest-900 text-xs font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleResolveCaregiverLoop(loop.id)}
                          className="py-1.5 px-3 bg-sage-600 text-ivory-100 text-xs font-bold rounded-xl"
                        >
                          Confirm In-Person Resolution
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveLoopResolveId(loop.id)}
                      className="bg-forest-900 hover:bg-forest-950 text-ivory-100 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage-200" />
                      Resolve as Caregiver
                    </button>
                  )}
                </div>
              ))
            )}
          </section>

          {/* Today's Medication Checks */}
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold text-forest-900">
              Medication Administration & Observations
            </h2>
            <div className="space-y-3">
              {doseInstances.map((dose) => (
                <div
                  key={dose.id}
                  className="p-4 bg-ivory-50 rounded-2xl border border-forest-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-extrabold text-forest-900 text-sm block">
                      {dose.medicationName} ({dose.dosage})
                    </span>
                    <span className="text-forest-800/80">
                      Scheduled for{' '}
                      {new Date(dose.scheduledTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      — Status:{' '}
                      <strong className="uppercase text-forest-900">{dose.status}</strong>
                    </span>
                  </div>
                  {dose.status !== 'taken' && (
                    <button
                      onClick={() =>
                        recordDoseCheckIn(
                          dose.id,
                          'taken',
                          undefined,
                          'In-person administered by Caregiver Sunita.'
                        )
                      }
                      className="bg-sage-600 hover:bg-sage-700 text-ivory-100 font-bold py-2 px-3 rounded-xl flex items-center gap-1 self-start sm:self-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Record Administered
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Shift Observations & Handover Generation */}
        <div className="space-y-6">
          <div className="bg-ivory-50 border-2 border-forest-900/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-forest-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-sage-600" />
              Shift Observations
            </h3>

            <div className="space-y-2">
              {observationsList.map((obs, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-ivory-100 rounded-2xl border border-forest-900/10 text-xs text-forest-800"
                >
                  {obs}
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-2">
              <input
                type="text"
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
                placeholder="e.g. Afternoon tea taken, appetite good."
                className="w-full text-xs p-2.5 rounded-xl border border-forest-900/20 bg-ivory-100"
              />
              <button
                onClick={handleAddObservation}
                className="w-full bg-forest-900 hover:bg-forest-950 text-ivory-100 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Add Observation
              </button>
            </div>
          </div>

          {/* End Shift & Generate Handover */}
          <div className="bg-forest-900 text-ivory-100 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-sage-200" />
              End Shift & Generate Handover Brief
            </h3>
            <p className="text-xs text-sage-200 leading-relaxed">
              Produces a computed handover package with active loops, exceptions, and observations
              requiring incoming caregiver acceptance.
            </p>
            <textarea
              value={departingNotes}
              onChange={(e) => setDepartingNotes(e.target.value)}
              placeholder="Summary note for family and incoming caregiver..."
              className="w-full text-xs p-3 rounded-2xl bg-forest-800 border border-forest-700 text-ivory-100 h-20"
            />
            <button
              onClick={handleEndShift}
              className="w-full bg-sage-600 hover:bg-sage-700 text-ivory-100 text-xs font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Publish Handover Brief
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
