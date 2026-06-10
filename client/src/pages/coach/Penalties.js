import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Gavel, Add, Edit, Delete, CheckCircle, Cancel
} from '@mui/icons-material';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Chip, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Grid, Tooltip, FormHelperText
} from '@mui/material';
import { TeamContext } from '../../context/TeamContext';
import { AuthContext } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL;

const Penalties = () => {
  const { teams, fetchTeams } = useContext(TeamContext);
  const { user } = useContext(AuthContext);

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [catalogDialog, setCatalogDialog] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', amount: '' });

  const [assignDialog, setAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({ playerId: '', catalogEntryId: '', customName: '', amount: '', note: '' });

  useEffect(() => { fetchTeams(); }, []);

  const coachTeams = teams.filter(t => t.coaches && t.coaches.some(c => (c._id || c) === user._id));

  useEffect(() => {
    if (coachTeams.length > 0 && !selectedTeamId) setSelectedTeamId(coachTeams[0]._id);
  }, [teams]);

  useEffect(() => {
    if (selectedTeamId) { fetchCatalog(); fetchAssigned(); }
  }, [selectedTeamId]);

  const getToken = () => localStorage.getItem('token');
  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchCatalog = async () => {
    try {
      const r = await axios.get(`${API}/penalties/team/${selectedTeamId}/catalog`, { headers: headers() });
      setCatalog(r.data);
    } catch { setError('Fehler beim Laden des Katalogs'); }
  };

  const fetchAssigned = async () => {
    try {
      const r = await axios.get(`${API}/penalties/team/${selectedTeamId}/assigned`, { headers: headers() });
      setAssigned(r.data);
    } catch { setError('Fehler beim Laden der Strafen'); }
  };

  const saveCatalogEntry = async () => {
    try {
      setLoading(true);
      if (editEntry) {
        await axios.put(`${API}/penalties/team/${selectedTeamId}/catalog/${editEntry._id}`, catForm, { headers: headers() });
      } else {
        await axios.post(`${API}/penalties/team/${selectedTeamId}/catalog`, catForm, { headers: headers() });
      }
      await fetchCatalog();
      setCatalogDialog(false); setEditEntry(null); setCatForm({ name: '', description: '', amount: '' });
      setSuccess(editEntry ? 'Eintrag aktualisiert' : 'Eintrag hinzugefügt');
    } catch { setError('Fehler beim Speichern'); }
    finally { setLoading(false); }
  };

  const deleteCatalogEntry = async (id) => {
    if (!window.confirm('Eintrag wirklich löschen?')) return;
    try {
      await axios.delete(`${API}/penalties/team/${selectedTeamId}/catalog/${id}`, { headers: headers() });
      await fetchCatalog(); setSuccess('Eintrag gelöscht');
    } catch { setError('Fehler beim Löschen'); }
  };

  const assignPenalty = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/penalties/team/${selectedTeamId}/assign`, assignForm, { headers: headers() });
      await fetchAssigned();
      setAssignDialog(false); setAssignForm({ playerId: '', catalogEntryId: '', customName: '', amount: '', note: '' });
      setSuccess('Strafe vergeben');
    } catch { setError('Fehler beim Vergeben der Strafe'); }
    finally { setLoading(false); }
  };

  const togglePaid = async (id) => {
    try {
      await axios.patch(`${API}/penalties/assigned/${id}/paid`, {}, { headers: headers() });
      await fetchAssigned();
    } catch { setError('Fehler beim Aktualisieren'); }
  };

  const deletePenalty = async (id) => {
    if (!window.confirm('Strafe wirklich löschen?')) return;
    try {
      await axios.delete(`${API}/penalties/assigned/${id}`, { headers: headers() });
      await fetchAssigned(); setSuccess('Strafe gelöscht');
    } catch { setError('Fehler beim Löschen'); }
  };

  const selectedTeam = teams.find(t => t._id === selectedTeamId);
  const totalOpen = assigned.filter(p => !p.isPaid).reduce((s, p) => s + p.amount, 0);
  const totalPaid = assigned.filter(p => p.isPaid).reduce((s, p) => s + p.amount, 0);
  const openCount = assigned.filter(p => !p.isPaid).length;

  return (
    <Box sx={{ mt: 2, pb: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Gavel sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" component="h1">Strafenkatalog</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Team auswählen</InputLabel>
          <Select value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} label="Team auswählen">
            {coachTeams.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Paper>

      {!selectedTeamId && <Alert severity="info">Bitte wählen Sie ein Team aus.</Alert>}

      {selectedTeamId && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                <Typography variant="h5" sx={{ color: 'error.dark', fontWeight: 'bold' }}>{totalOpen.toFixed(2)} €</Typography>
                <Typography variant="body2">Offene Strafen</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                <Typography variant="h5" sx={{ color: 'success.dark', fontWeight: 'bold' }}>{totalPaid.toFixed(2)} €</Typography>
                <Typography variant="body2">Bezahlte Strafen</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{assigned.length}</Typography>
                <Typography variant="body2">Strafen gesamt</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={3}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label={`Strafenkatalog (${catalog.length})`} />
              <Tab label={`Strafen (${openCount} offen)`} />
            </Tabs>

            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button variant="contained" startIcon={<Add />} onClick={() => { setEditEntry(null); setCatForm({ name: '', description: '', amount: '' }); setCatalogDialog(true); }}>
                    Eintrag hinzufügen
                  </Button>
                </Box>
                {catalog.length === 0 ? (
                  <Alert severity="info">Noch keine Einträge im Strafenkatalog.</Alert>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Beschreibung</TableCell>
                          <TableCell align="right">Betrag</TableCell>
                          <TableCell align="center">Aktionen</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {catalog.map(e => (
                          <TableRow key={e._id} hover>
                            <TableCell><strong>{e.name}</strong></TableCell>
                            <TableCell>{e.description || '—'}</TableCell>
                            <TableCell align="right">{Number(e.amount).toFixed(2)} €</TableCell>
                            <TableCell align="center">
                              <Tooltip title="Bearbeiten">
                                <IconButton size="small" onClick={() => { setEditEntry(e); setCatForm({ name: e.name, description: e.description || '', amount: e.amount }); setCatalogDialog(true); }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Löschen">
                                <IconButton size="small" color="error" onClick={() => deleteCatalogEntry(e._id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button variant="contained" startIcon={<Add />} onClick={() => { setAssignForm({ playerId: '', catalogEntryId: '', customName: '', amount: '', note: '' }); setAssignDialog(true); }}>
                    Strafe vergeben
                  </Button>
                </Box>
                {assigned.length === 0 ? (
                  <Alert severity="info">Noch keine Strafen vergeben.</Alert>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Spieler</TableCell>
                          <TableCell>Strafe</TableCell>
                          <TableCell align="right">Betrag</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Notiz</TableCell>
                          <TableCell>Datum</TableCell>
                          <TableCell align="center">Aktionen</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assigned.map(p => (
                          <TableRow key={p._id} hover sx={{ opacity: p.isPaid ? 0.65 : 1 }}>
                            <TableCell>{p.player?.name}</TableCell>
                            <TableCell>{p.name}</TableCell>
                            <TableCell align="right">{Number(p.amount).toFixed(2)} €</TableCell>
                            <TableCell>
                              <Chip label={p.isPaid ? 'Bezahlt' : 'Offen'} color={p.isPaid ? 'success' : 'error'} size="small" />
                            </TableCell>
                            <TableCell>{p.note || '—'}</TableCell>
                            <TableCell>{new Date(p.createdAt).toLocaleDateString('de-DE')}</TableCell>
                            <TableCell align="center">
                              <Tooltip title={p.isPaid ? 'Als offen markieren' : 'Als bezahlt markieren'}>
                                <IconButton size="small" color={p.isPaid ? 'default' : 'success'} onClick={() => togglePaid(p._id)}>
                                  {p.isPaid ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Löschen">
                                <IconButton size="small" color="error" onClick={() => deletePenalty(p._id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Paper>
        </>
      )}

      {/* Catalog Entry Dialog */}
      <Dialog open={catalogDialog} onClose={() => setCatalogDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editEntry ? 'Eintrag bearbeiten' : 'Neuer Katalogeintrag'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name *" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth label="Beschreibung" value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} sx={{ mt: 2 }} multiline rows={2} />
          <TextField fullWidth label="Betrag (€) *" type="number" value={catForm.amount} onChange={e => setCatForm(p => ({ ...p, amount: e.target.value }))} sx={{ mt: 2 }} inputProps={{ min: 0, step: 0.5 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatalogDialog(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={saveCatalogEntry} disabled={loading || !catForm.name || !catForm.amount}>
            {loading ? <CircularProgress size={20} /> : 'Speichern'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Penalty Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Strafe vergeben</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Spieler *</InputLabel>
            <Select value={assignForm.playerId} onChange={e => setAssignForm(p => ({ ...p, playerId: e.target.value }))} label="Spieler *">
              {selectedTeam?.players?.map(pl => <MenuItem key={pl._id} value={pl._id}>{pl.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Aus Katalog wählen</InputLabel>
            <Select
              value={assignForm.catalogEntryId}
              onChange={e => {
                const entry = catalog.find(c => c._id === e.target.value);
                setAssignForm(p => ({ ...p, catalogEntryId: e.target.value, amount: entry ? entry.amount : p.amount, customName: '' }));
              }}
              label="Aus Katalog wählen"
            >
              <MenuItem value=""><em>Eigene Strafe eingeben</em></MenuItem>
              {catalog.map(c => <MenuItem key={c._id} value={c._id}>{c.name} ({Number(c.amount).toFixed(2)} €)</MenuItem>)}
            </Select>
          </FormControl>
          {!assignForm.catalogEntryId && (
            <TextField fullWidth label="Strafenname *" value={assignForm.customName} onChange={e => setAssignForm(p => ({ ...p, customName: e.target.value }))} sx={{ mt: 2 }} />
          )}
          <TextField fullWidth label="Betrag (€) *" type="number" value={assignForm.amount} onChange={e => setAssignForm(p => ({ ...p, amount: e.target.value }))} sx={{ mt: 2 }} inputProps={{ min: 0, step: 0.5 }} />
          <TextField fullWidth label="Notiz (optional)" value={assignForm.note} onChange={e => setAssignForm(p => ({ ...p, note: e.target.value }))} sx={{ mt: 2 }} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={assignPenalty}
            disabled={loading || !assignForm.playerId || (!assignForm.catalogEntryId && !assignForm.customName) || !assignForm.amount}
          >
            {loading ? <CircularProgress size={20} /> : 'Strafe vergeben'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Penalties;
