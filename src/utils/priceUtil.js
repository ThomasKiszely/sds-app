const { frequencyMultipliers } = require("./frequencyEnum");

function calculateTaskMonthlyPrice(task, hourlyRate) {
    const quantity = Number(task.quantity ?? 1);
    const amount = Number(task.amount ?? 0);

    // Varighed pr gang
    let duration = task.durationPerUnit;
    if (task.unit === "stk") duration *= quantity;
    if (task.unit === "m2" || task.unit === "lbm") duration *= amount;

    // Pris pr gang
    const pricePerTime = task.customPrice != null
        ? Number(task.customPrice)
        : (duration / 60) * hourlyRate;

    // Frekvens
    const freqMultiplier = frequencyMultipliers[task.frequency] ?? 1;

    // Pris pr måned (KORREKT)
    const monthlyPrice = pricePerTime * freqMultiplier;

    return {
        duration,
        pricePerTime,
        monthlyPrice
    };
}

module.exports = { calculateTaskMonthlyPrice };
