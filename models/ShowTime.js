//D:\Be_Movie\models\ShowTime.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId; // Thêm dòng này để khai báo ObjectId
const ShowTimeSchema = new Schema({
    movieId: { type: Schema.Types.ObjectId, ref: 'movie', required: true }, // Tham chiếu đến Movie
    roomId: { type: Schema.Types.ObjectId, ref: 'room', required: true }, // Tham chiếu đến Room
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    day: { type: String, required: true },
    Room_Shape: { type: String, required: true },// Layout ghế của phòng
    seatTypes: [{ type: ObjectId, ref: 'typeSeat' }],// Liên kết với loại ghế
});

// module.exports = mongoose.model('showtime', ShowTimeSchema);
module.exports = mongoose.model('showtime', ShowTimeSchema);
