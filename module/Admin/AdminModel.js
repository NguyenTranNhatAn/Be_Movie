const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AdminSchema = new Schema({
    name: { type: String, require: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, require: true },
   

});

module.exports = mongoose.model('admin', AdminSchema)