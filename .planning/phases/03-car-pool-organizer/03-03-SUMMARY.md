---
phase: 03-car-pool-organizer
plan: "03"
status: complete
completed: "2026-03-24T00:00:00.000Z"
commit: b3a046c
files_modified:
  - client/src/pages/player/EventDetail.js
---

# Plan 03-03 Summary: Player EventDetail — Car Pool Section

## What Was Built

Added inline carpool UI to `client/src/pages/player/EventDetail.js`. Section renders only for Game events when the player's status is 'attending'.

## Changes Made

**client/src/pages/player/EventDetail.js** (+315 lines)
- Added `axios` import and MUI imports: `FormControl`, `FormLabel`, `RadioGroup`, `FormControlLabel`, `Radio`, `Divider`, `List`, `ListItem`, `ListItemText`, `ListItemAvatar`
- Added 6 carpool state variables: `carpoolRole`, `carpoolSeats`, `carpoolNote`, `carpoolLoading`, `carpoolError`, `driverPickerOpen`
- Added 3 handler functions: `handleCarpoolRegister`, `handleCarpoolWithdraw`, `handlePickDriver`
- Added carpool display helpers: `myDriverEntry`, `isRegisteredDriver`, `isRegisteredPassenger`, `myAssignedDriver`, `availableDriversForPick`
- Added full carpool JSX section after attendance buttons (line ~685)

## Verification

All must-haves confirmed:
- ✅ Carpool section guards: `event?.type === 'Game'` and `userStatus?.status === 'attending'`
- ✅ Radio buttons for driver/passenger role selection
- ✅ Driver role shows seats field (1-9) and optional note field
- ✅ Register → POST /api/events/:id/carpool/register with Bearer token
- ✅ Withdraw → DELETE /api/events/:id/carpool/register
- ✅ Passenger re-pick driver → driver picker dialog → PATCH /api/events/:id/carpool/pick-driver
- ✅ Pre-finalization: full driver+passenger chip list visible
- ✅ Post-finalization: driver sees passenger list, passenger sees driver+note, unassigned sees "kein Auto zugeteilt"
- ✅ "Kein Fahrer verfügbar" state when no drivers with capacity

## Decisions

- Used direct `axios` with Bearer token (same pattern as coach EventDetail) — EventContext methods don't cover carpool mutations
- Placed carpool section after attendance buttons, inside existing layout Box — no new root container
