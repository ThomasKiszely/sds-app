const { frequency } = require('./frequencyEnum');
const { units } = require('./unitEnum');
const { categoryTypes } = require('./categoryEnum');


function countDays(daysArray) {
    return Array.isArray(daysArray) ? daysArray.length : 0;
}


 // Frekvens-multiplikator (antal gange pr. år)
 // Standard i rengøringsbranchen.

function getFrequencyMultiplier(freq) {
    switch (freq) {
        case frequency.weekly: return 52;
        case frequency.biweekly: return 26;
        case frequency.monthly: return 12;
        case frequency.bimonthly: return 6;
        case frequency.quarterly: return 4;
        case frequency.semiannual: return 2;
        case frequency.annual: return 1;
        default: return 1;
    }
}



 // Enhedsbaseret prislogik.

function calculateUnitPrice({ unit, price, amount = 0, quantity = 0 }) {
    switch (unit) {
        case units.m2:
        case units.lbm:
            return amount * price;      // m² eller lbm × pris
        case units.stk:
            return quantity * price;    // stk × pris
        case units.ingen:
        default:
            return price;               // fast pris
    }
}


// Samlet prisberegning (årsbaseret)

function calculateTaskTotalPrice({ unit, category, price, amount, quantity, frequency, days }) {

    const basePrice = calculateUnitPrice({ unit, price, amount, quantity });

    const freqMultiplier = getFrequencyMultiplier(frequency);

    const dayCount = countDays(days);

    // Forbrugsvare er stadig månedlig
    if (category === categoryTypes.consumables) {
        return basePrice * 12;
    }

    // Alle andre kategorier
    return basePrice * freqMultiplier * dayCount;
}


module.exports = {
    getFrequencyMultiplier,
    calculateUnitPrice,
    calculateTaskTotalPrice
};
