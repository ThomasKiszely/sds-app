const SystemSettings = require("../models/SystemSettings");

async function getSettings() {
    let settings = await SystemSettings.findOne().lean();

    // Hvis der ikke findes settings, opret standard
    if (!settings) {
        settings = await SystemSettings.create({});
        return settings.toObject();
    }

    return settings;
}

// Bruges KUN til inflation
async function updateSettings(data) {
    const settings = await SystemSettings.findOne();

    if (!settings) {
        return SystemSettings.create(data);
    }

    Object.assign(settings, data);

    // ✔ inflation må opdatere lastUpdated
    settings.lastUpdated = new Date();

    return settings.save();
}

// Bruges til miljøafgift
async function updateEnvironmentalFee(value) {
    const settings = await SystemSettings.findOne();

    if (!settings) {
        return SystemSettings.create({ environmentalFee: value });
    }

    // ✔ miljøafgift må IKKE ændre lastUpdated
    settings.environmentalFee = value;

    return settings.save();
}

module.exports = {
    getSettings,
    updateSettings,
    updateEnvironmentalFee
};
