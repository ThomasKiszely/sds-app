const { frequencyMultipliers } = require("./frequencyEnum");
const { categoryTypes } = require('./categoryEnum');

function calculateTaskMonthlyPrice(task, hourlyRate) {
    // Forbrugsvarer: ingen månedspris
    if (task.category === categoryTypes.consumables) {
        return {
            duration: 0,
            pricePerTime: Number(task.customPrice),   // pris pr stk
            monthlyPrice: 0                           // tilkøb → ikke i total
        };
    }

    // ⭐ Almindelige opgaver (som før)
    const quantity = Number(task.quantity ?? 1);
    const amount = Number(task.amount ?? 0);

    let duration = task.durationPerUnit;
    if (task.unit === "stk") duration *= quantity;
    if (task.unit === "m2" || task.unit === "lbm") duration *= amount;

    const pricePerTime = task.customPrice != null
        ? Number(task.customPrice)
        : (duration / 60) * hourlyRate;

    const freqMultiplier = frequencyMultipliers[task.frequency] ?? 1;

    const monthlyPrice = pricePerTime * freqMultiplier;

    return {
        duration,
        pricePerTime,
        monthlyPrice
    };
}


module.exports = { calculateTaskMonthlyPrice };
