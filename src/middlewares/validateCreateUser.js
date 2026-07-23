const { userRoles } = require("../utils/userRoles");

function validateCreateUser(req, res, next) {
    const { userName, fullName, role } = req.body;

    if (!userName || typeof userName !== "string") {
        return next(new Error("Ugyldigt brugernavn"));
    }

    if (userName.trim().length === 0) {
        return next(new Error("Brugernavn må ikke være tomt"));
    }

    if (userName.length > 50) {
        return next(new Error("Brugernavn er for langt"));
    }

    const forbidden = /[<>\/\\{}$]/;
    if (forbidden.test(userName)) {
        return next(new Error("Brugernavn indeholder ugyldige tegn"));
    }

    if (!fullName || typeof fullName !== "string") {
        return next(new Error("Ugyldigt fuldt navn"));
    }

    if (fullName.trim().length === 0) {
        return next(new Error("Fuldt navn må ikke være tomt"));
    }

    if (fullName.length > 100) {
        return next(new Error("Fuldt navn er for langt"));
    }

    const forbiddenName = /[<>\/\\{}$]/;
    if (forbiddenName.test(fullName)) {
        return next(new Error("Fuldt navn indeholder ugyldige tegn"));
    }

    if (role && !Object.values(userRoles).includes(role)) {
        return next(new Error("Ugyldig rolle"));
    }

    next();
}

module.exports = { validateCreateUser };
