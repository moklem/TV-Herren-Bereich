const mongoose = require('mongoose');

const PenaltyCatalogSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  amount: { type: Number, required: true, min: 0 },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PenaltyCatalog', PenaltyCatalogSchema);
