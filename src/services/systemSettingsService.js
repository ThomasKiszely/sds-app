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
        throw userError("Miljøafgift skal være mellem 0% og 10%.", 400);
    }

    return systemSettingsRepo.updateEnvironmentalFee(value);
}


module.exports = {
    getSettings,
    updateInflationRate,
    updateEnvironmentalFee
};
