// middleware/validateCleaningTaskTemplate.js

const { categoryTypes } = require("../utils/categoryEnum");
const { units } = require("../utils/unitEnum");

module.exports = function validateCleaningTaskTemplate(req, res, next) {
    const errors = [];
    const { name, category, defaultDuration, defaultPrice, unit } = req.body;

    // Name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
        errors.push("Navn på opgave-skabelon er påkrævet.");
    }

    // Category enum
    if (!category || !Object.values(categoryTypes).includes(category)) {
        errors.push(`Kategori skal være en af: ${Object.values(categoryTypes).join(", ")}`);
    }

    // Duration
    if (defaultDuration !== undefined && (isNaN(defaultDuration) || defaultDuration < 0)) {
        errors.push("defaultDuration skal være et positivt tal.");
    }

    // Price
    if (defaultPrice !== undefined && (isNaN(defaultPrice) || defaultPrice < 0)) {
        errors.push("defaultPrice skal være et positivt tal.");
    }

    // Unit enum
    if (unit && !Object.values(units).includes(unit)) {
        errors.push(`Unit skal være en af: ${Object.values(units).join(", ")}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    // Trim
    req.body.name = name.trim();

    next();
};
