import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import {
  ArrowBack,
  Event,
  LocationOn,
  Group,
  Description,
  CloudUpload,
  CheckCircle,
  Notifications,
  Add,
  Delete,
  UploadFile
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
  Divider,
  Tooltip,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { AuthContext } from '../../context/AuthContext';
import { EventContext } from '../../context/EventContext';
import { TeamContext } from '../../context/TeamContext';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB — must match server constant

const ImportMatchesPDF = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { createEvent, loading: eventLoading, events } = useContext(EventContext);
  const { teams, fetchTeams, loading: teamLoading } = useContext(TeamContext);

  const [activeStep, setActiveStep] = useState(0);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadedMatches, setUploadedMatches] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [userCoachTeams, setUserCoachTeams] = useState([]);

  // Event creation settings (similar to CreateEvent)
  const [votingDeadline, setVotingDeadline] = useState(null);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [reminderTimes, setReminderTimes] = useState([
    { hours: 24, minutes: 0 },
    { hours: 1, minutes: 0 }
  ]);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [isOpenAccess, setIsOpenAccess] = useState(false);
  const [selectedMatchIndices, setSelectedMatchIndices] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateAction, setDuplicateAction] = useState(null); // 'skip' | 'overwrite' | null

  const steps = ['PDF hochladen', 'Team auswählen', 'Einstellungen', 'Bestätigen'];

  // Load teams on component mount
  useEffect(() => {
    const loadTeams = async () => {
      await fetchTeams();
    };
    loadTeams();
  }, [fetchTeams]);

  // Identify which teams the user coaches
  useEffect(() => {
    if (teams.length > 0 && user) {
      const coachTeams = teams.filter(team => {
        // Defensive check: ensure team.coaches exists and is an array
        if (!team.coaches || !Array.isArray(team.coaches)) {
          return false;
        }

        // Convert IDs to strings for comparison to handle ObjectId vs String
        const isCoach = team.coaches.some(coach =>
          String(coach._id) === String(user._id)
        );

        return isCoach;
      });

      setUserCoachTeams(coachTeams);
    }
  }, [teams, user]);

  // Update selected players when team changes
  useEffect(() => {
    if (selectedTeamId && teams.length > 0) {
      const team = teams.find(t => t._id === selectedTeamId);
      if (team && !isOpenAccess) {
        setSelectedPlayers(team.players.map(player => player._id));
      }
    }
  }, [selectedTeamId, teams, isOpenAccess]);

  // Clear selected players when open access is enabled
  useEffect(() => {
    if (isOpenAccess) {
      setSelectedPlayers([]);
    }
  }, [isOpenAccess]);

  // Filter matches when team name is selected
  useEffect(() => {
    if (selectedTeamName && uploadedMatches.length > 0) {
      const filtered = uploadedMatches.filter(
        match => match.teamA === selectedTeamName || match.teamB === selectedTeamName
      );

      // Group by date
      const groupedByDate = {};
      filtered.forEach(match => {
        if (!groupedByDate[match.datum]) {
          groupedByDate[match.datum] = [];
        }
        groupedByDate[match.datum].push(match);
      });

      // Create one event per date with all matches
      const matchesByDate = Object.keys(groupedByDate).map(datum => ({
        datum,
        zeit: groupedByDate[datum][0].zeit,
        matches: groupedByDate[datum],
        location: groupedByDate[datum][0].location,
        opponent: groupedByDate[datum].map(m =>
          m.teamA === selectedTeamName ? m.teamB : m.teamA
        ).join(', ')
      }));

      setFilteredMatches(matchesByDate);
    }
  }, [selectedTeamName, uploadedMatches]);

  // Reset selection when filtered matches change (e.g. team switch)
  useEffect(() => {
    setSelectedMatchIndices(filteredMatches.map((_, idx) => idx));
  }, [filteredMatches]);

  // Re-trigger handleCreateEvents after coach makes duplicate decision
  useEffect(() => {
    if (duplicateAction !== null && !duplicateWarning) {
      handleCreateEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateAction, duplicateWarning]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Bitte wählen Sie eine gültige PDF-Datei aus');
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setUploadError('Die Datei ist zu groß. Maximale Dateigröße: 10 MB.');
      return;
    }
    setPdfFile(file);
    setUploadError('');
  };

  const handleUploadPDF = async () => {
    if (!pdfFile) {
      setUploadError('Keine PDF-Datei ausgewählt');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('pdf', pdfFile);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/events/parse-pdf`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadedMatches(response.data.matches);
      setAvailableTeams(response.data.teams);

      // Show warning if no teams found
      if (response.data.teams.length === 0) {
        setUploadError('PDF wurde hochgeladen, aber keine Teams gefunden. Überprüfen Sie die Browser-Konsole für Debug-Informationen.');
      } else {
        setActiveStep(1);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Fehler beim Hochladen der PDF';

      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);

      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 1 && !selectedTeamName) {
      setUploadError('Bitte wählen Sie Ihr Team aus');
      return;
    }
    if (activeStep === 1 && !selectedTeamId) {
      setUploadError('Bitte wählen Sie das Team aus der Dropdown-Liste aus');
      return;
    }
    setUploadError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCreateEvents = async () => {
    const matchesToCreate = filteredMatches.filter((_, idx) => selectedMatchIndices.includes(idx));

    if (matchesToCreate.length === 0) {
      setUploadError('Keine Spiele zum Erstellen ausgewählt');
      return;
    }

    if (!selectedTeamId) {
      setUploadError('Bitte wählen Sie ein Team aus');
      return;
    }

    // Duplicate detection — only run if we have not yet made a decision
    if (duplicateAction === null) {
      const existingForTeam = (events || []).filter(e =>
        e.team?._id === selectedTeamId ||
        (e.teams || []).some(t => (t._id || t) === selectedTeamId)
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

      if (duplicates.length > 0) {
        setDuplicateWarning({ duplicates, matchesToCreate });
        return; // Pause until coach decides
      }
    }

    // Determine final matches based on duplicate decision
    let finalMatches = matchesToCreate;
    if (duplicateAction === 'skip' && duplicateWarning) {
      const dupDates = duplicateWarning.duplicates.map(m => m.datum);
      finalMatches = matchesToCreate.filter(m => !dupDates.includes(m.datum));
    }

    if (finalMatches.length === 0) {
      setUploadError('Alle ausgewählten Spiele existieren bereits. Es wurden keine neuen Termine erstellt.');
      setDuplicateWarning(null);
      setDuplicateAction(null);
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const createdEvents = [];

      for (const matchDay of finalMatches) {
        const [day, month, year] = matchDay.datum.split('.');
        const [hours, minutes] = matchDay.zeit.split(':');
        const startTime = new Date(year, month - 1, day, hours, minutes);
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours

        let matchVotingDeadline = null;
        if (votingDeadline) {
          const offset = votingDeadline.getTime() - new Date().getTime();
          matchVotingDeadline = new Date(startTime.getTime() + offset);
        }

        const eventData = {
          title: `Spiel gegen ${matchDay.opponent}`,
          type: 'Game',
          startTime,
          endTime,
          location: matchDay.location || 'Siehe Spielplan',
          description: `Spiele: ${matchDay.matches.map(m => `${m.teamA} vs ${m.teamB}`).join(', ')}`,
          teams: [selectedTeamId],
          organizingTeam: selectedTeamId,
          organizingTeams: [selectedTeamId],
          invitedPlayers: isOpenAccess ? [] : selectedPlayers,
          isOpenAccess,
          votingDeadline: matchVotingDeadline,
          notificationSettings: {
            enabled: notificationEnabled,
            reminderTimes: reminderTimes,
            customMessage: customMessage
          }
        };

        const result = await createEvent(eventData);
        createdEvents.push(result);
      }

      navigate('/coach/events');
    } catch (error) {
      setUploadError(error.message || 'Fehler beim Erstellen der Termine');
    } finally {
      setUploading(false);
      setDuplicateWarning(null);
      setDuplicateAction(null);
    }
  };

  // Notification reminder functions
  const addReminderTime = () => {
    setReminderTimes([...reminderTimes, { hours: 1, minutes: 0 }]);
  };

  const removeReminderTime = (index) => {
    setReminderTimes(reminderTimes.filter((_, i) => i !== index));
  };

  const updateReminderTime = (index, field, value) => {
    const newReminderTimes = [...reminderTimes];
    newReminderTimes[index][field] = parseInt(value) || 0;
    setReminderTimes(newReminderTimes);
  };

  const handlePlayerSelection = (event) => {
    const { value } = event.target;
    setSelectedPlayers(value);
  };

  const handleSelectAllPlayers = () => {
    const team = teams.find(t => t._id === selectedTeamId);
    if (!team) return;

    if (selectedPlayers.length === team.players.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(team.players.map(player => player._id));
    }
  };

  if (teamLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, pb: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/coach/events')}
          sx={{ mr: 1 }}
          aria-label="Zurück"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1">
          Spielplan importieren (PDF)
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {uploadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {uploadError}
          </Alert>
        )}

        {/* Step 1: PDF Upload */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              PDF-Datei hochladen
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Laden Sie die Spielplan-PDF hoch, die Sie zu Beginn der Saison erhalten haben.
            </Typography>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => document.getElementById('pdf-upload').click()}
            >
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <UploadFile sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {pdfFile ? pdfFile.name : 'PDF-Datei auswählen'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Klicken Sie hier, um eine Datei auszuwählen
              </Typography>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleUploadPDF}
                disabled={!pdfFile || uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {uploading ? 'Hochladen...' : 'PDF hochladen und analysieren'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Team Selection */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Wählen Sie Ihr Team
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Gefundene Spiele: {uploadedMatches.length}. Wählen Sie den Teamnamen aus, für den Sie Termine erstellen möchten.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Team aus PDF</InputLabel>
                  <Select
                    value={selectedTeamName}
                    onChange={(e) => setSelectedTeamName(e.target.value)}
                    label="Team aus PDF"
                  >
                    {availableTeams.map((team) => (
                      <MenuItem key={team} value={team}>
                        {team}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Wählen Sie den Teamnamen wie er im PDF erscheint</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Team in der App</InputLabel>
                  <Select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    label="Team in der App"
                  >
                    {userCoachTeams.map((team) => (
                      <MenuItem key={team._id} value={team._id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Wählen Sie das entsprechende Team in Ihrer App</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>

            {selectedTeamName && filteredMatches.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Gefilterte Spieltage: {filteredMatches.length} ({selectedMatchIndices.length} ausgewählt)
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedMatchIndices.length === filteredMatches.length && filteredMatches.length > 0}
                            indeterminate={selectedMatchIndices.length > 0 && selectedMatchIndices.length < filteredMatches.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedMatchIndices(filteredMatches.map((_, i) => i));
                              else setSelectedMatchIndices([]);
                            }}
                          />
                        </TableCell>
                        <TableCell>Datum</TableCell>
                        <TableCell>Zeit</TableCell>
                        <TableCell>Gegner</TableCell>
                        <TableCell>Ort</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMatches.map((match, index) => (
                        <TableRow key={index} selected={selectedMatchIndices.includes(index)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedMatchIndices.includes(index)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMatchIndices(prev => [...prev, index]);
                                } else {
                                  setSelectedMatchIndices(prev => prev.filter(i => i !== index));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>{match.datum}</TableCell>
                          <TableCell>{match.zeit}</TableCell>
                          <TableCell>{match.opponent}</TableCell>
                          <TableCell>{match.location || 'Siehe PDF'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Zurück</Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!selectedTeamName || !selectedTeamId || filteredMatches.length === 0 || selectedMatchIndices.length === 0}
              >
                Weiter
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Settings */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Einstellungen für alle Termine
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Diese Einstellungen gelten für alle {filteredMatches.length} Spieltermine.
            </Typography>

            <Grid container spacing={3}>
              {/* Voting Deadline */}
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                  <DateTimePicker
                    label="Abstimmungsfrist (optional)"
                    value={votingDeadline}
                    onChange={(newValue) => setVotingDeadline(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: 'Wird relativ zu jedem Spieltermin angewendet'
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Open Access */}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isOpenAccess}
                      onChange={(e) => setIsOpenAccess(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Offenes Training (für alle Vereinsmitglieder)"
                />
              </Grid>

              {/* Player Selection */}
              {!isOpenAccess && selectedTeamId && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="players-label">Nominierte Spieler</InputLabel>
                    <Select
                      labelId="players-label"
                      multiple
                      value={selectedPlayers}
                      onChange={handlePlayerSelection}
                      input={<OutlinedInput label="Nominierte Spieler" />}
                      renderValue={(selected) => {
                        const team = teams.find(t => t._id === selectedTeamId);
                        if (!team) return '';
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((playerId) => {
                              const player = team.players.find(p => p._id === playerId);
                              return player ? (
                                <Chip key={playerId} label={player.name} size="small" />
                              ) : null;
                            })}
                          </Box>
                        );
                      }}
                    >
                      <MenuItem onClick={handleSelectAllPlayers}>
                        <Checkbox
                          checked={
                            selectedPlayers.length ===
                            teams.find(t => t._id === selectedTeamId)?.players.length
                          }
                        />
                        <ListItemText primary="Alle auswählen" />
                      </MenuItem>
                      <Divider />
                      {teams
                        .find(t => t._id === selectedTeamId)
                        ?.players.map((player) => (
                          <MenuItem key={player._id} value={player._id}>
                            <Checkbox checked={selectedPlayers.includes(player._id)} />
                            <ListItemText primary={player.name} />
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Notification Settings */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Notifications sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Benachrichtigungen</Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationEnabled}
                      onChange={(e) => setNotificationEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Benachrichtigungen aktivieren"
                />
              </Grid>

              {notificationEnabled && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Erinnerungszeiten
                    </Typography>

                    {reminderTimes.map((reminder, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TextField
                          type="number"
                          label="Stunden"
                          value={reminder.hours}
                          onChange={(e) => updateReminderTime(index, 'hours', e.target.value)}
                          sx={{ width: '100px', mr: 1 }}
                          inputProps={{ min: 0, max: 168 }}
                        />
                        <TextField
                          type="number"
                          label="Minuten"
                          value={reminder.minutes}
                          onChange={(e) => updateReminderTime(index, 'minutes', e.target.value)}
                          sx={{ width: '100px', mr: 1 }}
                          inputProps={{ min: 0, max: 59 }}
                        />
                        <Typography sx={{ mr: 1 }}>vor dem Termin</Typography>
                        {reminderTimes.length > 1 && (
                          <IconButton
                            onClick={() => removeReminderTime(index)}
                            color="error"
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    ))}

                    <Button
                      onClick={addReminderTime}
                      startIcon={<Add />}
                      variant="outlined"
                      size="small"
                    >
                      Weitere Erinnerung hinzufügen
                    </Button>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Individuelle Nachricht (optional)"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      multiline
                      rows={2}
                      placeholder="Benutzerdefinierte Nachricht für die Benachrichtigung..."
                    />
                  </Grid>
                </>
              )}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Zurück</Button>
              <Button variant="contained" onClick={handleNext}>
                Weiter
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 4: Confirmation */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Bestätigung
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bitte überprüfen Sie die Einstellungen und bestätigen Sie die Erstellung der Termine.
            </Typography>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Team
                    </Typography>
                    <Typography variant="body1">
                      {teams.find(t => t._id === selectedTeamId)?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Anzahl Spieltage
                    </Typography>
                    <Typography variant="body1">{filteredMatches.length}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Eingeladene Spieler
                    </Typography>
                    <Typography variant="body1">
                      {isOpenAccess
                        ? 'Offen für alle Vereinsmitglieder'
                        : `${selectedPlayers.length} Spieler ausgewählt`}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Benachrichtigungen
                    </Typography>
                    <Typography variant="body1">
                      {notificationEnabled ? 'Aktiviert' : 'Deaktiviert'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mb: 3 }}>
              Es werden {filteredMatches.length} Termine erstellt. Termine mit mehreren Spielen am selben Tag werden zu einem Termin zusammengefasst.
            </Alert>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Zurück</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateEvents}
                disabled={uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {uploading ? 'Erstelle Termine...' : `${filteredMatches.length} Termine erstellen`}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Dialog open={Boolean(duplicateWarning)} onClose={() => { setDuplicateWarning(null); setDuplicateAction(null); }}>
        <DialogTitle>Doppelte Termine gefunden</DialogTitle>
        <DialogContent>
          <Typography>
            {duplicateWarning?.duplicates.length} {duplicateWarning?.duplicates.length === 1 ? 'Spiel existiert' : 'Spiele existieren'} bereits für dieses Team.
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
    </Box>
  );
};

export default ImportMatchesPDF;