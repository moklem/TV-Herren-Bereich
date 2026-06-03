# Phase 3: Car Pool Organizer - Research

**Researched:** 2026-02-26
**Domain:** Mongoose embedded sub-document schema extension, Express REST routes, MUI v5 inline UI, web-push personalized notifications
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary**
Attending players can self-register as driver or passenger for match events. On registration, passengers are auto-assigned to a driver. Passengers can manually re-pick a driver before finalization. Coach views the pool via a two-column overview, adjusts assignments, and finalizes. After finalization, players see their own assignment. Car pool controls only appear on match/game events — not training events. Creating/editing events and attendance tracking are separate features.

**Player registration flow**
- Car pool section is inline on the event detail page (collapsible/section — not a modal or separate route)
- Player selects role via radio buttons: "Driver" expands a seat count field; "Passenger" registers without extra fields; no "Not going" option in car pool (attendance is separate)
- Players can update or withdraw their registration freely until the coach finalizes; server rejects changes after finalization
- Before finalization, players see the full list of who registered and as what — all drivers (with names) and all passengers (by name) are visible to everyone

**Auto-assignment**
- When a passenger registers, the system immediately auto-assigns them to a driver with available seats (first-fit)
- A passenger can manually re-pick any driver with remaining capacity at any time before finalization
- Re-picking is silent — no notifications to drivers or coach; driver's passenger list simply updates

**Driver registration fields**
- Seat count: required
- Free-text note (e.g. meeting point, departure time, instructions): optional — driver can enter anything
- Coach can override/edit the driver's note during assignment management

**Coach assignment UI**
- Coach accesses car pool management as a tab or section on the event detail page (not a separate route)
- Layout: two-column — drivers on the left (each showing name, seat count, current passengers), unassigned passengers on the right
- Assignment action: tap an unassigned passenger → picker appears with available drivers and remaining seats → coach selects one
- Coach can also override passenger self-assignments (move passengers between drivers)
- Finalization with unassigned passengers: allowed — coach sees a warning ("X passengers are unassigned") but can proceed

**Finalization & notifications**
- Coach can re-open after finalizing (players become editable again), make changes, and re-finalize; re-finalization sends a new notification
- Players are blocked from changing registration only after finalization (no automatic cutoff by time)
- On finalization, all attending players (drivers and passengers) receive a push notification
- Notification content is personalized:
  - Driver: "Car pool finalized for [Event] — you are driving. Check your passengers."
  - Passenger: "Car pool finalized for [Event] — you are riding with [Driver Name]."
  - Unassigned passenger: "Car pool finalized for [Event] — you have no car assigned yet."

**Post-finalization player views**
- Passenger sees: driver name + driver's free-text note
- Driver sees: list of passenger names

### Claude's Discretion
- Exact auto-assignment algorithm (first-fit is the intent — assign to driver with most remaining capacity, or similar simple heuristic)
- How to handle the edge case where no drivers have remaining seats when a new passenger registers (show a "no seats available" state)
- Loading/skeleton states
- Empty state when no one has registered yet
- Exact visual styling of the driver card and passenger list

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CARPOOL-01 | Attending player can register as driver for a match event, specifying available seat count (1–9) | carPool.drivers sub-doc with seats field; POST /api/events/:id/carpool/register route |
| CARPOOL-02 | Attending player can register as passenger requesting a ride | carPool.passengers sub-doc; same register route with role:"passenger" |
| CARPOOL-03 | Player can withdraw or update their car pool registration at any time before finalization | DELETE or PATCH /api/events/:id/carpool/register; server checks carPool.finalized flag |
| CARPOOL-04 | Driver can optionally specify a meeting point and departure time | Free-text note field on driver sub-doc; rendered via driver card |
| CARPOOL-05 | Coach sees overview of all drivers (with seat counts), all passengers, and unassigned attending players | GET /api/events/:id returns populated carPool; coach two-column UI section on EventDetail |
| CARPOOL-06 | Coach can manually assign passengers to specific drivers | PATCH /api/events/:id/carpool/assign route; coach UI picker |
| CARPOOL-07 | Coach can finalize car pool assignments — finalization is server-enforced | POST /api/events/:id/carpool/finalize; server sets carPool.finalized = true and rejects future player writes |
| CARPOOL-08 | Players receive push notification when coach finalizes assignments | Personalized payloads built per-player and sent via existing web-push/sendNotificationToMany pattern |
| CARPOOL-09 | Player sees their own assignment — driver sees passengers, passenger sees driver + note | GET /api/events/:id includes carPool; player EventDetail renders based on own userId |
| CARPOOL-10 | Car pool feature only available on match/game events (not training events) | Conditional render: show carPool section only when event.type === 'Game'; server routes also guard this |
</phase_requirements>

---

## Summary

Phase 3 extends the existing Event document with an embedded `carPool` sub-document, adds six new Express routes under `/api/events/:id/carpool/*`, and adds two new UI sections — one in the player EventDetail and one in the coach EventDetail — while re-using the already-configured `web-push` + `PushSubscription` notification pipeline.

No new npm packages are required. The entire feature lives inside the existing full-stack: Mongoose 7 on the backend, React 18 + MUI v5 on the frontend, and the existing `web-push` library for personalized push notifications. The prior decision (STATE.md, [Roadmap]) to embed carPool as an Event sub-document is confirmed correct: carPool has no standalone meaning, and `.select('-carPool')` is already applied on the event list endpoint to prevent payload bloat.

The main implementation risk is correctly enforcing the `finalized` gate in all write routes (player register/update/withdraw and coach assign). The auto-assignment algorithm is intentionally simple (first-fit by available capacity), so no library is needed. Notification personalization requires iterating over carPool participants one at a time to construct individual payloads, which the existing `sendNotification` helper handles per-subscription.

**Primary recommendation:** Embed carPool in the Event schema, build six focused Express sub-routes, add inline UI sections to both EventDetail pages, and send personalized push notifications on finalization using the existing `web-push` pipeline.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mongoose | ^7.5.0 | Event sub-document schema, atomic `$push`/`$set`/`$pull` ops | Already the project ORM |
| express | ^4.18.2 | New carpool sub-routes on existing router | Already the project HTTP framework |
| web-push | ^3.6.7 | Send personalized push notifications on finalize | Already installed and configured with VAPID keys |
| @mui/material | ^5.15.14 | Radio group, TextField, Grid, Card, Chip — all used in new UI sections | Already the project UI library |
| react | ^18.2.0 | Player + coach EventDetail inline sections | Already the project framework |
| axios | ^1.4.0 | Frontend API calls to carpool routes | Already used in all other event calls |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mui/icons-material | ^5.14.3 | DirectionsCar, Person, Check icons for the carpool section | Carpool driver/passenger iconography |
| date-fns | ^2.25.0 | Not needed for carpool itself, already used for event date formatting | Already in use |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Embedded carPool sub-doc | Separate CarPool collection | Separate collection adds query joins, network round-trips, and orphan-cleanup complexity — no benefit for data scoped to one event |
| Simple first-fit algorithm | Optimization library (e.g. Hungarian algorithm) | Over-engineering: club-level car pools have <20 participants, first-fit by remaining capacity is sufficient |
| Personalized loop over participants | One broadcast push | One broadcast push cannot carry personalized content (driver name differs per passenger) |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

New files follow existing conventions:

```
server/
├── routes/
│   └── eventRoutes.js        # ADD: 6 carpool sub-routes appended at bottom
├── models/
│   └── Event.js              # ADD: carPool sub-document schema inline

client/src/
├── pages/
│   ├── coach/
│   │   └── EventDetail.js    # ADD: CarPoolCoachSection component (inline or extracted)
│   └── player/
│       └── EventDetail.js    # ADD: CarPoolPlayerSection component (inline or extracted)
```

No new route files needed — all carpool routes attach to the existing `eventRoutes.js` router.

### Pattern 1: Embedded carPool Sub-Document Schema

**What:** Add `carPool` as an embedded sub-document to the existing EventSchema. This was the confirmed roadmap decision.
**When to use:** When the sub-document has no standalone meaning and is always fetched with the parent.

```javascript
// server/models/Event.js — add before closing schema definition

const carPoolDriverSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seats: { type: Number, required: true, min: 1, max: 9 },
  note: { type: String, default: '' },  // free-text: meeting point, departure time, etc.
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: false });

const carPoolSchema = new mongoose.Schema({
  finalized: { type: Boolean, default: false },
  drivers: [carPoolDriverSchema],
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]  // all registered passengers
}, { _id: false });

// In EventSchema definition:
carPool: { type: carPoolSchema, default: () => ({}) }
```

**Key design point:** `carPool.passengers` stores ALL registered passengers (for the list view). A passenger's assigned driver is determined by checking which driver's `passengers` array contains that userId. This avoids duplicating assignment state and keeps a single source of truth.

### Pattern 2: Finalization Guard in Route Middleware

**What:** Check `event.carPool.finalized` before allowing player writes.
**When to use:** On every player-facing carpool write route.

```javascript
// Reusable guard — inline in each player route handler
const event = await Event.findById(req.params.id);
if (!event) return res.status(404).json({ message: 'Event not found' });
if (event.carPool?.finalized) {
  return res.status(409).json({ message: 'Car pool is finalized — no further changes allowed' });
}
// Only match/game events
if (event.type !== 'Game') {
  return res.status(400).json({ message: 'Car pool is only available for match events' });
}
// Only attending players can register
if (!event.attendingPlayers.some(p => p.toString() === req.user._id.toString())) {
  return res.status(403).json({ message: 'Only attending players can register for car pool' });
}
```

### Pattern 3: Auto-Assignment Algorithm (First-Fit by Remaining Capacity)

**What:** When a passenger registers, assign to the driver with the most remaining capacity.
**When to use:** On `POST /api/events/:id/carpool/register` when role === 'passenger'.

```javascript
// server/routes/eventRoutes.js — inside the passenger register handler
const autoAssign = (drivers, passengerId) => {
  // Sort by remaining capacity descending (most seats first)
  const available = drivers
    .filter(d => d.seats - d.passengers.length > 0)
    .sort((a, b) => (b.seats - b.passengers.length) - (a.seats - a.passengers.length));

  if (available.length === 0) return null; // No seats available

  // Add passenger to driver with most remaining seats
  available[0].passengers.push(passengerId);
  return available[0].player; // Return assigned driver ID
};
```

**Edge case — no seats available:** Return the passenger as registered but unassigned (present in `carPool.passengers` but in no driver's `passengers` array). The player UI shows "Kein Fahrer verfügbar — du stehst auf der Warteliste."

### Pattern 4: Personalized Push Notifications on Finalization

**What:** Loop over all carPool participants, build individual payload per role, send using existing `sendNotification` helper.
**When to use:** In the `POST /api/events/:id/carpool/finalize` route handler.

```javascript
// server/routes/eventRoutes.js — finalization notification logic
const PushSubscription = require('../models/PushSubscription');
const { sendNotification } = require('../utils/webpush');

// After setting event.carPool.finalized = true and saving:
const populatedEvent = await Event.findById(event._id)
  .populate('carPool.drivers.player', 'name')
  .populate('carPool.drivers.passengers', 'name')
  .populate('carPool.passengers', 'name');

for (const driver of populatedEvent.carPool.drivers) {
  const sub = await PushSubscription.findOne({ user: driver.player._id });
  if (sub) {
    await sendNotification(sub.subscription, {
      title: `Fahrgemeinschaft: ${populatedEvent.title}`,
      body: `Fahrgemeinschaft abgeschlossen — du fährst. Prüfe deine Mitfahrer.`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: `carpool-finalized-${populatedEvent._id}`,
      data: { url: `/player/events/${populatedEvent._id}` }
    });
  }
}

for (const passengerId of populatedEvent.carPool.passengers) {
  // Find which driver has this passenger
  const assignedDriver = populatedEvent.carPool.drivers.find(d =>
    d.passengers.some(p => p._id.toString() === passengerId._id.toString())
  );

  const sub = await PushSubscription.findOne({ user: passengerId._id });
  if (!sub) continue;

  const body = assignedDriver
    ? `Fahrgemeinschaft abgeschlossen — du fährst mit ${assignedDriver.player.name}.`
    : `Fahrgemeinschaft abgeschlossen — du hast noch kein Auto zugeteilt.`;

  await sendNotification(sub.subscription, {
    title: `Fahrgemeinschaft: ${populatedEvent.title}`,
    body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: `carpool-finalized-${populatedEvent._id}`,
    data: { url: `/player/events/${populatedEvent._id}` }
  });
}
```

### Pattern 5: Event Type Guard in Frontend (CARPOOL-10)

**What:** Only render the carPool section when the event is a Game/match.
**When to use:** In both player and coach EventDetail JSX.

```jsx
// Show carPool section only for match events
{event.type === 'Game' && (
  <CarPoolSection event={event} user={user} onUpdate={handleCarPoolUpdate} />
)}
```

The event model uses `type: 'Game'` for match events (confirmed from Event.js enum: `['Training', 'Game']`).

### Pattern 6: GET /api/events/:id — carPool Population

**What:** The single-event GET route must populate carPool player references for both coach and player views.
**When to use:** The existing `GET /:id` route currently does NOT include carPool in `.select('-carPool')` exclusion (`.select('-carPool')` is ONLY on the list endpoint — confirmed from eventRoutes.js line 428–429, 481). The single-event GET at line 496 does NOT exclude carPool.

However, `carPool.drivers.player` and `carPool.drivers.passengers` need explicit `.populate()` calls to resolve names.

```javascript
// ADD to existing GET /:id handler populate chain:
.populate('carPool.drivers.player', 'name')
.populate({
  path: 'carPool.drivers.passengers',
  select: 'name'
})
.populate('carPool.passengers', 'name')
```

### Anti-Patterns to Avoid

- **Storing assignment state twice:** Do NOT store `assignedDriver` on the passenger record AND in `driver.passengers[]`. The driver's passengers array is the single source of truth.
- **Separate CarPool collection:** Confirmed out of scope (STATE.md decision). CarPool has no lifecycle independent of its event.
- **Blocking finalization when passengers are unassigned:** Confirmed out of scope — coach must be warned but allowed to proceed.
- **Using broadcast push:** One broadcast payload cannot carry personalized text (driver name). Loop over participants individually.
- **Using `.lean()` before notification send on finalize:** Lean objects lack Mongoose ObjectId `.toString()` behavior reliably. Populate normally and save, then use populated document for notifications.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Push notification delivery | Custom HTTP to push service | Existing `sendNotification` from `server/utils/webpush.js` | VAPID auth, error handling, and 410 cleanup already implemented |
| Seat capacity validation | Custom min/max check | Mongoose schema `min: 1, max: 9` on seats field | Schema-level enforcement is atomic and cannot be bypassed |
| Role-based auth check | Custom middleware | Existing `protect`, `coach`, `player` middleware from `authMiddleware.js` | Already handles JWT, role extraction, and 401/403 responses |
| Optimistic UI update after carpool action | Manual state merge | Call `fetchEvent(id)` after mutation (pattern already used in player EventDetail for accept/decline) | Existing EventContext.fetchEvent updates local state correctly |

**Key insight:** This feature's complexity is orchestration, not infrastructure. Every underlying primitive (auth, push, Mongoose, MUI) already exists in this codebase. The work is wiring them together correctly.

---

## Common Pitfalls

### Pitfall 1: Forgetting to exclude carPool from the event LIST endpoint

**What goes wrong:** If `.select('-carPool')` is removed or forgotten on the list query, every event in the list will include the full carPool sub-document, causing payload bloat (Phase 1 added this exclusion proactively via PERF-07).
**Why it happens:** Developers add populate for the detail page and accidentally change the list query.
**How to avoid:** Only add carPool population to `GET /:id` (single event). The list endpoint at line 428 and 481 already has `.select('-carPool')` — do NOT touch those.
**Warning signs:** Response size on `/api/events` increases noticeably.

### Pitfall 2: `.lean()` breaking the carPool pre-save hook

**What goes wrong:** The EventSchema has a `post('save')` hook that calls `trainingPoolAutoInvite`. Adding carPool mutations via `Event.findByIdAndUpdate()` with `{ new: true }` bypasses this hook — which is fine for carpool. But if `.lean()` is used after populate for notifications, ObjectId comparison with `.toString()` may behave unexpectedly on nested populated objects.
**Why it happens:** `.lean()` was added to all list queries in Phase 1 for performance. Developers habitually add it everywhere.
**How to avoid:** Do NOT use `.lean()` in the carpool finalize route where you need to compare populated ObjectIds across nested arrays. Use normal Mongoose documents for the notification loop.

### Pitfall 3: Player can register for car pool when not attending

**What goes wrong:** A player who clicked "unsure" or hasn't responded tries to register as driver or passenger.
**Why it happens:** The frontend might show the carPool section to all players on a Game event without checking attendance.
**How to avoid:** Server-side: check `event.attendingPlayers.includes(req.user._id)` before allowing registration. Frontend: conditionally show car pool registration UI only when `userStatus === 'attending'`.

### Pitfall 4: Race condition on auto-assignment with concurrent passenger registrations

**What goes wrong:** Two passengers register simultaneously; both get auto-assigned to the last driver with one seat. MongoDB `findById` + `save()` pattern is not atomic for array mutations.
**Why it happens:** The existing pattern for attendance (accept/decline) uses the same non-atomic pattern and has never caused issues at club-scale user counts.
**How to avoid:** Use `Event.findOneAndUpdate()` with `$push` and `$set` atomically where possible for the passenger array, or accept the race condition given club-scale usage (< 20 concurrent users). This is acceptable per the project's Render.com free-tier context.

### Pitfall 5: Re-open after finalization must clear the finalized state server-side

**What goes wrong:** Coach hits "Re-open" — only the frontend clears the lock but the server still returns `409` on player registration attempts.
**Why it happens:** The finalized flag is server-side; re-opening requires an explicit `PATCH /api/events/:id/carpool/reopen` route that sets `carPool.finalized = false`.
**How to avoid:** Implement a dedicated re-open route. Do NOT let the frontend optimistically update the finalization flag — always re-fetch from server after re-open.

### Pitfall 6: Missing pb: 10 on new UI sections

**What goes wrong:** Mobile navigation overlaps the bottom of the carPool section.
**Why it happens:** CLAUDE.md mandates `pb: 10` on all coach page root containers. The new car pool section is added inside existing EventDetail pages that already have this padding — but if a new wrapper Box is introduced without it, the inner content may overflow.
**How to avoid:** The existing outer `<Box sx={{ pb: isMobile ? 8 : 2 }}>` in coach EventDetail (line 581) already provides clearance. Do not add a new root container — add carpool as a section inside the existing layout.

---

## Code Examples

Verified patterns from the existing codebase:

### Existing player invitation accept pattern (model for car pool player action)

```javascript
// server/routes/eventRoutes.js line 894 — player accept pattern
router.post('/:id/accept', protect, player, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.acceptInvitation(req.user._id);
    await event.save();
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Carpool register route follows the same shape
```

### Existing notification loop pattern (model for carpool finalization)

```javascript
// server/utils/notificationQueue.js — sendCustomEventReminder pattern
// Fetches subscriptions for a list of userIds, loops, calls sendNotification per sub
const subscriptions = await PushSubscription.find({ user: { $in: playerIds } });
for (const sub of subscriptions) {
  // Build payload per sub if needed
  await sendNotification(sub.subscription, payload);
}
```

### Existing event type check pattern (from coach EventDetail.js line 617)

```jsx
// Confirmed enum values: 'Training' | 'Game'
<Chip
  label={event.type === 'Training' ? 'Training' : 'Spiel'}
  color={event.type === 'Training' ? 'primary' : 'secondary'}
/>

// Carpool gate: show only for 'Game'
{event.type === 'Game' && <CarPoolSection ... />}
```

### Existing sendNotificationToMany signature

```javascript
// server/utils/webpush.js — use sendNotification for personalized, sendNotificationToMany for broadcast
const sendNotificationToMany = async (subscriptions, payload) => {
  // Takes array of PushSubscription documents, one payload for all
  // For personalized carpool: call sendNotification in a loop instead
};
const sendNotification = async (subscription, payload) => {
  // subscription is the raw push subscription object (sub.subscription field)
  // payload is a plain object — will be JSON.stringified internally
};
```

### MUI RadioGroup pattern for driver/passenger role selection

```jsx
// Standard MUI v5 RadioGroup — no new imports needed
import { Radio, RadioGroup, FormControl, FormLabel, FormControlLabel } from '@mui/material';

<FormControl>
  <FormLabel>Fahrgemeinschaft</FormLabel>
  <RadioGroup value={role} onChange={(e) => setRole(e.target.value)} row>
    <FormControlLabel value="driver" control={<Radio />} label="Fahrer" />
    <FormControlLabel value="passenger" control={<Radio />} label="Mitfahrer" />
  </RadioGroup>
</FormControl>

{role === 'driver' && (
  <TextField
    label="Freie Plätze"
    type="number"
    inputProps={{ min: 1, max: 9 }}
    value={seats}
    onChange={(e) => setSeats(e.target.value)}
    required
  />
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate CarPool collection | Embedded Event.carPool sub-document | Roadmap decision (2026-02-23) | No cross-collection joins; event deletion cascades cleanly |
| Broadcast push notification | Per-player personalized push | Phase 3 design | Each player gets their specific driver name or "no car" message |

**Confirmed architectural decisions from STATE.md:**
- `Car pool data as embedded Event.carPool sub-document — scoped to event, no standalone meaning`
- `.select('-carPool')` added proactively before Phase 3 — already in production on list endpoint

---

## New API Routes

Six routes to add to `server/routes/eventRoutes.js`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/events/:id/carpool/register` | protect + player | Register as driver or passenger (body: `{ role, seats?, note? }`) |
| DELETE | `/api/events/:id/carpool/register` | protect + player | Withdraw car pool registration |
| PATCH | `/api/events/:id/carpool/pick-driver` | protect + player | Passenger manually re-picks driver (body: `{ driverId }`) |
| PATCH | `/api/events/:id/carpool/assign` | protect + coach | Coach assigns passenger to driver (body: `{ passengerId, driverId }`) |
| POST | `/api/events/:id/carpool/finalize` | protect + coach | Finalize assignments; sends personalized push notifications |
| POST | `/api/events/:id/carpool/reopen` | protect + coach | Re-opens finalized carpool (sets finalized=false) |

All routes guard: `event.type !== 'Game'` → 400; finalized guard on player write routes → 409.

---

## Open Questions

1. **PushSubscription.findOne vs findAll per user**
   - What we know: A user can have multiple push subscriptions (e.g., phone + desktop). `PushSubscription.findOne` sends to only one device.
   - What's unclear: The existing codebase uses `findOne` in some places (sendGuestInvitation) and `find` + `sendNotificationToMany` in others (event reminders). The carpool finalize notification is more critical than a reminder.
   - Recommendation: Use `PushSubscription.find({ user: userId })` and send to all devices for the finalize notification, matching the event-reminder pattern. Use `sendNotification` in a loop over found subscriptions.

2. **Handling the populate chain on GET /:id after carPool is added**
   - What we know: The existing GET /:id at line 496 calls `.lean()` at the end. Populated nested arrays work with lean but the comparison `p._id.toString()` must be used carefully.
   - What's unclear: Whether adding carPool populate to an already complex populate chain causes performance issues on the Render.com free tier.
   - Recommendation: Add carPool population fields carefully. Use `.select()` on population to limit fields (only `name`). The carPool sub-document is small (max ~20 participants) so this is acceptable.

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection: `server/models/Event.js` — EventSchema structure, embedded sub-doc patterns, pre/post save hooks, existing indexes
- Codebase inspection: `server/routes/eventRoutes.js` — existing route patterns (protect/coach/player middleware, event fetch, `.lean()`, `.select('-carPool')` on list)
- Codebase inspection: `server/controllers/notificationController.js` — sendNotification, sendNotificationToMany, PushSubscription lookup patterns
- Codebase inspection: `server/utils/webpush.js` — sendNotification signature, 410 handling
- Codebase inspection: `server/utils/notificationQueue.js` — per-player notification loop pattern
- Codebase inspection: `server/middleware/authMiddleware.js` — protect/coach/player middleware behavior and role strings ('Trainer', 'Spieler', 'Jugendspieler')
- Codebase inspection: `client/src/pages/coach/EventDetail.js` — existing layout (pb: isMobile ? 8 : 2 on root Box), MUI imports, Tabs pattern, event type rendering
- Codebase inspection: `client/src/pages/player/EventDetail.js` — fetchEvent pattern, userStatus, existing player action structure
- Codebase inspection: `client/src/context/EventContext.js` — fetchEvent, fetchEvents, event state update pattern
- Codebase inspection: `client/package.json` + `server/package.json` — confirmed all required packages already installed

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` — Confirmed roadmap decision: carPool as embedded Event sub-document; `.select('-carPool')` already deployed
- `.planning/REQUIREMENTS.md` — CARPOOL-01 through CARPOOL-10 requirements
- `.planning/phases/03-car-pool-organizer/03-CONTEXT.md` — locked design decisions from discussion phase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already in project, verified from package.json
- Architecture: HIGH — roadmap decision confirmed in STATE.md; Event.js schema patterns understood from codebase
- Pitfalls: HIGH — identified from actual codebase patterns (lean, select, post-save hook, race condition at club scale)
- Notification pattern: HIGH — webpush.js and notificationController.js fully read and understood

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable stack, 30-day validity)
