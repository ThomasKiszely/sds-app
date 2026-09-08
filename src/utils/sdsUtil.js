function frequencyDigit(freq) {
    switch (freq) {
        case "daily":        // daglig
            return 5;
        case "weekly":       // ugentlig
            return 1;
        case "biweekly":     // hver 14. dag
            return 0;
        case "monthly":      // månedlig
            return 0;
        default:
            return 0;
    }
}

function sdsDigitFromDays(days) {
    if (!Array.isArray(days)) return 0;
    return days.length;
}

module.exports = {
    frequencyDigit,
    sdsDigitFromDays
};

