const mongoose = require('mongoose');
const Schema= mongoose.Schema;
const ObjectId = Schema.ObjectId;
const MovieSchema= new Schema({
    name:{type: String, require: true},
    duration:{ type: Date, default: Date.now() },
    release_date:{ type: Date, default: Date.now() },
    trailer:String,
    images:[Object],
    description:String,
    rating:Number,
    genreId :{type: ObjectId, ref:'genre'}
    
});

module.exports= mongoose.model('movie', MovieSchema);