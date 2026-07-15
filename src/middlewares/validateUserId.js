function validateUserId(req, res, next) {
    let { id } = req.params;

    // Trim ID og gem det tilbage i req.params
    id = id.trim();
    req.params.id = id;

    // MongoDB ObjectId er altid 24 hex-tegn
    const isValid = /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValid) {
        return next(new Error("Ugyldigt bruger-ID format"));
    }

    next();
}

module.exports = { validateUserId };
