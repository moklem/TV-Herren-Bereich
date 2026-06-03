---
phase: 02-pdf-import-mobile-layout
plan: 01
subsystem: ui
tags: [react, material-ui, mobile, responsive, layout]

# Dependency graph
requires: []
provides:
  - "Events.js root Box has pb: 10 — event cards clear BottomNavigation on mobile"
  - "Events.js header button row is responsive — stacks vertically on xs, horizontal on sm+"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pb: 10 on root Box containers for BottomNavigation clearance on coach pages"
    - "flexDirection: { xs: 'column', sm: 'row' } for responsive header button rows"
    - "flexWrap: 'wrap' on button groups to prevent overflow on narrow screens"

key-files:
  created: []
  modified:
    - "client/src/pages/coach/Events.js"

key-decisions:
  - "Used flexDirection responsive breakpoint (xs: column, sm: row) instead of hiding buttons — both buttons remain visible on all screen sizes"
  - "Reduced button gap from 2 to 1 (16px to 8px) to conserve horizontal space without affecting readability"

patterns-established:
  - "Header row pattern: flexDirection responsive + flexWrap wrap + gap 1 on button container"
  - "Root container pattern: sx={{ mt: 2, pb: 10 }} on all coach page root Box elements"

requirements-completed: [LAYOUT-01]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 2 Plan 01: Events.js Mobile Layout Fix Summary

**Bottom-nav clearance (pb: 10) and responsive stacking header added to coach Events page — event cards no longer hidden behind BottomNavigation on mobile**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-24T13:10:19Z
- **Completed:** 2026-02-24T13:13:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Root Box in Events.js now has `pb: 10` (80px bottom padding), clearing the fixed BottomNavigation bar on mobile so no event cards are clipped
- Header button row now stacks vertically on xs screens (`flexDirection: { xs: 'column', sm: 'row' }`) — no horizontal overflow on screens narrower than 380px
- Button container uses `flexWrap: 'wrap'` so buttons wrap gracefully if needed
- Both buttons ("Spielplan importieren" and "Neuer Termin") remain fully functional with same links, labels, and icons

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Events.js root container bottom padding and responsive header buttons** - `02448f3` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `client/src/pages/coach/Events.js` - Added pb: 10 to root Box; made header Box responsive with flexDirection breakpoints; added flexWrap to button container

## Decisions Made
- Used `flexDirection: { xs: 'column', sm: 'row' }` responsive breakpoint to keep both buttons visible on all screen sizes rather than hiding one behind a menu
- Reduced button gap from 2 (16px) to 1 (8px) to conserve horizontal space
- `alignItems: { xs: 'flex-start', sm: 'center' }` so heading and buttons align correctly in both layouts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- LAYOUT-01 complete — Events page mobile layout corrected
- Ready for Phase 02 Plan 02 (PDF import feature implementation)

---
*Phase: 02-pdf-import-mobile-layout*
*Completed: 2026-02-24*

## Self-Check: PASSED

- FOUND: client/src/pages/coach/Events.js
- FOUND: .planning/phases/02-pdf-import-mobile-layout/02-01-SUMMARY.md
- FOUND: commit 02448f3
