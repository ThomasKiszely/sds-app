const { userError } = require("../utils/userError");
const { frequencies } = require("../utils/frequencyEnum");
const { categoryTypes } = require("../utils/categoryEnum");
const { days } = require("../utils/dayEnum");
const { units } = require("../utils/unitEnum");

module.exports = function validateCleaningTask(req, res, next) {
    const errors = [];
    const {
        planId,
        templateId,
        name,
        roomName,
        quantity,
        amount,
        category,
        frequency,
        durationPerUnit,
        customPrice,
        days: selectedDays,
        description,
        unit
    } = req.body;

    // ⭐ Required i modellen
    if (!planId || !planId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("planId skal være et gyldigt MongoDB ObjectId.");
    }

    if (!templateId || !templateId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("templateId skal være et gyldigt MongoDB ObjectId.");
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        errors.push("Navn er påkrævet.");
    }

    if (!category || !Object.values(categoryTypes).includes(category)) {
        errors.push("category skal være en gyldig kategori.");
    }

    // ⭐ unit (required i modellen)
    if (!unit || !Object.values(units).includes(unit)) {
        errors.push("unit skal være en gyldig enhed.");
    }

    // ⭐ durationPerUnit (required for non-consumables)
    if (category !== categoryTypes.consumables) {
        const dur = Number(durationPerUnit);
        if (isNaN(dur) || dur < 0) {
            errors.push("durationPerUnit skal være et positivt tal.");
        }
    }

    // ⭐ frequency (required for non-consumables)
    if (category !== categoryTypes.consumables) {
        if (!frequency || !Object.values(frequencies).includes(frequency)) {
            errors.push("frequency skal være en gyldig frekvens.");
        }
    }

    // ⭐ Optional felter – valider kun hvis de er til stede
    if (roomName !== undefined && typeof roomName !== "string") {
        errors.push("roomName skal være en tekststreng.");
    }

    if (quantity !== undefined && (isNaN(quantity) || quantity < 0)) {
        errors.push("quantity skal være et positivt tal.");
    }

    if (amount !== undefined && (isNaN(amount) || amount < 0)) {
        errors.push("amount skal være et positivt tal.");
    }

    if (customPrice !== undefined && customPrice !== null) {
        const cp = Number(customPrice);
        if (isNaN(cp) || cp < 0) {
            errors.push("customPrice skal være et positivt tal.");
        }
    }

    if (selectedDays !== undefined) {
        if (!Array.isArray(selectedDays)) {
            errors.push("days skal være en liste.");
        } else {
            for (const d of selectedDays) {
                if (!Object.values(days).includes(d)) {
                    errors.push(`Ugyldig dag: ${d}`);
                }
            }
        }
    }

    if (description !== undefined && typeof description !== "string") {
        errors.push("description skal være en tekststreng.");
    }

    if (errors.length > 0) {
        throw userError(errors.join("<br>"), 400);
    }

    next();
};
