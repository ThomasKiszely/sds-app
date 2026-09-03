// middlewares/validateAccept.js

module.exports = function validateAccept(req, res, next) {
    const { name, email } = req.body;

    // ⭐ Valider navn
    if (!name || typeof name !== "string" || name.trim().length < 2) {
        return next({
            isUserError: true,
            message: "Navn skal være mindst 2 tegn."
        });
    }

    // ⭐ Valider email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return next({
            isUserError: true,
            message: "Email-adressen er ugyldig."
        });
    }

    next();
};
