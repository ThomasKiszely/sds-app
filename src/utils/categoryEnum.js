// SDS-opgaver (daily, floor, inventory) har frekvens og månedlig pris.
// Alle andre kategorier har pris pr gang eller pr stk.

module.exports.categoryTypes = {
    daily: "daily",
    floor: "floor",
    inventory: "inventory",
    windows: "windows",
    adHoc: "adHoc",
    efterAftale: "efterAftale",
    extra: "extra",
    consumables: "consumables",
    deep_cleaning: "deep_cleaning",
    final_cleaning: "final_cleaning"
};

module.exports.categoryLabels = {
    daily: "Daglig",
    floor: "Gulv",
    inventory: "Inventar",
    windows: "Vinduespudsning",
    adHoc: "Ad hoc",
    efterAftale: "Efter aftale",
    extra: "Ekstra",
    consumables: "Forbrugsvare",
    deep_cleaning: "Hovedrengøring",
    final_cleaning: "Slutrengøring"
};
