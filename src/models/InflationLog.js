const mongoose = require('mongoose');

const InflationLogSchema = new mongoose.Schema({
    year: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    rate: { type: Number, required: true }
});

module.exports = mongoose.model('InflationLog', InflationLogSchema);
