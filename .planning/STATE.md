# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Coaches and players stay coordinated — from event scheduling and attendance to car pools and team finances — all in one mobile-first app.
**Current focus:** Phase 1 — Backend Stability (COMPLETE)

## Current Position

Phase: 1 of 4 (Backend Stability) — COMPLETE
Plan: 4 of 4 in current phase (all plans done)
Status: Phase Complete — ready for Phase 2
Last activity: 2026-02-24 — Plan 04 complete: .lean() on all read-only GET endpoints (47 occurrences)

Progress: [██████░░░░] 35%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~5 min
- Total execution time: ~18 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-backend-stability | 4 | ~18 min | ~5 min |

**Recent Trend:**
- Last 5 plans: 01-04 (7 min), 01-02 (1 min), 01-03 (2 min), 01-01 (8 min)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

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
- [Pre-Phase 2]: Test improved pdf-parse parsing against 2-3 real volleyball federation PDFs — the fix searches entire PDF and handles multi-line rows but is unverified; debug logging in eventRoutes.js + ImportMatchesPDF.js must be removed before release
- [Pre-Phase 5 / v2]: Render.com Starter upgrade ($7/month) decision needed before App Store review — free tier cold starts risk reviewer rejection

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 01-04-PLAN.md — Phase 01 complete
Resume file: None
