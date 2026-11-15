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

## 3. Implemented Features & Audit Verifications

### A. Manual-Interaction & UI Regression Audit (Verified)
1. **Four-Persona Switching:** All personas (Sheela, Priya, Rahul, Sunita) switch deterministically by unique `profileId` via `switchProfile(p.id)`. On mobile, selecting a persona automatically closes the sidebar drawer.
2. **Permission Segregation Across Switching & Refreshes:**
   - Priya (`canManageMedications: true`) has full prescription management privileges.
   - Rahul (`canManageMedications: false`) is strictly restricted to View Only mode (Add Prescription button hidden; backend engine enforces rejection).
   - A dedicated **Care Circle** tab in `FamilyCoordinationView` renders the membership roster with explicit badges for prescription authorization, audit access, and emergency contact status.
3. **Care Loop Lifecycle:** Open, Claim, Hand Off, Lapse, Escalate, and Resolve are verified through the UI:
   - Hand-off targets dynamically exclude the current user and elder role.
   - Non-owners of claimed loops are clearly informed that only the current owner can reassign responsibility.
   - Evidence and resolution notes are strictly mandatory to close loops.
4. **Deterministic Demo Clock:** Quick-advance buttons (`+15m`, `+45m (Miss)`, `+2h (Escalate)`, `Reset 9:15 AM`) reliably trigger dose evaluations, loop creation, and status transitions.
5. **Layout & Responsive Shell:**
   - Desktop: Left sidebar (`w-64`) with brand identity, care recipient context ("Sheela Deshmukh, 82"), role navigation, and persona switcher.
   - Mobile: Top bar with persona badge, sliding drawer, bottom tab bar, and compact floating demo clock pill positioned at `bottom-20` to avoid viewport obstruction.
6. **Elder Today Accessibility:** High-contrast 24px text, native `SpeechSynthesis` read-aloud support, skip reason logging, privacy access receipts, and full English, Hindi (हिंदी), and Marathi (मराठी) localization.
7. **Actionable Feedback:** Zero broken or purely decorative buttons; input validation messages for empty notes and unauthorized actions.
8. **Error-Free Execution:** Zero console errors, valid JSX hierarchy, and clean mobile responsive flow.

### B. Timezone & Timestamp Correction
- Doses generated using local date components (`getFullYear()`, `getMonth()`, `getDate()`) to eliminate UTC boundary shifts in Indian Standard Time (IST UTC+5:30) and other non-UTC environments.

## 4. Automated Test Results (21/21 Passing)
All test suites run via Node.js test runner (`node --test test/*.test.js`):
- `test/careLoop.test.js` (6 tests):
  - `CareLoopEngine: creates a loop in OPEN state with calculated deadline` (PASS)
  - `CareLoopEngine: claims an open loop atomically` (PASS)
  - `CareLoopEngine: prevents double claim by unauthorized actors` (PASS)
  - `CareLoopEngine: transitions from claimed to handed_off to another member` (PASS)
  - `CareLoopEngine: mandates resolution notes and evidence to resolve loop` (PASS)
  - `CareLoopEngine: advances to lapsed and escalated when deadline passes without claim` (PASS)
- `test/careLoopWorkflow.test.js` (2 tests):
  - `End-to-End Care Loop Workflow: Due -> Unconfirmed -> Loop Created -> Claimed -> Handed Off -> Resolved` (PASS)
  - `Role-based Permission Enforcement: Rahul cannot manage medications` (PASS)
- `test/rahulPersona.test.js` (13 tests):
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
  - `Care Circle: All members have defined permissions and roles` (PASS)
  - `CareLoopEngine: Non-owner cannot initiate a handoff on a claimed loop` (PASS)
  - `Handoff validation: Available handoff targets exclude current user and elder role` (PASS)

## 5. Deployment Status & Known External Blocker
- **Docker & Server:** Tested and verified. Multi-stage Dockerfile builds `dist/` and runs production Express server.
- **Google Cloud Run:** Deployment is blocked on GCP IAM permissions. The service account `1059717057567-compute@developer.gserviceaccount.com` in project `sunny-emissary-463707-u0` lacks `serviceusage.services.enable` to enable the Cloud Run Admin API (`run.googleapis.com`). Requires GCP project administrator to enable Cloud Run API in Cloud Console.

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
