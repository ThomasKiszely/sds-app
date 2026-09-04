const { frequencyMultipliers } = require("./frequencyEnum");
const { categoryTypes } = require("./categoryEnum");

function calculateTaskMonthlyPrice(task, hourlyRate) {

    // ⭐ 1) Forbrugsvarer (pris pr stk)
    if (task.category === categoryTypes.consumables) {
        return {
            duration: 0,
            pricePerTime: Number(task.customPrice ?? 0),
            monthlyPrice: 0
        };
    }

    // ⭐ 2) Ikke-SDS opgaver (pris pr gang)
    // windows, adHoc, efterAftale, extra, deep_cleaning, final_cleaning
    const nonSdsCategories = [
        categoryTypes.windows,
        categoryTypes.adHoc,
        categoryTypes.efterAftale,
        categoryTypes.extra,
        categoryTypes.deep_cleaning,
        categoryTypes.final_cleaning
    ];

    if (nonSdsCategories.includes(task.category)) {
        return {
            duration: task.durationPerUnit ?? 0,
            pricePerTime: Number(task.customPrice ?? 0),
            monthlyPrice: 0
        };
    }

    // ⭐ 3) SDS-opgaver (daily, floor, inventory)
    const quantity = Number(task.quantity ?? 1);
    const amount = Number(task.amount ?? 0);

    let duration = task.durationPerUnit ?? 0;

    if (task.unit === "stk") duration *= quantity;
    if (task.unit === "m2" || task.unit === "lbm") duration *= amount;

    // ⭐ Brug customPrice hvis den er sat
    const hasCustom =
        task.customPrice != null &&
        task.customPrice !== "" &&
        Number(task.customPrice) > 0;

    const pricePerTime = hasCustom
        ? Number(task.customPrice)
        : (duration / 60) * hourlyRate;

    // ⭐ Antal dage pr uge (SDS)
    let weeklyCount = Array.isArray(task.days) ? task.days.length : 0;
    if (weeklyCount === 0) weeklyCount = 1;

    // ⭐ Månedlig frekvens
    const freqMultiplier = frequencyMultipliers[task.frequency] ?? 1;

    // ⭐ Månedspris
    const monthlyPrice = pricePerTime * weeklyCount * freqMultiplier;

    return {
        duration,
        pricePerTime,
        monthlyPrice
    };
}

module.exports = { calculateTaskMonthlyPrice };
