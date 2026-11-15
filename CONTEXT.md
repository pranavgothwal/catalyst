# ALWAYS WITH YOU — CONTEXT & HANDOVER

## 1. Product Identity, Positioning & Problem Statement
- **Product Name:** AlwaysWithYOU
- **Category:** Human-centred Care Continuity System
- **Supporting Descriptor:** Care that stays with you, every step of the way.
- **Brand Personality:** Warm, reassuring, human, trustworthy, and modern.
- **Color Palette & Visuals:** Warm ivory (`#FAF8F5`), Deep forest green (`#1E3A2F`), Muted sage (`#6B8F71`), Warm terracotta/amber accents (`#C96E4B`). Clear typography, large touch targets, accessible contrast.
- **Core Product Thesis:** Elderly care fails in the gaps between people, not simply because of forgotten reminders. AlwaysWithYOU turns care events that need human attention into owned, trackable, and closable responsibilities called **Care Loops**. It connects elderly individuals, family members, and caregivers while preserving the elderly person's dignity, agency, and control.
- **Problem Statement:** Elderly Care & Medication Management Platform.

## 2. Current Architecture & Honest Persistence Model
- **Frontend:** React 18 / Vite / TypeScript / Tailwind CSS / Lucide React icons.
- **Backend / Server:** Express.js production server, health endpoints, SPA static routing, disabled mock mutation endpoints to prevent unauthenticated injection.
- **State & Deterministic Engines:**
  - `CareLoopEngine`: Atomic claims, handoffs, lapse/escalation, evidence-backed resolutions.
  - `MedicationScheduleEngine`: Timezone-safe, idempotent daily dose generation, grace periods.
  - `CareContext`: Persistent state with `localStorage` (versioned `alwayswithyou_state_v2`), profile ID-based switching (`switchProfile`), RBAC permission checks, input sanitization, safe schema recovery, and deterministic demo clock.
- **Authentication & Persistence Realities:**
  - **Persona Switching is a deterministic client demo capability**, not an authenticated session token model. There are no server-side sessions, JWTs, or passwords.
  - Persistence is client-side (`localStorage`), designed for offline resilience and local demonstration. Cross-device and multi-user synchronization is not claimed.
- **Deployment:** Multi-stage hardened Dockerfile (runs as non-root `USER node`) and `vercel.json` with enterprise security headers.

## 3. Security Remediations Implemented (Second Submission)
1. **Defensive HTTP Security Headers (Vercel & Express):**
   - Implemented strict Content Security Policy (CSP): `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://images.unsplash.com https://api.dicebear.com; connect-src 'self';`
   - Configured `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
   - Restricted device APIs with `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`.
2. **Backend Hardening (`server/index.js`):**
   - Disabled framework disclosure (`app.disable('x-powered-by')`).
   - Restricted request payload limits (`express.json({ limit: '16kb' })`) to prevent memory exhaustion / DoS.
   - Enforced origin-whitelisted CORS policy, rejecting arbitrary third-party cross-origin requests.
   - Added in-memory rate limiting (120 req/min sliding window).
   - Disabled and explicitly blocked unauthenticated public mutation endpoints (`/api/loops/claim`).
3. **Frontend Persistence Defense (`CareContext.tsx`):**
   - Added `validateAndSanitizeSavedState` to strictly validate deserialized `localStorage` against known profile schemas, valid ISO timestamps, and array objects with valid IDs before restoring state.
   - Implemented safe recovery: malformed, corrupted, or injected localStorage structures are discarded cleanly without crashing.
   - Guarded duplicate medication check-ins to prevent race conditions or duplicate entries.
   - Added string sanitization (trimming and length limits) on user inputs (loop notes, check-in notes, reasons).
4. **Container Security (`Dockerfile`):**
   - Added unprivileged user isolation: switches from root to non-root `USER node` with proper directory ownership (`chown -R node:node /app`).

## 4. Automated Test Results (25/25 Passing)
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
- `test/securityRemediation.test.js` (4 tests):
  - `Security & Validation: validates and sanitizes corrupt localStorage payloads gracefully` (PASS)
  - `Security & Invariants: prevents duplicate dose check-ins with identical status` (PASS)
  - `Security & Sanitization: truncates and trims free-form notes and reason inputs` (PASS)
  - `Backend Security: verifies unauthenticated endpoint lock and headers` (PASS)

## 5. Deployment Status & Compatibility
- **Vercel:** Fully configured with `vercel.json` providing static SPA routing and defense-in-depth security headers.
- **Docker & Cloud Run:** Multi-stage production container verified with unprivileged `USER node` runtime on port 8080.
- **Known External Blocker:** Google Cloud Run deployment remains blocked on GCP IAM permissions (`serviceusage.services.enable` missing for Cloud Run Admin API). Vercel deployment provides an immediate working public alternative.

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
├── vercel.json
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
    ├── rahulPersona.test.js
    └── securityRemediation.test.js
```
