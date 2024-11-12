// models/Combo.js
const mongoose = require('mongoose');

const ComboSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  description: { type: String, required: true },
  note: { type: String },
  image: { type: String },
  quantity: { type: Number, default: 0 }, // Số lượng ban đầu là 0
});

module.exports = mongoose.model('Combo', ComboSchema);
