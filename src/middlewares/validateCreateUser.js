const { userRoles } = require("../utils/userRoles");

function validateCreateUser(req, res, next) {
    const { userName, fullName, role, position, phoneNumber, email, address } = req.body;

    // --- userName ---
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

    // --- fullName ---
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

    // --- position ---
    if (position !== undefined) {
        if (typeof position !== "string" || position.trim().length === 0) {
            return next(new Error("Ugyldig stilling"));
        }
    }

    // --- phoneNumber ---
    if (phoneNumber !== undefined) {
        const phoneRegex = /^[0-9+\-\s]{5,20}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return next(new Error("Ugyldigt telefonnummer"));
        }
    }

    // --- email ---
    if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new Error("Ugyldig email"));
        }
    }

    // --- address ---
    if (address !== undefined) {
        if (typeof address !== "string" || address.trim().length === 0) {
            return next(new Error("Ugyldig adresse"));
        }
    }

    // --- role ---
    if (role && !Object.values(userRoles).includes(role)) {
        return next(new Error("Ugyldig rolle"));
    }

    next();
}

module.exports = { validateCreateUser };
