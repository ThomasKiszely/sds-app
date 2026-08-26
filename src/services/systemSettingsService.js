const systemSettingsRepo = require("../data/systemSettingsRepo");
const { userError } = require("../utils/userError");

async function getSettings() {
    return systemSettingsRepo.getSettings();
}

async function updateInflationRate(rate) {
    const value = Number(rate);

    if (isNaN(value) || value < 0 || value > 0.20) {
        throw userError("Inflation skal være mellem 0% og 20%.", 400);
    }

    return systemSettingsRepo.updateSettings({
        inflationRate: value
    });
}

async function updateEnvironmentalFee(rate) {
    const value = Number(rate);

    if (isNaN(value) || value < 0 || value > 10) {
        throw userError("Drift- og miljøtillæg skal være mellem 0% og 10%.", 400);
    }

    return systemSettingsRepo.updateEnvironmentalFee(value);
}

async function updateHourlyRate(rate) {
    const value = Number(rate);

    if (isNaN(value) || value < 0 || value > 2000) {
        throw userError("Timepris skal være mellem 0 og 2000 kr.", 400);
    }

    return systemSettingsRepo.updateHourlyRate(value);
}


module.exports = {
    getSettings,
    updateInflationRate,
    updateEnvironmentalFee,
    updateHourlyRate
};
