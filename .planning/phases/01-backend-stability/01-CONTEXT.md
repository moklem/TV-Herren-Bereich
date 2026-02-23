# Phase 1: Backend Stability - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Server-side stability and observability — OOM prevention, memory visibility, PDF upload size enforcement, and consolidation of notification schedulers. No frontend UI changes except the client-side upload guard. The goal is a backend that runs reliably without OOM crashes on Render.com Starter tier.

**Important correction:** The app runs on **Render.com Starter tier** (not free tier). This means more RAM headroom than originally specified in STATE.md.

</domain>

<decisions>
## Implementation Decisions

### Health Endpoint (/api/health)
- **Consumer:** Developers only — manual diagnostic use, not wired to Render health checks or frontend
- **Auth:** Public, no authentication required
- **Contents:** Memory only — `heapUsed`, `heapTotal`, `rss` from `process.memoryUsage()`
- **Response format:**
  ```json
  { "status": "ok", "memory": { "heapUsed": ..., "heapTotal": ..., "rss": ... } }
  ```

### Upload Rejection Behavior
- **HTTP status:** 413 Payload Too Large
- **Error message (German):** "Die Datei ist zu groß. Maximale Dateigröße: 10 MB."
- **Enforcement:** Both client-side (reject before upload) and server-side (reject before processing)
- **Limit definition:** Hardcoded constant — `MAX_UPLOAD_SIZE = 10 * 1024 * 1024` — defined in one place

### Notification Scheduler Removal
- **First step:** Read `server.js` to understand which scheduler (`startNotificationScheduler` vs. queue) is doing what before deciding what's safe to remove
- **If legacy is truly redundant:** Remove immediately in one commit — no commenting out, no deprecation period
- **If legacy handles unique functionality:** Migrate that functionality into the persistent queue scheduler, then remove the legacy scheduler
- **Post-removal:** Include a manual smoke test task to verify the notification queue is still processing after the change

### Memory Cap
- **Cap value:** Raise to 512MB (`NODE_OPTIONS=--max-old-space-size=512`) — Starter tier has more headroom than 256MB, and a tighter cap may cause unnecessary OOM restarts
- **Where to set:** `render.yaml` environment section — version-controlled, visible, applied on every Render deploy
- **Alerting:** Passive only — `/api/health` is sufficient; no automated alerts or log-level warnings needed for now
- **Root cause investigation:** The plan should investigate what's currently causing memory growth (likely `pdf-parse` or a leak in PDF processing) — not just apply the cap. Root cause context informs Phase 2 (pdfjs-dist migration).

### Claude's Discretion
- Exact order of operations within each fix (e.g., which file to touch first in scheduler removal)
- Whether to add a constants file or inline `MAX_UPLOAD_SIZE` where it's used
- How to verify `NODE_OPTIONS` is active in a Render deployment (log it at startup, or check via health endpoint)

</decisions>

<specifics>
## Specific Ideas

- The 256MB cap from the roadmap was based on free tier assumptions — Starter tier warrants revisiting to 512MB
- Root cause investigation matters because Phase 2 replaces `pdf-parse` with `pdfjs-dist` anyway — knowing what's leaking informs that work
- The health endpoint should be trivially simple: one route, no middleware, returns JSON immediately

</specifics>

<deferred>
## Deferred Ideas

- External uptime monitoring (e.g., UptimeRobot pinging /api/health) — could be added in a later operational phase
- Log-level memory warnings (e.g., WARN when heapUsed > 80% of cap) — not needed now but easy to add later

</deferred>

---

*Phase: 01-backend-stability*
*Context gathered: 2026-02-23*
