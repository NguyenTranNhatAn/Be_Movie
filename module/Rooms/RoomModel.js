const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const RoomSchema = new Schema({
    name: { type: String, require: true },
    totalSeat: { type: Number, default: 0 },
    roomShape: String,// Layout ghế
    cinema_id: { type: ObjectId, ref: 'cinema' },
     
});

module.exports = mongoose.model('room', RoomSchema);