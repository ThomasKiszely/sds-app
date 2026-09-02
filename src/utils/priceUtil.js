const { frequencyMultipliers } = require("./frequencyEnum");
const { categoryTypes } = require("./categoryEnum");

function calculateTaskMonthlyPrice(task, hourlyRate) {

    // ⭐ Forbrugsvarer: ingen månedspris
    if (task.category === categoryTypes.consumables) {
        return {
            duration: 0,
            pricePerTime: Number(task.customPrice),
            monthlyPrice: 0
        };
    }

    // ⭐ Ad hoc / engangsopgaver
    if (task.frequency === "adHoc" || task.frequency === "efterAftale") {
        return {
            duration: task.durationPerUnit,
            pricePerTime: Number(task.customPrice ?? 0),
            monthlyPrice: 0
        };
    }

    // ⭐ Almindelige faste opgaver
    const quantity = Number(task.quantity ?? 1);
    const amount = Number(task.amount ?? 0);

    let duration = task.durationPerUnit;
    if (task.unit === "stk") duration *= quantity;
    if (task.unit === "m2" || task.unit === "lbm") duration *= amount;

    // ⭐ Brug kun customPrice hvis den er > 0
    const hasCustom =
        task.customPrice != null &&
        task.customPrice !== "" &&
        Number(task.customPrice) > 0;

    const pricePerTime = hasCustom
        ? Number(task.customPrice)
        : (duration / 60) * hourlyRate;

    // ⭐ Antal dage pr uge
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
