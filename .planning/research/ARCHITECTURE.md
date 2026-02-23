# Architecture Research — Subsequent Milestone Features

**Project:** InTeam — Volleyball Team Manager PWA
**Research date:** 2026-02-23

---

## 1. Context Summary

Existing system: React 18 PWA (CRA + react-app-rewired + Workbox) backed by Node.js/Express 4 + Mongoose 7 + MongoDB Atlas, deployed as two independent Render.com services. Authentication is JWT-based. The Event model already carries `attendingPlayers`, `invitedPlayers`, `declinedPlayers`, `unsurePlayers` plus team references. No automated tests exist.

---

## 2. Component Boundaries

### 2.1 Car Pool Organizer

**Where data lives:** Embedded in Event document as a `carPool` sub-document. Car pool data has no meaning outside its event, and Event already owns the attendance arrays car pool depends on.

**Schema extension to `server/models/Event.js`:**
```js
carPool: {
  enabled: { type: Boolean, default: false },
  cars: [{
    driver: { type: ObjectId, ref: 'User', required: true },
    seats: { type: Number, min: 1, max: 9 },
    passengers: [{ type: ObjectId, ref: 'User' }],
    meetingPoint: String,
    departureTime: Date,
    notes: String
  }],
  unassignedPassengers: [{ type: ObjectId, ref: 'User' }],
  finalizedBy: { type: ObjectId, ref: 'User' },
  finalizedAt: Date
}
```

**New endpoints in `server/routes/eventRoutes.js`:**
- `GET /api/events/:id/carpool` — all event participants
- `POST /api/events/:id/carpool/register` — player registers as driver or passenger
- `DELETE /api/events/:id/carpool/register` — player withdraws
- `PUT /api/events/:id/carpool/assign` — coach assigns passengers to cars (coach middleware)
- `PUT /api/events/:id/carpool/finalize` — coach finalizes (coach middleware)

**New frontend component:** `client/src/components/CarPoolPanel.js` embedded in `EventDetail.js`.
React Query key: `['carpool', eventId]`

---

### 2.2 Team Fund / Punishment Catalog

**Why a separate collection:** Fine entries grow unbounded. Storing them on Team would risk document size growth and unintended populate cascades on every `GET /api/teams`.

**New model `server/models/TeamFund.js`:**
```js
{
  team: ObjectId (unique),
  catalog: [{ _id, label, amount (integer cents), currency }],
  entries: [{
    player: ObjectId,
    catalogItem: ObjectId,
    label: String (snapshot),
    amount: Number,
    note: String,
    addedBy: ObjectId,
    paidAt: Date,
    createdAt: Date
  }]
}
// Index: { team: 1, 'entries.player': 1 }
```

Amounts stored as integer cents to avoid float precision issues.

**New route file `server/routes/teamFundRoutes.js`:**
- `GET /api/teams/:id/fund` — full data (coach); own entries only (player, server-filtered)
- `PUT /api/teams/:id/fund/catalog` — replace catalog (coach)
- `POST /api/teams/:id/fund/entries` — add entry (coach)
- `PUT /api/teams/:id/fund/entries/:entryId/pay` — mark paid (coach)
- `DELETE /api/teams/:id/fund/entries/:entryId` — delete (coach)

**New frontend pages:**
- `client/src/pages/coach/TeamFund.js` — route `/coach/teams/:id/fund`
- `client/src/pages/player/TeamFund.js` — route `/player/teams/:id/fund` (read-only balance)
- Both need `pb: 10` on main container per CLAUDE.md

---

### 2.3 PWA App Store Packaging

**TWA (Play Store — zero source changes):**
- Add `client/public/.well-known/assetlinks.json` linking APK signing key to origin
- Bubblewrap CLI generates Android wrapper project
- Zero changes to React source or Express backend
- iOS not supported via TWA

**Capacitor (Android + iOS):**
- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` into `client/`
- Build: `npm run build` → `npx cap sync` → native IDE export
- Adds `capacitor.config.json`, `ios/`, `android/` — does not affect Render static site
- Requires Apple Developer Program ($99/year)

**Recommended sequence:** TWA first (Play Store, no code risk), Capacitor second (iOS).

**Manifest gaps to fix before submission:**
- Add icons at 48, 72, 96, 144, 180px + maskable 512px variant
- Add `"purpose": "maskable"` entry
- Change `"start_url"` to absolute URL `"https://inteamfe.onrender.com/"`

---

### 2.4 PDF Import Fix

**Option A — pdfjs-dist (JS-native, recommended):**
- Replace `pdf-parse` with `pdfjs-dist@4.x` in existing route handler
- Coordinate-aware text extraction — can reconstruct table rows by Y-coordinate grouping
- No new services, no extra memory cost
- Parsing logic is isolated inside the import handler in `server/routes/eventRoutes.js`

**Option B — docling Python microservice:**
- FastAPI service on a paid Render instance (~300-400MB model)
- Higher accuracy but adds infrastructure cost and cold-start latency
- Only needed if `pdfjs-dist` still fails on specific federation PDF variants

**Recommended:** Start with `pdfjs-dist`. Upgrade to docling microservice only if accuracy still insufficient.

---

## 3. Data Flow

```
Car Pool:
  browser → POST/PUT/DELETE /api/events/:id/carpool/* (protect)
  → eventRoutes.js updates Event.carPool sub-document
  → React Query ['carpool', eventId] invalidated → CarPoolPanel re-renders

Team Fund:
  coach → CRUD /api/teams/:id/fund/* (protect + coach)
  → teamFundRoutes.js → TeamFund collection
  → React Query ['teamFund', teamId] invalidated

  player → GET /api/teams/:id/fund (protect)
  → server filters entries to req.user._id → player sees own balance only

TWA:
  assetlinks.json at /.well-known/ → Bubblewrap APK wraps live PWA URL → Play Store

PDF import:
  multipart POST /api/events/import-pdf
  → multer buffer → pdfjs-dist parsing → JSON match array
  → ImportMatchesPDF.js renders preview
```

---

## 4. Suggested Build Order

```
Phase 1 — Backend optimization (unblocks stability)
  - .lean() on read queries, NODE_OPTIONS memory cap, multer limits

Phase 2 — PDF import fix (restores broken feature)
  - Replace pdf-parse with pdfjs-dist in eventRoutes.js
  - Fix mobile layout on coach event page

Phase 3 — Car pool organizer (additive, no breaking changes)
  - Event schema extension + route handlers + CarPoolPanel component

Phase 4 — Team fund / punishment catalog (new model + routes + pages)
  - TeamFund model, teamFundRoutes.js, coach + player pages

Phase 5 — App Store packaging (no source changes)
  - Manifest/icon fixes → TWA for Play Store → Capacitor for App Store
```

---

## 5. Cross-Cutting Concerns

**Memory:** `GET /api/events` should use `.select('-carPool')` to prevent payload bloat. TeamFund queries isolated from Team list queries.

**Authorization:** No new middleware needed. Car pool uses `protect` + inline team membership check. Fund uses `protect` + `coach` + existing team-coach verification pattern.

**React Query keys:** `['carpool', eventId]` and `['teamFund', teamId]` — no overlap with existing keys.

**Mobile layout:** New coach pages need `pb: 10`. CarPoolPanel inherits from EventDetail container.

**German locale:** All labels, dates, amounts in German. Amounts as "5,00 EUR". Dates via existing timezoneUtils.

---

*Research by: gsd-project-researcher*
*Last updated: 2026-02-23*
