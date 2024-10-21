const mongoose = require('mongoose');
const Schema= mongoose.Schema;
const ObjectId = Schema.ObjectId;
const ReviewSchema= new Schema({
    comment:{type: String, require: true},
    rating:{type:Number, require:true},
    userId :{type: ObjectId, ref:'user'},
    movieId :{type: ObjectId, ref:'movie'}
    
});

module.exports= mongoose.model('review', ReviewSchema);