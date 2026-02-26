# Roadmap: InTeam — Volleyball Team Manager PWA

## Overview

This milestone adds four capabilities to an already-deployed production app: first stabilizing the backend so memory crashes stop, then repairing the broken PDF schedule import, then delivering the car pool organizer for away games, and finally the team fund / fine catalog. Each phase delivers a coherent capability to real coaches and players. App Store packaging is scoped to v2 once the core features are stable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Backend Stability** - Eliminate memory crashes and reduce redundant load on Render.com free tier (completed 2026-02-24)
- [ ] **Phase 2: PDF Import + Mobile Layout** - Restore the broken schedule PDF import and fix the coach event page mobile layout
- [ ] **Phase 3: Car Pool Organizer** - Let players self-register as driver or passenger; coach finalizes assignments with push notification
- [ ] **Phase 4: Team Fund** - Per-team fine catalog with coach violation logging and player self-service balance view

## Phase Details

### Phase 1: Backend Stability
**Goal**: The backend runs continuously under normal load without OOM crashes, memory usage is observable, and redundant server load is eliminated
**Depends on**: Nothing (first phase)
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07
**Success Criteria** (what must be TRUE):
  1. The app does not crash during normal usage on Render.com free tier — no OOM kills observed after the fix
  2. A GET to `/api/health` returns current heap and RSS memory figures from `process.memoryUsage()`
  3. PDF uploads larger than 10MB are rejected by the server before processing
  4. `NODE_OPTIONS=--max-old-space-size=256` is active on Render.com and the process respects the cap
  5. Only one notification scheduler runs — the persistent queue; the legacy scheduler is gone from `server.js`
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Server config: /api/health memory data, NODE_OPTIONS 512MB cap, legacy scheduler removed
- [ ] 01-02-PLAN.md — Event model: compound indexes for background job queries and list sort
- [x] 01-03-PLAN.md — PDF upload 10MB limit (server + client) and proactive carPool payload exclusion
- [ ] 01-04-PLAN.md — .lean() on all read-only Mongoose queries across all route files

### Phase 2: PDF Import + Mobile Layout
**Goal**: Coaches can successfully import match schedules from volleyball federation PDFs, and the coach event page displays correctly on mobile
**Depends on**: Phase 1
**Requirements**: LAYOUT-01
**Success Criteria** (what must be TRUE):
  1. Coach event page renders without layout overflow or navigation overlap on a mobile viewport
  2. The import PDF button on the coach event page is accessible and usable on mobile screens
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Events.js mobile layout fix: pb: 10 on root Box + responsive header button row
- [ ] 02-02-PLAN.md — PDF import flow: per-match selection checkboxes, duplicate detection dialog, debug log removal
- [ ] 02-03-PLAN.md — Human verification checkpoint: mobile layout and PDF import flow

### Phase 3: Car Pool Organizer
**Goal**: Attending players can self-register as driver or passenger for match events; coach can assign passengers to drivers and finalize; every player sees their own assignment
**Depends on**: Phase 1
**Requirements**: CARPOOL-01, CARPOOL-02, CARPOOL-03, CARPOOL-04, CARPOOL-05, CARPOOL-06, CARPOOL-07, CARPOOL-08, CARPOOL-09, CARPOOL-10
**Success Criteria** (what must be TRUE):
  1. An attending player can register as driver (with seat count), as passenger, or withdraw/update their registration before finalization
  2. Coach sees a live overview — all drivers with seat counts, all passengers, and any unassigned attending players
  3. Coach can assign specific passengers to specific drivers and finalize the arrangement; once finalized the server rejects further player changes
  4. Each player sees their own assignment: drivers see their passengers; passengers see their driver, meeting point, and departure time
  5. Car pool controls are absent from training events — they appear only on match/game events
**Plans**: 5 plans

Plans:
- [ ] 03-01-PLAN.md — Event schema extension: carPool sub-document + GET /:id carPool population
- [ ] 03-02-PLAN.md — Backend carpool routes: all 6 routes (register, withdraw, pick-driver, assign, finalize, reopen)
- [ ] 03-03-PLAN.md — Player EventDetail inline carpool section (registration, withdraw, pick-driver, post-finalization view)
- [ ] 03-04-PLAN.md — Coach EventDetail inline carpool section (two-column overview, assign, finalize, reopen)
- [ ] 03-05-PLAN.md — Human verification checkpoint: end-to-end carpool flow in test environment

### Phase 4: Team Fund
**Goal**: Each team has a coach-managed fine catalog; coaches log violations against players; players can view their own outstanding balance
**Depends on**: Phase 3
**Requirements**: FUND-01, FUND-02, FUND-03, FUND-04, FUND-05
**Success Criteria** (what must be TRUE):
  1. Coach can create, edit, and delete fine rules (label + amount) in the team's punishment catalog, and each team has its own independent catalog
  2. Coach can log a violation against a player by selecting player, rule from catalog, optional date, and optional note
  3. Player can view their own outstanding balance (sum of unpaid fines across their teams)
  4. Player can view their own list of violations showing rule name, amount, date, and note for each entry
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Stability | 4/4 | Complete   | 2026-02-24 |
| 2. PDF Import + Mobile Layout | 2/3 | In Progress|  |
| 3. Car Pool Organizer | 0/5 | Not started | - |
| 4. Team Fund | 0/? | Not started | - |
