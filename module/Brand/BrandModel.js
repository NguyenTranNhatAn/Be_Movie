
const mongoose = require('mongoose');
const Schema= mongoose.Schema;
const BrandSchema= new Schema({
    name:{type: String, require: true},
    logo:{type:String, require:true},
    description:{type:String,require:true},
    status:Boolean
    
});

module.exports= mongoose.model('brand', BrandSchema);