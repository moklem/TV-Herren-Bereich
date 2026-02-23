# Stack Research — InTeam PWA (Subsequent Milestone)

**Project:** InTeam — Volleyball Team Manager PWA
**Research date:** 2026-02-23
**Milestone:** Subsequent (adding to existing production app)
**Questions answered:** docling/PDF parsing, PWA App Store packaging, Node.js memory optimization

---

## 1. PDF Parsing: Replacing pdf-parse

### Problem
`pdf-parse` fails on volleyball federation PDFs that use complex table layouts. It extracts text without coordinate awareness, losing column/row structure.

### Recommendation: pdfjs-dist 4.x (HIGH CONFIDENCE)

**Why not docling:**
- docling is Python-only — no npm package exists
- Would require a Python sidecar service on Render.com (second dyno = more cost/complexity)
- Overkill for schedule PDFs that have predictable structure

**Why pdfjs-dist:**
- `pdfjs-dist@4.x` — Mozilla's PDF.js library, runs in Node.js
- Provides coordinate-aware text extraction (`getTextContent()` returns items with `x`, `y`, `width`, `height`)
- Can reconstruct table rows by grouping items by Y-coordinate
- Pure JS — no Python sidecar, no new Render.com services
- Well-maintained, production-grade
- Replaces `pdf-parse` as a drop-in dependency in `server/`

**Integration pattern:**
```js
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';

const doc = await getDocument({ data: pdfBuffer }).promise;
const page = await doc.getPage(1);
const content = await page.getTextContent();
// Group content.items by Math.round(item.transform[5]) (Y coord) to reconstruct rows
```

**Version:** `pdfjs-dist@4.10.38` (latest stable as of research date)

---

## 2. PWA App Store Packaging

### Google Play Store → TWA (Trusted Web Activity)

**Tool:** `@bubblewrap/cli` (Google's official CLI)

- Wraps existing PWA in a Chrome Custom Tab with TWA protocol
- No code changes to React app — purely a packaging step
- Requires: PWA passes Lighthouse PWA audit, HTTPS, valid manifest.json, service worker
- Play Store accepts TWA — Google owns both, actively supports this path
- `assetlinks.json` file required on your domain for verification
- **Confidence: HIGH** — established, well-documented path

**Steps:**
1. `npm install -g @bubblewrap/cli`
2. `bubblewrap init --manifest https://inteamfe.onrender.com/manifest.json`
3. `bubblewrap build` → generates signed `.aab`
4. Upload to Play Console

### Apple App Store → Capacitor 6.x

**Tool:** `@capacitor/core` + `@capacitor/ios`

- Wraps React PWA in a native WKWebView shell
- Requires macOS + Xcode for iOS builds
- Add to existing CRA project without ejecting
- Apple requires binary submission — TWA not accepted on iOS
- **Confidence: HIGH** — Capacitor 6 is mature, widely used with React

**Steps:**
1. `npm install @capacitor/core @capacitor/cli @capacitor/ios`
2. `npx cap init InTeam com.yourclub.inteam`
3. `npm run build && npx cap add ios && npx cap sync`
4. Open in Xcode, sign with Apple Developer account, submit

**What NOT to use:**
- Ionic: Requires Ionic UI components — full UI rewrite not applicable
- React Native: Full rebuild — explicitly out of scope
- PWABuilder (Microsoft): Generates TWA/Capacitor under the hood anyway, less control

### Prerequisites for Both Stores
- PWA must pass Lighthouse PWA audit (score ≥ 90)
- Valid `manifest.json` with icons at all required sizes (48, 72, 96, 144, 192, 512px)
- Service worker with offline support (already present via Workbox)
- HTTPS (already: Render.com)
- Apple Developer account ($99/year), Google Play Developer account ($25 one-time)

---

## 3. Node.js Memory Optimization on Render.com Free Tier

### Diagnosis Tools

```js
// Add to server.js — log memory every 60 seconds
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`[MEM] heapUsed=${Math.round(mem.heapUsed/1024/1024)}MB rss=${Math.round(mem.rss/1024/1024)}MB`);
}, 60000);
```

Also: `GET /api/health` endpoint should return `process.memoryUsage()` for external monitoring.

### Key Fixes

| Fix | Impact | Where |
|-----|--------|-------|
| Add `.lean()` to all read-only Mongoose queries | High — eliminates Mongoose document overhead, up to 60% memory reduction on large result sets | All `find()` calls that don't need save/update |
| Set `NODE_OPTIONS=--max-old-space-size=400` | Medium — caps V8 heap before Render kills process | Render.com environment variable |
| Add `multer` file size limits | Medium — prevents memory spike on large PDF uploads | `server/routes/` file upload handlers |
| Guard `setInterval` jobs with cleanup | Medium — prevents accumulating job references | `server/utils/notificationQueue.js`, `votingDeadlineJob.js` |
| Paginate large list queries | Medium — prevents loading entire collections | Any route returning arrays without limit |
| Remove `morgan` in production or use minimal format | Low | `server/server.js` |

### Render.com Specific
- Free tier: ~512MB RAM
- Set env var: `NODE_OPTIONS=--max-old-space-size=400`
- This gives Node.js 400MB heap budget and triggers GC before OS kills the process
- Enables graceful degradation vs hard crash

### Most Likely Culprits (from CONCERNS.md)
- Large MongoDB queries without `.lean()` — Mongoose hydrates full documents into memory
- PDF processing without streaming — entire file buffered in memory
- NotificationQueue polling without proper job cleanup

---

## Summary Recommendations

| Area | Recommendation | Confidence |
|------|---------------|-----------|
| PDF parsing | Replace `pdf-parse` with `pdfjs-dist@4.x` | HIGH |
| Google Play Store | `@bubblewrap/cli` TWA packaging | HIGH |
| Apple App Store | Capacitor 6.x `@capacitor/ios` | HIGH |
| Memory: quick win | Add `.lean()` to all read queries | HIGH |
| Memory: guard | `NODE_OPTIONS=--max-old-space-size=400` on Render | HIGH |
| Memory: diagnosis | `process.memoryUsage()` logging + `/api/health` endpoint | HIGH |

---

*Research by: gsd-project-researcher*
*Last updated: 2026-02-23*
