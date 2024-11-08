const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SeatSchema = new Schema({
    roomID: { type: Schema.Types.ObjectId, ref: 'room', required: true }, // Khóa ngoại tham chiếu đến Room
    movieId: { type: Schema.Types.ObjectId, ref: 'movie', required: true },
    seats: [
        {
            seatNumber: String,      // Ví dụ: '0-1', '1-3', '2-5'
            typeSeatName: String,    // Loại ghế: 'T' (Thường), 'V' (VIP)
            price: Number            // Giá ghế
        }
    ],
    cinemaId: { type: Schema.Types.ObjectId, ref: 'cinema', required: true },
    totalPrice: { type: Number, required: true },
    dateBooked: { type: String, required: true }, // Lưu ngày, ví dụ: '2024-10-15'
    timeBooked: { type: String, required: true }
});

module.exports = mongoose.model('seat', SeatSchema);
