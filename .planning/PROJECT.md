# InTeam — Volleyball Team Manager PWA

## What This Is

InTeam is a Progressive Web App for managing volleyball teams, covering coaches and players (including youth). Coaches manage teams, events, training pools, and player development. Players track attendance, view schedules, and see their own progress. Deployed on Render.com with separate React frontend and Node.js/Express backend backed by MongoDB Atlas.

## Core Value

Coaches and players stay coordinated — from event scheduling and attendance to car pools and team finances — all in one mobile-first app.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — inferred from existing codebase -->

- ✓ JWT authentication with role-based access (Trainer / Spieler / Jugendspieler) — existing
- ✓ Team management (create, edit teams, assign coaches and players) — existing
- ✓ Event management with attendance tracking (accept/decline invitations) — existing
- ✓ Push notifications with persistent scheduling queue (1h, 3h, 24h reminders) — existing
- ✓ Player attributes and skill ratings with history timeline — existing
- ✓ Player self-assessment page — existing
- ✓ Training pools with auto-invite logic — existing
- ✓ Email service integration (Brevo/Gmail) — existing
- ✓ PWA with service worker and offline support (Workbox) — existing
- ✓ PDF import for match schedules (pdf-parse, parsing fix in progress) — existing (partially broken)
- ✓ Voting / deadline system — existing
- ✓ German timezone handling throughout — existing
- ✓ Mobile-first layout with coach and player navigation — existing

### Active

<!-- Current milestone scope — building toward these -->

- [ ] Backend memory optimization — identify and fix routes causing memory spikes on Render.com free tier
- [ ] Reduce unnecessary loading — eliminate redundant API calls and over-fetching on key pages
- [ ] Fix PDF schedule import — pdf-parse patterns improved (whole-PDF search, multi-line pattern); debug logging still present; needs verification against real federation PDFs and cleanup
- [ ] Fix coach event page mobile layout — import PDF button breaks mobile layout
- [ ] Car pool organizer at match events — players self-register as driver (with seats) or passenger; coach finalizes assignments
- [ ] Team fund / punishment catalog — coach maintains a catalog of fines per team; players see their own balance
- [ ] App Store + Play Store release — package existing PWA for distribution (approach TBD: Capacitor / TWA)

### Out of Scope

- Real-time chat — high complexity, no demand identified yet
- Video uploads — storage/bandwidth costs
- Native app rebuild (React Native) — PWA packaging preferred, revisit if PWA stores fail
- Multi-language support — German-first for now

## Context

- Production app with active teams and players — downtime has real impact
- Hosted on Render.com free tier — memory limit (~512MB) is a real constraint
- Backend: Node.js 18 / Express 4 / Mongoose 7 / MongoDB Atlas
- Frontend: React 18 / MUI 5 / React Query 5 / Workbox PWA
- UI language is German throughout
- PDF import uses `pdf-parse` — an in-progress fix improves parsing by searching the entire PDF and handling multi-line row formats, but debug logging is still present and the fix is unverified; pdfjs-dist/docling replacement remains an option if the pdf-parse fix proves insufficient
- No automated tests exist — changes are manually tested

## Constraints

- **Memory**: Render.com free tier — backend must stay under ~512MB; certain routes currently spike and crash the process
- **Build-time env vars**: Frontend env vars require a full redeploy to change
- **No local test environment**: Changes tested against test deployment (https://inteam-test.onrender.com)
- **Tech stack**: No rewrites — extend existing React/Express/MongoDB stack
- **German locale**: All UI, dates, and copy remain in German

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix PDF schedule parsing | pdf-parse patterns improved (whole-PDF search, multi-line support); if still insufficient, replace with pdfjs-dist | — In progress / unverified |
| PWA packaging for App Store | Avoids full native rewrite; fastest path to stores | — Pending |
| Car pool as part of Event model | Reuses existing invitation/attendance infrastructure | — Pending |
| Team fund as new Team sub-document | Keeps fines scoped to each team, editable by coach | — Pending |

---
*Last updated: 2026-02-24 — PDF parsing context updated after remote commits*
