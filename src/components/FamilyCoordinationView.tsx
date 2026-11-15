import React, { useState } from 'react';
import { useCare } from '../context/CareContext';
import { CareLoop, LoopEvent, Medication } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Share2,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Plus,
  MessageSquare,
  FileCheck,
  History,
} from 'lucide-react';

export const FamilyCoordinationView: React.FC = () => {
  const {
    careLoops,
    loopEvents,
    currentProfile,
    claimCareLoop,
    handOffCareLoop,
    resolveCareLoop,
    profiles,
    doseInstances,
    appointments,
    medications,
    addMedication,
    demoTime,
  } = useCare();

  const [activeTab, setActiveTab] = useState<'loops' | 'meds' | 'appointments' | 'members'>('loops');
  const [selectedLoop, setSelectedLoop] = useState<CareLoop | null>(null);

  // Modal states
  const [claimNotes, setClaimNotes] = useState('');
  const [handOffTarget, setHandOffTarget] = useState(profiles[3].id); // Sunita default
  const [handOffNotes, setHandOffNotes] = useState('Please check blood pressure and administer with breakfast.');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [evidenceType, setEvidenceType] = useState<CareLoop['evidenceType']>('observation');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New med modal
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedTime, setNewMedTime] = useState('10:00');

  const openLoops = careLoops.filter((l) => l.status !== 'resolved');
  const resolvedLoops = careLoops.filter((l) => l.status === 'resolved');

  const handleClaim = (loopId: string) => {
    setErrorMessage(null);
    const res = claimCareLoop(loopId, claimNotes);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to claim loop');
    } else {
      setClaimNotes('');
      setSelectedLoop(null);
    }
  };

  const handleHandOff = (loopId: string) => {
    setErrorMessage(null);
    const res = handOffCareLoop(loopId, handOffTarget, handOffNotes);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to hand off loop');
    } else {
      setSelectedLoop(null);
    }
  };

  const handleResolve = (loopId: string) => {
    setErrorMessage(null);
    if (!resolutionNotes.trim()) {
      setErrorMessage('Evidence and resolution notes are required to close a Care Loop.');
      return;
    }
    const res = resolveCareLoop(loopId, resolutionNotes, evidenceType);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to resolve loop');
    } else {
      setResolutionNotes('');
      setSelectedLoop(null);
    }
  };

  const handleCreateMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedDosage) return;

    addMedication({
      name: newMedName,
      dosage: newMedDosage,
      instructions: newMedInstructions || 'Take with water',
      frequency: 'Daily',
      scheduleTimes: [newMedTime],
      category: 'routine',
      active: true,
    });

    setNewMedName('');
    setNewMedDosage('');
    setNewMedInstructions('');
    setShowAddMedModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-forest-900/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-forest-900 tracking-tight">
              Family Care Coordination
            </h1>
            <span className="text-xs bg-sage-200 text-sage-800 font-bold px-2.5 py-1 rounded-full">
              Priya's Hub
            </span>
          </div>
          <p className="text-sm text-forest-800/80 mt-1">
            Care Loops engine, atomic responsibility claims, handovers, and circle oversight.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-ivory-200 p-1.5 rounded-2xl border border-forest-900/10 self-start">
          <button
            onClick={() => setActiveTab('loops')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'loops'
                ? 'bg-forest-900 text-ivory-100 shadow'
                : 'text-forest-800 hover:text-forest-950'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Care Loops ({openLoops.length})
          </button>
          <button
            onClick={() => setActiveTab('meds')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'meds'
                ? 'bg-forest-900 text-ivory-100 shadow'
                : 'text-forest-800 hover:text-forest-950'
            }`}
          >
            Medication Schedules
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'appointments'
                ? 'bg-forest-900 text-ivory-100 shadow'
                : 'text-forest-800 hover:text-forest-950'
            }`}
          >
            Appointments
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-2xl text-sm flex items-center justify-between">
          <span className="font-semibold">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* LOOPS TAB */}
      {activeTab === 'loops' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-ivory-50 border-2 border-amber-300/60 rounded-3xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-forest-900">
                  Care Loops Engine Active
                </h3>
                <p className="text-xs text-forest-800/80">
                  Every unconfirmed event turns into an owned responsibility that must be claimed,
                  handed off, or closed with verifiable evidence.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-forest-900">{openLoops.length}</span>
              <span className="text-xs text-forest-800 block font-semibold">Active Loops</span>
            </div>
          </div>

          {/* Active Loops List */}
          <div className="grid grid-cols-1 gap-4">
            {openLoops.length === 0 ? (
              <div className="text-center py-12 bg-ivory-50 rounded-3xl border-2 border-dashed border-forest-900/10">
                <CheckCircle2 className="w-12 h-12 text-sage-500 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-forest-900">All Care Loops Resolved</h4>
                <p className="text-xs text-forest-800/70 max-w-sm mx-auto mt-1">
                  Sheela's care routine is currently up to date. Advance the demo clock to simulate an
                  unconfirmed dose.
                </p>
              </div>
            ) : (
              openLoops.map((loop) => {
                const isClaimed = loop.status === 'claimed' || loop.status === 'handed_off';
                const isLapsed = loop.status === 'lapsed';
                const isEscalated = loop.status === 'escalated';

                return (
                  <div
                    key={loop.id}
                    className={`p-6 rounded-3xl border-2 transition-all shadow-sm ${
                      isEscalated
                        ? 'bg-red-50/60 border-red-300 ring-2 ring-red-400/20'
                        : isLapsed
                        ? 'bg-amber-50/60 border-amber-300'
                        : isClaimed
                        ? 'bg-sage-50/40 border-sage-300'
                        : 'bg-ivory-50 border-forest-900/15'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              isEscalated
                                ? 'bg-red-600 text-ivory-100'
                                : isLapsed
                                ? 'bg-amber-600 text-ivory-100'
                                : isClaimed
                                ? 'bg-sage-600 text-ivory-100'
                                : 'bg-forest-900 text-ivory-100'
                            }`}
                          >
                            {loop.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-forest-800/70 font-semibold">
                            Deadline:{' '}
                            {new Date(loop.deadline).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <h3 className="text-xl font-extrabold text-forest-900">{loop.title}</h3>
                        <p className="text-sm text-forest-800 leading-relaxed">{loop.description}</p>

                        {/* Owner pill */}
                        <div className="pt-2 flex items-center gap-2 text-xs font-semibold">
                          <span className="text-forest-800/70">Current Owner:</span>
                          {loop.ownerName ? (
                            <span className="bg-ivory-200 text-forest-900 px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-forest-900/10">
                              <UserCheck className="w-3.5 h-3.5 text-sage-600" />
                              {loop.ownerName}
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-xl border border-amber-200">
                              Unclaimed (Needs Attention)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap md:flex-col gap-2 min-w-[200px]">
                        {!isClaimed ? (
                          <button
                            onClick={() => handleClaim(loop.id)}
                            className="w-full bg-forest-900 hover:bg-forest-950 text-ivory-100 font-bold text-xs py-3 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-95"
                          >
                            <UserCheck className="w-4 h-4 text-sage-200" />
                            Claim Responsibility
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setSelectedLoop(loop)}
                              className="w-full bg-sage-600 hover:bg-sage-700 text-ivory-100 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              <FileCheck className="w-4 h-4" />
                              Resolve & Close Loop
                            </button>
                            <button
                              onClick={() => setSelectedLoop(loop)}
                              className="w-full bg-ivory-200 hover:bg-ivory-300 text-forest-900 font-bold text-xs py-2 px-3 rounded-xl border border-forest-900/10 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Share2 className="w-3.5 h-3.5 text-forest-800" />
                              Hand Off / Reassign
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Recently Resolved Loops */}
          {resolvedLoops.length > 0 && (
            <div className="pt-6 border-t border-forest-900/10 space-y-3">
              <h4 className="text-sm font-bold text-forest-800 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sage-600" />
                Recently Closed Care Loops ({resolvedLoops.length})
              </h4>
              <div className="space-y-2">
                {resolvedLoops.slice(0, 3).map((loop) => (
                  <div
                    key={loop.id}
                    className="p-4 bg-ivory-50 rounded-2xl border border-sage-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 opacity-80"
                  >
                    <div>
                      <span className="font-bold text-forest-900">{loop.title}</span>
                      <p className="text-forest-800/80 mt-0.5">
                        Resolution: {loop.resolutionNotes} [Evidence: {loop.evidenceType}]
                      </p>
                    </div>
                    <span className="text-[10px] text-sage-700 font-semibold bg-sage-100 px-2 py-1 rounded-lg self-start sm:self-auto">
                      Closed by {loop.ownerName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MEDS TAB */}
      {activeTab === 'meds' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-forest-900">Active Prescriptions</h3>
              <p className="text-xs text-forest-800/70">
                Prescription changes require authorised human confirmation.
              </p>
            </div>
            <button
              onClick={() => setShowAddMedModal(true)}
              className="bg-forest-900 hover:bg-forest-950 text-ivory-100 text-xs font-bold py-2.5 px-4 rounded-xl shadow flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Prescription
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => (
              <div
                key={med.id}
                className="p-5 bg-ivory-50 rounded-3xl border-2 border-forest-900/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-forest-900">{med.name}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-sage-200 text-sage-800 px-2 py-0.5 rounded-full">
                    {med.category}
                  </span>
                </div>
                <p className="text-xs font-bold text-forest-800">{med.dosage}</p>
                <p className="text-xs text-forest-800/80">{med.instructions}</p>
                <div className="pt-2 flex items-center gap-2 text-xs text-forest-800/70">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Times: {med.scheduleTimes.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <h3 className="text-xl font-extrabold text-forest-900">Care Appointments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-5 bg-ivory-50 rounded-3xl border-2 border-forest-900/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-sage-200 text-sage-800 px-2.5 py-0.5 rounded-xl">
                    {new Date(apt.scheduledTime).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-xs font-semibold text-forest-800/70">{apt.specialty}</span>
                </div>
                <h4 className="text-base font-extrabold text-forest-900">{apt.title}</h4>
                <p className="text-xs text-forest-800">{apt.location}</p>
                <p className="text-xs text-forest-800/80 italic">{apt.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loop Management Modal (Resolve & Hand Off) */}
      {selectedLoop && (
        <div className="fixed inset-0 z-50 bg-forest-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory-100 border-2 border-forest-900/20 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-forest-900/10">
              <h3 className="text-xl font-black text-forest-900">Manage Care Loop</h3>
              <button
                onClick={() => setSelectedLoop(null)}
                className="text-xs font-bold text-forest-800 hover:underline"
              >
                Close
              </button>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-forest-900">{selectedLoop.title}</h4>
              <p className="text-xs text-forest-800 mt-1">{selectedLoop.description}</p>
            </div>

            {/* Resolve Form */}
            <div className="space-y-3 bg-ivory-50 p-4 rounded-2xl border border-forest-900/10">
              <h5 className="text-xs font-bold text-sage-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                Option A: Resolve and Close Loop
              </h5>
              <div>
                <label className="text-xs font-semibold text-forest-900 block mb-1">
                  Evidence Type
                </label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-forest-900/20 bg-ivory-100"
                >
                  <option value="observation">Direct Observation</option>
                  <option value="call_completed">Phone Call with Sheela</option>
                  <option value="in_person_visit">In-Person Home Visit</option>
                  <option value="confirmed_skipped">Doctor-Advised Skip</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-900 block mb-1">
                  Resolution Notes & Evidence (Mandatory)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Called Sheela, confirmed she finished breakfast late and took the dose at 9:45 AM."
                  className="w-full text-xs p-2.5 rounded-xl border border-forest-900/20 bg-ivory-100 h-20"
                />
              </div>
              <button
                onClick={() => handleResolve(selectedLoop.id)}
                className="w-full bg-sage-600 hover:bg-sage-700 text-ivory-100 text-xs font-bold py-2.5 rounded-xl shadow"
              >
                Confirm Resolution
              </button>
            </div>

            {/* Hand Off Form */}
            <div className="space-y-3 bg-ivory-50 p-4 rounded-2xl border border-forest-900/10">
              <h5 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-4 h-4" />
                Option B: Hand Off Responsibility
              </h5>
              <div>
                <label className="text-xs font-semibold text-forest-900 block mb-1">
                  Transfer Responsibility To
                </label>
                <select
                  value={handOffTarget}
                  onChange={(e) => setHandOffTarget(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-forest-900/20 bg-ivory-100"
                >
                  {profiles
                    .filter((p) => p.id !== currentProfile.id && p.role !== 'elder')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.role})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-900 block mb-1">
                  Handover Instructions
                </label>
                <input
                  type="text"
                  value={handOffNotes}
                  onChange={(e) => setHandOffNotes(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-forest-900/20 bg-ivory-100"
                />
              </div>
              <button
                onClick={() => handleHandOff(selectedLoop.id)}
                className="w-full bg-forest-900 hover:bg-forest-950 text-ivory-100 text-xs font-bold py-2.5 rounded-xl"
              >
                Execute Hand-off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMed}
            className="bg-ivory-100 border-2 border-forest-900/20 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-xl font-black text-forest-900">Add New Medication</h3>
            <div>
              <label className="text-xs font-bold text-forest-900 block mb-1">Medicine Name</label>
              <input
                type="text"
                required
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="e.g. Amlodipine 5mg"
                className="w-full text-xs p-2.5 rounded-xl border border-forest-900/20 bg-ivory-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-forest-900 block mb-1">Dosage</label>
              <input
                type="text"
                required
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                placeholder="e.g. 1 tablet with water"
                className="w-full text-xs p-2.5 rounded-xl border border-forest-900/20 bg-ivory-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-forest-900 block mb-1">Scheduled Time</label>
              <input
                type="time"
                required
                value={newMedTime}
                onChange={(e) => setNewMedTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-forest-900/20 bg-ivory-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-forest-900 block mb-1">Instructions</label>
              <input
                type="text"
                value={newMedInstructions}
                onChange={(e) => setNewMedInstructions(e.target.value)}
                placeholder="e.g. Take after breakfast"
                className="w-full text-xs p-2.5 rounded-xl border border-forest-900/20 bg-ivory-50"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMedModal(false)}
                className="flex-1 py-2.5 bg-ivory-200 text-forest-900 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-forest-900 text-ivory-100 font-bold rounded-xl text-xs"
              >
                Save Prescription
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
