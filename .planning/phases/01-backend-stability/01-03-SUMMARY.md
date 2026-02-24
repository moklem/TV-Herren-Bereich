---
phase: 01-backend-stability
plan: 03
subsystem: api
tags: [multer, file-upload, pdf, express, mongoose, memory-protection]

# Dependency graph
requires: []
provides:
  - 10MB multer upload limit with HTTP 413 + German error on server
  - Client-side file size guard (10MB) before any network request
  - .select('-carPool') on event list GET endpoint (both coach and player queries)
affects: [phase-2-pdf-parsing, phase-3-car-pool]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline multer callback pattern for catching MulterError before route handler"
    - "Client/server mirrored constant (MAX_UPLOAD_SIZE) to keep limits in sync"
    - ".select('-carPool') on list queries to pre-emptively exclude Phase 3 sub-document"

key-files:
  created: []
  modified:
    - server/routes/eventRoutes.js
    - client/src/pages/coach/ImportMatchesPDF.js

key-decisions:
  - "Used inline multer callback (not global error middleware) to keep 413 logic co-located with the parse-pdf route"
  - "Added .select('-carPool') now (pre-Phase 3) to prevent payload bloat from future carPool sub-document being returned by default"

patterns-established:
  - "Multer size limit pattern: define MAX_UPLOAD_SIZE constant, pass in limits:{fileSize}, wrap upload.single() in callback to catch LIMIT_FILE_SIZE"
  - "Client guard mirrors server constant — same variable name, same value, same German error message for consistency"

requirements-completed: [PERF-03, PERF-07]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 1 Plan 3: Upload Size Limit and carPool Exclusion Summary

**10MB multer hard limit with HTTP 413 + German error on server, matching client-side guard in handleFileChange, and proactive .select('-carPool') on event list queries**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-24T13:31:43Z
- **Completed:** 2026-02-24T13:33:16Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Server rejects PDF uploads exceeding 10MB at multer layer before pdf-parse runs, returning HTTP 413 with German message
- Client rejects oversized files in handleFileChange before any network request is made
- Both coach and player event list queries exclude carPool sub-document via .select('-carPool')

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 10MB upload limit to multer config and PDF route error handling** - `88b2368` (feat)
2. **Task 2: Add client-side file size guard in ImportMatchesPDF.js** - `b42d866` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `server/routes/eventRoutes.js` - Added MAX_UPLOAD_SIZE constant, multer limits config, LIMIT_FILE_SIZE error handler (413), .select('-carPool') on both Event.find chains in GET /
- `client/src/pages/coach/ImportMatchesPDF.js` - Added MAX_UPLOAD_SIZE constant and file.size guard in handleFileChange

## Decisions Made
- Used inline multer callback pattern (not global Express error middleware) to keep 413 logic scoped to the parse-pdf route
- Added .select('-carPool') proactively before Phase 3 adds the carPool field to prevent future payload bloat on every event list load

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 04 can now add .lean() to the same event list queries (the .select('-carPool') is already in place)
- Phase 3 car pool feature will not bloat event list payloads for existing clients
- Server is protected against memory spikes from oversized PDF uploads

---
*Phase: 01-backend-stability*
*Completed: 2026-02-24*
