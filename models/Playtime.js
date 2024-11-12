const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const PlaytimeSchema = new Schema({
    movie_id: { type: ObjectId, ref: 'movie', required: true },
    cinema_id: [{ type: ObjectId, ref: 'cinema', required: true }], // Định nghĩa là mảng ObjectId
    room_id: [{ type: ObjectId, ref: 'room', required: true }],     // Định nghĩa là mảng ObjectId
    format: { type: String, required: true },
    dates: [
        {
            date: { type: Date, required: true },
            times: [{ type: String, required: true }]
        }
    ]
});

module.exports = mongoose.model('playtime', PlaytimeSchema);
