---
phase: 01-backend-stability
plan: 04
subsystem: api
tags: [mongoose, lean, performance, memory, queries]

# Dependency graph
requires:
  - 01-03
provides:
  - .lean() on all read-only GET route handlers across 10 route files (47 occurrences total)
affects: [all-get-endpoints, memory-usage, cpu-usage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mongoose .lean() pattern: appended to end of read-only query chains before res.json()"
    - "Populated-object safety: use obj._id || obj when leaned populated field passed to findById()"
    - "Authorization with leaned docs: .some(p => p.toString() ===) safe; .includes(objectId) unsafe"

key-files:
  created: []
  modified:
    - server/routes/eventRoutes.js
    - server/routes/teamRoutes.js
    - server/routes/userRoutes.js
    - server/routes/achievementRoutes.js
    - server/routes/attributeRoutes.js
    - server/routes/comparisonRoutes.js
    - server/controllers/notificationController.js
    - server/routes/progressRoutes.js
    - server/routes/teamInviteRoutes.js
    - server/routes/trainingPoolRoutes.js

key-decisions:
  - "notificationRoutes.js queries live in notificationController.js — added .lean() to controller instead of route file"
  - "GET /:id in eventRoutes and attributeRoutes: fixed Team.findById(event.team) to Team.findById(event.team._id||event.team) to handle leaned populated objects"
  - "Skipped .lean() on queries using .includes(mongoose_objectid) for auth — ObjectId reference comparison breaks with plain objects"
  - ".lean() applied to authorization helper queries (Team.find for teamIds, teamCheck) when they only read _id or use .toString() comparison"

requirements-completed: [PERF-01]

# Metrics
duration: 7min
completed: 2026-02-24
---

# Phase 1 Plan 4: .lean() Query Optimization Summary

**47 .lean() additions across 10 server files eliminating Mongoose Document hydration overhead on all read-only GET endpoints**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-02-24T13:39:19Z
- **Completed:** 2026-02-24T13:46:35Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- All read-only GET route handlers across the backend now return plain JS objects instead of hydrated Mongoose Documents
- 47 `.lean()` calls added: 6 in eventRoutes, 4 in teamRoutes, 7 in userRoutes, 12 in attributeRoutes, 4 in comparisonRoutes, 2 in notificationController, 3 in progressRoutes, 2 in teamInviteRoutes, 5 in trainingPoolRoutes, 2 in achievementRoutes
- Eliminates change-tracking, getter/setter, and validation overhead on every GET response
- Mutation routes (POST/PUT/DELETE that call .save() or schema methods) correctly have no .lean()

## Task Commits

Each task was committed atomically:

1. **Task 1: Add .lean() to read-only queries in eventRoutes.js** - `6028f04` (feat)
2. **Task 2: Add .lean() to read-only queries in all remaining route files** - `b90e203` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `server/routes/eventRoutes.js` - 6 .lean() additions: GET / (2 Event.find + Team.find), GET /:id, GET /:id/can-edit, GET /:id/feedback/check
- `server/routes/teamRoutes.js` - 4 .lean() additions: GET / (2 branches), GET /:id (2 queries)
- `server/routes/userRoutes.js` - 7 .lean() additions: GET /profile, GET /, GET /players, GET /youth, GET /team/:teamId, GET /:id, GET /reset-password/:token
- `server/routes/achievementRoutes.js` - 2 .lean() additions: GET /next/:playerId, GET /leaderboard/:teamId
- `server/routes/attributeRoutes.js` - 12 .lean() additions across GET /player/:playerId, GET /team/:teamId, GET /:id, GET /universal/:playerId, GET /progress, GET /level-progress, GET /self-assessment, GET /self-assessment-status, GET /focus-areas
- `server/routes/comparisonRoutes.js` - 4 .lean() additions: GET /team/:teamId/percentiles (Team.findById + PlayerAttribute.find), GET /team/:teamId/distribution (same)
- `server/controllers/notificationController.js` - 2 .lean() additions: getStatus (PushSubscription.findOne, User.findById)
- `server/routes/progressRoutes.js` - 3 .lean() additions: GET /player/:playerId, GET /milestones/:playerId, GET /stats/:playerId
- `server/routes/teamInviteRoutes.js` - 2 .lean() additions: GET /team/:teamId (Team.findById), GET /my-invites (Team.find)
- `server/routes/trainingPoolRoutes.js` - 5 .lean() additions: GET / (2x Team.find), GET /:id, GET /event/:eventId/available (Event.findById + TrainingPool.find)

## Decisions Made

- Added `.lean()` to `notificationController.js` instead of `notificationRoutes.js` because the GET /status route delegates entirely to the controller — the queries live there
- Fixed `Team.findById(event.team)` in `eventRoutes.js GET /:id` and `attributeRoutes.js GET /:id` to `Team.findById(teamId?._id || teamId)` since `.lean()` returns populated fields as plain objects, making direct `findById(populatedObj)` fail
- Skipped `.lean()` on `Team.findById(teamId)` calls used for `.includes(req.user._id)` authorization checks — ObjectId `.includes()` comparison does not work on plain objects (unlike `.some(p => p.toString() ===)`)
- Applied `.lean()` to helper queries that only read `_id` values (Team.find for teamIds) and to authorization queries using `.toString()` comparison

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed populated object passed to findById() after .lean()**
- **Found during:** Task 1 (eventRoutes GET /:id) and Task 2 (attributeRoutes GET /:id)
- **Issue:** After adding `.lean()`, `event.team` becomes a plain object `{ _id, name, type }` but `Team.findById(event.team)` expects an ID — would fail or produce wrong results
- **Fix:** Changed to `const teamId = event.team?._id || event.team` and used `teamId` for the findById call
- **Files modified:** server/routes/eventRoutes.js, server/routes/attributeRoutes.js
- **Commit:** b90e203

**2. [Rule 2 - Scope Adjustment] Notification queries are in controller, not route file**
- **Found during:** Task 2
- **Issue:** `notificationRoutes.js` has no direct DB queries — `GET /status` delegates to `notificationController.getStatus`
- **Fix:** Added `.lean()` to the two read-only queries in `notificationController.js` instead
- **Files modified:** server/controllers/notificationController.js
- **Commit:** b90e203

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - server-side optimization only, no configuration changes required.

## Next Phase Readiness

- Phase 1 complete: all 4 plans executed (indexes, health+scheduler, upload+carPool, .lean())
- Backend stability improvements are deployed on push to test branch
- Pre-Phase 2 task remains: test improved pdf-parse parsing against real volleyball federation PDFs; remove debug logging in eventRoutes.js and ImportMatchesPDF.js before release

---
*Phase: 01-backend-stability*
*Completed: 2026-02-24*
