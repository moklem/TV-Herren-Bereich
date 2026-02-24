# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Coaches and players stay coordinated — from event scheduling and attendance to car pools and team finances — all in one mobile-first app.
**Current focus:** Phase 2 — PDF Import + Mobile Layout (IN PROGRESS)

## Current Position

Phase: 2 of 4 (PDF Import + Mobile Layout) — IN PROGRESS
Plan: 2 of 3 in current phase (plans 01 and 02 done)
Status: In Progress
Last activity: 2026-02-24 — Plan 02-02 complete: PDF import per-match selection + duplicate detection + debug log removal

Progress: [████████░░] 45%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~5 min
- Total execution time: ~18 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-backend-stability | 4 | ~18 min | ~5 min |
| 02-pdf-import-mobile-layout | 2 | ~15 min | ~7 min |

**Recent Trend:**
- Last 5 plans: 02-02 (12 min), 02-01 (3 min), 01-04 (7 min), 01-02 (1 min), 01-03 (2 min)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [02-02]: Re-trigger handleCreateEvents via useEffect watching duplicateAction (not callback) to avoid stale closure issues after dialog dismissal
- [02-02]: Use EventContext.events for duplicate detection (already fetched by CoachLayout) — avoids extra network request
- [02-02]: Compare both event.team?._id and event.teams array entries for duplicate check — handles legacy single-team vs multi-team event schema
- [02-01]: flexDirection responsive breakpoint (xs: column, sm: row) keeps both header buttons visible on all screen sizes without hiding behind a menu
- [02-01]: pb: 10 pattern confirmed as mandatory on all coach page root Box containers for BottomNavigation clearance
- [Roadmap]: PDF fix approach is open — remote commits improved pdf-parse patterns (whole-PDF search, multi-line row support, debug logging); if fix proves insufficient, pdfjs-dist@4.10.38 remains the recommended replacement (coordinate-aware, pure JS)
- [Roadmap]: Car pool data as embedded Event.carPool sub-document — scoped to event, no standalone meaning
- [Roadmap]: TeamFund as separate collection (not Team sub-doc) — prevents document growth on every team list query
- [Roadmap]: Store fine amounts as integer cents — avoids float precision errors
- [Roadmap]: App Store packaging (STORE-01 through STORE-03) deferred to v2 — not in v1 scope
- [Phase 01-backend-stability]: Indexes added as EventSchema.index() declarations (not inline schema field options) for clarity and grouping
- [01-03]: Used inline multer callback (not global error middleware) to keep 413 logic co-located with the parse-pdf route
- [01-03]: .select('-carPool') added proactively before Phase 3 adds carPool field to prevent payload bloat on event list loads
- [01-01]: Health status field normalized to lowercase 'ok'; V8 startup log inside server.listen callback; notificationScheduler.js deleted entirely (not commented out)
- [01-04]: notificationRoutes.js queries live in notificationController.js — added .lean() to controller instead of route file
- [01-04]: Fixed Team.findById(populatedObj) to Team.findById(obj._id||obj) after adding .lean() — leaned populated fields are plain objects, not ObjectIds
- [01-04]: Skipped .lean() on Team.findById() used with .includes(mongoose_objectid) for auth — ObjectId reference comparison breaks with plain objects; .some(p => p.toString() ===) is safe

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED 01-01]: Notification scheduler question resolved — startNotificationScheduler removed, only notificationQueue remains
- [RESOLVED 02-02]: Debug logging removed from eventRoutes.js and ImportMatchesPDF.js
- [Pre-Phase 3]: Test improved pdf-parse parsing against 2-3 real volleyball federation PDFs — the fix searches entire PDF and handles multi-line rows but is unverified
- [Pre-Phase 5 / v2]: Render.com Starter upgrade ($7/month) decision needed before App Store review — free tier cold starts risk reviewer rejection

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 02-02-PLAN.md — PDF import per-match selection + duplicate detection + debug log removal
Resume file: None
