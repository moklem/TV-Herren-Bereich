# Requirements: InTeam — Volleyball Team Manager PWA

**Defined:** 2026-02-23
**Core Value:** Coaches and players stay coordinated — from event scheduling and attendance to car pools and team finances — all in one mobile-first app.

---

## v1 Requirements

### Backend Performance

- [ ] **PERF-01**: Backend handles concurrent requests without crashing — `.lean()` added to all read-only Mongoose queries to eliminate document hydration overhead
- [ ] **PERF-02**: Memory usage visible via `/api/health` endpoint returning `process.memoryUsage()` data
- [ ] **PERF-03**: PDF upload protected with 10MB file size limit to prevent memory spikes
- [ ] **PERF-04**: `NODE_OPTIONS=--max-old-space-size=256` configured on Render.com to cap V8 heap before OS OOM-kills the process
- [ ] **PERF-05**: Duplicate notification scheduler removed — only persistent queue runs (legacy `startNotificationScheduler` removed from `server.js`)
- [ ] **PERF-06**: Database indexes added for voting deadline and attendance tracking job queries (`votingDeadline`, `autoDeclineProcessed`, `startTime`)
- [ ] **PERF-07**: Event list endpoint excludes car pool sub-document from payload (`.select('-carPool')` prevents future payload bloat)

### Mobile Layout

- [ ] **LAYOUT-01**: Coach event page displays correctly on mobile — import PDF button no longer causes layout overflow or navigation overlap

### Car Pool Organizer

- [ ] **CARPOOL-01**: Attending player can register as driver for a match event, specifying available seat count (1–9)
- [ ] **CARPOOL-02**: Attending player can register as passenger requesting a ride
- [ ] **CARPOOL-03**: Player can withdraw or update their car pool registration at any time before finalization
- [ ] **CARPOOL-04**: Driver can optionally specify a meeting point and departure time
- [ ] **CARPOOL-05**: Coach sees overview of all drivers (with seat counts), all passengers, and unassigned attending players
- [ ] **CARPOOL-06**: Coach can manually assign passengers to specific drivers
- [ ] **CARPOOL-07**: Coach can finalize car pool assignments — finalization is server-enforced (further player changes blocked after finalization)
- [ ] **CARPOOL-08**: Players receive push notification when coach finalizes assignments
- [ ] **CARPOOL-09**: Player sees their own assignment — if driver: their passengers; if passenger: their assigned driver, meeting point, departure time
- [ ] **CARPOOL-10**: Car pool feature only available on match/game events (not training events)

### Team Fund / Punishment Catalog

- [ ] **FUND-01**: Coach can create, edit, and delete fine rules in the team's punishment catalog (rule label + amount in euros)
- [ ] **FUND-02**: Fine rule catalog is per-team — each team has its own independent catalog
- [ ] **FUND-03**: Coach can log a violation against a player by selecting player + rule from catalog + optional note + optional date
- [ ] **FUND-04**: Player can view their own total outstanding balance (sum of unpaid fine entries for their teams)
- [ ] **FUND-05**: Player can view their own list of violations with rule name, amount, date, and note

---

## v2 Requirements

### PDF Import

- **PDF-01**: Coach can import match schedule from volleyball federation PDF using pdfjs-dist (replaces broken pdf-parse)
- **PDF-02**: Parser extracts match rows from complex table layouts using coordinate-aware text extraction

### App Store Packaging

- **STORE-01**: App available on Google Play Store via TWA packaging (`@bubblewrap/cli`)
- **STORE-02**: App available on Apple App Store via Capacitor 6.x (`@capacitor/ios`)
- **STORE-03**: iOS push notifications work via APNs (`@capacitor/push-notifications`) — replaces broken web push in WKWebView

### Team Fund (Extended)

- **FUND-06**: Coach sees full team ledger — all players, all violation entries, running totals, paid/unpaid status
- **FUND-07**: Coach can mark individual fine entries as paid/settled
- **FUND-08**: Coach can add positive credit entries (advance payments, team contributions)
- **FUND-09**: Fine entry can be optionally linked to a specific event for context

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat | Explicitly excluded in PROJECT.md; high complexity |
| GPS tracking / route optimization for car pool | Privacy concerns; overkill for club-level use |
| Automated fines triggered by attendance data | Legal/ethical risk in German sport club context (DSGVO, minors) |
| Online payment integration (PayPal/Stripe) | Legal complexity, DSGVO, processing fees |
| Fine leaderboard / ranking | Public shaming inappropriate with Jugendspieler (youth) role |
| Cross-season fine analytics | Over-engineering for club-level data volume |
| In-app car pool chat | Subset of general chat — out of scope |
| Car pool history across events | Cross-event aggregation adds complexity with low marginal value |

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERF-01 through PERF-07 | Phase 1 | Pending |
| LAYOUT-01 | Phase 2 | Pending |
| CARPOOL-01 through CARPOOL-10 | Phase 3 | Pending |
| FUND-01 through FUND-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 after initial definition*
