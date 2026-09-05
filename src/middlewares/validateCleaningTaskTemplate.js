const { userError } = require("../utils/userError");
const { categoryTypes } = require("../utils/categoryEnum");
const { units } = require("../utils/unitEnum");
const { frequencies } = require("../utils/frequencyEnum");

module.exports = function validateCleaningTaskTemplate(req, res, next) {
    const errors = [];
    const {
        name,
        description,
        category,
        durationPerUnit,
        frequency,
        unit,
        pricePerUnit
    } = req.body;

    // ⭐ Required i modellen
    if (!name || typeof name !== "string" || name.trim().length === 0) {
        errors.push("Navn på opgave-skabelon er påkrævet.");
    }

    if (!category || !Object.values(categoryTypes).includes(category)) {
        errors.push(`Kategori skal være en af: ${Object.values(categoryTypes).join(", ")}`);
    }

    // ⭐ Optional felter – valider kun hvis de er til stede
    if (description !== undefined && typeof description !== "string") {
        errors.push("Beskrivelse skal være en tekststreng.");
    }

    if (durationPerUnit !== undefined) {
        const dur = Number(durationPerUnit);
        if (isNaN(dur) || dur < 0) {
            errors.push("durationPerUnit skal være et positivt tal.");
        }
    }

    if (frequency !== undefined && !Object.values(frequencies).includes(frequency)) {
        errors.push(`Frekvens skal være en af: ${Object.values(frequencies).join(", ")}`);
    }

    if (unit !== undefined && unit !== "" && !Object.values(units).includes(unit)) {
        errors.push(`Unit skal være en af: ${Object.values(units).join(", ")}`);
    }

    if (pricePerUnit !== undefined) {
        const p = Number(pricePerUnit);
        if (isNaN(p) || p < 0) {
            errors.push("pricePerUnit skal være et positivt tal.");
        }
    }

    if (errors.length > 0) {
        throw userError(errors.join("<br>"), 400);
    }

    // ⭐ Normalisering
    req.body.name = name.trim();
    if (description !== undefined) req.body.description = description.trim();

    if (durationPerUnit !== undefined) req.body.durationPerUnit = Number(durationPerUnit);
    if (pricePerUnit !== undefined) req.body.pricePerUnit = Number(pricePerUnit);

    next();
};
