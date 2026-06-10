const express = require('express');
const router = express.Router();
const { protect, coach } = require('../middleware/authMiddleware');
const PenaltyCatalog = require('../models/PenaltyCatalog');
const PlayerPenalty = require('../models/PlayerPenalty');
const Team = require('../models/Team');

const isCoachOfTeam = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  return team && team.coaches.some(c => c.toString() === userId.toString());
};

// GET catalog for a team (coach + players)
router.get('/team/:teamId/catalog', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team nicht gefunden' });
    const isCoach = team.coaches.some(c => c.toString() === req.user._id.toString());
    const isMember = team.players.some(p => p.toString() === req.user._id.toString());
    if (!isCoach && !isMember) return res.status(403).json({ message: 'Kein Zugriff' });
    const catalog = await PenaltyCatalog.find({ team: req.params.teamId }).sort({ name: 1 });
    res.json(catalog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create catalog entry (coach only)
router.post('/team/:teamId/catalog', protect, coach, async (req, res) => {
  try {
    if (!await isCoachOfTeam(req.params.teamId, req.user._id))
      return res.status(403).json({ message: 'Kein Zugriff' });
    const { name, description, amount } = req.body;
    const entry = await PenaltyCatalog.create({ name, description, amount, team: req.params.teamId, createdBy: req.user._id });
    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update catalog entry (coach only)
router.put('/team/:teamId/catalog/:id', protect, coach, async (req, res) => {
  try {
    if (!await isCoachOfTeam(req.params.teamId, req.user._id))
      return res.status(403).json({ message: 'Kein Zugriff' });
    const entry = await PenaltyCatalog.findOneAndUpdate(
      { _id: req.params.id, team: req.params.teamId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!entry) return res.status(404).json({ message: 'Eintrag nicht gefunden' });
    res.json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE catalog entry (coach only)
router.delete('/team/:teamId/catalog/:id', protect, coach, async (req, res) => {
  try {
    if (!await isCoachOfTeam(req.params.teamId, req.user._id))
      return res.status(403).json({ message: 'Kein Zugriff' });
    await PenaltyCatalog.findOneAndDelete({ _id: req.params.id, team: req.params.teamId });
    res.json({ message: 'Eintrag gelöscht' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET assigned penalties for a team (coach + players — all see all)
router.get('/team/:teamId/assigned', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team nicht gefunden' });
    const isCoach = team.coaches.some(c => c.toString() === req.user._id.toString());
    const isMember = team.players.some(p => p.toString() === req.user._id.toString());
    if (!isCoach && !isMember) return res.status(403).json({ message: 'Kein Zugriff' });
    const penalties = await PlayerPenalty.find({ team: req.params.teamId })
      .populate('player', 'name position')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(penalties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST assign penalty to player (coach only)
router.post('/team/:teamId/assign', protect, coach, async (req, res) => {
  try {
    if (!await isCoachOfTeam(req.params.teamId, req.user._id))
      return res.status(403).json({ message: 'Kein Zugriff' });
    const { playerId, catalogEntryId, customName, amount, note } = req.body;
    let penaltyName = customName;
    let penaltyAmount = parseFloat(amount);
    let catalogRef;
    if (catalogEntryId) {
      const entry = await PenaltyCatalog.findById(catalogEntryId);
      if (entry) { penaltyName = entry.name; catalogRef = entry._id; if (!amount) penaltyAmount = entry.amount; }
    }
    if (!penaltyName) return res.status(400).json({ message: 'Strafenname ist erforderlich' });
    if (isNaN(penaltyAmount)) return res.status(400).json({ message: 'Betrag ist erforderlich' });
    const penalty = await PlayerPenalty.create({
      catalogEntry: catalogRef, name: penaltyName, player: playerId,
      team: req.params.teamId, amount: penaltyAmount, note, assignedBy: req.user._id
    });
    const populated = await PlayerPenalty.findById(penalty._id)
      .populate('player', 'name position').populate('assignedBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH toggle paid status (coach only)
router.patch('/assigned/:id/paid', protect, coach, async (req, res) => {
  try {
    const penalty = await PlayerPenalty.findById(req.params.id);
    if (!penalty) return res.status(404).json({ message: 'Strafe nicht gefunden' });
    if (!await isCoachOfTeam(penalty.team, req.user._id))
      return res.status(403).json({ message: 'Kein Zugriff' });
    penalty.isPaid = !penalty.isPaid;
    penalty.paidAt = penalty.isPaid ? new Date() : undefined;
    await penalty.save();
    const populated = await PlayerPenalty.findById(penalty._id)
      .populate('player', 'name position').populate('assignedBy', 'name');
    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE assigned penalty (coach only)
router.delete('/assigned/:id', protect, coach, async (req, res) => {
  try {
    const penalty = await PlayerPenalty.findById(req.params.id);
    if (!penalty) return res.status(404).json({ message: 'Strafe nicht gefunden' });
    if (!await isCoachOfTeam(penalty.team, req.user._id))
      return res.status(403).json({ message: 'Kein Zugriff' });
    await penalty.deleteOne();
    res.json({ message: 'Strafe gelöscht' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
