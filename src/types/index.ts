export type Role = 'elder' | 'family' | 'caregiver';

export interface Profile {
  id: string;
  fullName: string;
  role: Role;
  phone: string;
  email: string;
  avatar?: string;
  preferredLanguage?: 'en' | 'hi' | 'mr';
}

export interface CareCircle {
  id: string;
  name: string;
  elderProfileId: string;
  timezone: string;
  createdAt: string;
}

export interface CircleMember {
  id: string;
  circleId: string;
  profileId: string;
  role: Role;
  relationship: string;
  canManageMedications: boolean;
  canViewAudit: boolean;
  isEmergencyContact: boolean;
  active: boolean;
}

export type DoseStatus =
  | 'due'
  | 'unconfirmed'
  | 'taken'
  | 'not_taken'
  | 'skipped'
  | 'follow_up';

export interface Medication {
  id: string;
  circleId: string;
  name: string;
  dosage: string;
  instructions: string;
  frequency: string;
  scheduleTimes: string[]; // e.g. ["08:00", "13:00", "20:00"]
  category: 'critical' | 'routine' | 'supplement';
  active: boolean;
}

export interface DoseInstance {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  circleId: string;
  scheduledTime: string; // ISO String
  status: DoseStatus;
  checkInTime?: string; // ISO String
  actorId?: string;
  actorName?: string;
  provenance: 'self_reported' | 'family_observed' | 'caregiver_observed' | 'system';
  reason?: string;
  notes?: string;
  careLoopId?: string;
}

export type LoopStatus =
  | 'open'
  | 'claimed'
  | 'handed_off'
  | 'lapsed'
  | 'escalated'
  | 'resolved';

export interface CareLoop {
  id: string;
  circleId: string;
  sourceEventType: 'medication_unconfirmed' | 'appointment_prep' | 'routine_checkin' | 'caregiver_flag';
  sourceId: string;
  title: string;
  description: string;
  status: LoopStatus;
  ownerId?: string;
  ownerName?: string;
  escalationLevel: number; // 0: Normal, 1: Lapsed, 2: Escalated
  deadline: string; // ISO String
  createdAt: string;
  closedAt?: string;
  resolutionNotes?: string;
  evidenceType?: 'observation' | 'call_completed' | 'in_person_visit' | 'confirmed_skipped';
}

export interface LoopEvent {
  id: string;
  loopId: string;
  eventType: 'created' | 'claimed' | 'handed_off' | 'lapsed' | 'escalated' | 'resolved' | 'reopened';
  actorId?: string;
  actorName?: string;
  previousState?: LoopStatus;
  newState: LoopStatus;
  notes?: string;
  timestamp: string;
}

export interface Appointment {
  id: string;
  circleId: string;
  title: string;
  doctorName: string;
  specialty?: string;
  location: string;
  scheduledTime: string; // ISO String
  notes?: string;
  accompaniedBy?: string;
  loopId?: string;
  status: 'upcoming' | 'completed' | 'rescheduled' | 'cancelled';
}

export interface CaregiverHandover {
  id: string;
  circleId: string;
  departingCaregiverId: string;
  departingCaregiverName: string;
  arrivingCaregiverId?: string;
  arrivingCaregiverName?: string;
  shiftStart: string;
  shiftEnd: string;
  briefText: string;
  unresolvedLoopsCount: number;
  medicationExceptionsCount: number;
  observations: string[];
  acceptedAt?: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  circleId: string;
  timestamp: string;
  eventType: 'medication' | 'care_loop' | 'appointment' | 'handover' | 'access';
  title: string;
  description: string;
  actorId?: string;
  actorName?: string;
  actorRole?: Role;
  provenance?: string;
  severity?: 'info' | 'warning' | 'urgent' | 'success';
}

export interface AccessReceipt {
  id: string;
  circleId: string;
  accessorId: string;
  accessorName: string;
  accessorRole: Role;
  categoryAccessed: 'medications' | 'appointments' | 'observations' | 'timeline';
  timestamp: string;
}
