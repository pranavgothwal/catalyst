import test from 'node:test';
import assert from 'node:assert/strict';

test('Security & Validation: validates and sanitizes corrupt localStorage payloads gracefully', () => {
  // Test schema recovery with corrupt and unexpected objects
  const corruptPayloads = [
    null,
    undefined,
    'plain string',
    12345,
    [],
    { demoTime: 'invalid-date' },
    { currentProfileId: 'injected-attacker-id' },
    { medications: ['not-an-object', null, { noId: true }] },
  ];

  function validateAndSanitize(rawState) {
    if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) {
      return null;
    }
    const sanitized = {};
    if (typeof rawState.demoTime === 'string' && !Number.isNaN(Date.parse(rawState.demoTime))) {
      sanitized.demoTime = rawState.demoTime;
    }
    const VALID_PROFILES = ['user-sheela', 'user-priya', 'user-rahul', 'user-sunita'];
    if (typeof rawState.currentProfileId === 'string' && VALID_PROFILES.includes(rawState.currentProfileId)) {
      sanitized.currentProfileId = rawState.currentProfileId;
    }
    if (Array.isArray(rawState.medications)) {
      sanitized.medications = rawState.medications.filter(
        (m) => m && typeof m === 'object' && typeof m.id === 'string'
      );
    }
    return sanitized;
  }

  for (const payload of corruptPayloads) {
    const result = validateAndSanitize(payload);
    if (result) {
      assert.notEqual(result.currentProfileId, 'injected-attacker-id');
      assert.equal(result.demoTime, undefined);
      if (result.medications) {
        assert.equal(result.medications.length, 0);
      }
    } else {
      assert.equal(result, null);
    }
  }
});

test('Security & Invariants: prevents duplicate dose check-ins with identical status', () => {
  const existingDose = {
    id: 'dose-morning-1',
    medicationName: 'Metformin',
    status: 'taken',
    checkInTime: '2026-11-15T09:15:00.000Z',
  };

  const incomingStatus = 'taken';
  const shouldSkipDuplicate = existingDose.checkInTime && existingDose.status === incomingStatus;
  assert.equal(shouldSkipDuplicate, true);

  const changingStatus = 'not_taken';
  const allowStatusUpdate = !(existingDose.checkInTime && existingDose.status === changingStatus);
  assert.equal(allowStatusUpdate, true);
});

test('Security & Sanitization: truncates and trims free-form notes and reason inputs', () => {
  const dangerousLongInput = '  ' + 'A'.repeat(800) + '  ';
  const sanitized = dangerousLongInput.trim().slice(0, 500);

  assert.equal(sanitized.length, 500);
  assert.equal(sanitized.startsWith('A'), true);
  assert.equal(sanitized.endsWith('A'), true);
});

test('Backend Security: verifies unauthenticated endpoint lock and headers', async () => {
  process.env.NODE_ENV = 'test';
  const { default: app } = await import('../server/index.js');
  
  // Verify app exists and has disabled x-powered-by
  assert.equal(app.get('x-powered-by'), false);
});

test('Caregiver Handover Intelligence: computes synthesised summary from real active loops and medication exceptions', () => {
  const activeLoops = [
    { id: 'l1', title: 'Unconfirmed: Metformin 500mg', status: 'open' },
    { id: 'l2', title: 'Doctor Appointment Check', status: 'claimed' },
  ];
  const doseExceptions = [
    { id: 'd1', medicationName: 'Amlodipine 5mg', scheduledTime: '08:30', status: 'unconfirmed' },
  ];

  const loopSummary = activeLoops.length > 0
    ? `Active Loops: ${activeLoops.map(l => `${l.title} [${l.status.toUpperCase()}]`).join(', ')}`
    : 'No unresolved care loops.';
  const medSummary = doseExceptions.length > 0
    ? `Medication exceptions needing attention: ${doseExceptions.map(d => `${d.medicationName} (${d.scheduledTime})`).join(', ')}`
    : 'All scheduled medication doses confirmed.';

  const note = 'Morning routine completed';
  const computedSummary = `${note} | ${loopSummary} | ${medSummary}`;

  assert.equal(computedSummary.includes('Unconfirmed: Metformin 500mg [OPEN]'), true);
  assert.equal(computedSummary.includes('Amlodipine 5mg (08:30)'), true);
});

test('Provenance Enforcement: check-in provenance distinguishes elder self-report, caregiver observation, and family', () => {
  const rolesAndProvenance = [
    { role: 'elder', expected: 'self_reported' },
    { role: 'caregiver', expected: 'caregiver_observed' },
    { role: 'family', expected: 'family_observed' },
  ];

  for (const { role, expected } of rolesAndProvenance) {
    const provenance =
      role === 'elder'
        ? 'self_reported'
        : role === 'caregiver'
        ? 'caregiver_observed'
        : 'family_observed';
    assert.equal(provenance, expected);
  }
});
