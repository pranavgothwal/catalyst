import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Profile,
  Role,
  CareCircle,
  CircleMember,
  Medication,
  DoseInstance,
  CareLoop,
  LoopEvent,
  Appointment,
  CaregiverHandover,
  TimelineEvent,
  AccessReceipt,
} from '../types';
import {
  SEEDED_PROFILES,
  SEEDED_CIRCLE,
  SEEDED_MEMBERS,
  SEEDED_MEDICATIONS,
  getInitialDoseInstances,
  SEEDED_APPOINTMENTS,
  SEEDED_TIMELINE,
} from '../data/seededData';
import { CareLoopEngine } from '../engine/CareLoopEngine';
import { MedicationScheduleEngine } from '../engine/MedicationScheduleEngine';

interface CareContextType {
  // Current Active Persona
  currentProfile: Profile;
  setCurrentProfile: (p: Profile) => void;
  switchRole: (role: Role) => void;

  // Circle Info
  circle: CareCircle;
  members: CircleMember[];
  profiles: Profile[];

  // Demo Clock
  demoTime: Date;
  advanceMinutes: (mins: number) => void;
  resetDemoClock: () => void;
  isClockSimulated: boolean;

  // Care Data
  medications: Medication[];
  doseInstances: DoseInstance[];
  careLoops: CareLoop[];
  loopEvents: LoopEvent[];
  appointments: Appointment[];
  handovers: CaregiverHandover[];
  timeline: TimelineEvent[];
  accessReceipts: AccessReceipt[];

  // Language & UI Controls
  language: 'en' | 'hi' | 'mr';
  setLanguage: (lang: 'en' | 'hi' | 'mr') => void;

  // Actions
  recordDoseCheckIn: (
    doseId: string,
    status: 'taken' | 'not_taken' | 'skipped' | 'follow_up',
    reason?: string,
    notes?: string
  ) => void;
  claimCareLoop: (loopId: string, notes?: string) => { success: boolean; error?: string };
  handOffCareLoop: (
    loopId: string,
    newOwnerId: string,
    notes: string
  ) => { success: boolean; error?: string };
  resolveCareLoop: (
    loopId: string,
    resolutionNotes: string,
    evidenceType: CareLoop['evidenceType']
  ) => { success: boolean; error?: string };
  triggerShiftHandover: (notes: string[], departingNote: string) => CaregiverHandover;
  acceptShiftHandover: (handoverId: string) => void;
  addMedication: (med: Omit<Medication, 'id' | 'circleId'>) => void;
  addAppointment: (apt: Omit<Appointment, 'id' | 'circleId' | 'status'>) => void;
  logAccess: (category: AccessReceipt['categoryAccessed']) => void;
}

const CareContext = createContext<CareContextType | null>(null);

const STORAGE_KEY = 'alwayswithyou_state_v1';

export const CareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Demo clock state - initialized to 9:15 AM today to demonstrate morning meds
  const [demoTime, setDemoTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(9, 15, 0, 0);
    return d;
  });

  const [currentProfile, setCurrentProfile] = useState<Profile>(SEEDED_PROFILES[0]); // Sheela (Elder) default
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  const [medications, setMedications] = useState<Medication[]>(SEEDED_MEDICATIONS);
  const [doseInstances, setDoseInstances] = useState<DoseInstance[]>(() =>
    getInitialDoseInstances(demoTime)
  );
  const [careLoops, setCareLoops] = useState<CareLoop[]>([]);
  const [loopEvents, setLoopEvents] = useState<LoopEvent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>(SEEDED_APPOINTMENTS);
  const [handovers, setHandovers] = useState<CaregiverHandover[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(SEEDED_TIMELINE);
  const [accessReceipts, setAccessReceipts] = useState<AccessReceipt[]>([]);
  const [isClockSimulated, setIsClockSimulated] = useState<boolean>(false);

  // Switch Role helper
  const switchRole = (role: Role) => {
    const target = SEEDED_PROFILES.find((p) => p.role === role);
    if (target) {
      setCurrentProfile(target);
      // Log access receipt when switching personas
      logAccessAudit(target, 'timeline');
    }
  };

  const logAccessAudit = (user: Profile, category: AccessReceipt['categoryAccessed']) => {
    const receipt: AccessReceipt = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      circleId: SEEDED_CIRCLE.id,
      accessorId: user.id,
      accessorName: user.fullName,
      accessorRole: user.role,
      categoryAccessed: category,
      timestamp: demoTime.toISOString(),
    };
    setAccessReceipts((prev) => [receipt, ...prev.slice(0, 49)]);
  };

  const logAccess = (category: AccessReceipt['categoryAccessed']) => {
    logAccessAudit(currentProfile, category);
  };

  // Add timeline event helper
  const addTimelineEvent = (
    eventType: TimelineEvent['eventType'],
    title: string,
    description: string,
    severity: TimelineEvent['severity'] = 'info',
    provenance?: string
  ) => {
    const event: TimelineEvent = {
      id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      circleId: SEEDED_CIRCLE.id,
      timestamp: demoTime.toISOString(),
      eventType,
      title,
      description,
      actorId: currentProfile.id,
      actorName: currentProfile.fullName,
      actorRole: currentProfile.role,
      provenance: provenance || (currentProfile.role === 'elder' ? 'self_reported' : 'caregiver_observed'),
      severity,
    };
    setTimeline((prev) => [event, ...prev]);
  };

  // Engine evaluation step for time progression
  const advanceMinutes = (mins: number) => {
    setIsClockSimulated(true);
    const newTime = new Date(demoTime.getTime() + mins * 60 * 1000);
    setDemoTime(newTime);

    // 1. Evaluate dose instances (due -> unconfirmed)
    setDoseInstances((prevDoses) => {
      let updatedDoses = [...prevDoses];
      const newlyUnconfirmedDoses: DoseInstance[] = [];

      updatedDoses = updatedDoses.map((dose) => {
        const { updated, dose: nextDose, triggerLoop } = MedicationScheduleEngine.evaluateDoseStatus(
          dose,
          newTime,
          30 // 30 mins grace period
        );
        if (updated && triggerLoop) {
          newlyUnconfirmedDoses.push(nextDose);
        }
        return nextDose;
      });

      // For any dose that just triggered a loop, create Care Loop
      if (newlyUnconfirmedDoses.length > 0) {
        newlyUnconfirmedDoses.forEach((unconfirmedDose) => {
          const loopId = `loop-${unconfirmedDose.id}`;
          const { loop, event } = CareLoopEngine.createLoop({
            id: loopId,
            circleId: SEEDED_CIRCLE.id,
            sourceEventType: 'medication_unconfirmed',
            sourceId: unconfirmedDose.id,
            title: `Unconfirmed: ${unconfirmedDose.medicationName}`,
            description: `Scheduled for ${new Date(unconfirmedDose.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. No check-in recorded within grace period. Check on Sheela.`,
            currentTime: newTime,
            graceMinutes: 20, // 20 mins to claim before lapse
          });

          // Link loop back to dose
          unconfirmedDose.careLoopId = loopId;

          setCareLoops((currLoops) => [loop, ...currLoops]);
          setLoopEvents((currEvents) => [event, ...currEvents]);

          // Timeline entry
          setTimeline((prev) => [
            {
              id: `tl-loop-${loop.id}`,
              circleId: SEEDED_CIRCLE.id,
              timestamp: newTime.toISOString(),
              eventType: 'care_loop',
              title: `Care Loop Created: ${unconfirmedDose.medicationName}`,
              description: `Attention needed: Dose was due and remains unconfirmed. Awaiting responsibility claim.`,
              actorId: 'system',
              actorName: 'System (AlwaysWithYOU)',
              severity: 'warning',
            },
            ...prev,
          ]);
        });
      }

      return updatedDoses;
    });

    // 2. Evaluate Care Loops for lapse / escalation
    setCareLoops((prevLoops) => {
      return prevLoops.map((loop) => {
        const { updated, loop: nextLoop, event } = CareLoopEngine.evaluateTimeProgression(
          loop,
          newTime
        );
        if (updated && event) {
          setLoopEvents((currEvents) => [event, ...currEvents]);
          setTimeline((prev) => [
            {
              id: `tl-${event.id}`,
              circleId: SEEDED_CIRCLE.id,
              timestamp: newTime.toISOString(),
              eventType: 'care_loop',
              title: `Care Loop ${event.newState.toUpperCase()}: ${loop.title}`,
              description: event.notes || '',
              actorId: 'system',
              actorName: 'System Escalation Engine',
              severity: event.newState === 'escalated' ? 'urgent' : 'warning',
            },
            ...prev,
          ]);
        }
        return nextLoop;
      });
    });
  };

  const resetDemoClock = () => {
    const d = new Date();
    d.setHours(9, 15, 0, 0);
    setDemoTime(d);
    setIsClockSimulated(false);
  };

  // Record medication check-in
  const recordDoseCheckIn = (
    doseId: string,
    status: 'taken' | 'not_taken' | 'skipped' | 'follow_up',
    reason?: string,
    notes?: string
  ) => {
    const nowIso = demoTime.toISOString();
    let affectedDose: DoseInstance | undefined;

    setDoseInstances((prev) =>
      prev.map((d) => {
        if (d.id === doseId) {
          affectedDose = {
            ...d,
            status,
            checkInTime: nowIso,
            actorId: currentProfile.id,
            actorName: currentProfile.fullName,
            provenance:
              currentProfile.role === 'elder'
                ? 'self_reported'
                : currentProfile.role === 'caregiver'
                ? 'caregiver_observed'
                : 'family_observed',
            reason,
            notes,
          };
          return affectedDose;
        }
        return d;
      })
    );

    const provenanceLabel =
      currentProfile.role === 'elder'
        ? 'User-reported (Elder)'
        : currentProfile.role === 'caregiver'
        ? 'Caregiver observation'
        : 'Family observed';

    let severity: TimelineEvent['severity'] = 'info';
    let statusLabel = '';
    if (status === 'taken') {
      severity = 'success';
      statusLabel = 'Reported Taken';
    } else if (status === 'not_taken') {
      severity = 'urgent';
      statusLabel = 'Reported Not Taken';
    } else if (status === 'skipped') {
      severity = 'warning';
      statusLabel = `Skipped (${reason || 'no reason stated'})`;
    } else if (status === 'follow_up') {
      severity = 'warning';
      statusLabel = 'Follow-up Required';
    }

    addTimelineEvent(
      'medication',
      `${affectedDose?.medicationName || 'Medication'} ${statusLabel}`,
      `${currentProfile.fullName} recorded status. Notes: ${notes || reason || 'None'}. [Provenance: ${provenanceLabel}]`,
      severity,
      provenanceLabel
    );

    // If there is an associated Care Loop, automatically resolve it if taken or follow-up handled
    if (affectedDose?.careLoopId) {
      resolveCareLoop(
        affectedDose.careLoopId,
        `Resolved via direct check-in by ${currentProfile.fullName} (${statusLabel}).`,
        'observation'
      );
    }
  };

  // Claim Care Loop
  const claimCareLoop = (loopId: string, notes?: string) => {
    const targetLoop = careLoops.find((l) => l.id === loopId);
    if (!targetLoop) return { success: false, error: 'Loop not found' };

    const res = CareLoopEngine.claimLoop(
      targetLoop,
      currentProfile.id,
      currentProfile.fullName,
      demoTime,
      notes
    );

    if (res.success && res.loop && res.event) {
      setCareLoops((prev) => prev.map((l) => (l.id === loopId ? res.loop! : l)));
      setLoopEvents((prev) => [res.event!, ...prev]);
      addTimelineEvent(
        'care_loop',
        `Responsibility Claimed: ${targetLoop.title}`,
        `${currentProfile.fullName} claimed ownership. Notes: ${notes || 'Action in progress.'}`,
        'info'
      );
      return { success: true };
    }

    return { success: false, error: res.error };
  };

  // Hand off Care Loop
  const handOffCareLoop = (loopId: string, newOwnerId: string, notes: string) => {
    const targetLoop = careLoops.find((l) => l.id === loopId);
    if (!targetLoop) return { success: false, error: 'Loop not found' };

    const newOwner = SEEDED_PROFILES.find((p) => p.id === newOwnerId);
    if (!newOwner) return { success: false, error: 'Target owner not found' };

    const res = CareLoopEngine.handOffLoop(
      targetLoop,
      currentProfile.id,
      currentProfile.fullName,
      newOwner.id,
      newOwner.fullName,
      demoTime,
      notes
    );

    if (res.success && res.loop && res.event) {
      setCareLoops((prev) => prev.map((l) => (l.id === loopId ? res.loop! : l)));
      setLoopEvents((prev) => [res.event!, ...prev]);
      addTimelineEvent(
        'care_loop',
        `Care Loop Handed Off: ${targetLoop.title}`,
        `Transferred from ${currentProfile.fullName} to ${newOwner.fullName}. Note: ${notes}`,
        'warning'
      );
      return { success: true };
    }

    return { success: false, error: res.error };
  };

  // Resolve Care Loop
  const resolveCareLoop = (
    loopId: string,
    resolutionNotes: string,
    evidenceType: CareLoop['evidenceType']
  ) => {
    const targetLoop = careLoops.find((l) => l.id === loopId);
    if (!targetLoop) return { success: false, error: 'Loop not found' };

    const res = CareLoopEngine.resolveLoop(
      targetLoop,
      currentProfile.id,
      currentProfile.fullName,
      resolutionNotes,
      evidenceType,
      demoTime
    );

    if (res.success && res.loop && res.event) {
      setCareLoops((prev) => prev.map((l) => (l.id === loopId ? res.loop! : l)));
      setLoopEvents((prev) => [res.event!, ...prev]);
      addTimelineEvent(
        'care_loop',
        `Care Loop Resolved: ${targetLoop.title}`,
        `Closed by ${currentProfile.fullName}. Evidence [${evidenceType}]: ${resolutionNotes}`,
        'success'
      );
      return { success: true };
    }

    return { success: false, error: res.error };
  };

  // Trigger Caregiver Shift Handover
  const triggerShiftHandover = (observations: string[], departingNote: string): CaregiverHandover => {
    const unresolved = careLoops.filter((l) => l.status !== 'resolved').length;
    const exceptions = doseInstances.filter((d) => d.status === 'unconfirmed' || d.status === 'not_taken').length;

    const handover: CaregiverHandover = {
      id: `handover-${Date.now()}`,
      circleId: SEEDED_CIRCLE.id,
      departingCaregiverId: currentProfile.id,
      departingCaregiverName: currentProfile.fullName,
      shiftStart: new Date(demoTime.getTime() - 8 * 3600 * 1000).toISOString(),
      shiftEnd: demoTime.toISOString(),
      briefText: departingNote || 'Shift completed. Vital signs stable, routine adhered to.',
      unresolvedLoopsCount: unresolved,
      medicationExceptionsCount: exceptions,
      observations,
      createdAt: demoTime.toISOString(),
    };

    setHandovers((prev) => [handover, ...prev]);
    addTimelineEvent(
      'handover',
      `Caregiver Shift Prepared: ${currentProfile.fullName}`,
      `Handover ready with ${unresolved} open loop(s) and ${exceptions} medication exception(s).`,
      'info'
    );

    return handover;
  };

  // Accept Shift Handover
  const acceptShiftHandover = (handoverId: string) => {
    setHandovers((prev) =>
      prev.map((h) => {
        if (h.id === handoverId) {
          return {
            ...h,
            arrivingCaregiverId: currentProfile.id,
            arrivingCaregiverName: currentProfile.fullName,
            acceptedAt: demoTime.toISOString(),
          };
        }
        return h;
      })
    );

    addTimelineEvent(
      'handover',
      `Shift Handover Accepted by ${currentProfile.fullName}`,
      `Explicit handover confirmed. Caregiver has assumed responsibility for active routine and loops.`,
      'success'
    );
  };

  // Add Medication
  const addMedication = (medData: Omit<Medication, 'id' | 'circleId'>) => {
    const newMed: Medication = {
      ...medData,
      id: `med-${Date.now()}`,
      circleId: SEEDED_CIRCLE.id,
    };
    setMedications((prev) => [...prev, newMed]);

    // Generate dose instances for today
    const newDoses = MedicationScheduleEngine.generateDailyDoseInstances(
      [newMed],
      doseInstances,
      demoTime,
      SEEDED_CIRCLE.id
    );
    if (newDoses.length > 0) {
      setDoseInstances((prev) => [...prev, ...newDoses]);
    }

    addTimelineEvent(
      'medication',
      `New Medication Added: ${newMed.name}`,
      `Schedule configured: ${newMed.frequency} (${newMed.dosage}). Added by ${currentProfile.fullName}.`,
      'info'
    );
  };

  // Add Appointment
  const addAppointment = (aptData: Omit<Appointment, 'id' | 'circleId' | 'status'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: `apt-${Date.now()}`,
      circleId: SEEDED_CIRCLE.id,
      status: 'upcoming',
    };
    setAppointments((prev) => [newApt, ...prev]);

    addTimelineEvent(
      'appointment',
      `New Appointment Scheduled: ${newApt.title}`,
      `Doctor: ${newApt.doctorName}. Location: ${newApt.location}. Scheduled for ${new Date(newApt.scheduledTime).toLocaleDateString()}.`,
      'info'
    );
  };

  const value = useMemo(
    () => ({
      currentProfile,
      setCurrentProfile,
      switchRole,
      circle: SEEDED_CIRCLE,
      members: SEEDED_MEMBERS,
      profiles: SEEDED_PROFILES,
      demoTime,
      advanceMinutes,
      resetDemoClock,
      isClockSimulated,
      medications,
      doseInstances,
      careLoops,
      loopEvents,
      appointments,
      handovers,
      timeline,
      accessReceipts,
      language,
      setLanguage,
      recordDoseCheckIn,
      claimCareLoop,
      handOffCareLoop,
      resolveCareLoop,
      triggerShiftHandover,
      acceptShiftHandover,
      addMedication,
      addAppointment,
      logAccess,
    }),
    [
      currentProfile,
      demoTime,
      isClockSimulated,
      medications,
      doseInstances,
      careLoops,
      loopEvents,
      appointments,
      handovers,
      timeline,
      accessReceipts,
      language,
    ]
  );

  return <CareContext.Provider value={value}>{children}</CareContext.Provider>;
};

export const useCare = () => {
  const context = useContext(CareContext);
  if (!context) {
    throw new Error('useCare must be used within a CareProvider');
  }
  return context;
};
