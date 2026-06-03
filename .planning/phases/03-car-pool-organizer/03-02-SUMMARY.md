---
phase: 03-car-pool-organizer
plan: "02"
subsystem: api
tags: [express, mongoose, push-notifications, carpool, webpush]

# Dependency graph
requires:
  - phase: 03-01
    provides: Event.carPool sub-document schema with drivers/passengers arrays and finalized flag

provides:
  - 7 carpool API routes on /api/events/:id/carpool/*
  - Player self-registration as driver or passenger with auto-assignment
  - Passenger manual driver pick with capacity validation
  - Coach assignment override (no capacity limit)
  - Finalization with personalized push notifications to all participants
  - Re-open finalized carpool
  - Coach override of individual driver notes
affects:
  - 03-03 (frontend carpool UI — consumes all 7 routes)
  - 03-04 (any further carpool features)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - checkCarpoolPlayerPreconditions helper extracts shared guard logic (Game-type, finalized, attendance checks) for player routes
    - autoAssignPassenger helper implements first-fit by most remaining capacity
    - Finalize route uses populated Mongoose doc (no .lean()) for notification loop so nested ObjectId comparisons work correctly; .lean() only on final response populate

key-files:
  created: []
  modified:
    - server/routes/eventRoutes.js

key-decisions:
  - "autoAssignPassenger sorts by most remaining capacity and assigns to the first available driver — simple first-fit keeps passenger assignment predictable"
  - "Coach assign route omits finalized check — coach can assign freely anytime before finalization (per must-have spec)"
  - "Finalize route loops PushSubscription.find per user in a for-of loop (serial) to avoid race conditions on notification send; acceptable given low participant counts"
  - "Finalization notification body is personalized per role: drivers get 'du fährst', assigned passengers get driver name, unassigned passengers get a separate message"
  - "No capacity enforcement in coach assign route — coach override takes precedence over seat limits"

patterns-established:
  - "Carpool player routes use shared checkCarpoolPlayerPreconditions helper to avoid duplicating three guards"
  - "All carpool routes return the populated carPool sub-document on success for immediate UI refresh"
  - "Never use .lean() on populated docs used for ObjectId comparisons in loops"

requirements-completed: [CARPOOL-01, CARPOOL-02, CARPOOL-03, CARPOOL-04, CARPOOL-05, CARPOOL-06, CARPOOL-07, CARPOOL-08, CARPOOL-09, CARPOOL-10]

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 03 Plan 02: Backend Carpool Routes Summary

**7 carpool REST routes added to eventRoutes.js — player register/withdraw/pick-driver, coach assign/finalize/reopen/driver-note — with personalized push notifications on finalization**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T11:06:45Z
- **Completed:** 2026-02-26T11:08:51Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Added PushSubscription and sendNotification imports to eventRoutes.js
- Implemented 3 player carpool routes with shared precondition helper (Game-type, finalized, attendance guards) and auto-assign on passenger registration
- Implemented 4 coach carpool routes: assign (no capacity/finalized checks), finalize (personalized push notifications without .lean() during notification loop), reopen, driver-note

## Task Commits

Each task was committed atomically:

1. **Task 1: Add imports and player carpool routes (register, withdraw, pick-driver)** - `e749423` (feat)
2. **Task 2: Add coach carpool routes (assign, finalize, reopen)** - `5c398d3` (feat)
3. **Task 3: Add coach route to update a driver's note** - `1443147` (feat)

## Files Created/Modified

- `server/routes/eventRoutes.js` — 7 carpool routes appended, PushSubscription + sendNotification imported (328 lines added)

## Decisions Made

- autoAssignPassenger uses first-fit by most remaining capacity: simple and predictable, sufficient for small team sizes
- Coach assign route deliberately omits finalized check — per spec, coach can assign anytime before finalization
- Finalize notification loop uses serial for-of (not Promise.all) to avoid race conditions on push send
- Finalization sends personalized messages: drivers hear they drive, assigned passengers get driver name, unassigned passengers get a separate unassigned message
- All 7 routes guard event.type !== 'Game' with 400, fulfilling the must-have constraint

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 7 backend carpool API endpoints are complete and ready for frontend integration
- Routes follow consistent response format (populated carPool sub-document)
- Frontend plan 03-03 (carpool UI components) can now consume all endpoints

---
*Phase: 03-car-pool-organizer*
*Completed: 2026-02-26*

## Self-Check: PASSED

- server/routes/eventRoutes.js: FOUND
- .planning/phases/03-car-pool-organizer/03-02-SUMMARY.md: FOUND
- Commit e749423 (Task 1): FOUND
- Commit 5c398d3 (Task 2): FOUND
- Commit 1443147 (Task 3): FOUND
