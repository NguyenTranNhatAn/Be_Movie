const mongoose = require('mongoose');
const Schema= mongoose.Schema;
const ObjectId = Schema.ObjectId;
const MovieSchema= new Schema({
    name:{type: String, require: true},
    duration:String,
    release_date:Date,
    trailer:String,
    images:[Object],
    description:String,
    rating:Number,
    genreId :{type: ObjectId, ref:'genre'}
    
});

module.exports= mongoose.model('movie', MovieSchema);