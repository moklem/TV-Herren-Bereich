# Pitfalls Research — InTeam PWA (Subsequent Milestone)

**Research date:** 2026-02-23
**Scope:** Memory optimization, PDF import fix, car pool organizer, team fund/punishments, App Store + Play Store packaging

---

## Domain 1 — Node.js Memory Optimization on Render.com Free Tier

### PITFALL 1.1 — Mongoose `.populate()` chains load entire documents into heap

**What goes wrong:** Event routes perform deep multi-field `.populate()` on every GET — `invitedPlayers`, `attendingPlayers`, `declinedPlayers`, `unsurePlayers`, `uninvitedPlayers`, `playerResponses.player`, `guestPlayers`, `trainingPoolAutoInvite`. This loads full User documents for every event. Two concurrent requests can crash the 512MB Render.com free tier.

**Warning signs:** Render.com OOM kills correlated with GET /api/events; `heapUsed` exceeds 300MB after a single event list fetch.

**Prevention:**
- Use `.select()` on populate — fetch only `name`, `position`, `_id` for list views
- Split the endpoint: lean list (IDs + counts) for event list; full populate only on single event detail
- Add `.lean()` to all read-only queries — saves ~30–40% memory per document
- Add `.limit(100)` to the events list — coaches rarely need more than 3 months at once

**Phase:** Phase 1 — Memory optimization

---

### PITFALL 1.2 — Two notification schedulers running simultaneously (N+1 query every minute)

**What goes wrong:** `server.js` starts both `startNotificationScheduler()` (legacy, every 5min) and `startNotificationQueue()` (new, every 1min). Both poll MongoDB. `processPendingNotifications` runs `Team.findById` inside a loop — N+1 queries on every tick.

**Warning signs:** Both `[Notification Scheduler]` and `[Notification Queue]` messages in logs; steady 5–10 DB queries/minute with zero user activity.

**Prevention:**
- Remove `startNotificationScheduler()` from `server.js` — the persistent queue supersedes it
- Batch `Team.findById` calls: collect all team IDs, fetch once with `$in`, process in-memory
- Early exit if `pendingNotifications.length === 0`

**Phase:** Phase 1 — Memory optimization

---

### PITFALL 1.3 — Multer `memoryStorage()` without file size limits

**What goes wrong:** No `limits: { fileSize }` on the PDF upload multer config. A 15MB PDF + `pdf-parse` intermediate buffers can spike memory by 50–150MB. Corrupted files can hang indefinitely.

**Prevention:**
- Add `limits: { fileSize: 10 * 1024 * 1024 }` immediately
- Add `fileFilter` to reject non-PDF MIME types before buffer allocation
- Set `req.file.buffer = null` after parsing to allow GC
- Wrap parsing in a 30-second timeout

**Phase:** Phase 1 (also relevant to PDF fix)

---

### PITFALL 1.4 — V8 heap defaults to host memory, not container limit

**What goes wrong:** Render.com free tier = ~512MB. V8 defaults heap limit to full host memory (4GB+). Node.js won't GC until well above 512MB — OS OOM-kills the process before V8 cleans up.

**Prevention:**
- Set `NODE_OPTIONS=--max-old-space-size=256` in Render.com dashboard
- Add `process.memoryUsage()` to `/api/health` endpoint for visibility

**Phase:** Phase 1

---

### PITFALL 1.5 — Voting/attendance jobs do full collection scans without indexes

**What goes wrong:** `votingDeadlineJob.js` and `attendanceTrackingJob.js` poll without indexes on `votingDeadline`, `startTime`, `autoDeclineProcessed`. Scans grow linearly as event history accumulates.

**Prevention:**
- Add Mongoose indexes: `{ votingDeadline: 1, autoDeclineProcessed: 1 }` and `{ startTime: 1 }`
- Add date ceiling: only look at events in the past 30 days
- Filter `autoDeclineProcessed: false` to exclude already-processed events

**Phase:** Phase 1

---

## Domain 2 — PDF Import Fix

### PITFALL 2.1 — Docling is Python-only; no npm package exists

**What goes wrong:** Docling is `pip install docling` only. No Node.js SDK. Render.com managed Node.js runtime has no Python. Using it requires a Python microservice (extra Render instance = cost + cold starts).

**Prevention:**
- Start with `pdfjs-dist@4.x` — JS-native, coordinate-aware, no sidecar needed
- Test against actual federation PDFs before committing to docling
- Keep docling as a future upgrade if `pdfjs-dist` still fails on specific layouts

**Phase:** Phase 2 — PDF fix

---

### PITFALL 2.2 — Docling subprocess blocks the event loop if not properly async

**What goes wrong:** If called via `child_process.execSync`, blocks all requests for 5–30 seconds. Render.com health check fails, causing restarts.

**Prevention:** Always use `spawn` with a Promise wrapper and 30-second timeout. Never `execSync`.

**Phase:** Phase 2

---

### PITFALL 2.3 — Docling output schema is incompatible with existing regex parser

**What goes wrong:** Current code expects `pdfData.text` (flat string) and applies regex patterns. Docling returns structured JSON (tables, paragraphs, sections). Zero matches returned silently — no error thrown.

**Prevention:**
- Capture sample docling JSON from a real federation PDF before writing integration code
- Write a completely new parser module — do not patch the existing regex parser
- Feature-flag the choice so fallback to `pdf-parse`/`pdfjs-dist` is possible

**Phase:** Phase 2

---

## Domain 3 — App Store / Play Store Packaging

### PITFALL 3.1 — Apple rejects pure web view wrappers (Guideline 4.2 — Minimum Functionality)

**What goes wrong:** Apple's App Store review rejects apps with no native API usage that are "not sufficiently different from a mobile website." Web push (VAPID/service worker) also does NOT work inside WKWebView.

**Warning signs:** No Capacitor plugins beyond defaults; no native features used; notifications use web push only.

**Prevention:**
- Add at least one meaningful native capability: `@capacitor/local-notifications` or `@capacitor/share`
- Migrate iOS push to APNs via `@capacitor/push-notifications` — gate on `window.Capacitor`
- This is the highest-risk item in the milestone — plan it first in the packaging phase

**Phase:** Phase 5 — App Store packaging

---

### PITFALL 3.2 — Web push is fundamentally broken inside Capacitor on iOS (WKWebView limitation)

**What goes wrong:** iOS WKWebView does not support the Web Push API. Existing Workbox service worker and VAPID push will silently fail. App Store users never receive notifications.

**Prevention:**
- Plan `@capacitor/push-notifications` as the iOS notification path from day one of packaging
- Backend needs a new APNs device token flow (structurally different from VAPID subscriptions)
- Budget this as roughly doubling the notification infrastructure work

**Phase:** Phase 5

---

### PITFALL 3.3 — TWA requires Digital Asset Links + Lighthouse PWA audit pass

**What goes wrong:** TWA requires `/.well-known/assetlinks.json` linking APK SHA-256 signing fingerprint to domain. If signing key changes, assetlinks becomes invalid — TWA silently falls back to Chrome Custom Tab (shows browser UI). Also: TWA is Android-only, not iOS.

**Prevention:**
- Run Lighthouse PWA audit against production frontend before any TWA work; fix all failures first
- Generate `assetlinks.json` using the Play Store signing fingerprint (not local debug key)
- Strategy: TWA for Android, Capacitor for iOS

**Phase:** Phase 5

---

### PITFALL 3.4 — App Store review requires demo accounts with seeded data

**What goes wrong:** Apple reviewers must exercise every feature. Empty account → rejection. Push permission on first launch → rejection for "aggressive permissions."

**Prevention:**
- Create two demo accounts: one `Trainer` + one `Spieler` in the same team with 3–5 upcoming events
- Delay notification permission until after first login + first event view
- Document both accounts explicitly in App Store review notes

**Phase:** Phase 5

---

### PITFALL 3.5 — `REACT_APP_API_URL` is hardcoded in Capacitor binary

**What goes wrong:** Backend URL changes require a full rebuild + App Store resubmission (1–3 day review cycle).

**Prevention:** Use a stable custom domain alias for the backend before first App Store submission.

**Phase:** Phase 5

---

## Domain 4 — Car Pool Organizer

### PITFALL 4.1 — Car pool in Event model inherits existing RSVP race condition

**What goes wrong:** Concurrent registrations using full-document PUT calls overwrite each other. The RSVP system already has this documented bug — car pool stored the same way inherits it.

**Prevention:**
- Use dedicated sub-resource endpoints with MongoDB atomic operators (`$push`, `$pull`, `$addToSet`)
- Never use full document replace for car pool mutations

**Phase:** Phase 3 — Car pool

---

### PITFALL 4.2 — Stale seat counts cause "no seats available" errors with no UI explanation

**What goes wrong:** 5-minute `staleTime` means Player A sees seats available, Player B takes them, Player A gets a server error with no explanation.

**Prevention:**
- Override `staleTime: 30_000` and `refetchInterval: 30_000` for car pool query when section is mounted and event is within 24 hours
- Handle 409 responses explicitly: "Dieser Platz wurde soeben vergeben."
- Do NOT introduce WebSockets — disproportionate cost for free-tier app

**Phase:** Phase 3

---

### PITFALL 4.3 — Car pool fields re-inflate the already-heavy GET /api/events response

**What goes wrong:** Car pool arrays returned in every event list response undoes phase 1 memory optimization work.

**Prevention:**
- Exclude car pool from list endpoint: `.select('-carPool')`
- Car pool data only in `GET /api/events/:id` or dedicated `GET /api/events/:id/carpool`
- Design this during phase 1, not after

**Phase:** Phase 3 (plan during Phase 1)

---

### PITFALL 4.4 — Coach "finalize" is frontend-only without server enforcement

**What goes wrong:** Players can still call registration endpoints after coach finalizes if there's no server-side flag.

**Prevention:**
- Add `carpoolFinalized: { type: Boolean, default: false }` to Event model
- All car pool mutation endpoints check this flag, return HTTP 409 if finalized

**Phase:** Phase 3

---

## Domain 5 — Team Fund / Punishment Catalog

### PITFALL 5.1 — Storing a computed balance number instead of a transaction log loses audit trail

**What goes wrong:** Coaches and players will dispute balances with no way to verify them.

**Prevention:** Model as immutable transaction log — balance computed as `SUM(entries)` on read. Never store `currentBalance: Number`.

**Phase:** Phase 4 — Team fund

---

### PITFALL 5.2 — Fund entries leak across teams without authorization check

**What goes wrong:** Missing team membership check lets a player read fine entries for teams they don't belong to.

**Prevention:** Reuse the team membership check from `teamRoutes.js`. Players receive only `player: req.user._id` entries; coaches receive all team entries.

**Phase:** Phase 4

---

## Cross-Cutting Pitfalls

### PITFALL X.1 — No automated tests means every change is a production gamble

**What goes wrong:** Zero tests. This milestone modifies `eventRoutes.js` (1615 lines) and `EventContext.js` (660 lines). A memory fix that breaks RSVP won't be caught until coaches report it.

**Prevention:**
- Before touching `eventRoutes.js`, add minimal integration tests for: GET /api/events returns 200, POST creates event, PUT RSVP changes status
- For PDF parser replacement, write unit tests with sample output strings before integration code

**Phase:** All phases

---

### PITFALL X.2 — Render.com free tier spin-down kills background jobs and degrades App Store review

**What goes wrong:** Free tier spins down after 15 minutes. Cold starts take 30–60 seconds. All `setInterval` jobs die. App Store reviewer hits a 45-second cold start → rejection risk.

**Prevention:**
- Do not design car pool or fund features requiring time-critical background jobs — they will fail during spin-down
- Decide whether to upgrade to Render.com Starter ($7/month) before App Store submission

**Phase:** Awareness for all phases; upgrade decision before Phase 5

---

*Research by: gsd-project-researcher*
*Last updated: 2026-02-23*
