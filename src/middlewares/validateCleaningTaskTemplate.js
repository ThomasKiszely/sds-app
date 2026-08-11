const { categoryTypes } = require("../utils/categoryEnum");
const { units } = require("../utils/unitEnum");

module.exports = function validateCleaningTaskTemplate(req, res, next) {
    const errors = [];
    const { name, description, category, defaultDuration, defaultPrice, unit } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        errors.push("Navn på opgave-skabelon er påkrævet.");
    }

    if (description !== undefined && typeof description !== "string") {
        errors.push("Beskrivelse skal være en tekststreng.");
    }

    if (!category || !Object.values(categoryTypes).includes(category)) {
        errors.push(`Kategori skal være en af: ${Object.values(categoryTypes).join(", ")}`);
    }

    if (defaultDuration !== undefined && (isNaN(defaultDuration) || defaultDuration < 0)) {
        errors.push("defaultDuration skal være et positivt tal.");
    }

    if (defaultPrice !== undefined && (isNaN(defaultPrice) || defaultPrice < 0)) {
        errors.push("defaultPrice skal være et positivt tal.");
    }

    if (unit && !Object.values(units).includes(unit)) {
        errors.push(`Unit skal være en af: ${Object.values(units).join(", ")}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    req.body.name = name.trim();
    if (description !== undefined) req.body.description = description.trim();
    if (defaultDuration !== undefined) req.body.defaultDuration = Number(defaultDuration);
    if (defaultPrice !== undefined) req.body.defaultPrice = Number(defaultPrice);

    next();
};
