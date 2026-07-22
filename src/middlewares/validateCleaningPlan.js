module.exports = function validateCleaningPlan(req, res, next) {
    const errors = [];
    const { name, customerId, description } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        errors.push("Navn på rengøringsplan er påkrævet.");
    }

    if (!customerId || !customerId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("customerId skal være et gyldigt MongoDB ObjectId.");
    }

    if (description && typeof description !== "string") {
        errors.push("Beskrivelse skal være en tekststreng.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    req.body.name = name.trim();
    if (description) req.body.description = description.trim();

    next();
};
