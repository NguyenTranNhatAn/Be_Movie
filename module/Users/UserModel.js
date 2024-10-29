const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const UserSchema = new Schema({
    name: { type: String, require: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, require: true },
    address: { type: String, require: true },
    wishlist:[{type:ObjectId,ref:'movie'}],
    

});

module.exports = mongoose.model('user', UserSchema)