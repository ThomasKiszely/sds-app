const systemSettingsRepo = require("../data/systemSettingsRepo");
const { userError } = require("../utils/userError");

async function getSettings() {
    return systemSettingsRepo.getSettings();
}

// Øvre grænse for den årlige indeksregulering (i procent). Reguleringen hæver
// alle aktive planers timepris, så grænsen forhindrer tastefejl i at give store stigninger.
const MAX_INFLATION_PERCENT = 10;

// Tager imod procent (fx 2.5 eller "2,5") og gemmer som brøk (0.025)
async function updateInflationRate(ratePercent) {
    const raw = String(ratePercent ?? "").trim().replace(",", ".");
    const percent = Number(raw);

    if (raw === "" || isNaN(percent) || percent < 0 || percent > MAX_INFLATION_PERCENT) {
        throw userError(`Indeksregulering skal være mellem 0% og ${MAX_INFLATION_PERCENT}%.`, 400);
    }

    return systemSettingsRepo.updateSettings({
        inflationRate: Math.round(percent * 100) / 10000
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
    MAX_INFLATION_PERCENT,
    getSettings,
    updateInflationRate,
    updateEnvironmentalFee,
    updateHourlyRate
};
