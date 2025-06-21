const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: String,
    name: String,
    password: String,
    otp: Number,
    createdAt: Date,
    expiresAt: Date
});

module.exports = mongoose.model('Otp', OtpSchema)