const { frequency } = require('./frequencyEnum');
const { units } = require('./unitEnum');
const { categoryTypes } = require('./categoryEnum');

// Skal måske tilrettes - spørg Jakob
function getFrequencyMultiplier(freq) {
    switch (freq) {
        case frequency.daily: return 21;
        case frequency.weekly: return 4.33;
        case frequency.biweekly: return 2.165;
        case frequency.monthly: return 1;
        case frequency.bimonthly: return 0.5;
        case frequency.quarterly: return 1 / 3;
        case frequency.semiannual: return 1 / 6;
        case frequency.annual: return 1 / 12;
        default: return 1;
    }
}


function calculateUnitPrice({ unit, price, amount = 0, quantity = 0 }) {
    switch (unit) {
        case units.none:
            return price;
        case units.m2:
            return amount * price;
        case units.lbm:
            return amount * price;
        case units.pcs:
            return quantity * price;
        default:
            return price;
    }
}


function adjustForCategory({ category, basePrice, frequencyMultiplier }) {
    switch (category) {
        case categoryTypes.windows:
        case categoryTypes.extra:
        case categoryTypes.special:
            return basePrice; // pr. gang
        case categoryTypes.consumable:
            return basePrice * 1; // fast pr. måned
        case categoryTypes.daily:
            return basePrice * frequencyMultiplier; // daglig drift
        default:
            return basePrice * frequencyMultiplier;
    }
}


function calculateTaskTotalPrice({ unit, category, price, amount, quantity, frequency }) {
    const frequencyMultiplier = getFrequencyMultiplier(frequency);

    const basePrice = calculateUnitPrice({
        unit,
        price,
        amount,
        quantity
    });

    const finalPrice = adjustForCategory({
        category,
        basePrice,
        frequencyMultiplier
    });

    return Number(finalPrice.toFixed(2));
}

module.exports = {
    getFrequencyMultiplier,
    calculateUnitPrice,
    adjustForCategory,
    calculateTaskTotalPrice
};
