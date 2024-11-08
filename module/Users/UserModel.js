const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    name: { type: String, require: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, unique: true },
    password: { type: String, require: true },
    address: { type: String, require: true },
    otp: { type: String },          // OTP tạm thời
    isVerified: { type: Boolean, default: false }, // Trạng thái xác thực
});

module.exports = mongoose.model('user', UserSchema)