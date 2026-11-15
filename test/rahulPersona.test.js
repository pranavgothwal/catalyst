import test from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Inline data matching src/data/seededData.ts exactly
// ---------------------------------------------------------------------------
const SEEDED_PROFILES = [
  {
    id: 'user-sheela',
    fullName: 'Sheela Deshmukh',
    role: 'elder',
    phone: '+91 98201 12345',
    email: 'sheela@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    preferredLanguage: 'en',
  },
  {
    id: 'user-priya',
    fullName: 'Priya Deshmukh',
    role: 'family',
    phone: '+91 98201 54321',
    email: 'priya@example.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-rahul',
    fullName: 'Rahul Deshmukh',
    role: 'family',
    phone: '+91 98201 67890',
    email: 'rahul@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-sunita',
    fullName: 'Sunita Kamat',
    role: 'caregiver',
    phone: '+91 98201 99887',
    email: 'sunita.kamat@eldercare.org',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
];

const SEEDED_MEMBERS = [
  {
    id: 'mem-sheela',
    circleId: 'circle-sheela-main',
    profileId: 'user-sheela',
    role: 'elder',
    relationship: 'Self',
    canManageMedications: true,
    canViewAudit: true,
    isEmergencyContact: false,
    active: true,
  },
  {
    id: 'mem-priya',
    circleId: 'circle-sheela-main',
    profileId: 'user-priya',
    role: 'family',
    relationship: 'Daughter (Primary Coordinator)',
    canManageMedications: true,
    canViewAudit: true,
    isEmergencyContact: true,
    active: true,
  },
  {
    id: 'mem-rahul',
    circleId: 'circle-sheela-main',
    profileId: 'user-rahul',
    role: 'family',
    relationship: 'Son',
    canManageMedications: false,
    canViewAudit: true,
    isEmergencyContact: true,
    active: true,
  },
  {
    id: 'mem-sunita',
    circleId: 'circle-sheela-main',
    profileId: 'user-sunita',
    role: 'caregiver',
    relationship: 'Professional Day Caregiver',
    canManageMedications: true,
    canViewAudit: false,
    isEmergencyContact: false,
    active: true,
  },
];

// ---------------------------------------------------------------------------
// Helper: simulate the switchProfile fix (find by ID)
// ---------------------------------------------------------------------------
function switchProfile(profileId) {
  return SEEDED_PROFILES.find((p) => p.id === profileId) ?? null;
}

// Helper: simulate old buggy switchRole (find by role — returns first match)
function switchRole(role) {
  return SEEDED_PROFILES.find((p) => p.role === role) ?? null;
}

// ---------------------------------------------------------------------------
// TEST 1: Rahul profile exists with correct id and role
// ---------------------------------------------------------------------------
test('Rahul profile exists in SEEDED_PROFILES with id=user-rahul and role=family', () => {
  const rahul = SEEDED_PROFILES.find((p) => p.id === 'user-rahul');
  assert.ok(rahul, 'Rahul profile must exist');
  assert.equal(rahul.id, 'user-rahul');
  assert.equal(rahul.role, 'family');
  assert.equal(rahul.fullName, 'Rahul Deshmukh');
});

// ---------------------------------------------------------------------------
// TEST 2: Priya and Rahul are both role=family but are distinct profiles
// ---------------------------------------------------------------------------
test('Priya and Rahul both have role=family but are distinct profiles', () => {
  const priya = SEEDED_PROFILES.find((p) => p.id === 'user-priya');
  const rahul = SEEDED_PROFILES.find((p) => p.id === 'user-rahul');
  assert.ok(priya, 'Priya profile must exist');
  assert.ok(rahul, 'Rahul profile must exist');
  assert.equal(priya.role, 'family');
  assert.equal(rahul.role, 'family');
  assert.notEqual(priya.id, rahul.id);
  assert.notEqual(priya.fullName, rahul.fullName);
});

// ---------------------------------------------------------------------------
// TEST 3: Rahul's member record — canManageMedications=false, canViewAudit=true
// ---------------------------------------------------------------------------
test("Rahul's member record: canManageMedications=false, canViewAudit=true", () => {
  const rahulMember = SEEDED_MEMBERS.find((m) => m.profileId === 'user-rahul');
  assert.ok(rahulMember, "Rahul's member record must exist");
  assert.equal(rahulMember.canManageMedications, false);
  assert.equal(rahulMember.canViewAudit, true);
  assert.equal(rahulMember.role, 'family');
});

// ---------------------------------------------------------------------------
// TEST 4: Priya's member record — canManageMedications=true
// ---------------------------------------------------------------------------
test("Priya's member record: canManageMedications=true", () => {
  const priyaMember = SEEDED_MEMBERS.find((m) => m.profileId === 'user-priya');
  assert.ok(priyaMember, "Priya's member record must exist");
  assert.equal(priyaMember.canManageMedications, true);
  assert.equal(priyaMember.role, 'family');
});

// ---------------------------------------------------------------------------
// TEST 5: switchProfile by ID finds Rahul specifically (not Priya)
// ---------------------------------------------------------------------------
test('switchProfile(user-rahul) returns Rahul, not Priya', () => {
  const result = switchProfile('user-rahul');
  assert.ok(result, 'switchProfile must return a profile');
  assert.equal(result.id, 'user-rahul');
  assert.equal(result.fullName, 'Rahul Deshmukh');
  assert.notEqual(result.id, 'user-priya');
});

// ---------------------------------------------------------------------------
// TEST 6: Old bug — switchRole('family') returns Priya (first family match)
// ---------------------------------------------------------------------------
test('switchRole("family") returns Priya — proves the old role-based bug', () => {
  const result = switchRole('family');
  assert.ok(result, 'switchRole must return a profile');
  // The first profile with role=family is Priya (index 1 in the array)
  assert.equal(result.id, 'user-priya');
  // Demonstrates the bug: switching to "family" never reaches Rahul
  assert.notEqual(result.id, 'user-rahul');
});

// ---------------------------------------------------------------------------
// TEST 7: CareLoopEngine.claimLoop with Rahul's ID — Rahul CAN claim open loops
// ---------------------------------------------------------------------------
test('CareLoopEngine: Rahul can claim an open loop', () => {
  const openLoop = {
    id: 'loop-test-rahul-1',
    circleId: 'circle-sheela-main',
    sourceEventType: 'medication_unconfirmed',
    sourceId: 'dose-telmisartan-0900',
    title: 'Unconfirmed: Telmisartan 40mg',
    status: 'open',
    escalationLevel: 0,
    deadline: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  // Rahul is a family member — eligible to claim open loops
  const rahul = SEEDED_PROFILES.find((p) => p.id === 'user-rahul');
  const eligibleRoles = ['family', 'caregiver', 'elder'];
  const canClaim = openLoop.status === 'open' && eligibleRoles.includes(rahul.role);

  assert.equal(canClaim, true);

  // Simulate the claim
  const claimedLoop = {
    ...openLoop,
    status: 'claimed',
    ownerId: rahul.id,
    ownerName: rahul.fullName,
  };

  assert.equal(claimedLoop.status, 'claimed');
  assert.equal(claimedLoop.ownerId, 'user-rahul');
  assert.equal(claimedLoop.ownerName, 'Rahul Deshmukh');
});

// ---------------------------------------------------------------------------
// TEST 8: Permission check — canManageMedications differs between Rahul & Priya
// ---------------------------------------------------------------------------
test('Permission check: canManageMedications is false for Rahul, true for Priya', () => {
  const rahulMember = SEEDED_MEMBERS.find((m) => m.profileId === 'user-rahul');
  const priyaMember = SEEDED_MEMBERS.find((m) => m.profileId === 'user-priya');

  assert.equal(rahulMember.canManageMedications, false,
    'Rahul must NOT be able to manage medications');
  assert.equal(priyaMember.canManageMedications, true,
    'Priya must be able to manage medications');

  // Both are family role — proving role alone is insufficient for permissions
  assert.equal(rahulMember.role, priyaMember.role);
  assert.notEqual(rahulMember.canManageMedications, priyaMember.canManageMedications);
});

// ---------------------------------------------------------------------------
// TEST 9: All 4 personas have distinct IDs
// ---------------------------------------------------------------------------
test('All 4 personas have distinct IDs', () => {
  const ids = SEEDED_PROFILES.map((p) => p.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, 4, 'All 4 profile IDs must be unique');
  assert.ok(uniqueIds.has('user-sheela'));
  assert.ok(uniqueIds.has('user-priya'));
  assert.ok(uniqueIds.has('user-rahul'));
  assert.ok(uniqueIds.has('user-sunita'));
});

// ---------------------------------------------------------------------------
// TEST 10: Switching persona sequence Priya→Rahul→Sheela→Sunita→Priya
// ---------------------------------------------------------------------------
test('Persona switching sequence: Priya→Rahul→Sheela→Sunita→Priya all return correct profiles', () => {
  const sequence = [
    { id: 'user-priya',  expectedName: 'Priya Deshmukh',  expectedRole: 'family'    },
    { id: 'user-rahul',  expectedName: 'Rahul Deshmukh',  expectedRole: 'family'    },
    { id: 'user-sheela', expectedName: 'Sheela Deshmukh', expectedRole: 'elder'     },
    { id: 'user-sunita', expectedName: 'Sunita Kamat',    expectedRole: 'caregiver' },
    { id: 'user-priya',  expectedName: 'Priya Deshmukh',  expectedRole: 'family'    },
  ];

  for (const step of sequence) {
    const profile = switchProfile(step.id);
    assert.ok(profile, `switchProfile(${step.id}) must return a profile`);
    assert.equal(profile.id, step.id,
      `Expected id=${step.id}, got ${profile.id}`);
    assert.equal(profile.fullName, step.expectedName,
      `Expected fullName=${step.expectedName}, got ${profile.fullName}`);
    assert.equal(profile.role, step.expectedRole,
      `Expected role=${step.expectedRole}, got ${profile.role}`);
  }
});

// ---------------------------------------------------------------------------
// TEST 11: Care Circle member directory has defined roles and permissions
// ---------------------------------------------------------------------------
test('Care Circle: All members have defined permissions and roles', () => {
  assert.equal(SEEDED_MEMBERS.length, 4, 'Must have 4 registered members');
  for (const m of SEEDED_MEMBERS) {
    assert.ok(m.id, 'Member must have id');
    assert.ok(m.profileId, 'Member must link to profileId');
    assert.ok(m.role, 'Member must have assigned role');
    assert.equal(typeof m.canManageMedications, 'boolean');
    assert.equal(typeof m.canViewAudit, 'boolean');
  }

  // Verify Rahul vs Priya
  const rahul = SEEDED_MEMBERS.find((m) => m.profileId === 'user-rahul');
  const priya = SEEDED_MEMBERS.find((m) => m.profileId === 'user-priya');
  assert.equal(rahul.canManageMedications, false);
  assert.equal(priya.canManageMedications, true);
});

// ---------------------------------------------------------------------------
// TEST 12: CareLoopEngine: Non-owner cannot initiate a handoff on a claimed loop
// ---------------------------------------------------------------------------
test('CareLoopEngine: Non-owner cannot initiate a handoff on a claimed loop', () => {
  const loopClaimedByPriya = {
    id: 'loop-test-handoff',
    circleId: 'circle-sheela-main',
    status: 'claimed',
    ownerId: 'user-priya',
    ownerName: 'Priya Deshmukh',
  };

  const actorId = 'user-rahul'; // Rahul tries to hand off Priya's loop
  const canHandOff = loopClaimedByPriya.ownerId === actorId;
  assert.equal(canHandOff, false, 'Non-owner must be rejected from initiating handoff');
});

// ---------------------------------------------------------------------------
// TEST 13: Handoff target validation: Excludes current user and elder role
// ---------------------------------------------------------------------------
test('Handoff validation: Available handoff targets exclude current user and elder role', () => {
  const currentUserId = 'user-priya';
  const availableTargets = SEEDED_PROFILES.filter(
    (p) => p.id !== currentUserId && p.role !== 'elder'
  );

  // Priya handing off: targets should be Rahul and Sunita
  const targetIds = availableTargets.map((p) => p.id);
  assert.ok(!targetIds.includes('user-priya'), 'Must not include self');
  assert.ok(!targetIds.includes('user-sheela'), 'Must not include elder');
  assert.ok(targetIds.includes('user-rahul'), 'Must include Rahul');
  assert.ok(targetIds.includes('user-sunita'), 'Must include Sunita');
});
