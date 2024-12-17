const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    // seatDetails: { type: [String], required: true }, // Mảng chứa thông tin các ghế, ví dụ: ["A1 100k", "A2 100k"]
    seatsDetails: [
        {
            seatName: { type: String, required: true },
            price: { type: Number, required: true }
        }
    ],
    totalPrice: { type: Number, required: true }, // Tổng giá vé
    cinemaName: { type: String, required: true },
    //showtime
    roomName: { type: String, required: true },
    showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'showtime', required: true }, // OK
    showDate: { type: Date, required: true },
    movieName: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'paid', 'canceled'], default: 'pending' }, // Trạng thái vé
    qrCode: { type: String },// Lưu mã QR nếu cần, có thể để trống ban đầu,
    orderCode: { type: Number, unique: true }, // Thêm mã orderCode duy nhất
    createdAt: { type: Date, default: Date.now },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'movie', required: true },
    combos: [
        {
            comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo', required: true },
            quantity: { type: Number, required: true }
        }
    ],
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'room', required: true }, // Ref đến Room
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;

