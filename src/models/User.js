const mongoose = require('mongoose');
const { userRoles } = require('../utils/userRoles');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(userRoles), default: userRoles.user, required: true },
    mustChangePassword: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);