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

async function updateSettings(data) {
    const settings = await SystemSettings.findOne();

    if (!settings) {
        return SystemSettings.create(data);
    }

    Object.assign(settings, data);
    settings.lastUpdated = new Date();

    return settings.save();
}

module.exports = {
    getSettings,
    updateSettings
};
