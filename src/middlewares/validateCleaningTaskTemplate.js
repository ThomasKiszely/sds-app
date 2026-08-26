const { categoryTypes } = require("../utils/categoryEnum");
const { units } = require("../utils/unitEnum");
const { frequencies } = require("../utils/frequencyEnum");

module.exports = function validateCleaningTaskTemplate(req, res, next) {
    const errors = [];
    const { name, description, category, durationPerUnit, frequency, unit } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        errors.push("Navn på opgave-skabelon er påkrævet.");
    }

    if (description !== undefined && typeof description !== "string") {
        errors.push("Beskrivelse skal være en tekststreng.");
    }

    if (!category || !Object.values(categoryTypes).includes(category)) {
        errors.push(`Kategori skal være en af: ${Object.values(categoryTypes).join(", ")}`);
    }

    if (durationPerUnit === undefined || isNaN(durationPerUnit) || durationPerUnit < 0) {
        errors.push("durationPerUnit skal være et positivt tal.");
    }

    if (!frequency || !Object.values(frequencies).includes(frequency)) {
        errors.push(`Frekvens skal være en af: ${Object.values(frequencies).join(", ")}`);
    }

    if (unit && !Object.values(units).includes(unit)) {
        errors.push(`Unit skal være en af: ${Object.values(units).join(", ")}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    req.body.name = name.trim();
    if (description !== undefined) req.body.description = description.trim();
    req.body.durationPerUnit = Number(durationPerUnit);

    next();
};
