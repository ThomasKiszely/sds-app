// SDS-opgaver bruger weekly, biweekly, monthly.
// Alt andet bruger none, adHoc, windows, efterAftale — som IKKE påvirker pris.

module.exports.frequencies = {
    weekly: "weekly",
    biweekly: "biweekly",
    monthly: "monthly",
    quarterly: "quarterly",
    halfyearly: "halfyearly",
    yearly: "yearly",
    none: "none",
    adHoc: "adHoc",
};

module.exports.frequencyMultipliers = {
    weekly: 4.3,
    biweekly: 2.15,
    monthly: 1,
    quarterly: 0.25,
    halfyearly: 0.125,
    yearly: 0.0833,
    none: 0,
    adHoc: 0,
};

module.exports.frequencyLabels = {
    weekly: "Ugentlig",
    biweekly: "Hver anden uge",
    monthly: "Månedlig",
    quarterly: "Kvartalsvis",
    halfyearly: "Halvårlig",
    yearly: "Årlig",
    none: "Ingen fast frekvens",
    adHoc: "Ad hoc",
};
