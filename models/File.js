const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('File', fileSchema);
