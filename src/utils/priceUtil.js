const { frequencies, frequencyMultipliers } = require("./frequencyEnum");

function calculateTaskMonthlyPrice(task, hourlyRate) {
    const amount = Number(task.amount ?? 0);
    const durationPerUnit = Number(task.durationPerUnit ?? 0);
    const quantity = Number(task.quantity ?? 1);

    // samlet minutter pr gang
    const minutesPerTime = durationPerUnit * amount * quantity;
    const hoursPerTime = minutesPerTime / 60;

    const pricePerTimeFromRate = hoursPerTime * Number(hourlyRate ?? 0);

    // hvis der er customPrice → brug den pr gang
    const pricePerTime = task.customPrice != null
        ? Number(task.customPrice)
        : pricePerTimeFromRate;

    // ⭐ ANTAL DAGE
    const daysCount = Array.isArray(task.days) ? task.days.length : 0;

    let monthlyPrice = 0;

    // ⭐ FREKVENS + DAGE
    if (task.frequency && frequencyMultipliers[task.frequency]) {
        monthlyPrice = pricePerTime * frequencyMultipliers[task.frequency] * daysCount;
    }

    // "efterAftale" → ingen månedlig pris, kun pris pr gang
    if (task.frequency === frequencies.efterAftale) {
        monthlyPrice = 0;
    }

    return {
        monthlyPrice,
        pricePerTime
    };
}

module.exports = {
    calculateTaskMonthlyPrice
};
