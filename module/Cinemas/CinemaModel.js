
const mongoose = require('mongoose');
const Schema= mongoose.Schema;
const CinemaSchema= new Schema({
    name:{type: String, require: true},
    address:{type:String, require:true}
    
});

module.exports= mongoose.model('cinema', CinemaSchema);