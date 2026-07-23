const { userRoles } = require("../utils/userRoles");

function validateUserUpdate(req, res, next) {
    const { fullName, role } = req.body;

    if (fullName !== undefined) {
        if (typeof fullName !== "string") {
            return next(new Error("Ugyldigt fuldt navn"));
        }

        if (fullName.trim().length === 0) {
            return next(new Error("Fuldt navn må ikke være tomt"));
        }

        if (fullName.length > 100) {
            return next(new Error("Fuldt navn er for langt"));
        }

        const forbidden = /[<>\/\\{}$]/;
        if (forbidden.test(fullName)) {
            return next(new Error("Fuldt navn indeholder ugyldige tegn"));
        }
    }

    if (role !== undefined) {
        if (typeof role !== "string") {
            return next(new Error("Ugyldig rolle-type"));
        }

        if (!Object.values(userRoles).includes(role)) {
            return next(new Error("Ugyldig rolle"));
        }
    }

    next();
}

module.exports = { validateUserUpdate };
