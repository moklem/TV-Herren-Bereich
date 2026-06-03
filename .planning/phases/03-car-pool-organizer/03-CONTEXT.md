# Phase 3: Car Pool Organizer - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Attending players can self-register as driver or passenger for match events. On registration, passengers are auto-assigned to a driver. Passengers can manually re-pick a driver before finalization. Coach views the pool via a two-column overview, adjusts assignments, and finalizes. After finalization, players see their own assignment. Car pool controls only appear on match/game events — not training events. Creating/editing events and attendance tracking are separate features.

</domain>

<decisions>
## Implementation Decisions

### Player registration flow
- Car pool section is inline on the event detail page (collapsible/section — not a modal or separate route)
- Player selects role via radio buttons: "Driver" expands a seat count field; "Passenger" registers without extra fields; no "Not going" option in car pool (attendance is separate)
- Players can update or withdraw their registration freely until the coach finalizes; server rejects changes after finalization
- Before finalization, players see the full list of who registered and as what — all drivers (with names) and all passengers (by name) are visible to everyone

### Auto-assignment
- When a passenger registers, the system immediately auto-assigns them to a driver with available seats (first-fit)
- A passenger can manually re-pick any driver with remaining capacity at any time before finalization
- Re-picking is silent — no notifications to drivers or coach; driver's passenger list simply updates

### Driver registration fields
- Seat count: required
- Free-text note (e.g. meeting point, departure time, instructions): optional — driver can enter anything
- Coach can override/edit the driver's note during assignment management

### Coach assignment UI
- Coach accesses car pool management as a tab or section on the event detail page (not a separate route)
- Layout: two-column — drivers on the left (each showing name, seat count, current passengers), unassigned passengers on the right
- Assignment action: tap an unassigned passenger → picker appears with available drivers and remaining seats → coach selects one
- Coach can also override passenger self-assignments (move passengers between drivers)
- Finalization with unassigned passengers: allowed — coach sees a warning ("X passengers are unassigned") but can proceed

### Finalization & notifications
- Coach can re-open after finalizing (players become editable again), make changes, and re-finalize; re-finalization sends a new notification
- Players are blocked from changing registration only after finalization (no automatic cutoff by time)
- On finalization, all attending players (drivers and passengers) receive a push notification
- Notification content is personalized:
  - Driver: "Car pool finalized for [Event] — you are driving. Check your passengers."
  - Passenger: "Car pool finalized for [Event] — you are riding with [Driver Name]."
  - Unassigned passenger: "Car pool finalized for [Event] — you have no car assigned yet."

### Post-finalization player views
- Passenger sees: driver name + driver's free-text note
- Driver sees: list of passenger names

### Claude's Discretion
- Exact auto-assignment algorithm (first-fit is the intent — assign to driver with most remaining capacity, or similar simple heuristic)
- How to handle the edge case where no drivers have remaining seats when a new passenger registers (show a "no seats available" state)
- Loading/skeleton states
- Empty state when no one has registered yet
- Exact visual styling of the driver card and passenger list

</decisions>

<specifics>
## Specific Ideas

- Players can see the full registration list (all drivers and all passengers by name) before finalization — this is intentional for social coordination
- Passengers are auto-assigned immediately on registration so they always have a ride, but they retain control to re-pick
- The free-text note on driver registration replaces structured meeting point + departure time fields — simpler, more flexible

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-car-pool-organizer*
*Context gathered: 2026-02-26*
