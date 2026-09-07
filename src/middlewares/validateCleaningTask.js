const { userError } = require("../utils/userError");

module.exports = function validateCleaningTask(req, res, next) {
    const errors = [];
    const {
        planId,
        templateId,
        name,
        customPrice
    } = req.body;

    // ⭐ planId
    if (!planId || !planId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("planId skal være et gyldigt MongoDB ObjectId.");
    }

    // ⭐ templateId
    if (!templateId || !templateId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("templateId skal være et gyldigt MongoDB ObjectId.");
    }

    // ⭐ name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
        errors.push("Navn er påkrævet.");
    }

    // ⭐ customPrice (valgfrit)
    if (customPrice !== undefined && customPrice !== null) {
        const cp = Number(customPrice);
        if (isNaN(cp) || cp < 0) {
            errors.push("customPrice skal være et positivt tal.");
        }
    }

    if (errors.length > 0) {
        throw userError(errors.join("<br>"), 400);
    }

    next();
};
