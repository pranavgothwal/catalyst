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
  switchProfile: (profileId: string) => void;

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
  addMedication: (med: Omit<Medication, 'id' | 'circleId'>) => { success: boolean; error?: string };
  addAppointment: (apt: Omit<Appointment, 'id' | 'circleId' | 'status'>) => void;
  logAccess: (category: AccessReceipt['categoryAccessed']) => void;
}

const CareContext = createContext<CareContextType | null>(null);

const STORAGE_KEY = 'alwayswithyou_state_v2';

export const CareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try loading saved persistent state from localStorage
  const savedState = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // Local storage unparseable or in private mode
    }
    return null;
  }, []);

  // Demo clock state - initialized to 9:15 AM today to demonstrate morning meds
  const [demoTime, setDemoTime] = useState<Date>(() => {
    if (savedState?.demoTime) {
      return new Date(savedState.demoTime);
    }
    const d = new Date();
    d.setHours(9, 15, 0, 0);
    return d;
  });

  const [currentProfile, setCurrentProfile] = useState<Profile>(() => {
    if (savedState?.currentProfileId) {
      const match = SEEDED_PROFILES.find((p) => p.id === savedState.currentProfileId);
      if (match) return match;
    }
    return SEEDED_PROFILES[0]; // Sheela (Elder) default
  });

  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>(() => {
    return savedState?.language || 'en';
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    return savedState?.medications || SEEDED_MEDICATIONS;
  });

  const [doseInstances, setDoseInstances] = useState<DoseInstance[]>(() => {
    return savedState?.doseInstances || getInitialDoseInstances(demoTime);
  });

  const [careLoops, setCareLoops] = useState<CareLoop[]>(() => {
    return savedState?.careLoops || [];
  });

  const [loopEvents, setLoopEvents] = useState<LoopEvent[]>(() => {
    return savedState?.loopEvents || [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    return savedState?.appointments || SEEDED_APPOINTMENTS;
  });

  const [handovers, setHandovers] = useState<CaregiverHandover[]>(() => {
    return savedState?.handovers || [];
  });

  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => {
    return savedState?.timeline || SEEDED_TIMELINE;
  });

  const [accessReceipts, setAccessReceipts] = useState<AccessReceipt[]>(() => {
    return savedState?.accessReceipts || [];
  });

  const [isClockSimulated, setIsClockSimulated] = useState<boolean>(() => {
    return !!savedState?.isClockSimulated;
  });

  // Persistent save to localStorage whenever state updates
  useEffect(() => {
    try {
      const payload = {
        demoTime: demoTime.toISOString(),
        currentProfileId: currentProfile.id,
        language,
        medications,
        doseInstances,
        careLoops,
        loopEvents,
        appointments,
        handovers,
        timeline,
        accessReceipts,
        isClockSimulated,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Local storage quota or security error
    }
  }, [
    demoTime,
    currentProfile,
    language,
    medications,
    doseInstances,
    careLoops,
    loopEvents,
    appointments,
    handovers,
    timeline,
    accessReceipts,
    isClockSimulated,
  ]);

  // Switch Role helper
  const switchProfile = (profileId: string) => {
    const target = SEEDED_PROFILES.find((p) => p.id === profileId);
    if (target) {
      setCurrentProfile(target);
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
    localStorage.removeItem(STORAGE_KEY);
    const d = new Date();
    d.setHours(9, 15, 0, 0);
    setDemoTime(d);
    setIsClockSimulated(false);
    setDoseInstances(getInitialDoseInstances(d));
    setCareLoops([]);
    setLoopEvents([]);
    setMedications(SEEDED_MEDICATIONS);
    setAppointments(SEEDED_APPOINTMENTS);
    setTimeline(SEEDED_TIMELINE);
    setHandovers([]);
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

    // Role check: Elders cannot claim coordination loops on behalf of other family members
    if (currentProfile.role === 'elder') {
      return { success: false, error: 'Elders cannot claim care loops. Care coordination is handled by family and caregivers.' };
    }

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

    // Role check: Only authorized coordinators (family or active caregiver) can hand off
    if (currentProfile.role === 'elder') {
      return { success: false, error: 'Permission denied: Elder role cannot reassign or hand off care loops.' };
    }

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
    // Permission check: Only caregivers can trigger caregiver shift handovers
    if (currentProfile.role !== 'caregiver') {
      throw new Error('Permission denied: Only registered caregivers can create shift handovers.');
    }

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

  // Add Medication with permission enforcement
  const addMedication = (medData: Omit<Medication, 'id' | 'circleId'>) => {
    // Permission check: lookup current member permissions
    const member = SEEDED_MEMBERS.find((m) => m.profileId === currentProfile.id);
    if (!member || !member.canManageMedications) {
      return {
        success: false,
        error: `Permission Denied: ${currentProfile.fullName} is not authorized to add or edit prescriptions in this care circle.`,
      };
    }

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

    return { success: true };
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
      switchProfile,
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
