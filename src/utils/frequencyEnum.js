// Frekvenser med multiplier bidrager til den månedlige pris.
// De er udregnet ud fra 52 uger og ugentligt er så 52/12 = 4.3
// Hveranden er 26/12, månedlig 12/12, kvartalsvis er 4/12, halvårlig er 2/12 osv
// none og adHoc behandles som enkeltstående opgaver og indgår ikke i månedlige totaler.

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
    biweekly: 2.17,
    monthly: 1,
    quarterly: 0.33,
    halfyearly: 0.167,
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
