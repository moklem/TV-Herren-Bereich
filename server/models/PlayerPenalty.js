const mongoose = require('mongoose');

const PlayerPenaltySchema = new mongoose.Schema({
  catalogEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'PenaltyCatalog' },
  name: { type: String, required: true, trim: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  amount: { type: Number, required: true, min: 0 },
  note: { type: String, trim: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date }
}, { timestamps: true });

PlayerPenaltySchema.index({ team: 1, player: 1 });
PlayerPenaltySchema.index({ team: 1, isPaid: 1 });

module.exports = mongoose.model('PlayerPenalty', PlayerPenaltySchema);
