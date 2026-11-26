const mongoose = require('mongoose');
const { userRoles } = require('../utils/userRoles');

const { areas } = require('../utils/areas');
const { weekDays } = require('../utils/weekDays');

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;


const workHoursSchema = new mongoose.Schema({
    day: { type: String, enum: Object.values(weekDays), required: true },
    from: { type: String, match: timePattern, required: true },
    to: { type: String, match: timePattern, required: true },
}, { _id: false });

const employmentSchema = new mongoose.Schema({
    hoursPerWeek: { type: Number, min: 0, max: 500 },
    startDate: { type: Date },
    workHours: [workHoursSchema],
    areas: [{ type: String, enum: Object.values(areas) }],
}, { _id: false });

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    position: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    address: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(userRoles), required: true },
    // Ansættelsesoplysninger – bruges til planlægning af medarbejdere.
    // Alle felter er valgfri, så eksisterende brugere stadig er gyldige.
    employment: { type: employmentSchema, default: undefined },
    mustChangePassword: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);