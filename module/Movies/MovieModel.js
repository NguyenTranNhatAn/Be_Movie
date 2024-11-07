const mongoose = require('mongoose');
const Schema= mongoose.Schema;
const ObjectId = Schema.ObjectId;
const MovieSchema= new Schema({
    name:{type: String, require: true},
    duration:{ type: String, require:true },
    release_date:{ type: Date, default: Date.now() },
    trailer:String,
    images:[Object],
    description:String,
    rating:Number,
    genreId :{type: ObjectId, ref:'genre'},
    status:Boolean    
});

module.exports= mongoose.model('movie', MovieSchema);