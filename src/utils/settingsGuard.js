const { userError } = require("./userError");

// Der findes bevidst ingen standardværdier for timepris, drift- og miljøtillæg og
// indeksregulering: er de ikke sat, skal det give en fejl, så man ikke ubemærket
// laver tilbud eller regulerer priser på et gæt (det kan koste firmaet penge).

function isMissing(value) {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function assertHourlyRate(hourlyRate) {
    const value = Number(hourlyRate);
    if (isMissing(hourlyRate) || !Number.isFinite(value) || value <= 0) {
        throw userError("Timeprisen er ikke sat. Angiv en timepris under Admin → Systemindstillinger, før du opretter planer eller tilbud.", 400);
    }
    return value;
}

// 0 % er en gyldig værdi, men "ikke sat" er det ikke
function assertEnvironmentalFee(environmentalFee) {
    const value = Number(environmentalFee);
    if (isMissing(environmentalFee) || !Number.isFinite(value) || value < 0) {
        throw userError("Drift- og miljøtillægget er ikke sat. Angiv det under Admin → Systemindstillinger, før du opretter planer eller tilbud.", 400);
    }
    return value;
}

function assertInflationRate(inflationRate) {
    const value = Number(inflationRate);
    if (isMissing(inflationRate) || !Number.isFinite(value) || value < 0) {
        throw userError("Indeksreguleringen er ikke sat. Angiv den under Admin → Systemindstillinger.", 400);
    }
    return value;
}

module.exports = { assertHourlyRate, assertEnvironmentalFee, assertInflationRate };
