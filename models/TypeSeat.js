const mongoose = require('mongoose');

const TypeSeatSchema = new mongoose.Schema({
    typeSeatName: {
        type: String,
        required: true,
        enum: ['V', 'T', 'D'] // V: Vip, T: thường, D: đôi
    },
    cinemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'cinema', required: true }, // Liên kết đến Cinema
    typeSeatPrice: { type: Number, required: true }
});

module.exports = mongoose.model('typeSeat', TypeSeatSchema);
