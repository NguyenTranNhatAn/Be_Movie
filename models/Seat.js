const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SeatSchema = new Schema({
    roomID: { type: Schema.Types.ObjectId, ref: 'room', required: true }, // Khóa ngoại tham chiếu đến Room
    seatNumber: { type: String, required: true },
    status: { type: String, enum: ['A', 'R', 'U'], required: true }, // A: Available, R: Reserved, U: Booked
    typeSeatId: { type: Schema.Types.ObjectId, ref: 'typeSeat', required: true } // Tham chiếu đến TypeSeat
});

module.exports = mongoose.model('seat', SeatSchema);
