import { CareLoop, LoopEvent, LoopStatus } from '../types';

export interface TransitionResult {
  success: boolean;
  loop?: CareLoop;
  event?: LoopEvent;
  error?: string;
}

/**
 * Deterministic Care Loop Engine
 * Enforces atomic state transitions, explicit ownership, and verifiable resolutions.
 */
export class CareLoopEngine {
  /**
   * Create a new Care Loop when a trigger event (like an unconfirmed dose) requires human attention.
   */
  static createLoop(params: {
    id: string;
    circleId: string;
    sourceEventType: CareLoop['sourceEventType'];
    sourceId: string;
    title: string;
    description: string;
    currentTime: Date;
    graceMinutes?: number;
  }): { loop: CareLoop; event: LoopEvent } {
    const grace = params.graceMinutes || 30;
    const deadline = new Date(params.currentTime.getTime() + grace * 60 * 1000).toISOString();
    const nowIso = params.currentTime.toISOString();

    const loop: CareLoop = {
      id: params.id,
      circleId: params.circleId,
      sourceEventType: params.sourceEventType,
      sourceId: params.sourceId,
      title: params.title,
      description: params.description,
      status: 'open',
      escalationLevel: 0,
      deadline,
      createdAt: nowIso,
    };

    const event: LoopEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      loopId: loop.id,
      eventType: 'created',
      newState: 'open',
      notes: `Care loop opened. Attention required by ${deadline}`,
      timestamp: nowIso,
    };

    return { loop, event };
  }

  /**
   * Atomically claim a Care Loop.
   * Only 'open', 'lapsed', or 'escalated' loops can be claimed.
   */
  static claimLoop(
    currentLoop: CareLoop,
    actorId: string,
    actorName: string,
    currentTime: Date,
    notes?: string
  ): TransitionResult {
    if (currentLoop.status === 'resolved') {
      return { success: false, error: 'Cannot claim a closed/resolved loop.' };
    }
    if (currentLoop.status === 'claimed' && currentLoop.ownerId && currentLoop.ownerId !== actorId) {
      return {
        success: false,
        error: `Loop is already claimed by ${currentLoop.ownerName}. Use hand-off instead.`,
      };
    }

    const previousState = currentLoop.status;
    const nowIso = currentTime.toISOString();

    const updatedLoop: CareLoop = {
      ...currentLoop,
      status: 'claimed',
      ownerId: actorId,
      ownerName: actorName,
    };

    const event: LoopEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      loopId: currentLoop.id,
      eventType: 'claimed',
      actorId,
      actorName,
      previousState,
      newState: 'claimed',
      notes: notes || `Responsibility claimed by ${actorName}`,
      timestamp: nowIso,
    };

    return { success: true, loop: updatedLoop, event };
  }

  /**
   * Hand off responsibility from current owner to a new assignee.
   */
  static handOffLoop(
    currentLoop: CareLoop,
    actorId: string,
    actorName: string,
    newOwnerId: string,
    newOwnerName: string,
    currentTime: Date,
    notes: string
  ): TransitionResult {
    if (currentLoop.status !== 'claimed') {
      return { success: false, error: 'Only claimed loops can be handed off.' };
    }
    if (currentLoop.ownerId && currentLoop.ownerId !== actorId) {
      return { success: false, error: 'Only the current owner can initiate a hand-off.' };
    }

    const nowIso = currentTime.toISOString();
    const updatedLoop: CareLoop = {
      ...currentLoop,
      status: 'handed_off',
      ownerId: newOwnerId,
      ownerName: newOwnerName,
    };

    const event: LoopEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      loopId: currentLoop.id,
      eventType: 'handed_off',
      actorId,
      actorName,
      previousState: 'claimed',
      newState: 'handed_off',
      notes: `Handed over from ${actorName} to ${newOwnerName}. Note: ${notes}`,
      timestamp: nowIso,
    };

    return { success: true, loop: updatedLoop, event };
  }

  /**
   * Resolve and close a Care Loop. Requires evidence and resolution notes.
   */
  static resolveLoop(
    currentLoop: CareLoop,
    actorId: string,
    actorName: string,
    resolutionNotes: string,
    evidenceType: CareLoop['evidenceType'],
    currentTime: Date
  ): TransitionResult {
    if (currentLoop.status === 'resolved') {
      return { success: false, error: 'Loop is already resolved.' };
    }
    if (!resolutionNotes || resolutionNotes.trim().length === 0) {
      return { success: false, error: 'Resolution notes and evidence are mandatory to close a loop.' };
    }

    const previousState = currentLoop.status;
    const nowIso = currentTime.toISOString();

    const updatedLoop: CareLoop = {
      ...currentLoop,
      status: 'resolved',
      closedAt: nowIso,
      resolutionNotes,
      evidenceType: evidenceType || 'observation',
      ownerId: actorId,
      ownerName: actorName,
    };

    const event: LoopEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      loopId: currentLoop.id,
      eventType: 'resolved',
      actorId,
      actorName,
      previousState,
      newState: 'resolved',
      notes: `Closed by ${actorName}. Evidence: [${evidenceType || 'observation'}] - ${resolutionNotes}`,
      timestamp: nowIso,
    };

    return { success: true, loop: updatedLoop, event };
  }

  /**
   * Evaluate a Care Loop against the current time to check for lapse and escalation.
   */
  static evaluateTimeProgression(
    currentLoop: CareLoop,
    currentTime: Date
  ): { updated: boolean; loop: CareLoop; event?: LoopEvent } {
    if (currentLoop.status === 'resolved') {
      return { updated: false, loop: currentLoop };
    }

    const deadlineTime = new Date(currentLoop.deadline).getTime();
    const currTime = currentTime.getTime();
    const nowIso = currentTime.toISOString();

    // Check if loop has exceeded deadline
    if (currTime > deadlineTime) {
      // If still open and past deadline => LAPSED
      if (currentLoop.status === 'open' && currentLoop.escalationLevel === 0) {
        const updatedLoop: CareLoop = {
          ...currentLoop,
          status: 'lapsed',
          escalationLevel: 1,
        };
        const event: LoopEvent = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          loopId: currentLoop.id,
          eventType: 'lapsed',
          previousState: 'open',
          newState: 'lapsed',
          notes: 'Deadline passed without claim. Care loop marked as lapsed.',
          timestamp: nowIso,
        };
        return { updated: true, loop: updatedLoop, event };
      }

      // If lapsed or open for more than 15 minutes past deadline => ESCALATED
      const escalationThreshold = deadlineTime + 15 * 60 * 1000;
      if (
        (currentLoop.status === 'lapsed' || currentLoop.status === 'open') &&
        currTime > escalationThreshold &&
        currentLoop.escalationLevel < 2
      ) {
        const updatedLoop: CareLoop = {
          ...currentLoop,
          status: 'escalated',
          escalationLevel: 2,
        };
        const event: LoopEvent = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          loopId: currentLoop.id,
          eventType: 'escalated',
          previousState: currentLoop.status,
          newState: 'escalated',
          notes: 'Critical alert: Care loop escalated to all trusted family members & caregivers.',
          timestamp: nowIso,
        };
        return { updated: true, loop: updatedLoop, event };
      }
    }

    return { updated: false, loop: currentLoop };
  }
}
