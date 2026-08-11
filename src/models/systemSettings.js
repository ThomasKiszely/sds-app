const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({
    inflationRate: { type: Number, default: 0.025 }, // 2.5%
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
