const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({
    inflationRate: { type: Number, default: 0.025 }, // 2.5%
    environmentalFee: { type: Number, default: 1.0 }, // 1%
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
