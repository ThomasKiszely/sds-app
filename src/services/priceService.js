// services/priceService.js

const { frequencies, frequencyMultipliers } = require("../utils/frequencyEnum");

// Frekvenser der giver månedlig pris
const monthlyFrequencies = [
    frequencies.weekly,
    frequencies.biweekly,
    frequencies.monthly,
    frequencies.quarterly,
    frequencies.halfyearly,
    frequencies.yearly
];

// Frekvenser der IKKE må tælle med i månedlig pris
const nonMonthlyFrequencies = [
    frequencies.none,
    frequencies.adHoc
];

/**
 * Beregner effektiv multiplier baseret på frekvens og antal dage.
 */
function getEffectiveMultiplier(frequency, days) {
    if (!monthlyFrequencies.includes(frequency)) return 0;

    const base = frequencyMultipliers[frequency] || 0;
    const dayCount = Array.isArray(days) && days.length > 0 ? days.length : 1;

    return base * dayCount;
}

/**
 * Beregner pris for en enkelt task.
 */
function calculateTaskPrice(task, hourlyRate) {

    const amount = Number(task.amount ?? 0);
    const durationPerUnit = Number(task.durationPerUnit ?? 0);
    const frequency = task.frequency || frequencies.none;
    const days = Array.isArray(task.days) ? task.days : [];

    // Varighed i minutter
    const duration = durationPerUnit > 0
        ? round(durationPerUnit * amount)
        : 0;

    // Pris pr. gang (minutter → kr.)
    const pricePerTime = duration > 0
        ? round(duration * (hourlyRate / 60))
        : 0;

    // Grundpris (customPrice > beregnet pris)
    const basePrice =
        task.customPrice != null
            ? Number(task.customPrice)
            : pricePerTime;

    // Månedlig multiplier
    const multiplier = getEffectiveMultiplier(frequency, days);

    // Månedlig pris
    const monthlyPrice = multiplier > 0
        ? round(basePrice * multiplier)
        : 0;

    // Pris pr. gang (kun hvis ikke månedlig)
    const pricePerOccurrence = monthlyPrice > 0 ? 0 : basePrice;

    // Totalpris (månedlig eller pr. gang)
    const totalPrice = monthlyPrice > 0 ? monthlyPrice : 0;

    return {
        duration,
        pricePerTime,
        basePrice,
        monthlyPrice,
        pricePerOccurrence,
        totalPrice,
        frequency
    };
}

/**
 * Beregner totaler for hele planen.
 */
function calculateTotals({ tasks, discountPercent, environmentalFeePercent }) {

    // Subtotal = kun månedlige priser
    const subtotal = tasks.reduce((sum, t) => {

        // Ad hoc / none må IKKE tælle med
        if (nonMonthlyFrequencies.includes(t.frequency)) {
            return sum;
        }

        return sum + (t.monthlyPrice || 0);

    }, 0);

    const discountAmount = round(subtotal * (discountPercent / 100));
    const afterDiscount = subtotal - discountAmount;

    const environmentalFeeAmount = round(afterDiscount * (environmentalFeePercent / 100));

    const total = round(afterDiscount + environmentalFeeAmount);

    return {
        subtotal,
        discountPercent,
        discountAmount,
        environmentalFeePercent,
        environmentalFeeAmount,
        total
    };
}

/**
 * Stabil rounding.
 */
function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = {
    calculateTaskPrice,
    calculateTotals
};
