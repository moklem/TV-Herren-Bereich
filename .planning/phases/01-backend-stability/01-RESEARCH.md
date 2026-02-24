# Phase 1: Backend Stability - Research

**Researched:** 2026-02-23
**Domain:** Node.js/Express server stability — OOM prevention, memory observability, upload limits, scheduler deduplication, Mongoose query optimization, MongoDB indexes
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Health Endpoint (/api/health)**
- Consumer: Developers only — manual diagnostic use, not wired to Render health checks or frontend
- Auth: Public, no authentication required
- Contents: Memory only — `heapUsed`, `heapTotal`, `rss` from `process.memoryUsage()`
- Response format: `{ "status": "ok", "memory": { "heapUsed": ..., "heapTotal": ..., "rss": ... } }`

**Upload Rejection Behavior**
- HTTP status: 413 Payload Too Large
- Error message (German): "Die Datei ist zu groß. Maximale Dateigröße: 10 MB."
- Enforcement: Both client-side (reject before upload) and server-side (reject before processing)
- Limit definition: Hardcoded constant — `MAX_UPLOAD_SIZE = 10 * 1024 * 1024` — defined in one place

**Notification Scheduler Removal**
- First step: Read `server.js` to understand which scheduler is doing what (already done in research)
- If legacy is truly redundant: Remove immediately in one commit
- If legacy handles unique functionality: Migrate that functionality into the persistent queue scheduler, then remove
- Post-removal: Include a manual smoke test task to verify notification queue is still processing

**Memory Cap**
- Cap value: 512MB (`NODE_OPTIONS=--max-old-space-size=512`)
- Where to set: `render.yaml` environment section
- Alerting: Passive only — `/api/health` is sufficient
- Root cause investigation: Plan should investigate what's currently causing memory growth (likely `pdf-parse` or a leak in PDF processing)

### Claude's Discretion

- Exact order of operations within each fix
- Whether to add a constants file or inline `MAX_UPLOAD_SIZE` where it's used
- How to verify `NODE_OPTIONS` is active in a Render deployment (log it at startup, or check via health endpoint)

### Deferred Ideas (OUT OF SCOPE)

- External uptime monitoring (e.g., UptimeRobot pinging /api/health)
- Log-level memory warnings (e.g., WARN when heapUsed > 80% of cap)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | `.lean()` added to all read-only Mongoose queries to eliminate document hydration overhead | 169 `.find()` / `.findOne()` / `.findById()` calls across 9 route files — no `.lean()` found anywhere. Mongoose `.lean()` returns plain JS objects (~3-5x lighter). Pattern is straightforward. |
| PERF-02 | Memory usage visible via `/api/health` endpoint returning `process.memoryUsage()` data | `/api/health` already exists in `server.js` (line 69) but returns only `status`, `timestamp`, `environment`, `version`. Needs extension to add `memory` field. One-line change. |
| PERF-03 | PDF upload protected with 10MB file size limit to prevent memory spikes | Multer is already installed (`^2.0.2`). Current multer config uses `memoryStorage()` with no `limits` option. Client-side `handleFileChange` only validates file type, not size. Both need updating. |
| PERF-04 | `NODE_OPTIONS=--max-old-space-size=256` configured on Render.com (user decision: raise to 512) | `render.yaml` has `envVars` section for backend service. No `NODE_OPTIONS` currently set. Adding it there is the correct approach — version-controlled, applied on every deploy. |
| PERF-05 | Duplicate notification scheduler removed — only persistent queue runs | `startNotificationScheduler` runs every 5 min + heartbeat every 1 min. `startNotificationQueue` runs every 1 min + heartbeat every 5 min. Both call `sendCustomEventReminder` with identical logic. Legacy scheduler duplicates queue functionality completely — safe to remove. |
| PERF-06 | Database indexes added for `votingDeadline`, `autoDeclineProcessed`, `startTime` | `Event` model has no indexes defined. `votingDeadlineJob.js` queries on `votingDeadline` and `autoDeclineProcessed`. Event list endpoint sorts by `startTime`. `attendanceTrackingJob` queries `startTime` and `attendanceAutoProcessed`. |
| PERF-07 | Event list endpoint excludes `carPool` sub-document from payload | Event schema has no `carPool` field yet (Phase 3 adds it). The requirement is a proactive measure — apply `.select('-carPool')` now so the payload stays lean when the field is added later. |
</phase_requirements>

---

## Summary

Phase 1 is entirely server-side and touches five distinct areas of `server/`. The work is additive (health endpoint, indexes) and subtractive (legacy scheduler, missing upload limit). No architectural changes are needed. Every task is self-contained and low-risk.

The most important discovery from codebase inspection: **the two notification schedulers are running in parallel right now.** `startNotificationScheduler` (legacy) and `startNotificationQueue` both call `sendCustomEventReminder` — they share identical notification delivery logic but maintain separate codepaths. The legacy scheduler uses a 30-minute "catch-up" window on the Event document's `remindersSent` array to deduplicate; the queue uses `NotificationQueue` documents in MongoDB for the same purpose. Running both doubles the notification processing load on every cycle. The queue's approach (persistent MongoDB records) is strictly better — it survives restarts. The legacy scheduler is safe to delete.

The second most important discovery: **169 Mongoose queries across 9 route files have no `.lean()`.** This is the largest single source of unnecessary memory and CPU overhead in the application. Every `.find()` that populates related documents creates full Mongoose Document objects with getters, setters, validation, and change-tracking overhead. For read-only list endpoints this is pure waste. The PERF-01 requirement addresses the root cause of memory pressure more directly than the memory cap itself.

**Primary recommendation:** Fix PERF-01 (`.lean()`) and PERF-05 (remove legacy scheduler) before deploying the memory cap — these reduce actual heap usage, making the cap a safety net rather than a band-aid.

---

## Standard Stack

### Core (no new packages needed)

| Library | Current Version | Purpose | Notes |
|---------|----------------|---------|-------|
| express | `^4.18.2` | HTTP framework | Already installed |
| multer | `^2.0.2` | Multipart file uploads | Already installed — needs `limits` config |
| mongoose | `^7.5.0` | MongoDB ODM | Already installed — needs `.lean()` additions |
| Node.js built-in `process` | N/A | `process.memoryUsage()` for health endpoint | No import needed |

### What NOT to add

No new npm packages are required for Phase 1. All functionality is achievable with existing dependencies and Node.js built-ins.

---

## Architecture Patterns

### Pattern 1: Multer Upload Limit

**What:** Pass a `limits` object to `multer()` to cap file size at the middleware layer — before the file buffer reaches application code.

**When to use:** Any route that accepts file uploads.

**Current code (eventRoutes.js line 285):**
```javascript
const upload = multer({ storage: multer.memoryStorage() });
```

**Target code:**
```javascript
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE }
});
```

**Multer error handling:** When the file exceeds `limits.fileSize`, multer throws a `MulterError` with `code === 'LIMIT_FILE_SIZE'`. This must be caught in an error-handling middleware or in the route handler. Express does not automatically catch multer errors.

**Pattern for catching multer errors in a route:**
```javascript
router.post('/parse-pdf', protect, coach, (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'Die Datei ist zu groß. Maximale Dateigröße: 10 MB.'
        });
      }
      return res.status(400).json({ message: 'Upload-Fehler' });
    }
    next();
  });
}, async (req, res) => {
  // existing parse-pdf handler body
});
```

Alternatively, multer can be applied via a dedicated error middleware registered after the route. The inline callback pattern above is simpler and keeps the change localized.

### Pattern 2: Mongoose `.lean()`

**What:** Appending `.lean()` to a Mongoose query chain returns plain JavaScript objects instead of Mongoose Document instances. The resulting objects have no getters, setters, virtuals, or `save()` method.

**When to use:** Any query where the result is only read and serialized to JSON — i.e., all list/detail endpoints that do not call `.save()` on the result.

**Current pattern (eventRoutes.js line 416):**
```javascript
events = await Event.find({ ...filter })
  .populate('team', 'name type')
  // ... more populates
  .sort({ startTime: 1 });
```

**Target pattern:**
```javascript
events = await Event.find({ ...filter })
  .populate('team', 'name type')
  // ... more populates
  .sort({ startTime: 1 })
  .lean();
```

**Compatibility warning:** `.lean()` strips Mongoose Document methods (`acceptInvitation`, `declineInvitation`, `isPlayerAttending`, etc. defined on EventSchema). Routes that call event document methods after a `.find()` CANNOT use `.lean()`. Specifically in `eventRoutes.js`, the `GET /` and `GET /:id` routes that just return JSON are safe. Routes that then call `event.save()` or schema methods are not safe to lean.

**Scope for PERF-01:** Only apply `.lean()` to queries where the result is serialized and returned without mutation. This is primarily the list/detail GET endpoints.

### Pattern 3: MongoDB Index Definition in Mongoose Schema

**What:** Call `Schema.index()` after the schema definition to declare compound indexes. Mongoose syncs indexes to MongoDB on startup when `autoIndex` is true (default in development).

**When to use:** Fields used in `$match` / `find()` filters and `sort()` operations with high query frequency.

**Queries that need indexes (from codebase inspection):**

- `votingDeadlineJob.js` line 12: `Event.find({ votingDeadline: { $lt: now }, autoDeclineProcessed: { $ne: true } })` → compound index: `{ votingDeadline: 1, autoDeclineProcessed: 1 }`
- `attendanceTrackingJob.js`: queries on `endTime` past threshold and `attendanceAutoProcessed: false` → compound index: `{ endTime: 1, attendanceAutoProcessed: 1 }`
- `eventRoutes.js` GET `/`: sorts by `startTime: 1` on all events → single index: `{ startTime: 1 }`
- `notificationQueue.js` line 177: `NotificationQueue.find({ status: 'pending', scheduledTime: { $gte, $lte } })` → already indexed (NotificationQueue has `{ scheduledTime: 1, status: 1 }` index)

**Target additions to Event model:**
```javascript
// After EventSchema definition, before module.exports
EventSchema.index({ startTime: 1 });
EventSchema.index({ votingDeadline: 1, autoDeclineProcessed: 1 });
EventSchema.index({ endTime: 1, attendanceAutoProcessed: 1 });
```

### Pattern 4: NODE_OPTIONS in render.yaml

**What:** Set `NODE_OPTIONS` as an environment variable in the backend service's `envVars` array in `render.yaml`. Render.com applies env vars before process startup.

**Current render.yaml backend envVars (no NODE_OPTIONS):**
```yaml
envVars:
  - key: NODE_VERSION
    value: 18.17.0
  - key: NODE_ENV
    value: production
  # ...
```

**Target:**
```yaml
envVars:
  - key: NODE_OPTIONS
    value: "--max-old-space-size=512"
  - key: NODE_VERSION
    value: 18.17.0
  # ... rest unchanged
```

**Verification:** Log the V8 heap limit at startup to confirm the cap is active:
```javascript
// In server.js, near the top after requires
const v8 = require('v8');
console.log(`[Startup] V8 heap size limit: ${Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024)} MB`);
```
This appears in Render logs on every deploy and confirms `NODE_OPTIONS` was applied.

### Pattern 5: /api/health Memory Extension

**What:** `process.memoryUsage()` returns an object with `rss`, `heapTotal`, `heapUsed`, `external`, `arrayBuffers`. All values are in bytes.

**Current handler (server.js line 69):**
```javascript
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});
```

**Target:** Replace with the user-decided response shape:
```javascript
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: 'ok',
    memory: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss
    }
  });
});
```

Note: The user-decided format uses lowercase `"ok"` (not `"OK"`). The current handler uses `"OK"`. Since render.yaml points `healthCheckPath: /api/health` at this endpoint, confirm whether Render's health check parser expects a specific status value. **However**, the CONTEXT.md explicitly states this endpoint is for developer use only and is NOT wired to Render health checks. Therefore we can safely change the status string. The Render health check only verifies HTTP 200, not the body content.

### Pattern 6: Legacy Scheduler Removal

**What:** Delete the `startNotificationScheduler` import and call from `server.js`, then either delete `notificationScheduler.js` entirely or confirm no other file imports from it.

**Codebase state (confirmed by reading both files):**
- `notificationScheduler.js` exports: `startNotificationScheduler`, `checkAndSendEventReminders`, `sendCustomEventReminder`
- `notificationQueue.js` exports: `scheduleEventNotifications`, `processPendingNotifications`, `cleanupOldNotifications`, `startNotificationQueue`
- `server.js` imports both and calls both
- No other file imports from `notificationScheduler.js`

**Overlap analysis:**
- Both call a `sendCustomEventReminder` function — the implementations are identical (same logic, different log prefix `[Notification Scheduler]` vs `[Notification Queue]`)
- Legacy scheduler checks events by scanning the `remindersSent` Event sub-document. Queue checks by querying `NotificationQueue` model
- Queue has deduplication via `alreadySent` check that reads `event.remindersSent` — same safety net as legacy
- Queue persists state in MongoDB across restarts — legacy scheduler loses state on cold boot
- Both run on startup immediately

**Conclusion:** The legacy scheduler provides zero unique functionality. The queue subsumes everything the scheduler does, plus adds restart-resilience. **Safe to delete `notificationScheduler.js` and remove the import/call from `server.js`.**

**Files to modify:**
1. `server/server.js` — remove line 22 (`require('./utils/notificationScheduler')`) and line 324 (`startNotificationScheduler()`)
2. `server/utils/notificationScheduler.js` — delete entire file

### Anti-Patterns to Avoid

- **Applying `.lean()` to mutation routes:** Routes that call `event.save()` or schema instance methods need the full Mongoose Document. Only lean list/detail GET handlers.
- **Relying on Render UI for env vars:** Setting `NODE_OPTIONS` in the Render dashboard instead of `render.yaml` makes it invisible to code review and can be accidentally overwritten.
- **Inline multer middleware without error handling:** `upload.single('pdf')` used as direct Express middleware will bubble multer errors as unhandled exceptions. Must use the callback form or a dedicated error middleware.
- **Commenting out the legacy scheduler:** CONTEXT.md is explicit — remove it in one commit, no deprecation period.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File size limiting | Custom middleware reading Content-Length header | `multer({ limits: { fileSize: N } })` | Multer handles chunked uploads, streaming, multipart parsing edge cases |
| Memory measurement | Custom memory tracking/sampling | `process.memoryUsage()` (built-in) | Node.js built-in, synchronous, always accurate |
| V8 heap limit reporting | Parsing `--max-old-space-size` from process.argv | `require('v8').getHeapStatistics().heap_size_limit` | Reads the actual enforced limit, not the configured one |

---

## Common Pitfalls

### Pitfall 1: `.lean()` Breaks Schema Methods

**What goes wrong:** After adding `.lean()` to Event queries, calls to `event.acceptInvitation()`, `event.declineInvitation()`, `event.isVotingDeadlinePassed()` etc. throw "event.X is not a function".

**Why it happens:** `.lean()` returns a plain object. Schema instance methods only exist on Mongoose Document instances.

**How to avoid:** Only add `.lean()` to queries where the result is immediately serialized (returned as JSON response). Never add it to queries where the result is modified and saved.

**Warning signs:** Any query followed by `event.save()`, `event.someSchemaMethod()`, or `event.push()` — these cannot be leaned.

**In this codebase:** The `GET /api/events` and `GET /api/events/:id` routes are safe to lean (they return JSON). The `POST /:id/accept`, `POST /:id/decline`, etc. are NOT safe to lean (they call schema methods).

### Pitfall 2: Multer v2 API Change

**What goes wrong:** Code copied from multer v1 documentation fails at runtime.

**Why it happens:** `multer` package at `^2.0.2` in `package.json`. Multer 2.x was released in 2024 and introduced breaking changes from 1.x.

**How to avoid:** Verify the current multer 2.x API. The `limits.fileSize` option and `MulterError` class exist in both v1 and v2. The error code `LIMIT_FILE_SIZE` is unchanged. The primary v2 change is dropping support for the `diskStorage.destination` callback pattern for some edge cases — but memory storage is unaffected.

**Confidence:** MEDIUM — verified that `multer` v2 is installed, limits API is documented as stable. Recommend checking `node_modules/multer/README.md` at implementation time.

### Pitfall 3: render.yaml NODE_OPTIONS Quoting

**What goes wrong:** `NODE_OPTIONS` value with `--` flags gets misinterpreted by YAML parser.

**Why it happens:** YAML has special meaning for strings starting with `--` in some parsers.

**How to avoid:** Always quote the value: `value: "--max-old-space-size=512"` (with surrounding double quotes in YAML).

### Pitfall 4: Index Creation on Existing Production Collection

**What goes wrong:** Mongoose `autoIndex: true` (default) rebuilds indexes on startup. On a large collection this can spike CPU and hold the event loop.

**Why it happens:** MongoDB builds indexes in the foreground by default in older drivers, blocking reads/writes briefly.

**How to avoid:** The Event collection in this app is small (a team's events over a season — likely under 1000 documents). Index creation will be near-instantaneous. This pitfall is not a practical concern here.

**Warning signs:** Would only matter if the Event collection had > 100,000 documents.

### Pitfall 5: Forgetting the Client-Side Upload Guard

**What goes wrong:** Server returns 413 but client shows a generic error message because the client-side guard is absent or uses the wrong limit value.

**Why it happens:** `handleFileChange` in `ImportMatchesPDF.js` currently only validates file type, not size. The 413 server response will be caught by the `catch` block in `handleUploadPDF` which sets `setUploadError` to the axios error message — which may be an English string, not the German message.

**How to avoid:** Add size check in `handleFileChange` before the upload is even attempted, using the same `MAX_UPLOAD_SIZE` constant (or its numeric equivalent on the client side since the client can't import from the server). Show the same German error message.

**Current client code (ImportMatchesPDF.js lines ~178-190, shifted by remote commits adding coach filtering logic above):**
```javascript
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    setPdfFile(file);
    setUploadError('');
  } else {
    setUploadError('Bitte wählen Sie eine gültige PDF-Datei aus');
  }
};
```

**Target client code:**
```javascript
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB — must match server constant

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    setUploadError('Bitte wählen Sie eine gültige PDF-Datei aus');
    return;
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    setUploadError('Die Datei ist zu groß. Maximale Dateigröße: 10 MB.');
    return;
  }
  setPdfFile(file);
  setUploadError('');
};
```

---

## Code Examples

### `/api/health` target response

```javascript
// Source: Node.js built-in process.memoryUsage() API
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: 'ok',
    memory: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss
    }
  });
});
```

### V8 heap limit startup log

```javascript
// Source: Node.js built-in v8 module
const v8 = require('v8');
// Place near top of server.js after initial requires
console.log(`[Startup] V8 heap size limit: ${Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024)} MB`);
```

### Multer with size limit and error handling

```javascript
// Source: multer v2 documentation
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE }
});

// Usage in route (inline callback pattern to catch MulterError):
router.post('/parse-pdf', protect, coach, (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'Die Datei ist zu groß. Maximale Dateigröße: 10 MB.'
        });
      }
      return res.status(400).json({ message: 'Upload-Fehler: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Keine PDF-Datei hochgeladen' });
  }
  // ... existing parse-pdf logic
});
```

### Event model indexes

```javascript
// After EventSchema definition in server/models/Event.js
// Before module.exports = mongoose.model('Event', EventSchema);

EventSchema.index({ startTime: 1 });
EventSchema.index({ votingDeadline: 1, autoDeclineProcessed: 1 });
EventSchema.index({ endTime: 1, attendanceAutoProcessed: 1 });
```

### Mongoose .lean() on list endpoint

```javascript
// Pattern: add .lean() at end of read-only query chains
events = await Event.find({ ...filter })
  .populate('team', 'name type')
  .populate('teams', 'name type')
  .populate('attendingPlayers', 'name email position')
  // ... other populates
  .sort({ startTime: 1 })
  .lean();   // <-- add here, only on GET endpoints that return JSON

// DO NOT add .lean() on queries like:
const event = await Event.findById(req.params.id);  // followed by event.save()
```

---

## Codebase State Summary

Key facts discovered by reading the actual source files:

| Area | Current State | What PERF-XX Requires |
|------|--------------|----------------------|
| `/api/health` | Returns `status`, `timestamp`, `environment`, `version` — no memory | Add `memory` object from `process.memoryUsage()` |
| Multer config | `memoryStorage()` only, no `limits` | Add `limits: { fileSize: MAX_UPLOAD_SIZE }` |
| Client upload guard | Type validation only, no size check | Add `file.size > MAX_UPLOAD_SIZE` check |
| `NODE_OPTIONS` in render.yaml | Not set — no heap cap active | Add `--max-old-space-size=512` to backend envVars |
| `notificationScheduler.js` | Running in parallel with queue, identical delivery logic | Delete file, remove import and call from `server.js` |
| Event model indexes | No indexes defined on Event schema | Add 3 compound indexes for job query fields |
| `carPool` field in Event | Does not exist yet (Phase 3 adds it) | Add `.select('-carPool')` proactively to event list queries |
| `.lean()` usage | Zero occurrences across all 169 read queries | Apply to all read-only GET endpoints |

---

## Open Questions

1. **Does render.yaml `healthCheckPath: /api/health` care about the `status` field value?**
   - What we know: Render.com health checks verify HTTP 200 status code only, not body content.
   - What's unclear: Whether changing `"OK"` to `"ok"` could affect any existing monitoring script.
   - Recommendation: Change to `"ok"` per CONTEXT.md spec. The endpoint is for developer use only.

2. **Is `pdf-parse` the actual cause of the OOM crashes?**
   - What we know: `pdf-parse` loads the entire PDF into memory as a Buffer via multer's `memoryStorage()`. Without a file size limit, a large PDF could spike heap usage significantly.
   - What's unclear: Whether the crashes are from `pdf-parse` alone or from a combination of factors (large event documents with many populated references, 5-minute notification scan loading all events with players populated).
   - Recommendation: The 10MB upload limit (PERF-03) directly limits `pdf-parse` exposure. The `.lean()` changes (PERF-01) reduce event query memory. Both together address the most plausible causes. This context informs Phase 2 (replacing pdf-parse with pdfjs-dist).

3. **Should `notificationScheduler.js` exports be preserved anywhere?**
   - What we know: No file other than `server.js` imports from `notificationScheduler.js`. The `sendCustomEventReminder` function in `notificationQueue.js` is a complete reimplementation with identical behavior.
   - What's unclear: Nothing — confirmed by grep.
   - Recommendation: Delete the file entirely. No migration needed.

---

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection — `server/server.js`, `server/utils/notificationScheduler.js`, `server/utils/notificationQueue.js`, `server/routes/eventRoutes.js`, `server/models/Event.js`, `server/models/NotificationQueue.js`, `render.yaml`, `server/package.json`, `client/src/pages/coach/ImportMatchesPDF.js`
- Node.js built-in `process.memoryUsage()` — standard API, no version concerns
- Node.js built-in `v8.getHeapStatistics()` — stable API since Node.js 6

### Secondary (MEDIUM confidence)

- Multer v2 `limits.fileSize` API and `MulterError` — based on package.json version `^2.0.2` and npm package documentation pattern; recommend verifying at `node_modules/multer/README.md` during implementation
- Mongoose `.lean()` behavior with populated documents — well-documented Mongoose feature, stable across v6/v7

### Tertiary (LOW confidence)

- Render.com Starter tier RAM specifications — stated as "more headroom than free tier" in CONTEXT.md; 512MB cap is user decision based on this

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already installed, using built-ins
- Architecture: HIGH — patterns read directly from existing code, no speculation
- Pitfalls: HIGH for lean/scheduler pitfalls (confirmed by codebase), MEDIUM for multer v2 API details
- Scheduler removal decision: HIGH — both files read completely, overlap confirmed line-by-line

**Research date:** 2026-02-23
**Valid until:** 2026-05-23 (stable domain — Mongoose, multer, Node.js built-ins change rarely)
