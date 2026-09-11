const { bundleTypes } = require("../utils/bundleType");

function validateRoomTemplate(req, res, next) {
    const { name, defaultSize, bundleType } = req.body;

    const errors = [];

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        errors.push("Navn er påkrævet.");
    }

    const size = Number(defaultSize);
    if (isNaN(size) || size <= 0) {
        errors.push("defaultSize skal være et tal større end 0.");
    }

    if (!bundleType || !Object.values(bundleTypes).includes(bundleType)) {
        errors.push("bundleType er ugyldig.");
    }

    if (errors.length > 0) {
        return res.status(400).render("admin/roomTemplates/new", {
            error: errors.join("<br>"),
            formData: req.body,
        });
    }

    next();
}

module.exports = { validateRoomTemplate };
