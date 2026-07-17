function validateLogin(req, res, next) {
    const { userName, password } = req.body;

    if (!userName || typeof userName !== "string") {
        return next(new Error("Ugyldigt brugernavn"));
    }

    if (!password || typeof password !== "string") {
        return next(new Error("Ugyldigt kodeord"));
    }

    next();
}

module.exports = { validateLogin };