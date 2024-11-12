const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const PlaytimeSchema = new Schema({
    movie_id: { type: ObjectId, ref: 'movie', required: true }, // Liên kết với phim
    cinema_id: { type: ObjectId, ref: 'cinema', required: true }, // Liên kết với rạp chiếu
    room_id: { type: ObjectId, ref: 'room', required: true }, // Liên kết với phòng chiếu
    format: { type: String, required: true }, // Định dạng phim (ví dụ: 2D, 3D, phụ đề)
    dates: [{ // Mảng chứa các ngày chiếu và giờ chiếu trong ngày
        date: { type: Date, required: true }, // Ngày chiếu
        times: [{ type: String, required: true }] // Mảng các giờ chiếu
    }]
});

module.exports = mongoose.model('playtime', PlaytimeSchema);
