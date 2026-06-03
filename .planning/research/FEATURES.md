# Features Research — Car Pool Organizer & Team Fund/Punishment Catalog

**Project:** InTeam — Volleyball Team Manager PWA
**Research date:** 2026-02-23
**Milestone:** Subsequent (adding to existing production app)
**Question answered:** What features do car pool organizers and team fine/fund trackers typically have? What's table stakes vs differentiating? What do teams actually need vs what sounds nice?

---

## Context Summary

InTeam already has:
- Event model with `attendingPlayers`, `invitedPlayers`, `declinedPlayers` arrays per event
- Team model with `coaches` and `players` arrays — team-scoped data is natural
- Role-based access: Trainer (coach), Spieler (player), Jugendspieler (youth player)
- Mobile-first PWA, German locale, React/MUI frontend
- No automated tests — changes go to test deployment first

---

## Feature 1: Car Pool Organizer

### Table Stakes (Must Have)

| Feature | Why It's Table Stakes | Complexity |
|---|---|---|
| Driver self-registration with seat count | Core mechanic — without this the feature doesn't exist | Low |
| Passenger self-registration (need a ride) | Mirror of driver — without this, no matching is possible | Low |
| Coach overview: who drives, who needs a ride, unmatched | Coaches ask this before every away match | Low-Medium |
| Assignment display per player on player view | Players need to know who to drive with / where to meet | Low |
| Only invited/attending players can join | Data integrity — use existing `attendingPlayers` array | Low |
| Withdraw/update registration | Players change plans | Low |

### Differentiators

| Feature | Why It Differentiates | Complexity |
|---|---|---|
| Coach can manually assign a passenger to a driver | Auto-matching is never perfect — human override is the safety valve | Medium |
| Seat utilization badge on driver cards | Visual "2/4 seats taken" saves mental arithmetic | Low |
| Push notification when coach finalizes assignments | Players don't have to keep checking | Medium (reuse NotificationQueue) |
| Departure time / meeting point field on driver | Optional text field covers different starting points | Low |
| Car pool summary embedded on event detail page | Coach already lives on the event detail page | Low-Medium |

### Anti-Features (Deliberately NOT Build)

| Feature | Why Not |
|---|---|
| Real-time GPS tracking / live location | High privacy concern, native APIs, out of scope |
| Google Maps route optimization | Overkill for club-level. Teams are in one city |
| In-app chat per car pool group | Chat is explicitly out of scope in PROJECT.md |
| Payment splitting for fuel costs | Turns coordination tool into finance tool |
| Cross-event car pool aggregation | Adds complexity with low marginal value |
| Driver rating system | Social friction in a team setting |

### Dependencies

- Requires `Event` model extension: `carPool` sub-document (drivers + passengers + assignments arrays)
- Only applicable to event type `Game` — filter accordingly
- Push notification reuses existing `NotificationQueue` model and `webpush.js`
- Coach assignment UI uses existing `attendingPlayers` array

---

## Feature 2: Team Fund / Punishment Catalog

### Table Stakes (Must Have)

| Feature | Why It's Table Stakes | Complexity |
|---|---|---|
| Fine rule catalog per team (name + amount) | Without catalog, coach types amounts freehand — error-prone | Low |
| Add/edit/delete fine rules | Rules change mid-season | Low |
| Log a violation: player + rule + optional date | Core entry mechanic | Low-Medium |
| Player balance view (own balance only) | Players ask "how much do I owe?" — self-service prevents messages | Low |
| Coach full ledger: all players, all violations, totals | Coach needs full picture to collect at season end | Medium |
| Mark entry as paid / settled | Without this the balance never resets — feature becomes useless | Low-Medium |

### Differentiators

| Feature | Why It Differentiates | Complexity |
|---|---|---|
| Per-team fine catalog (not per-club) | Teams have different cultures. H1 fines differ from U16 | Low (Team sub-document) |
| Optional note on each logged violation | Context helps fairness — optional means no friction | Low |
| Running total at top of player view | Players see headline number immediately | Low |
| Coach can add a positive credit entry | Teams sometimes pay in advance or receive contributions | Low-Medium |
| Fine log entry linked to event (optional) | "Late to match on 15.03." — optional FK to Event | Low |

### Anti-Features (Deliberately NOT Build)

| Feature | Why Not |
|---|---|
| Online payment integration (PayPal/Stripe) | Legal complexity, DSGVO, fees — out of scope |
| Automated fines triggered by attendance data | Legal/ethical risk in German sport club context (minors, DSGVO) |
| Fine appeals / dispute workflow | Small teams — coach decides. Bureaucracy rejected |
| Notification to player when fined | Psychological friction — some coaches prefer to tell in person |
| Fine leaderboard / ranking | Public shaming inappropriate with Jugendspieler role |
| Cross-season analytics | Over-engineering for club-level data volume |

### Dependencies

- New `FineRule` sub-document array on `Team` model
- New `FineEntry` model: `team`, `player`, `rule` (ref), `amount`, `note`, `date`, `paid`, `paidAt`, `loggedBy`
- Player balance = sum of unpaid entries for that player in that team
- Authorization: fine rules writeable by `Trainer` only; players read-only for own entries
- Optional event link uses existing `Event` ObjectId ref

---

## Build Order Recommendation

**Car pool first:**
1. Event-scoped — isolated change surface, lower risk
2. Event model already has attendance arrays needed for authorization
3. Purely additive — no existing functionality touched
4. Immediate value: next away match

**Fine system second:**
1. Requires new `FineEntry` model — more schema design up front
2. Rule catalog on Team is a non-trivial schema change
3. Authorization logic more nuanced (player sees own, coach sees all)
4. Longer payoff cycle — teams collect at end of season

---

*Research by: gsd-project-researcher*
*Last updated: 2026-02-23*
