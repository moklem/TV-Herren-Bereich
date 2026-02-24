# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Coaches and players stay coordinated — from event scheduling and attendance to car pools and team finances — all in one mobile-first app.
**Current focus:** Phase 1 — Backend Stability

## Current Position

Phase: 1 of 4 (Backend Stability)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-02-23 — Roadmap created; all 23 v1 requirements mapped to 4 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: none yet
- Trend: -

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-Phase 1]: Confirm which notification scheduler (`startNotificationScheduler` vs queue) is safe to remove — requires reading current `server.js`
- [Pre-Phase 2]: Test improved pdf-parse parsing against 2-3 real volleyball federation PDFs — the fix searches entire PDF and handles multi-line rows but is unverified; debug logging in eventRoutes.js + ImportMatchesPDF.js must be removed before release
- [Pre-Phase 5 / v2]: Render.com Starter upgrade ($7/month) decision needed before App Store review — free tier cold starts risk reviewer rejection

## Session Continuity

Last session: 2026-02-23
Stopped at: Roadmap written; requirements mapped; STATE.md initialized
Resume file: None
