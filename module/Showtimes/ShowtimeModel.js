
const mongoose = require('mongoose');
const Schema= mongoose.Schema;
const ObjectId = Schema.ObjectId;
const ShowtimeSchema= new Schema({
    movieId: { type: Schema.Types.ObjectId, ref: 'movie', required: true }, // Tham chiếu đến Movie
    roomId: { type: Schema.Types.ObjectId, ref: 'room', required: true }, // Tham chiếu đến Room
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    day: { type: Date, required: true },
    Room_Shape: { type: String, required: true } 
    
});

module.exports= mongoose.model('showtim', ShowtimeSchema);