const { frequencies } = require("../utils/frequencyEnum");
const { categoryTypes } = require("../utils/categoryEnum");

module.exports = function validateCleaningTask(req, res, next) {
    const errors = [];
    const { templateId, roomName, quantity, amount, category } = req.body;

    // templateId
    if (!templateId || !templateId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("templateId skal være et gyldigt MongoDB ObjectId.");
    }

    // ⭐ roomName kun required for ikke-forbrugsvarer
    if (category !== categoryTypes.consumables) {
        if (!roomName || typeof roomName !== "string" || roomName.trim().length === 0) {
            errors.push("roomName skal være en ikke-tom tekststreng.");
        }
    }

    // quantity
    if (quantity !== undefined && (isNaN(quantity) || quantity < 1)) {
        errors.push("quantity skal være et positivt tal (min. 1).");
    }

    // amount kun relevant for SDS-opgaver
    if (category !== categoryTypes.consumables) {
        if (amount !== undefined && (isNaN(amount) || amount < 0)) {
            errors.push("amount skal være et positivt tal.");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};
