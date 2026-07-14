const { userRoles } = require("../utils/userRoles");

function validateCreateUser(req, res, next) {
    const { name, role } = req.body;

    // 1. Skal være en string
    if (!name || typeof name !== "string") {
        return next(new Error("Ugyldigt brugernavn"));
    }

    // 2. Må ikke være tom eller whitespace
    if (name.trim().length === 0) {
        return next(new Error("Brugernavn må ikke være tomt"));
    }

    // 3. Må ikke være for langt
    if (name.length > 50) {
        return next(new Error("Brugernavn er for langt"));
    }

    // 4. Må ikke indeholde farlige tegn
    const forbidden = /[<>\/\\{}$]/;
    if (forbidden.test(name)) {
        return next(new Error("Brugernavn indeholder ugyldige tegn"));
    }

    // 5. Rolle skal være gyldig (hvis sendt)
    if (role && !Object.values(userRoles).includes(role)) {
        return next(new Error("Ugyldig rolle"));
    }

    next();
}

module.exports = { validateCreateUser };
