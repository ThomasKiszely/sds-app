// SDS-opgaver bruger weekly, biweekly, monthly.
// Alt andet bruger none, adHoc, windows, efterAftale — som IKKE påvirker pris.

module.exports.frequencies = {
    weekly: "weekly",
    biweekly: "biweekly",
    monthly: "monthly",
    none: "none",
    adHoc: "adHoc",
    windows: "windows",
    efterAftale: "efterAftale"
};

module.exports.frequencyMultipliers = {
    weekly: 4,
    biweekly: 2,
    monthly: 1,
    none: 0,
    adHoc: 0,
    windows: 0,
    efterAftale: 0
};

module.exports.frequencyLabels = {
    weekly: "Ugentlig",
    biweekly: "Hver anden uge",
    monthly: "Månedlig",
    none: "Ingen fast frekvens",
    adHoc: "Ad hoc",
    windows: "Vinduespudsning",
    efterAftale: "Efter aftale"
};
