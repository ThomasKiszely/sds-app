const { userError } = require("../utils/userError");
const { bundleTypes } = require("../utils/bundleType");

function validateRoomTemplate(req, res, next) {
    const { name, defaultSize, bundleType, daily, floor, inventory } = req.body;

    const forbidden = /[<>\/\\{}$]/;

    // --- name ---
    if (name !== undefined) {
        if (typeof name !== "string") {
            return next(userError("Navn skal være en tekst", 400));
        }
        const trimmed = name.trim();
        if (trimmed.length === 0) {
            return next(userError("Navn må ikke være tomt", 400));
        }
        if (trimmed.length > 100) {
            return next(userError("Navn er for langt (maks 100 tegn)", 400));
        }
        if (forbidden.test(trimmed)) {
            return next(userError("Navn indeholder ugyldige tegn", 400));
        }
        req.body.name = trimmed; // ← fjern farlige tegn
    }

    // --- defaultSize ---
    if (defaultSize !== undefined) {
        const size = Number(defaultSize);
        if (isNaN(size) || size <= 0) {
            return next(userError("defaultSize skal være et tal større end 0", 400));
        }
        req.body.defaultSize = size; // ← konverter til tal
    }

    // --- bundleType ---
    if (bundleType !== undefined) {
        if (!Object.values(bundleTypes).includes(bundleType)) {
            return next(userError("bundleType er ugyldig", 400));
        }
    }

    // --- SDS taskTemplateId felter ---
    // De må gerne være tomme, men hvis de findes, skal de være gyldige ObjectId’er
    const idRegex = /^[0-9a-fA-F]{24}$/;

    if (daily !== undefined && daily !== "" && !idRegex.test(daily)) {
        return next(userError("Ugyldigt soignering taskTemplateId", 400));
    }

    if (floor !== undefined && floor !== "" && !idRegex.test(floor)) {
        return next(userError("Ugyldigt gulv taskTemplateId", 400));
    }

    if (inventory !== undefined && inventory !== "" && !idRegex.test(inventory)) {
        return next(userError("Ugyldigt inventar taskTemplateId", 400));
    }

    next();
}

module.exports = { validateRoomTemplate };
