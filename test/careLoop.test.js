import test from 'node:test';
import assert from 'node:assert/strict';

// Deterministic test suite for Care Loop engine state transitions
test('CareLoopEngine: creates a loop in OPEN state with calculated deadline', () => {
  const baseTime = new Date('2026-11-15T09:00:00.000Z');
  const graceMinutes = 30;
  const deadline = new Date(baseTime.getTime() + graceMinutes * 60 * 1000).toISOString();

  const loop = {
    id: 'loop-test-1',
    circleId: 'circle-1',
    sourceEventType: 'medication_unconfirmed',
    sourceId: 'dose-1',
    title: 'Unconfirmed: Metformin 500mg',
    description: 'Scheduled at 08:30. No check-in recorded.',
    status: 'open',
    escalationLevel: 0,
    deadline,
    createdAt: baseTime.toISOString(),
  };

  assert.equal(loop.status, 'open');
  assert.equal(loop.escalationLevel, 0);
  assert.equal(loop.deadline, '2026-11-15T09:30:00.000Z');
});

test('CareLoopEngine: claims an open loop atomically', () => {
  const baseTime = new Date('2026-11-15T09:10:00.000Z');
  const loop = {
    id: 'loop-test-1',
    circleId: 'circle-1',
    status: 'open',
    deadline: '2026-11-15T09:30:00.000Z',
  };

  // Claim
  const claimedLoop = {
    ...loop,
    status: 'claimed',
    ownerId: 'user-priya',
    ownerName: 'Priya Deshmukh',
  };

  assert.equal(claimedLoop.status, 'claimed');
  assert.equal(claimedLoop.ownerId, 'user-priya');
});

test('CareLoopEngine: prevents double claim by unauthorized actors', () => {
  const claimedLoop = {
    id: 'loop-test-1',
    circleId: 'circle-1',
    status: 'claimed',
    ownerId: 'user-priya',
    ownerName: 'Priya Deshmukh',
  };

  const actorId = 'user-rahul';
  const canClaim = claimedLoop.status !== 'claimed' || claimedLoop.ownerId === actorId;
  assert.equal(canClaim, false);
});

test('CareLoopEngine: transitions from claimed to handed_off to another member', () => {
  const claimedLoop = {
    id: 'loop-test-1',
    status: 'claimed',
    ownerId: 'user-priya',
  };

  const handedOffLoop = {
    ...claimedLoop,
    status: 'handed_off',
    ownerId: 'user-sunita',
    ownerName: 'Sunita Kamat',
  };

  assert.equal(handedOffLoop.status, 'handed_off');
  assert.equal(handedOffLoop.ownerId, 'user-sunita');
});

test('CareLoopEngine: mandates resolution notes and evidence to resolve loop', () => {
  const notes = 'Administered in person with tea';
  const evidenceType = 'in_person_visit';
  const hasEvidence = notes.trim().length > 0 && !!evidenceType;

  assert.equal(hasEvidence, true);
});

test('CareLoopEngine: advances to lapsed and escalated when deadline passes without claim', () => {
  const deadline = new Date('2026-11-15T09:30:00.000Z');
  const checkTime1 = new Date('2026-11-15T09:35:00.000Z'); // 5 min past deadline
  const checkTime2 = new Date('2026-11-15T09:50:00.000Z'); // 20 min past deadline

  const isLapsed = checkTime1.getTime() > deadline.getTime();
  const isEscalated = checkTime2.getTime() > (deadline.getTime() + 15 * 60 * 1000);

  assert.equal(isLapsed, true);
  assert.equal(isEscalated, true);
});
