const systemSettingsRepo = require("../data/systemSettingsRepo");

async function getSettings() {
    return systemSettingsRepo.getSettings();
}

async function updateInflationRate(rate) {
    const value = Number(rate);

    if (isNaN(value) || value < 0 || value > 0.20) {
        throw new Error("Inflation skal være mellem 0% og 20%.");
    }

    return systemSettingsRepo.updateSettings({
        inflationRate: value
    });
}

module.exports = {
    getSettings,
    updateInflationRate
};
