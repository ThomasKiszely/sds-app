const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({
    inflationRate: { type: Number }, // Ingen standard: skal sættes af admin
    environmentalFee: { type: Number }, // Ingen standard: skal sættes af admin
    hourlyRate: { type: Number }, // Ingen standard: skal sættes af admin, ellers fejler oprettelse af planer/tilbud
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
