
const mongoose = require('mongoose');
const Schema= mongoose.Schema;
const ObjectId = Schema.ObjectId;
const CinemaSchema= new Schema({
    name:{type: String, require: true},
    address:{type:String, require:true},
    brandId: {type:ObjectId,ref:'brand'},
    status:Boolean
    
});

module.exports= mongoose.model('cinema', CinemaSchema);