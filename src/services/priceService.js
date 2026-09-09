// services/priceService.js

const { frequencies, frequencyMultipliers } = require("../utils/frequencyEnum");

const monthlyFrequencies = [
    frequencies.weekly,
    frequencies.biweekly,
    frequencies.monthly,
    frequencies.quarterly,
    frequencies.halfyearly,
    frequencies.yearly
];

function getEffectiveMultiplier(frequency, days) {
    const base = frequencyMultipliers[frequency] || 0;
    const dayCount = Array.isArray(days) && days.length > 0 ? days.length : 1;
    return monthlyFrequencies.includes(frequency) ? base * dayCount : 0;
}

function calculateTaskPrice(task, hourlyRate) {

    const amount = Number(task.amount ?? 0);
    const durationPerUnit = Number(task.durationPerUnit ?? 0);
    const frequency = task.frequency || null;
    const days = task.days || [];

    const multiplier = getEffectiveMultiplier(frequency, days);

    const duration =
        durationPerUnit > 0
            ? durationPerUnit * amount
            : 0;

    const pricePerTime =
        durationPerUnit > 0
            ? duration * (hourlyRate / 60)
            : 0;

    let basePrice;

    if (durationPerUnit > 0) {
        basePrice =
            task.customPrice != null
                ? Number(task.customPrice)
                : pricePerTime;
    } else {
        basePrice =
            task.customPrice != null
                ? Number(task.customPrice)
                : 0;
    }

    const monthlyPrice =
        multiplier > 0
            ? basePrice * multiplier
            : 0;

    const pricePerOccurrence =
        monthlyPrice > 0
            ? 0
            : basePrice;

    const totalPrice =
        monthlyPrice > 0
            ? monthlyPrice
            : basePrice;

    return {
        duration,
        pricePerTime,
        basePrice,
        monthlyPrice,
        pricePerOccurrence,
        totalPrice
    };
}

module.exports = {
    calculateTaskPrice
};
