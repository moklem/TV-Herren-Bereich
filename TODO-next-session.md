# TODO – Nächste Session

## Kontext
Zwei neue Features wurden begonnen und sind größtenteils fertig.
**Backend ist vollständig funktionsfähig.** Es fehlen nur noch 3 Frontend-Kleinigkeiten.

---

## Feature 1: Auto-Anmeldung (✅ Fast fertig)
Spieler werden bei Terminerstellung automatisch als „Zugesagt" eingetragen statt als „Eingeladen".

### Status
- ✅ `server/models/Event.js` — Feld `autoRegister` hinzugefügt
- ✅ `server/routes/eventRoutes.js` — POST + PUT behandeln `autoRegister`
- ✅ `client/src/pages/coach/CreateEvent.js` — Switch UI + State hinzugefügt
- ✅ `client/src/pages/coach/EditEvent.js` — Switch UI + State + Laden aus Event hinzugefügt

### Noch offen
- [ ] **EditEvent.js** — `FormHelperText` fehlt in den MUI-Imports (wird für den Hilfstext unter dem Switch benötigt)
  - Datei: `client/src/pages/coach/EditEvent.js`
  - Zeile ~46: `FormHelperText` zu den MUI-Imports hinzufügen (ist bereits in CreateEvent.js vorhanden)

---

## Feature 2: Strafenkatalog (✅ Fast fertig)
Vollständiges Penalty-System wie bei Spielerplus.

### Status
- ✅ `server/models/PenaltyCatalog.js` — Neues Model (Katalog-Einträge)
- ✅ `server/models/PlayerPenalty.js` — Neues Model (vergebene Strafen)
- ✅ `server/routes/penaltyRoutes.js` — Vollständige CRUD-API
- ✅ `server/server.js` — Penalty-Routes registriert unter `/api/penalties`
- ✅ `client/src/pages/coach/Penalties.js` — Vollständige Coach-Seite (2 Tabs: Katalog + Strafen)
- ✅ `client/src/App.js` — Route `/coach/penalties` + Import hinzugefügt
- ✅ `client/src/components/layout/CoachLayout.js` — „Strafenkatalog" im Drawer-Menü + Gavel-Icon

### Noch offen

#### 1. CoachLayout Desktop-Navbar
- Datei: `client/src/components/layout/CoachLayout.js`
- In der Desktop-Navigationsleiste (die `<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>`) fehlt ein Button für Strafenkatalog
- Nach dem „Attribute"-Button einfügen:
```jsx
<Button
  component={RouterLink}
  to="/coach/penalties"
  sx={{ my: 2, color: 'white', display: 'block' }}
>
  Strafenkatalog
</Button>
```

#### 2. PlayerTeamDetail – Strafen-Lektion für Spieler
- Datei: `client/src/pages/player/TeamDetail.js`
- Alle Teammitglieder sollen die Strafen ihres Teams sehen (wie bei Spielerplus – öffentliche Übersicht)
- Am Ende der Seite (nach dem `</Paper>` auf Zeile ~278) eine neue `<Paper>` Sektion hinzufügen:
  - Fetch: `GET /api/penalties/team/${id}/assigned`
  - Anzeige: Rangliste nach offenen Schulden sortiert (Spieler | Offen | Bezahlt)
  - axios importieren (fehlt noch in der Datei)
  - State: `const [penalties, setPenalties] = useState([])`
  - Laden im `useEffect` nach dem Team-Laden

**Beispiel-Implementierung für PlayerTeamDetail:**
```jsx
// Imports ergänzen:
import axios from 'axios';
// ...
const [penalties, setPenalties] = useState([]);

// Im useEffect nach setTeam(teamData):
try {
  const token = localStorage.getItem('token');
  const r = await axios.get(
    `${process.env.REACT_APP_API_URL}/penalties/team/${id}/assigned`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setPenalties(r.data);
} catch (_) { /* Strafen nicht verfügbar */ }

// Leaderboard-Berechnung:
const playerTotals = {};
penalties.forEach(p => {
  const pid = p.player._id;
  if (!playerTotals[pid]) playerTotals[pid] = { name: p.player.name, open: 0, paid: 0 };
  if (p.isPaid) playerTotals[pid].paid += p.amount;
  else playerTotals[pid].open += p.amount;
});
const leaderboard = Object.values(playerTotals).sort((a, b) => b.open - a.open);

// JSX nach dem schließenden </Paper> (~Zeile 278):
{penalties.length > 0 && (
  <Paper elevation={2} sx={{ p: 3, mt: 3, mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <GavelIcon sx={{ mr: 1, color: 'warning.main' }} />
      <Typography variant="h6">Strafenkatalog</Typography>
    </Box>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Spieler</TableCell>
          <TableCell align="right">Offen (€)</TableCell>
          <TableCell align="right">Bezahlt (€)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {leaderboard.map(pl => (
          <TableRow key={pl.name} sx={{ fontWeight: pl.open > 0 ? 'bold' : 'normal' }}>
            <TableCell>{pl.name}</TableCell>
            <TableCell align="right" sx={{ color: pl.open > 0 ? 'error.main' : 'inherit' }}>
              {pl.open.toFixed(2)}
            </TableCell>
            <TableCell align="right" sx={{ color: 'success.main' }}>
              {pl.paid.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
)}
```
- Benötigte zusätzliche MUI-Imports: `Table, TableBody, TableCell, TableHead, TableRow` (+ `Gavel as GavelIcon` von @mui/icons-material)

---

## API-Übersicht (zur Referenz)
```
GET    /api/penalties/team/:teamId/catalog      — Katalog laden (Coach + Spieler)
POST   /api/penalties/team/:teamId/catalog      — Katalogeintrag erstellen (Coach)
PUT    /api/penalties/team/:teamId/catalog/:id  — Katalogeintrag bearbeiten (Coach)
DELETE /api/penalties/team/:teamId/catalog/:id  — Katalogeintrag löschen (Coach)
GET    /api/penalties/team/:teamId/assigned     — Vergebene Strafen laden (Coach + Spieler)
POST   /api/penalties/team/:teamId/assign       — Strafe vergeben (Coach)
PATCH  /api/penalties/assigned/:id/paid         — Bezahlt-Status umschalten (Coach)
DELETE /api/penalties/assigned/:id              — Strafe löschen (Coach)
```
