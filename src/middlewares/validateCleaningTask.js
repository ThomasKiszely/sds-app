const { units } = require("../utils/unitEnum");
const { frequency } = require("../utils/frequencyEnum");

module.exports = function validateCleaningTask(req, res, next) {
    const errors = [];
    const { templateId, frequency: freq, quantity, amount, unit } = req.body;

    // templateId required
    if (!templateId || !templateId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("templateId skal være et gyldigt MongoDB ObjectId.");
    }

    // Frequency enum
    if (!freq || !Object.values(frequency).includes(freq)) {
        errors.push(`frequency skal være en af: ${Object.values(frequency).join(", ")}`);
    }

    // Quantity
    if (quantity !== undefined && (isNaN(quantity) || quantity < 1)) {
        errors.push("quantity skal være et positivt tal (min. 1).");
    }

    // Amount (m2, lbm, stk)
    if (amount !== undefined && (isNaN(amount) || amount < 0)) {
        errors.push("amount skal være et positivt tal.");
    }

    // Unit enum (optional, but must match template)
    if (unit && !Object.values(units).includes(unit)) {
        errors.push(`unit skal være en af: ${Object.values(units).join(", ")}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    next();
};
