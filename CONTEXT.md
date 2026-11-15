# ALWAYS WITH YOU — CONTEXT & HANDOVER

## 1. Product Identity, Positioning & Problem Statement
- **Product Name:** AlwaysWithYOU
- **Category:** Human-centred Care Continuity System
- **Supporting Descriptor:** Care that stays with you, every step of the way.
- **Brand Personality:** Warm, reassuring, human, trustworthy, and modern.
- **Color Palette & Visuals:** Warm ivory (`#FAF8F5`), Deep forest green (`#1E3A2F`), Muted sage (`#6B8F71`), Warm terracotta/amber accents (`#C96E4B`). Clear typography, large touch targets, accessible contrast.
- **Core Product Thesis:** Elderly care fails in the gaps between people, not simply because of forgotten reminders. AlwaysWithYOU turns care events that need human attention into owned, trackable, and closable responsibilities called **Care Loops**. It connects elderly individuals, family members, and caregivers while preserving the elderly person's dignity, agency, and control.
- **Problem Statement:** Elderly Care & Medication Management Platform.

## 2. Current Architecture & Technology Stack
- **Frontend:** React 18 / Vite / TypeScript / Tailwind CSS / Lucide React icons.
- **Backend / Server:** Express.js production server, health endpoints, SPA static routing, API endpoints for loops.
- **State & Deterministic Engines:**
  - `CareLoopEngine`: Atomic claims, handoffs, lapse/escalation, evidence-backed resolutions.
  - `MedicationScheduleEngine`: Timezone-safe, idempotent daily dose generation, grace periods.
  - `CareContext`: Persistent state with `localStorage` (versioned `alwayswithyou_state_v2`), profile ID-based switching (`switchProfile`), RBAC permission checks, and deterministic demo clock.
- **Deployment:** Multi-stage Dockerfile for containerized deployment (Cloud Run ready).

## 3. Implemented Features & Recent Fixes

### A. Rahul Persona Bug Fix (Root Cause & Resolution)
- **Root Cause:** Persona switcher previously invoked `switchRole(p.role)`, which searched `SEEDED_PROFILES.find(p => p.role === role)`. Since both Priya and Rahul have `role: 'family'` and Priya appeared first in the array, clicking Rahul always selected Priya. Furthermore, `FamilyCoordinationView` hardcoded `"Priya's Hub"`.
- **Resolution:**
  - Switched navigation to explicit profile ID: `switchProfile(profileId: string)`.
  - Updated `PersonaSwitcher` to call `switchProfile(p.id)`.
  - Dynamically titles the family view as `{currentProfile.fullName.split(' ')[0]}'s Hub` (displays "Rahul's Hub" or "Priya's Hub").
  - Enforced RBAC at both UI and business logic layers: Rahul's member profile has `canManageMedications: false`, correctly hiding the "Add Prescription" button and rejecting attempts at the engine level.
  - Added 10 automated regression tests in `test/rahulPersona.test.js` validating distinct IDs, permissions, loop claims, and switching sequences.

### B. Timezone & Timestamp Correction
- **Root Cause:** Doses generated using UTC string concatenation (`toISOString().split('T')[0]`) created cross-boundary discrepancies when run in local timezones (e.g. IST UTC+5:30), causing afternoon doses to appear at evening hours or miss filter queries.
- **Resolution:**
  - Updated `MedicationScheduleEngine` and `seededData.ts` to construct timestamps using local date components (`getFullYear()`, `getMonth()`, `getDate()`).
  - Updated `ElderTodayView` to filter today's doses using local date comparison.
  - Bumped state storage key to `alwayswithyou_state_v2` ensuring fresh, consistent timestamps across reloads.

### C. UI/UX Redesign (Brand-Aligned & Human-Centred)
- **Desktop Sidebar Navigation:** Fixed left sidebar featuring product identity, care recipient context (Sheela Verma, 82), role-specific navigation, and one-click profile switching.
- **Mobile Navigation:** Responsive top bar with persona indicator and bottom tab bar ensuring comfortable one-handed navigation without horizontal overflow.
- **Compact Floating Demo Clock:** Collapsible floating widget (`bottom-20 md:bottom-4`) that displays a minimal live status pill when collapsed and expands on click, preventing UI obstruction.
- **Role-Aware Workspaces:**
  - **ELDER Today:** Large text (24px+), clear contrast, read-aloud voice support, simple check-in actions, and access privacy receipts.
  - **FAMILY Coordination:** Segmented tabs for active Care Loops, prescriptions, and appointments with atomic claim/handoff modals.
  - **CAREGIVER Shift:** Shift status, active loop claiming, observation logs, and formal shift handover acceptance.
  - **SHARED Timeline:** Immutable chronological feed tracking all events, actors, and provenance tags.

## 4. Automated Test Results (18/18 Passing)
All test suites run via Node.js test runner (`node --test test/*.test.js`):
- `test/careLoop.test.js`:
  - `CareLoopEngine: creates a loop in OPEN state with calculated deadline` (PASS)
  - `CareLoopEngine: claims an open loop atomically` (PASS)
  - `CareLoopEngine: prevents double claim by unauthorized actors` (PASS)
  - `CareLoopEngine: transitions from claimed to handed_off to another member` (PASS)
  - `CareLoopEngine: mandates resolution notes and evidence to resolve loop` (PASS)
  - `CareLoopEngine: advances to lapsed and escalated when deadline passes without claim` (PASS)
- `test/careLoopWorkflow.test.js`:
  - `End-to-End Care Loop Workflow: Due -> Unconfirmed -> Loop Created -> Claimed -> Handed Off -> Resolved` (PASS)
  - `Role-based Permission Enforcement: Rahul cannot manage medications` (PASS)
- `test/rahulPersona.test.js`:
  - `Rahul profile exists in SEEDED_PROFILES with id=user-rahul and role=family` (PASS)
  - `Priya and Rahul both have role=family but are distinct profiles` (PASS)
  - `Rahul's member record: canManageMedications=false, canViewAudit=true` (PASS)
  - `Priya's member record: canManageMedications=true` (PASS)
  - `switchProfile(user-rahul) returns Rahul, not Priya` (PASS)
  - `switchRole("family") returns Priya — proves the old role-based bug` (PASS)
  - `CareLoopEngine: Rahul can claim an open loop` (PASS)
  - `Permission check: canManageMedications is false for Rahul, true for Priya` (PASS)
  - `All 4 personas have distinct IDs` (PASS)
  - `Persona switching sequence: Priya→Rahul→Sheela→Sunita→Priya all return correct profiles` (PASS)

## 5. Deployment Status & Known External Blocker
- **Docker & Server:** Tested and working. Multi-stage Dockerfile builds `dist/` and runs production Express server.
- **Google Cloud Run:** Deployment blocked on GCP IAM permissions. The service account `1059717057567-compute@developer.gserviceaccount.com` in project `sunny-emissary-463707-u0` lacks the `serviceusage.services.enable` permission to enable the Cloud Run Admin API (`run.googleapis.com`). Requires GCP project administrator to enable Cloud Run API in Cloud Console.

## 6. Repository Structure
```
catalyst/
├── .dockerignore
├── .gitignore
├── Dockerfile
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── server/
│   └── index.js
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── components/
│   │   ├── CaregiverShiftView.tsx
│   │   ├── DemoClockControl.tsx
│   │   ├── ElderTodayView.tsx
│   │   ├── FamilyCoordinationView.tsx
│   │   ├── PersonaSwitcher.tsx
│   │   └── SharedTimelineView.tsx
│   ├── context/
│   │   └── CareContext.tsx
│   ├── data/
│   │   └── seededData.ts
│   ├── engine/
│   │   ├── CareLoopEngine.ts
│   │   └── MedicationScheduleEngine.ts
│   └── types/
│       └── index.ts
└── test/
    ├── careLoop.test.js
    ├── careLoopWorkflow.test.js
    └── rahulPersona.test.js
```
