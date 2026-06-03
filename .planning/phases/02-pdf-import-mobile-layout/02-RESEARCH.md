# Phase 2: PDF Import + Mobile Layout - Research

**Researched:** 2026-02-24
**Domain:** React/MUI mobile layout + PDF parsing pipeline + event creation UX
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **PDF file selection**: Use native device file picker — standard `<input type="file" accept=".pdf">` approach. Already implemented in `ImportMatchesPDF.js` (lines 439-444). Do NOT change.
- **Loading / parsing feedback**: Show spinner with "Importing PDF..." text while parsing is in progress. Already partially present — verify spinner text is correct.
- **Post-parse result flow**: After successful parse, show a review list of found matches before importing. Coach selects which matches to add, then confirms. NOT auto-imported.
- **Duplicate handling**: If a parsed match already exists as an event — show a warning. Format: "[N] matches already exist — skip them or import anyway?" Coach chooses: skip duplicates or overwrite.

### Claude's Discretion
- PDF import button placement on mobile (FAB, header, drawer menu — pick what fits the existing coach event page layout)
- Layout fix strategy (add `pb: 10` per project conventions, or adjust container structure if needed)
- Scope of layout fix across other coach pages (fix event page; fix others only if same root cause and low risk)
- Error feedback when PDF parsing fails (empty parse result, wrong format, unsupported federation) — show clear inline error message, no crash

### Deferred Ideas (OUT OF SCOPE)
- Camera scan / OCR for printed schedule photos
- Scheduled/recurring import of PDFs
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAYOUT-01 | Coach event page displays correctly on mobile — import PDF button no longer causes layout overflow or navigation overlap | Layout analysis: `Events.js` root `<Box>` missing `pb: 10`; header row with two side-by-side buttons overflows on narrow screens; `CoachLayout.js` provides `mb: isMobile ? 7 : 0` on main box and a `Paper`/`BottomNavigation` fixed at bottom — pages must clear this with `pb: 10` on their root containers |
</phase_requirements>

---

## Summary

Phase 2 has two workstreams: (1) fix the coach event page mobile layout, and (2) complete the PDF import flow with the missing duplicate-detection step. Both workstreams touch existing code — no new pages are needed.

The layout issue is concrete and well-understood. `Events.js` root container `<Box sx={{ mt: 2 }}>` is missing `pb: 10`, which causes the event card grid to render beneath the fixed `BottomNavigation` bar. Additionally, the header row renders two buttons (`Spielplan importieren` + `Neuer Termin`) side by side with `display: flex` and no wrapping — on narrow screens these buttons overflow or force horizontal scroll. The fix is: add `pb: 10` to the root Box, and restructure the header button row to stack vertically on mobile using MUI's responsive `sx` prop or `useMediaQuery`.

The PDF import flow already has a 4-step stepper with file upload, team selection, settings, and confirmation. What is missing per the CONTEXT decisions is: (a) per-match selection checkboxes in the review list (currently the review table shows all matches and imports all of them), and (b) duplicate detection — the `handleCreateEvents` function does not check whether an event for the same date/team already exists before calling `createEvent`. These two gaps must be closed.

**Primary recommendation:** Fix `Events.js` mobile layout first (straightforward, low risk), then add per-match selection and duplicate detection to `ImportMatchesPDF.js` (moderate complexity, isolated to one component).

---

## Standard Stack

### Core (already installed — no new dependencies needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mui/material | ^5.15.14 | Layout, BottomNavigation, Dialog, Checkbox | Already in project; all needed components available |
| @mui/icons-material | ^5.14.3 | Icons for UI | Already in project |
| react | ^18.2.0 | Component rendering | Project standard |
| axios | ^1.4.0 | HTTP requests to API | Already used in ImportMatchesPDF.js |
| pdf-parse | ^1.1.1 (server) | PDF text extraction | Already installed on server |

### No New Dependencies Required
Phase 2 can be completed entirely with the existing stack. pdfjs-dist is NOT needed for this phase — CONTEXT.md and STATE.md both indicate pdf-parse may be sufficient; pdfjs-dist is a v2 consideration only.

**Installation:** None required.

---

## Architecture Patterns

### Existing Layout System (verified by reading CoachLayout.js)
```
CoachLayout.js renders:
  <AppBar position="fixed">           ← fixed top bar (~64px)
  <Box component="main" sx={{
    mt: 8,                            ← clears AppBar height
    mb: isMobile ? 7 : 0             ← clears BottomNavigation on mobile
  }}>
    <Container maxWidth="lg">
      {children}                      ← page content renders here
    </Container>
  </Box>
  {isMobile && (
    <Paper sx={{ position: 'fixed', bottom: 0, ... }}>
      <BottomNavigation />            ← ~56px fixed bar
    </Paper>
  )}
```

The `mb: 7` on the main Box = ~56px. BUT the page content (`children`) is a `Container maxWidth="lg"` wrapper — page components must still add `pb: 10` (≈80px) to their own root element to prevent card content from being clipped by the bottom nav on smaller phones where layout math is tighter.

### Pattern 1: Root Container with Mobile Clearance
**What:** Every coach page root element must include `pb: 10`
**When to use:** All coach pages (project convention from CLAUDE.md)
**Example:**
```javascript
// Events.js — current (broken on mobile)
<Box sx={{ mt: 2 }}>

// Events.js — fixed
<Box sx={{ mt: 2, pb: 10 }}>
```

### Pattern 2: Responsive Button Row
**What:** Header action buttons that stack vertically on mobile, horizontal on desktop
**When to use:** Any page header with 2+ action buttons
**Example:**
```javascript
// Events.js header — current (overflows on mobile)
<Box sx={{ display: 'flex', gap: 2 }}>
  <Button>Spielplan importieren</Button>
  <Button>Neuer Termin</Button>
</Box>

// Events.js header — fixed
<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
  <Button variant="outlined" ... sx={{ minWidth: 0 }}>
    Spielplan importieren
  </Button>
  <Button variant="contained" ...>
    Neuer Termin
  </Button>
</Box>
```

Alternative: On xs screens, show only the `+` FAB for creating events and move "Spielplan importieren" to the drawer — this is at Claude's discretion per CONTEXT.md.

### Pattern 3: Per-Row Checkbox in Review Table (ImportMatchesPDF.js Step 2)
**What:** Add a checkbox column to the matches table so coach selects which matches to import
**When to use:** Step 2 of the PDF stepper (team selection / preview step)
**Example:**
```javascript
// Add state
const [selectedMatches, setSelectedMatches] = useState([]);

// After filteredMatches is computed, initialize selection
useEffect(() => {
  setSelectedMatches(filteredMatches.map((_, idx) => idx)); // all selected by default
}, [filteredMatches]);

// In the TableHead row, add a "Auswählen" column
// In each TableRow, add: <TableCell><Checkbox checked={selectedMatches.includes(index)} .../></TableCell>
```

### Pattern 4: Duplicate Detection Before Event Creation
**What:** Before calling `createEvent`, check if an event with the same team + same date already exists
**When to use:** In `handleCreateEvents` in `ImportMatchesPDF.js`
**Approach:** Call `GET /api/events` (already cached by React Query if using hooks, or use the EventContext `events` array already loaded) and compare each `matchDay.datum` against existing events' `startTime` dates for the same team.
**Example:**
```javascript
// In handleCreateEvents, before the for-loop:
const existingForTeam = events.filter(e =>
  e.team?._id === selectedTeamId || e.teams?.some(t => t._id === selectedTeamId)
);

const duplicates = filteredMatches.filter(matchDay => {
  const [day, month, year] = matchDay.datum.split('.');
  return existingForTeam.some(e => {
    const d = new Date(e.startTime);
    return d.getFullYear() === +year &&
           d.getMonth() + 1 === +month &&
           d.getDate() === +day;
  });
});

if (duplicates.length > 0) {
  // Show warning dialog — coach picks skip or overwrite
  setDuplicateWarning({ duplicates, action: null });
  return; // pause until coach decides
}
// Then proceed with creation
```

### Pattern 5: Duplicate Warning Dialog (MUI Dialog)
**What:** Modal dialog listing duplicate count with two action buttons
**When to use:** When `duplicates.length > 0` in handleCreateEvents
**Example:**
```javascript
<Dialog open={Boolean(duplicateWarning)} onClose={() => setDuplicateWarning(null)}>
  <DialogTitle>Doppelte Termine gefunden</DialogTitle>
  <DialogContent>
    <Typography>
      {duplicateWarning?.duplicates.length} Spiele existieren bereits für dieses Team.
      Möchten Sie diese überspringen oder trotzdem importieren?
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleSkipDuplicates}>Überspringen</Button>
    <Button onClick={handleImportAll} color="warning">Trotzdem importieren</Button>
  </DialogActions>
</Dialog>
```

### Anti-Patterns to Avoid
- **Creating all matches unconditionally**: `handleCreateEvents` currently loops through ALL `filteredMatches` without checking for duplicates — must add duplicate check first.
- **Importing the entire `events` array from EventContext for duplicate check**: EventContext loads ALL events including past ones; better to filter server-side or use `useEvents` hook result already available in the component.
- **Adding a full new page for match review**: CONTEXT.md explicitly says "not a full new page" — use the existing stepper's step 2 preview table, extended with checkboxes.
- **Using pdfjs-dist in this phase**: STATE.md says test current pdf-parse fix first; pdfjs-dist is v2 scope. Do not add it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duplicate match detection | Custom date comparison utility | Inline comparison in handleCreateEvents using JS Date | Complexity is low enough for inline; no external lib needed |
| Warning dialog | Custom modal | MUI `Dialog` + `DialogActions` | Already used for delete confirmation in Events.js — exact same pattern |
| Mobile responsive buttons | CSS media queries | MUI `sx` prop with `{ xs: 'column', sm: 'row' }` flexDirection | Already the pattern used elsewhere in the project |
| PDF text extraction | Custom binary reader | `pdf-parse` (already installed) | Handles PDF spec complexity; proven in existing route |

**Key insight:** Everything needed for this phase already exists in the project. The work is configuration and wiring, not building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Missing `pb: 10` Causes Hidden Content on Small Phones
**What goes wrong:** Event cards or the last match in the import table are rendered behind the BottomNavigation bar.
**Why it happens:** `CoachLayout.js` adds `mb: isMobile ? 7 : 0` on the main box which is ~56px, but some phones have safe-area insets (notch, home bar) that push the BottomNavigation slightly higher, exhausting the margin.
**How to avoid:** Always add `pb: 10` (80px) to page root containers — this is the project convention in CLAUDE.md.
**Warning signs:** Content visible on desktop missing on mobile, or bottom card partially obscured.

### Pitfall 2: Header Button Overflow with Two Buttons
**What goes wrong:** On screens < 360px wide the "Spielplan importieren" and "Neuer Termin" buttons (both with icons and full German labels) push the header beyond viewport width, causing horizontal scroll.
**Why it happens:** `<Box sx={{ display: 'flex', gap: 2 }}>` has no `flexWrap` and no responsive width constraints.
**How to avoid:** Add `flexWrap: 'wrap'` or use `sx={{ flexDirection: { xs: 'column', sm: 'row' } }}` on the button container. Alternatively, on xs screens show only an icon button (no label) for the import action.
**Warning signs:** Header row scrolls horizontally; buttons clip against page edge.

### Pitfall 3: Duplicate Check Uses Wrong Team ID Comparison
**What goes wrong:** Duplicate detection misses events because `event.team` is populated as an object with `._id` but the code compares against a string `selectedTeamId`.
**Why it happens:** Events are populated via `.populate('team', 'name type')` so `event.team` is an object, not a plain ID string.
**How to avoid:** Always compare `event.team?._id === selectedTeamId` (not `event.team === selectedTeamId`). This matches the existing pattern in Events.js team filtering.
**Warning signs:** Duplicate detection always shows 0 duplicates even when events clearly exist.

### Pitfall 4: Debug Console.log Statements Left in Production
**What goes wrong:** Server logs flood with PDF parsing debug output on every import.
**Why it happens:** STATE.md explicitly flags: "debug logging in eventRoutes.js + ImportMatchesPDF.js must be removed before release."
**How to avoid:** Remove all `console.log` statements added for PDF debugging (identified in eventRoutes.js lines 317-321, 394, 436-449 and ImportMatchesPDF.js lines 221-236, 254-258) as part of this phase.
**Warning signs:** Server logs contain "=== PDF PARSING DEBUG ===" lines in production.

### Pitfall 5: Match Selection State Not Initialized When Team Changes
**What goes wrong:** Coach selects team A (sees matches, all selected), then changes to team B — selected matches still reflect team A's indices.
**Why it happens:** The `selectedMatches` state is not reset when `filteredMatches` recomputes.
**How to avoid:** Reset `selectedMatches` inside the `useEffect` that watches `filteredMatches`.
**Warning signs:** After switching teams, match count in confirmation step doesn't match visible selected checkboxes.

---

## Code Examples

Verified patterns from reading the codebase:

### Events.js: Root Box Fix (LAYOUT-01)
```javascript
// File: client/src/pages/coach/Events.js
// Change line 262 from:
<Box sx={{ mt: 2 }}>
// To:
<Box sx={{ mt: 2, pb: 10 }}>
```

### Events.js: Header Button Row — Mobile Responsive Fix
```javascript
// File: client/src/pages/coach/Events.js — lines 263-288
// Current:
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
  <Typography variant="h4" component="h1">Termine</Typography>
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Button variant="outlined" ... >Spielplan importieren</Button>
    <Button variant="contained" ... >Neuer Termin</Button>
  </Box>
</Box>

// Fixed — buttons wrap on small screens:
<Box sx={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: { xs: 'flex-start', sm: 'center' },
  flexDirection: { xs: 'column', sm: 'row' },
  gap: 1,
  mb: 3
}}>
  <Typography variant="h4" component="h1">Termine</Typography>
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Button variant="outlined" color="primary" startIcon={<UploadFile />}
      component={RouterLink} to="/coach/events/import-pdf">
      Spielplan importieren
    </Button>
    <Button variant="contained" color="primary" startIcon={<Add />}
      component={RouterLink} to="/coach/events/create">
      Neuer Termin
    </Button>
  </Box>
</Box>
```

### ImportMatchesPDF.js: Add Match Selection Checkboxes to Step 2 Table
```javascript
// State to add near top of component:
const [selectedMatchIndices, setSelectedMatchIndices] = useState([]);

// Reset when filtered matches change:
useEffect(() => {
  setSelectedMatchIndices(filteredMatches.map((_, idx) => idx));
}, [filteredMatches]);

// In TableHead — add first column:
<TableCell padding="checkbox">
  <Checkbox
    checked={selectedMatchIndices.length === filteredMatches.length}
    indeterminate={selectedMatchIndices.length > 0 && selectedMatchIndices.length < filteredMatches.length}
    onChange={(e) => {
      if (e.target.checked) setSelectedMatchIndices(filteredMatches.map((_, i) => i));
      else setSelectedMatchIndices([]);
    }}
  />
</TableCell>

// In each TableRow:
<TableCell padding="checkbox">
  <Checkbox
    checked={selectedMatchIndices.includes(index)}
    onChange={(e) => {
      if (e.target.checked) setSelectedMatchIndices(prev => [...prev, index]);
      else setSelectedMatchIndices(prev => prev.filter(i => i !== index));
    }}
  />
</TableCell>
```

### ImportMatchesPDF.js: Duplicate Detection in handleCreateEvents
```javascript
// Import events from EventContext (already imported at line 67):
const { createEvent, loading: eventLoading, events } = useContext(EventContext);

// In handleCreateEvents, before the for-loop:
const matchesToCreate = filteredMatches.filter((_, idx) => selectedMatchIndices.includes(idx));

const existingForTeam = (events || []).filter(e =>
  e.team?._id === selectedTeamId ||
  (e.teams || []).some(t => t._id === selectedTeamId)
);

const duplicates = matchesToCreate.filter(matchDay => {
  const [day, month, year] = matchDay.datum.split('.');
  return existingForTeam.some(e => {
    const d = new Date(e.startTime);
    return d.getFullYear() === parseInt(year) &&
           (d.getMonth() + 1) === parseInt(month) &&
           d.getDate() === parseInt(day);
  });
});

if (duplicates.length > 0 && duplicateAction === null) {
  setDuplicateWarning({ duplicates, matchesToCreate });
  return;
}

// Then loop over matchesToCreate (not filteredMatches):
const finalMatches = duplicateAction === 'skip'
  ? matchesToCreate.filter(m => !duplicates.includes(m))
  : matchesToCreate;
```

### ImportMatchesPDF.js: Duplicate Warning Dialog
```javascript
// State to add:
const [duplicateWarning, setDuplicateWarning] = useState(null);
const [duplicateAction, setDuplicateAction] = useState(null); // 'skip' | 'overwrite' | null

// Dialog JSX — add before closing </Box> in return:
<Dialog open={Boolean(duplicateWarning)} onClose={() => setDuplicateWarning(null)}>
  <DialogTitle>Doppelte Termine gefunden</DialogTitle>
  <DialogContent>
    <Typography>
      {duplicateWarning?.duplicates.length} Spiele existieren bereits für dieses Team.
      Möchten Sie diese Spiele überspringen oder trotzdem importieren?
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => {
      setDuplicateAction('skip');
      setDuplicateWarning(null);
    }}>
      Überspringen
    </Button>
    <Button color="warning" onClick={() => {
      setDuplicateAction('overwrite');
      setDuplicateWarning(null);
    }}>
      Trotzdem importieren
    </Button>
  </DialogActions>
</Dialog>
```

Note: `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` are already imported in `ImportMatchesPDF.js` — no new imports needed (they're in `@mui/material`). Confirm they're in the imports list before submitting the task.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf-parse for text extraction | pdf-parse with improved whole-PDF pattern matching | Phase 1 (01-03) | Multi-line row support + debug logging added; debug logging must be removed in Phase 2 |
| Auto-import all parsed matches | Coach-selectable review + confirmation | Phase 2 (this phase) | Prevents accidental bulk import |
| No duplicate detection | Duplicate warning with skip/overwrite choice | Phase 2 (this phase) | Prevents duplicate events per CONTEXT.md decisions |

**Deprecated/outdated:**
- Debug logging (`console.log('=== PDF PARSING DEBUG ===')` etc.) in `eventRoutes.js` and `ImportMatchesPDF.js`: flagged in STATE.md as must-remove before release. Phase 2 should remove these.

---

## Open Questions

1. **EventContext vs useEvents hook for duplicate check**
   - What we know: `ImportMatchesPDF.js` uses `EventContext` (line 67) to get `createEvent` and `events`. `useEvents` (React Query hook) also exists in `useEvents.js`. EventContext may have stale data.
   - What's unclear: Whether `EventContext.events` is always populated when the import page mounts, or whether it needs a fresh fetch.
   - Recommendation: Use EventContext `events` array since it's already fetched in `CoachLayout.js` (`fetchEvents()` in useEffect). If that's insufficient, call `fetchEvents()` on mount of ImportMatchesPDF.js (already done in other effects there).

2. **Should debug console.log removal be a separate task or bundled?**
   - What we know: STATE.md says it must be removed before release. It's in `eventRoutes.js` (server) and `ImportMatchesPDF.js` (client).
   - What's unclear: How many console.log lines total — approximately 15-20 based on code review.
   - Recommendation: Make it an explicit task in the plan (Task 0 or Task 1), not an afterthought.

3. **Does the existing `createEvent` in EventContext handle the `teams` array field correctly?**
   - What we know: `ImportMatchesPDF.js` passes `{ teams: [selectedTeamId], organizingTeam: selectedTeamId, organizingTeams: [selectedTeamId] }` — all three variants are set.
   - What's unclear: Whether duplicate detection should check `event.team`, `event.teams`, or both. Current events may have only `event.team`.
   - Recommendation: Check both `event.team?._id` and `event.teams` array to be safe (shown in code example above).

---

## Sources

### Primary (HIGH confidence)
- **`client/src/pages/coach/Events.js`** (read in full) — identifies exact missing `pb: 10` and button overflow issue
- **`client/src/components/layout/CoachLayout.js`** (read in full) — documents BottomNavigation height, `mb: isMobile ? 7 : 0` on main box, exact layout structure
- **`client/src/pages/coach/ImportMatchesPDF.js`** (read in full) — documents existing 4-step stepper, missing duplicate check, missing per-match selection
- **`server/routes/eventRoutes.js`** (read lines 282-472) — documents pdf-parse usage, debug logging that must be removed
- **`server/package.json`** — confirms pdf-parse@1.1.1 installed, pdfjs-dist NOT installed
- **`client/package.json`** — confirms @mui/material@5.15.14, all needed MUI components available
- **`.planning/phases/02-pdf-import-mobile-layout/02-CONTEXT.md`** — locked decisions constraining implementation
- **`.planning/STATE.md`** — confirms debug logging must be removed; pdf-parse fix is unverified against real PDFs
- **`CLAUDE.md`** — confirms `pb: 10` as mandatory project convention for all coach pages

### Secondary (MEDIUM confidence)
- MUI BottomNavigation component height is ~56px (standard MUI spec); `mb: 7` in CoachLayout = 7 * 8px = 56px; `pb: 10` = 80px provides additional clearance for phones with home bars

### Tertiary (LOW confidence — flag for validation)
- Whether volleyball federation PDFs in Germany all follow a consistent enough format for the current pdf-parse patterns to work — STATE.md explicitly says "unverified against 2-3 real PDFs." This is a pre-Phase 2 blocker noted in STATE.md but is out of scope for the layout task.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by reading package.json files directly
- Architecture / layout patterns: HIGH — read CoachLayout.js and Events.js in full; layout system fully documented
- PDF parsing: MEDIUM — pdf-parse is installed and route exists; whether it parses real PDFs correctly is flagged as unverified in STATE.md
- Pitfalls: HIGH — identified from direct code reading, not speculation
- Duplicate detection approach: MEDIUM — EventContext.events freshness in ImportMatchesPDF.js context not fully verified

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable MUI + React stack, 30-day window is safe)
