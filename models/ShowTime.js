const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShowTimeSchema = new Schema({
    movieId: { type: Schema.Types.ObjectId, ref: 'movie', required: true }, // Tham chiếu đến Movie
    roomId: { type: Schema.Types.ObjectId, ref: 'room', required: true }, // Tham chiếu đến Room
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    day: { type: String, required: true },
    Room_Shape: { type: String, required: true }  // Layout ghế của phòng
});

module.exports = mongoose.model('showTime', ShowTimeSchema);
