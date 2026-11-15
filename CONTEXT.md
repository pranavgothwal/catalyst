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
  - `MedicationScheduleEngine`: Timezone-aware, idempotent daily dose generation, grace periods.
  - `CareContext`: Persistent state with `localStorage` fallback across page reloads, persona switching, role permission checks, and deterministic demo clock.
- **Deployment:** Multi-stage Dockerfile for containerized deployment (Cloud Run ready).

## 3. Implemented Features (P0 Complete & Verified)
- [x] Cloned catalyst repository (`https://github.com/pranavgothwal/catalyst.git`).
- [x] Full React 18 + TypeScript + Vite + Tailwind CSS scaffold.
- [x] Role-aware unified experiences on shared care data:
  - **ELDER Today:** Dignified greeting, large high-contrast medication cards, speech read-aloud support (`SpeechSynthesis`), skip reasons, upcoming appointments, emergency circle contacts, and access privacy controls.
  - **FAMILY Coordination:** Care Loops engine hub, atomic responsibility claiming, delegation/handoff, verifiable resolution with required evidence, prescription manager with permission enforcement, and appointment views.
  - **CAREGIVER Shift:** Shift start/end, active caregiver loop assignment, observations log, structured computed handover briefs with explicit incoming caregiver acceptance.
- [x] Care Loop Engine:
  - Full lifecycle: `OPEN` -> `CLAIMED` -> `HANDED_OFF` -> `RESOLVED`.
  - Automatic time-based progression: `OPEN` -> `LAPSED` -> `ESCALATED`.
  - Double-claim prevention and mandatory resolution evidence.
- [x] Medication scheduling and adherence tracking:
  - Honest status distinction: `due`, `unconfirmed`, `taken`, `not_taken`, `skipped` (with reason), and `follow_up`.
  - Clear provenance recording (self-reported vs. caregiver observation).
- [x] Role-Based Access Control (RBAC):
  - Strictly enforced at context/engine layer: only authorized circle members can modify prescriptions (`canManageMedications`), elders cannot be forced into coordination claiming, and only caregivers can issue shift handovers.
- [x] Shared immutable care timeline:
  - Append-only event history with actor, role, timestamp, provenance, and severity.
- [x] Elder-controlled privacy & access:
  - Viewable access receipts showing which circle members accessed care categories.
- [x] Multi-language support:
  - English, Hindi (हिंदी), and Marathi (मराठी) translations on Elder Today interface.
- [x] Seeded demo personas:
  - Sheela (Elder care recipient), Priya (Family coordinator), Rahul (Family son), Sunita (Caregiver).
- [x] Persistent State & Controllable Demo Clock:
  - State survives browser refresh via synchronized local store.
  - Interactive judge-friendly clock (+15m, +45m miss, +2h escalation, reset).
  - Accelerates real state machine and updates Care Loop statuses without bypassing business rules.
- [x] Production Express server (`server/index.js`) and multi-stage `Dockerfile`.
- [x] Automated test suites:
  - Node.js test runner passing 8/8 tests covering Care Loop state transitions, end-to-end due-to-resolution flow, and RBAC permission enforcement.
- [x] Production build verified (`dist/index.html` generated with 0 errors).
- [x] Git commits and push verified to remote repository `main` branch.

## 4. Partially Implemented Features
- None (All P0 requirements operational).

## 5. Unimplemented Features
- External email delivery (omitted as per safety guidelines to avoid claiming fake delivery without configured SMTP credentials).
- Complex medical diagnostics / wearables (explicitly excluded).

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
    └── careLoopWorkflow.test.js
```

## 7. Database Schema & Core Entities
- `Profile`: ID, full name, role (elder | family | caregiver), phone, email, avatar, preferred language.
- `CareCircle`: ID, name, elderProfileId, timezone, createdAt.
- `CircleMember`: ID, circleId, profileId, role, relationship, permissions, active.
- `Medication`: ID, circleId, name, dosage, instructions, frequency, scheduleTimes, category, active.
- `DoseInstance`: ID, medicationId, scheduledTime, status (due | unconfirmed | taken | not_taken | skipped | follow_up), provenance, actorId, careLoopId.
- `CareLoop`: ID, circleId, sourceEventType, sourceId, title, description, status (open | claimed | handed_off | lapsed | escalated | resolved), ownerId, escalationLevel, deadline, evidenceType, resolutionNotes.
- `CaregiverHandover`: ID, departingCaregiverId, arrivingCaregiverId, briefText, unresolvedLoopsCount, observations, acceptedAt.
- `TimelineEvent`: ID, timestamp, eventType, title, description, actorName, actorRole, provenance, severity.

## 8. Safety and Trust Rules
- No check-in does NOT mean medication was missed; represented honestly as "unconfirmed".
- "Taken" is user-reported confirmation, not ingestion proof.
- Caregiver observations preserve provenance.
- Prescription changes require authorized human action.
- Mandatory evidence before closing Care Loops.

## 9. Environment Variables
- `PORT`: Port for Express server (default `8080`).
- `NODE_ENV`: `production` / `development`.

## 10. Local Setup and Build Commands
```bash
npm install
npm run build
npm test
npm run server
```

## 11. Production Build & Deployment Commands
```bash
docker build -t alwayswithyou:latest .
# Run locally:
docker run -p 8080:8080 alwayswithyou:latest
# Cloud Run deploy (once Run API is enabled on GCP project):
# gcloud run deploy alwayswithyou --source . --platform managed --region us-central1 --allow-unauthenticated
```

## 12. Tests Executed & Actual Results
- Command: `npm test`
- Results:
  - `✔ CareLoopEngine: creates a loop in OPEN state with calculated deadline`
  - `✔ CareLoopEngine: claims an open loop atomically`
  - `✔ CareLoopEngine: prevents double claim by unauthorized actors`
  - `✔ CareLoopEngine: transitions from claimed to handed_off to another member`
  - `✔ CareLoopEngine: mandates resolution notes and evidence to resolve loop`
  - `✔ CareLoopEngine: advances to lapsed and escalated when deadline passes without claim`
  - `✔ End-to-End Care Loop Workflow: Due -> Unconfirmed -> Loop Created -> Claimed -> Handed Off -> Resolved`
  - `✔ Role-based Permission Enforcement: Rahul cannot manage medications`
  - Total: 8 passed, 0 failed.

## 13. Deployment Status & Verification
- **Production Build:** Verified (`dist/assets/index-Dqh4CTt2.js` 222.25 kB, clean compile).
- **Server:** Verified Express production static server ready to serve on port 8080.
- **Docker:** Multi-stage production `Dockerfile` created and configured.
- **Cloud Run Deployment Blocker:** Attempted automated deployment via `gcloud run deploy`. The authenticated service account `1059717057567-compute@developer.gserviceaccount.com` in GCP project `sunny-emissary-463707-u0` lacks IAM permission `serviceusage.services.enable` to activate `run.googleapis.com` (Cloud Run Admin API). Once the Cloud Run Admin API is enabled on the GCP project by the project owner via `gcloud auth login` with owner permissions or through the Google Cloud Console, running `gcloud run deploy alwayswithyou --source . --platform managed --allow-unauthenticated` will deploy the container immediately.

## 14. Current Branch & Latest Commit Hash
- Branch: `main`
- Remote: `https://github.com/pranavgothwal/catalyst.git`
- Latest Commit: `f6093c6`
