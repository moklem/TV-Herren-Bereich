# Project Research Summary

**Project:** InTeam — Volleyball Team Manager PWA
**Domain:** Sports team management PWA (subsequent milestone — adding to existing production app)
**Researched:** 2026-02-23
**Confidence:** HIGH

## Executive Summary

InTeam is a production React PWA backed by Node.js/Express and MongoDB Atlas, deployed on Render.com free tier. This milestone adds four distinct features to an already-working system: memory stability fixes, a PDF schedule import repair, a car pool organizer for away games, and a team fine/punishment catalog. The research is unusually well-grounded because the existing codebase is known — recommendations are specific to actual file names, model fields, and deployed constraints rather than hypothetical patterns.

The recommended approach is strictly sequential with stability first. Phase 1 (memory optimization) is non-negotiable as the prerequisite for everything else: the app crashes under load on Render.com free tier today, and adding new features to an unstable backend is counterproductive. Phase 2 (PDF fix) restores a broken feature. Phases 3 and 4 (car pool, team fund) are additive and low-risk because both use established patterns already in the codebase. Phase 5 (App Store packaging) comes last because it depends on a stable, passing Lighthouse audit and carries the highest external review risk.

The highest-risk item across the entire milestone is App Store packaging for iOS. Apple's Guideline 4.2 rejects minimal web wrappers, and WKWebView breaks web push entirely — meaning iOS notifications require a completely separate APNs integration path. This item alone could double the effort of Phase 5 if not planned from the start. The other risks (Render.com OOM kills, car pool race conditions, fine entry authorization leaks) are all well-understood and have concrete fixes documented in the research.

---

## Key Findings

### Recommended Stack

The existing stack (React 18, Node.js/Express 4, Mongoose 7, MongoDB Atlas, Workbox, Render.com) stays intact for all phases. No new runtimes or infrastructure is introduced except for optional App Store tooling.

**Core technologies for new work:**

- `pdfjs-dist@4.10.38`: PDF parsing replacement — coordinate-aware text extraction without a Python sidecar, pure JS, runs in existing Node.js runtime
- `@bubblewrap/cli`: Google Play Store packaging via Trusted Web Activity — no source code changes, purely a packaging step
- `@capacitor/core` + `@capacitor/ios` (Capacitor 6.x): iOS App Store packaging — wraps existing React build in WKWebView shell
- `@capacitor/local-notifications` + `@capacitor/push-notifications`: Required native plugins to satisfy Apple's minimum functionality requirement and replace broken web push on iOS
- MongoDB atomic operators (`$push`, `$pull`, `$addToSet`): Required for car pool mutations to avoid race conditions

**Critical version constraints:**
- `pdfjs-dist@4.x` specifically — coordinate API changed between v2 and v4
- `NODE_OPTIONS=--max-old-space-size=256` on Render.com — must be set as env var, not code

### Expected Features

**Car Pool Organizer — Must have (table stakes):**
- Driver self-registration with seat count
- Passenger self-registration (need a ride)
- Coach overview of who drives, who needs a ride, unmatched players
- Assignment display per player showing their driver and meeting point
- Restrict to attending/invited players only (reuse existing `attendingPlayers` array)
- Withdraw/update registration

**Car Pool Organizer — Should have (differentiators):**
- Coach manual assignment of passengers to drivers
- Seat utilization badge on driver cards ("2/4 taken")
- Push notification when coach finalizes assignments
- Departure time and meeting point field per driver
- Car pool summary embedded in existing EventDetail page

**Team Fund / Punishment Catalog — Must have (table stakes):**
- Fine rule catalog per team (label + amount)
- Add/edit/delete fine rules (coach only)
- Log a violation: player + rule + optional date + optional note
- Player balance view (own balance only — self-service)
- Coach full ledger: all players, all violations, running totals
- Mark entries as paid/settled

**Team Fund — Should have (differentiators):**
- Per-team catalog (not per-club — H1 fines differ from U16)
- Optional event link on each violation entry
- Running total at top of player balance view
- Positive credit entry capability (advance payments, contributions)

**Defer to future:**
- GPS tracking, route optimization (car pool)
- Online payments, automated fines, appeals workflow (team fund)
- In-app chat, payment splitting, cross-event aggregation
- Cross-season analytics, fine leaderboards

### Architecture Approach

All new features extend the existing Express/Mongoose/React Query architecture without introducing new patterns. Car pool data lives as a `carPool` sub-document embedded in the existing `Event` model — event-scoped data with no standalone meaning. Team fund data lives in a new `TeamFund` collection (separate from `Team`) to prevent document growth and avoid unintended populates on every team list query. Amounts are stored as integer cents to avoid float precision errors. React Query keys are isolated: `['carpool', eventId]` and `['teamFund', teamId]`.

**Major components:**

1. `Event.carPool` sub-document + 5 new endpoints in `server/routes/eventRoutes.js` — car pool CRUD with atomic operators
2. `server/models/TeamFund.js` + `server/routes/teamFundRoutes.js` — fine catalog and transaction log; balance computed on read, never stored
3. `client/src/components/CarPoolPanel.js` embedded in `EventDetail.js` — car pool UI component
4. `client/src/pages/coach/TeamFund.js` + `client/src/pages/player/TeamFund.js` — fund management and read-only balance views
5. `client/public/.well-known/assetlinks.json` + Bubblewrap CLI output — Play Store packaging artifacts
6. `capacitor.config.json` + `ios/` directory — iOS packaging (no effect on Render.com deployment)

### Critical Pitfalls

1. **Mongoose populate chains loading full documents on every event list request** — Use `.select('name position _id')` on populate fields; split list vs detail endpoints; add `.lean()` to all read-only queries. Without this fix first, adding car pool arrays will make OOM crashes worse.

2. **Two notification schedulers running simultaneously** — Remove `startNotificationScheduler()` from `server.js` (legacy, superseded by queue). The N+1 query pattern inside `processPendingNotifications` causes steady DB load even with zero user activity.

3. **Multer `memoryStorage()` with no file size limits** — A single 15MB PDF can spike memory by 50-150MB. Add `limits: { fileSize: 10 * 1024 * 1024 }` and a `fileFilter` immediately; null the buffer after parsing.

4. **Apple App Store Guideline 4.2 + WKWebView web push failure** — Apple rejects minimal web wrappers; web push (VAPID/service worker) does not work in WKWebView. iOS packaging requires `@capacitor/local-notifications` and `@capacitor/push-notifications` with a full APNs backend flow. This is the highest-risk item in the milestone.

5. **Car pool race condition via full-document replace** — Car pool embedded in Event inherits the existing RSVP race condition. All car pool mutations must use MongoDB atomic operators (`$push`, `$pull`, `$addToSet`) on sub-document arrays, never full document PUT.

6. **Team fund balance stored as computed number** — Storing `currentBalance` as a field loses the audit trail coaches need for disputes. Model as immutable transaction log; compute balance as `SUM(unpaid entries)` on read.

---

## Implications for Roadmap

Based on research, the 5-phase structure from ARCHITECTURE.md is well-justified and should be followed as-is.

### Phase 1: Backend Stability
**Rationale:** The existing app crashes under load on Render.com free tier. Every subsequent phase writes more data to the event model or fires more queries. Building on an unstable foundation is counterproductive. This phase has zero user-visible changes except reliability improvement.
**Delivers:** Stable, non-crashing backend; measurable memory reduction; health monitoring endpoint
**Addresses:** `.lean()` on all read queries; `NODE_OPTIONS=--max-old-space-size=256`; Multer file limits; remove duplicate notification scheduler; add DB indexes on voting/attendance jobs
**Avoids:** PITFALL 1.1 (populate OOM), PITFALL 1.2 (dual schedulers), PITFALL 1.3 (multer spike), PITFALL 1.4 (V8 heap defaults), PITFALL 1.5 (collection scans); PITFALL 4.3 (car pool payload inflation — design `.select('-carPool')` here before car pool exists)

### Phase 2: PDF Import Fix
**Rationale:** The PDF import feature is broken in production. Coaches are blocked from importing match schedules. This is a single-file replacement with a well-researched drop-in library; low risk, immediate coach value.
**Delivers:** Working schedule PDF import for volleyball federation PDFs with complex table layouts
**Uses:** `pdfjs-dist@4.10.38` replacing `pdf-parse` in existing `server/routes/eventRoutes.js` import handler
**Avoids:** PITFALL 2.1 (docling Python-only), PITFALL 2.2 (blocking subprocess), PITFALL 2.3 (incompatible output schema)

### Phase 3: Car Pool Organizer
**Rationale:** Purely additive — no existing functionality touched. Event model already carries attendance arrays that authorization depends on. Immediate value before any away match. Lower schema complexity than team fund.
**Delivers:** Driver/passenger registration, coach assignment UI, finalize flow with push notification; `CarPoolPanel` embedded in existing EventDetail
**Implements:** `Event.carPool` sub-document; 5 new endpoints; `CarPoolPanel.js` component
**Avoids:** PITFALL 4.1 (race condition — use atomic operators), PITFALL 4.2 (stale seats — 30s refetch + 409 handling), PITFALL 4.3 (payload bloat — `.select('-carPool')` on list), PITFALL 4.4 (finalize not server-enforced — `carpoolFinalized` flag)

### Phase 4: Team Fund / Punishment Catalog
**Rationale:** More schema design up front than car pool; new model + new routes + two new pages. Correct to build after car pool patterns are established. Teams collect fines at season end — slightly longer payoff cycle than car pool, but high value for season-long team management.
**Delivers:** Per-team fine rule catalog (coach-managed); violation log with player/rule/note/event link; immutable transaction ledger; coach full ledger + player own-balance view
**Implements:** `TeamFund` model (integer cents, no stored balance); `teamFundRoutes.js`; `coach/TeamFund.js` + `player/TeamFund.js` pages (both with `pb: 10` per CLAUDE.md)
**Avoids:** PITFALL 5.1 (store transaction log, not computed balance), PITFALL 5.2 (team membership authorization check on all endpoints)

### Phase 5: App Store Packaging
**Rationale:** No source code changes for Play Store (TWA path). iOS requires native plugin additions but does not affect Render.com deployment. Comes last because it depends on a stable, Lighthouse-passing PWA and requires App Store reviewer accounts with seeded demo data.
**Delivers:** Signed `.aab` for Google Play Store; Capacitor iOS project for App Store submission
**Uses:** `@bubblewrap/cli` (TWA); Capacitor 6.x + `@capacitor/ios` + `@capacitor/local-notifications` + `@capacitor/push-notifications`
**Avoids:** PITFALL 3.1 (Apple Guideline 4.2 — add native capability), PITFALL 3.2 (WKWebView web push — APNs path), PITFALL 3.3 (assetlinks.json + Lighthouse audit), PITFALL 3.4 (demo accounts + delayed permission prompt), PITFALL 3.5 (stable backend URL before submission)
**Pre-decision required:** Upgrade to Render.com Starter ($7/month) before App Store review — cold starts on free tier risk reviewer rejection (PITFALL X.2)

### Phase Ordering Rationale

- Phase 1 must be first: car pool adds data to the event model; building car pool before fixing OOM makes the crash worse, not better
- Phase 2 is isolated and delivers immediate coach value with minimal risk — no reason to defer it
- Phase 3 before Phase 4: car pool has lower schema complexity and validates the team-scoped authorization pattern; team fund can reuse those patterns
- Phase 5 last: App Store review is external and unpredictable; all internal features should be complete before locking the binary
- The ARCHITECTURE.md explicitly derives this order from dependency analysis, not arbitrary sequencing

### Research Flags

Phases needing deeper research during planning:
- **Phase 5 (App Store packaging — iOS):** Apple review guidelines change frequently; APNs integration with Capacitor is non-trivial; recommend per-task research on `@capacitor/push-notifications` backend integration before implementation
- **Phase 1 (Memory — notification scheduler):** Need to confirm which scheduler (`startNotificationScheduler` vs `startNotificationQueue`) is safe to remove; requires reading current `server.js` to verify both are actually registered simultaneously

Phases with standard patterns (skip research-phase):
- **Phase 2 (PDF fix):** `pdfjs-dist` integration is well-documented; coordinate-grouping algorithm for table reconstruction is straightforward; no external dependencies beyond npm install
- **Phase 3 (Car pool):** Standard React Query + Mongoose subdocument pattern; all data flows match existing event RSVP pattern already in production
- **Phase 4 (Team fund):** Standard transaction-log pattern; authorization mirrors existing team-coach verification already in codebase

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations are specific to this codebase — pdfjs-dist, Bubblewrap, and Capacitor are well-documented with no viable alternatives at this constraint level |
| Features | HIGH | Car pool and fine tracker are common team management features; anti-features are correctly excluded based on scope constraints documented in PROJECT.md |
| Architecture | HIGH | Based on actual existing models and routes — Event.carPool sub-document and separate TeamFund collection are correct tradeoffs given MongoDB document size concerns |
| Pitfalls | HIGH | Memory issues are diagnosed from actual codebase patterns (populate chains, dual schedulers); iOS App Store rejection path is well-documented |

**Overall confidence:** HIGH

### Gaps to Address

- **Render.com Starter upgrade decision:** The free tier spin-down (PITFALL X.2) affects App Store review. This is a business/cost decision that must be made before Phase 5 starts, not a technical question.
- **iOS APNs backend flow:** The research flags this as "roughly doubling the notification infrastructure work." The exact scope needs a dedicated implementation spike at the start of Phase 5 — the backend changes for APNs device token registration vs VAPID subscriptions are structurally different and not fully detailed in research.
- **`pdfjs-dist` against actual federation PDFs:** Research recommends starting with `pdfjs-dist` but acknowledges it may not handle all federation PDF variants. Have 2-3 real federation PDFs available for testing before marking Phase 2 complete.
- **No automated tests:** PITFALL X.1 documents zero test coverage. `eventRoutes.js` is 1615 lines and will be modified in Phases 1, 2, and 3. Minimal integration tests for the RSVP flow should be added at the start of Phase 1 before any modifications.

---

## Sources

### Primary (HIGH confidence)
- Mozilla `pdfjs-dist` documentation — coordinate-aware text extraction API (`getTextContent`, `transform[5]` Y-coordinate grouping)
- Google Bubblewrap CLI documentation — TWA packaging requirements, `assetlinks.json` format
- Capacitor 6.x official documentation — iOS setup, `@capacitor/push-notifications` APNs integration
- Render.com documentation — free tier memory limits (512MB), `NODE_OPTIONS` env var behavior
- Apple App Store Review Guidelines — Guideline 4.2 (minimum functionality), push permission timing

### Secondary (MEDIUM confidence)
- MongoDB documentation — atomic subdocument operators (`$push`, `$pull`, `$addToSet`)
- Mongoose documentation — `.lean()` memory savings (documented as 30-60% on large result sets)
- WebKit WKWebView documentation — Web Push API not supported in WKWebView (confirmed, not inferred)

### Tertiary (LOW confidence)
- Render.com free tier cold start timing (30-60 seconds) — community-reported; actual timing varies
- Apple review rejection rate for minimal web wrappers — qualitative pattern from community reports, not a published Apple statistic

---

*Research completed: 2026-02-23*
*Ready for roadmap: yes*
